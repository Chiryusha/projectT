import { randomUUID } from "crypto";
import { existsSync } from "fs";
import { basename, join } from "path";

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Optional,
  NotFoundException,
} from "@nestjs/common";
import {
  DraftSessionStatus,
  Prisma,
  SavedSquad,
  TournamentStage,
  TournamentStatus,
} from "@prisma/client";

import { MetricsService } from "../monitoring/metrics.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDraftSessionDto } from "./dto/create-draft-session.dto";
import { PickPlayerDto } from "./dto/pick-player.dto";
import { SaveSquadDto } from "./dto/save-squad.dto";
import type { AiDifficulty } from "./dto/start-tournament.dto";
import { SwapPicksDto } from "./dto/swap-picks.dto";
import {
  AI_TEAM_NAMES,
  FORMATIONS,
  OPTIONS_PER_SLOT,
  POSITION_ALIASES,
  REQUIRED_GOALKEEPERS,
  TOTAL_DRAFT_SLOTS,
  getFormationByCode,
  getSlotPosition,
} from "./draft.constants";
import {
  MatchSimulatorService,
  MatchStats,
  MatchTimelineEvent,
} from "./match-simulator.service";
import type {
  DeleteSavedSquadResponse,
  DraftChemistryResponse,
  DraftCurrentOptionsResponse,
  DraftFormationResponse,
  DraftOptionResponse,
  DraftPickActionResponse,
  DraftPicksResponse,
  DraftPickResponseItem,
  DraftSessionResponse,
  DraftSessionStateResponse,
  SavedSquadResponse,
  SavedSquadSnapshotResponse,
  TournamentResponse,
} from "./types/draft-response.type";

const PLAYER_IMAGE_PUBLIC_PATH = "/player-images/";

type Team = {
  name: string;
  strength: number;
  chemistry: number;
  isUser: boolean;
  lineup: string[];
};

type SimulatedMatch = {
  stage: TournamentStage;
  bracketIndex: number;
  homeTeamName: string;
  awayTeamName: string;
  homeStrength: number;
  awayStrength: number;
  homeChemistry: number;
  awayChemistry: number;
  homeScore: number;
  awayScore: number;
  winnerTeamName: string;
  isUserMatch: boolean;
  wentToPenalties: boolean;
  simulationProvider: "local" | "ai";
  simulationReason: string;
  events: MatchTimelineEvent[];
  stats: MatchStats;
  homeLineup: string[];
  awayLineup: string[];
};

type GoalkeeperConstraints = {
  mustPickGoalkeeper: boolean;
  forbidGoalkeeper: boolean;
};

type PickWithCard = {
  slotNo: number;
  pickedAt: Date;
  playerCard: {
    id: string;
    overall: number;
    basePosition: string;
    rarity: string;
    player: {
      fullName: string;
      nation: string;
      club: string;
      league: string;
      imageUrl: string | null;
    };
  };
};

type EligibleDraftCard = {
  id: string;
  overall: number;
  playerId: string;
};

@Injectable()
export class DraftService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchSimulator: MatchSimulatorService,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  getFormations(): DraftFormationResponse[] {
    return FORMATIONS.map((formation) => ({
      code: formation.code,
      name: formation.name,
      lineupSlots: [...formation.lineupSlots],
      benchSlots: TOTAL_DRAFT_SLOTS - formation.lineupSlots.length,
      totalSlots: TOTAL_DRAFT_SLOTS,
      requiredGoalkeepers: REQUIRED_GOALKEEPERS,
    }));
  }

  async createSession(
    userId: string,
    dto: CreateDraftSessionDto,
  ): Promise<DraftSessionStateResponse> {
    await this.ensureUserExists(userId);

    const formationCode = dto.formation ?? FORMATIONS[0].code;

    if (!getFormationByCode(formationCode)) {
      throw new BadRequestException("Unknown formation code");
    }

    const session = await this.prisma.draftSession.create({
      data: {
        userId,
        formation: formationCode,
        seed: randomUUID(),
        totalSlots: TOTAL_DRAFT_SLOTS,
        goalkeepersRequired: REQUIRED_GOALKEEPERS,
      },
    });

    await this.generateOptionsForSlot(session.id, session.currentSlot);

    this.metrics?.recordDraftEvent("session_created", formationCode);

    return this.getSessionState(session.id, userId);
  }

  async getSessionState(
    sessionId: string,
    userId: string,
    optionsSlotNo?: number,
  ): Promise<DraftSessionStateResponse> {
    const session = await this.getSessionWithProgress(sessionId, userId);
    const activeOptionsSlotNo = optionsSlotNo ?? session.currentSlot;

    const options =
      session.status === DraftSessionStatus.IN_PROGRESS
        ? await this.fetchOptionsForSlot(session.id, activeOptionsSlotNo)
        : [];

    const picks = await this.fetchPicks(session.id);
    const chemistry = this.calculateChemistryFromPicks(
      picks,
      session.formation,
    );

    return {
      session,
      optionsSlotNo:
        session.status === DraftSessionStatus.IN_PROGRESS
          ? activeOptionsSlotNo
          : null,
      options,
      picks: this.mapPicks(picks),
      chemistry,
    };
  }

  async getCurrentOptions(
    sessionId: string,
    userId: string,
  ): Promise<DraftCurrentOptionsResponse> {
    const session = await this.getSessionWithProgress(sessionId, userId);

    if (session.status !== DraftSessionStatus.IN_PROGRESS) {
      return {
        session,
        optionsSlotNo: null,
        options: [],
      };
    }

    const options = await this.fetchOptionsForSlot(
      session.id,
      session.currentSlot,
    );

    return { session, optionsSlotNo: session.currentSlot, options };
  }

  async getOptionsForSlot(
    sessionId: string,
    userId: string,
    slotNo: number,
  ): Promise<DraftSessionStateResponse> {
    const session = await this.getSessionWithProgress(sessionId, userId);

    if (session.status !== DraftSessionStatus.IN_PROGRESS) {
      return this.getSessionState(sessionId, userId);
    }

    if (slotNo < 1 || slotNo > session.totalSlots) {
      throw new BadRequestException("Slot number is outside draft range");
    }

    const existingPick = await this.prisma.draftPick.findUnique({
      where: {
        sessionId_slotNo: {
          sessionId,
          slotNo,
        },
      },
    });

    if (existingPick) {
      throw new ConflictException("Slot already contains a player");
    }

    await this.generateOptionsForSlot(sessionId, slotNo);

    return this.getSessionState(sessionId, userId, slotNo);
  }

  async getPicks(
    sessionId: string,
    userId: string,
  ): Promise<DraftPicksResponse> {
    await this.ensureSessionOwnership(sessionId, userId);

    const picks = await this.fetchPicks(sessionId);
    const goalkeepersPicked = picks.filter(
      (pick) => pick.playerCard.basePosition === "GK",
    ).length;

    const session = await this.prisma.draftSession.findUnique({
      where: { id: sessionId },
      select: { formation: true },
    });

    if (!session) {
      throw new NotFoundException("Draft session not found");
    }

    const chemistry = this.calculateChemistryFromPicks(
      picks,
      session.formation,
    );

    return {
      sessionId,
      picks: this.mapPicks(picks),
      chemistry,
      summary: {
        totalPicked: picks.length,
        goalkeepersPicked,
      },
    };
  }

  async saveSquad(
    sessionId: string,
    userId: string,
    dto: SaveSquadDto,
  ): Promise<SavedSquadResponse> {
    await this.ensureSessionOwnership(sessionId, userId);

    const existingSavedSquad = await this.prisma.savedSquad.findUnique({
      where: {
        userId_sessionId: {
          sessionId,
          userId,
        },
      },
    });

    if (existingSavedSquad) {
      return this.mapSavedSquad(existingSavedSquad);
    }

    const session = await this.prisma.draftSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        formation: true,
        status: true,
        totalSlots: true,
      },
    });

    if (!session) {
      throw new NotFoundException("Draft session not found");
    }

    if (session.status !== DraftSessionStatus.COMPLETED) {
      throw new ConflictException("Only completed draft squads can be saved");
    }

    const picks = await this.fetchPicks(sessionId);

    if (picks.length !== session.totalSlots) {
      throw new ConflictException(
        "Draft session is incomplete, not enough picks",
      );
    }

    const chemistry = this.calculateChemistryFromPicks(
      picks,
      session.formation,
    );
    const rating = this.calculateSquadRating(picks);
    const createdAt = new Date();
    const name =
      dto.name?.trim() ||
      `${session.formation} squad ${createdAt.toLocaleDateString("ru-RU")}`;
    const snapshotPicks = this.mapPicks(picks);
    const snapshot = {
      chemistry,
      formation: session.formation,
      picks: snapshotPicks,
      savedAt: createdAt.toISOString(),
      sessionId,
    };

    const savedSquad = await this.prisma.savedSquad.create({
      data: {
        userId,
        sessionId,
        name,
        formation: session.formation,
        rating,
        chemistry: chemistry.teamChemistry,
        snapshot,
      },
    });

    this.metrics?.recordDraftEvent("squad_saved", session.formation);

    return this.mapSavedSquad(savedSquad);
  }

  async getSavedSquads(userId: string): Promise<SavedSquadResponse[]> {
    const savedSquads = await this.prisma.savedSquad.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return savedSquads.map((savedSquad) => this.mapSavedSquad(savedSquad));
  }

  async deleteSavedSquad(
    savedSquadId: string,
    userId: string,
  ): Promise<DeleteSavedSquadResponse> {
    const result = await this.prisma.savedSquad.deleteMany({
      where: {
        id: savedSquadId,
        userId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException("Saved squad not found");
    }

    this.metrics?.recordDraftEvent("saved_squad_deleted");

    return {
      deletedCount: result.count,
      success: true,
    };
  }

  async clearSavedSquads(userId: string): Promise<DeleteSavedSquadResponse> {
    const result = await this.prisma.savedSquad.deleteMany({
      where: { userId },
    });

    this.metrics?.recordDraftEvent("saved_squads_cleared");

    return {
      deletedCount: result.count,
      success: true,
    };
  }

  async pickPlayer(
    sessionId: string,
    userId: string,
    dto: PickPlayerDto,
  ): Promise<DraftPickActionResponse> {
    await this.ensureSessionOwnership(sessionId, userId);

    const stepResult = await this.prisma.$transaction(async (tx) => {
      const session = await tx.draftSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          status: true,
          currentSlot: true,
          totalSlots: true,
          formation: true,
          goalkeepersRequired: true,
        },
      });

      if (!session) {
        throw new NotFoundException("Draft session not found");
      }

      if (session.status !== DraftSessionStatus.IN_PROGRESS) {
        throw new ConflictException("Draft session is not in progress");
      }

      const slotNo = dto.slotNo ?? session.currentSlot;

      if (slotNo < 1 || slotNo > session.totalSlots) {
        throw new BadRequestException("Slot number is outside draft range");
      }

      const selectedOption = await tx.draftOption.findFirst({
        where: {
          sessionId,
          slotNo,
          playerCardId: dto.playerCardId,
        },
        select: {
          playerCard: {
            select: {
              basePosition: true,
              playerId: true,
            },
          },
        },
      });

      if (!selectedOption) {
        throw new BadRequestException(
          "Selected card is not available in current options",
        );
      }

      const currentPicks = await tx.draftPick.findMany({
        where: {
          sessionId,
        },
        select: {
          slotNo: true,
          playerCard: {
            select: {
              basePosition: true,
              playerId: true,
            },
          },
        },
      });

      if (
        currentPicks.some(
          (pick) =>
            pick.playerCard.playerId === selectedOption.playerCard.playerId,
        )
      ) {
        throw new ConflictException(
          "This player was already picked in this draft session",
        );
      }

      const goalkeepersPicked = currentPicks.filter(
        (pick) => pick.playerCard.basePosition === "GK",
      ).length;

      const slotPosition = getSlotPosition(session.formation, slotNo);
      const constraints = this.getGoalkeeperConstraints({
        remainingSlotsIncludingCurrent:
          session.totalSlots - currentPicks.length,
        goalkeepersRequired: session.goalkeepersRequired,
        goalkeepersPicked,
        slotPosition,
      });

      const isGoalkeeperPick = selectedOption.playerCard.basePosition === "GK";

      if (constraints.mustPickGoalkeeper && !isGoalkeeperPick) {
        throw new BadRequestException(
          "You must pick a goalkeeper on this slot",
        );
      }

      if (constraints.forbidGoalkeeper && isGoalkeeperPick) {
        throw new ConflictException(
          "Goalkeeper limit reached for this draft session",
        );
      }

      const existingPick = await tx.draftPick.findUnique({
        where: {
          sessionId_slotNo: {
            sessionId,
            slotNo,
          },
        },
      });

      if (existingPick) {
        throw new ConflictException("Current slot was already picked");
      }

      await tx.draftPick.create({
        data: {
          sessionId,
          slotNo,
          playerCardId: dto.playerCardId,
        },
      });

      const filledSlots = new Set([
        ...currentPicks.map((pick) => pick.slotNo),
        slotNo,
      ]);
      const nextSlot =
        Array.from(
          { length: session.totalSlots },
          (_, index) => index + 1,
        ).find((candidateSlotNo) => !filledSlots.has(candidateSlotNo)) ?? null;

      if (!nextSlot) {
        await tx.draftSession.update({
          where: { id: sessionId },
          data: {
            status: DraftSessionStatus.COMPLETED,
            completedAt: new Date(),
          },
        });

        return { completed: true, nextSlot: null as number | null };
      }

      await tx.draftSession.update({
        where: { id: sessionId },
        data: {
          currentSlot: nextSlot,
        },
      });

      return { completed: false, nextSlot };
    });

    this.metrics?.recordDraftEvent(
      stepResult.completed ? "session_completed" : "player_picked",
    );

    return {
      completed: stepResult.completed,
      ...(await this.getSessionState(sessionId, userId)),
    };
  }

  async swapPicks(
    sessionId: string,
    userId: string,
    dto: SwapPicksDto,
  ): Promise<DraftSessionStateResponse> {
    await this.ensureSessionOwnership(sessionId, userId);

    const { sourceSlotNo, targetSlotNo } = dto;

    if (sourceSlotNo === targetSlotNo) {
      return this.getSessionState(sessionId, userId);
    }

    await this.prisma.$transaction(async (tx) => {
      const session = await tx.draftSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          totalSlots: true,
        },
      });

      if (!session) {
        throw new NotFoundException("Draft session not found");
      }

      const tournament = await tx.tournament.findUnique({
        where: { sessionId },
        select: { id: true },
      });

      if (tournament) {
        throw new ConflictException(
          "Picks cannot be swapped after tournament start",
        );
      }

      if (
        sourceSlotNo > session.totalSlots ||
        targetSlotNo > session.totalSlots
      ) {
        throw new BadRequestException("Slot number is outside draft range");
      }

      const picks = await tx.draftPick.findMany({
        where: {
          sessionId,
          slotNo: {
            in: [sourceSlotNo, targetSlotNo],
          },
        },
        select: {
          id: true,
          slotNo: true,
        },
      });

      if (picks.length !== 2) {
        throw new ConflictException("Both slots must already contain players");
      }

      const sourcePick = picks.find((pick) => pick.slotNo === sourceSlotNo);
      const targetPick = picks.find((pick) => pick.slotNo === targetSlotNo);

      if (!sourcePick || !targetPick) {
        throw new ConflictException("Both slots must already contain players");
      }

      const temporarySlotNo = -sourceSlotNo;

      await tx.draftPick.update({
        where: { id: sourcePick.id },
        data: { slotNo: temporarySlotNo },
      });

      await tx.draftPick.update({
        where: { id: targetPick.id },
        data: { slotNo: sourceSlotNo },
      });

      await tx.draftPick.update({
        where: { id: sourcePick.id },
        data: { slotNo: targetSlotNo },
      });
    });

    this.metrics?.recordDraftEvent("picks_swapped");

    return this.getSessionState(sessionId, userId);
  }

  async startTournament(
    sessionId: string,
    userId: string,
    aiDifficulty: AiDifficulty = "normal",
  ): Promise<TournamentResponse> {
    await this.ensureSessionOwnership(sessionId, userId);

    const existingTournament = await this.prisma.tournament.findUnique({
      where: { sessionId },
      include: {
        matches: true,
      },
    });

    if (existingTournament) {
      throw new ConflictException(
        "Tournament was already played for this draft session",
      );
    }

    const session = await this.prisma.draftSession.findUnique({
      where: { id: sessionId },
      include: {
        picks: {
          include: {
            playerCard: {
              select: {
                overall: true,
                basePosition: true,
                player: {
                  select: {
                    fullName: true,
                    nation: true,
                    club: true,
                    league: true,
                    imageUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException("Draft session not found");
    }

    if (session.status !== DraftSessionStatus.COMPLETED) {
      throw new ConflictException(
        "Tournament can be started only after draft completion",
      );
    }

    if (session.picks.length !== session.totalSlots) {
      throw new ConflictException(
        "Draft session is incomplete, not enough picks",
      );
    }

    const goalkeeperCount = session.picks.filter(
      (pick) => pick.playerCard.basePosition === "GK",
    ).length;

    if (goalkeeperCount !== session.goalkeepersRequired) {
      throw new ConflictException(
        `Draft session must contain exactly ${session.goalkeepersRequired} goalkeepers before tournament start`,
      );
    }

    const picksForChemistry: PickWithCard[] = session.picks.map((pick) => ({
      slotNo: pick.slotNo,
      pickedAt: pick.pickedAt,
      playerCard: {
        id: pick.playerCardId,
        overall: pick.playerCard.overall,
        basePosition: pick.playerCard.basePosition,
        rarity: "gold",
        player: {
          fullName: pick.playerCard.player.fullName,
          nation: pick.playerCard.player.nation,
          club: pick.playerCard.player.club,
          league: pick.playerCard.player.league,
          imageUrl: pick.playerCard.player.imageUrl,
        },
      },
    }));

    const chemistry = this.calculateChemistryFromPicks(
      picksForChemistry,
      session.formation,
    );
    const userLineup = this.buildUserLineup(
      picksForChemistry,
      session.formation,
    );

    const userTeam: Team = {
      name: "User Squad",
      strength: this.calculateTeamStrength(
        picksForChemistry.map((pick) => pick.playerCard.overall),
        chemistry.teamChemistry,
      ),
      chemistry: chemistry.teamChemistry,
      isUser: true,
      lineup: userLineup,
    };

    const aiTeams = this.generateAiTeams(7, aiDifficulty);
    const bracketTeams = this.shuffleArray([userTeam, ...aiTeams]);

    const quarterfinalRound = await this.simulateRound(
      TournamentStage.QUARTERFINAL,
      bracketTeams,
    );
    const semifinalRound = await this.simulateRound(
      TournamentStage.SEMIFINAL,
      quarterfinalRound.winners,
    );
    const finalRound = await this.simulateRound(
      TournamentStage.FINAL,
      semifinalRound.winners,
    );

    const allMatches: SimulatedMatch[] = [
      ...quarterfinalRound.matches,
      ...semifinalRound.matches,
      ...finalRound.matches,
    ];

    const championTeam = finalRound.winners[0];

    const tournament = await this.prisma.$transaction(async (tx) => {
      const createdTournament = await tx.tournament.create({
        data: {
          sessionId,
          status: championTeam.isUser
            ? TournamentStatus.CHAMPION
            : TournamentStatus.ELIMINATED,
          userTeamName: userTeam.name,
          championTeam: championTeam.name,
          completedAt: new Date(),
        },
      });

      await tx.tournamentMatch.createMany({
        data: allMatches.map((match) => ({
          tournamentId: createdTournament.id,
          stage: match.stage,
          bracketIndex: match.bracketIndex,
          homeTeamName: match.homeTeamName,
          awayTeamName: match.awayTeamName,
          homeStrength: match.homeStrength,
          awayStrength: match.awayStrength,
          homeChemistry: match.homeChemistry,
          awayChemistry: match.awayChemistry,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          winnerTeamName: match.winnerTeamName,
          isUserMatch: match.isUserMatch,
          wentToPenalties: match.wentToPenalties,
          simulationProvider: match.simulationProvider,
          simulationReason: this.stringifyMatchSimulationDetails(match),
        })),
      });

      return tx.tournament.findUnique({
        where: { id: createdTournament.id },
        include: {
          matches: true,
        },
      });
    });

    if (!tournament) {
      throw new NotFoundException("Tournament was not created");
    }

    this.metrics?.recordDraftEvent("tournament_started", session.formation);
    this.metrics?.recordTournamentEvent(
      championTeam.isUser ? "champion" : "eliminated",
      aiDifficulty,
    );

    return this.mapTournamentResponse(tournament);
  }

  async getTournament(
    sessionId: string,
    userId: string,
  ): Promise<TournamentResponse> {
    await this.ensureSessionOwnership(sessionId, userId);

    const tournament = await this.prisma.tournament.findUnique({
      where: { sessionId },
      include: {
        matches: true,
      },
    });

    if (!tournament) {
      throw new NotFoundException("Tournament not found for this session");
    }

    return this.mapTournamentResponse(tournament);
  }

  private async generateOptionsForSlot(
    sessionId: string,
    slotNo: number,
  ): Promise<void> {
    const session = await this.prisma.draftSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        formation: true,
        status: true,
        totalSlots: true,
        goalkeepersRequired: true,
      },
    });

    if (!session) {
      throw new NotFoundException("Draft session not found");
    }

    if (session.status !== DraftSessionStatus.IN_PROGRESS) {
      return;
    }

    const picks = await this.prisma.draftPick.findMany({
      where: { sessionId },
      select: {
        playerCardId: true,
        playerCard: {
          select: {
            basePosition: true,
            playerId: true,
          },
        },
      },
    });

    const pickedCardIds = picks.map((pick) => pick.playerCardId);
    const pickedPlayerIds = picks.map((pick) => pick.playerCard.playerId);
    const goalkeepersPicked = picks.filter(
      (pick) => pick.playerCard.basePosition === "GK",
    ).length;
    const previousOptions = await this.prisma.draftOption.findMany({
      where: {
        sessionId,
        slotNo: {
          not: slotNo,
        },
      },
      select: {
        playerCardId: true,
        playerCard: {
          select: {
            playerId: true,
          },
        },
      },
    });
    const shownCardIds = previousOptions.map((option) => option.playerCardId);
    const shownPlayerIds = previousOptions.map(
      (option) => option.playerCard.playerId,
    );
    const freshCardIds = Array.from(
      new Set([...pickedCardIds, ...shownCardIds]),
    );
    const freshPlayerIds = Array.from(
      new Set([...pickedPlayerIds, ...shownPlayerIds]),
    );

    const slotPosition = getSlotPosition(session.formation, slotNo);

    const constraints = this.getGoalkeeperConstraints({
      remainingSlotsIncludingCurrent: session.totalSlots - picks.length,
      goalkeepersRequired: session.goalkeepersRequired,
      goalkeepersPicked,
      slotPosition,
    });

    const createOptions = async (
      preferredPosition: string,
      usePositionFilter: boolean,
      excludedCardIds: string[],
      excludedPlayerIds: string[],
    ) => {
      const cards = await this.findEligibleCards({
        pickedCardIds: excludedCardIds,
        pickedPlayerIds: excludedPlayerIds,
        constraints,
        preferredPosition,
        usePositionFilter,
      });

      return this.sampleDraftOptionCardIds(cards, OPTIONS_PER_SLOT);
    };

    let selectedCardIds = await createOptions(
      slotPosition,
      slotPosition !== "ANY",
      freshCardIds,
      freshPlayerIds,
    );

    if (selectedCardIds.length < OPTIONS_PER_SLOT) {
      selectedCardIds = await createOptions(
        "ANY",
        false,
        freshCardIds,
        freshPlayerIds,
      );
    }

    if (selectedCardIds.length < OPTIONS_PER_SLOT) {
      selectedCardIds = await createOptions(
        slotPosition,
        slotPosition !== "ANY",
        pickedCardIds,
        pickedPlayerIds,
      );
    }

    if (selectedCardIds.length < OPTIONS_PER_SLOT) {
      selectedCardIds = await createOptions(
        "ANY",
        false,
        pickedCardIds,
        pickedPlayerIds,
      );
    }

    if (selectedCardIds.length < OPTIONS_PER_SLOT) {
      throw new BadRequestException(
        "Not enough cards to generate options. Expand seed catalog.",
      );
    }

    await this.prisma.draftOption.deleteMany({
      where: {
        sessionId,
        slotNo,
      },
    });

    await this.prisma.draftOption.createMany({
      data: selectedCardIds.map((playerCardId, index) => ({
        sessionId,
        slotNo,
        optionIndex: index + 1,
        playerCardId,
      })),
    });

    this.metrics?.recordDraftEvent("options_generated", slotPosition);
  }

  private async findEligibleCards(params: {
    pickedCardIds: string[];
    pickedPlayerIds: string[];
    constraints: GoalkeeperConstraints;
    preferredPosition: string;
    usePositionFilter: boolean;
  }) {
    const baseWhere = this.buildCardFilter(
      params.pickedCardIds,
      params.pickedPlayerIds,
      params.constraints,
      params.preferredPosition,
      params.usePositionFilter,
    );

    const cards = await this.prisma.playerCard.findMany({
      where: baseWhere,
      select: { id: true, overall: true, playerId: true },
      take: 800,
      orderBy: [{ overall: "desc" }, { createdAt: "desc" }],
    });

    return this.dedupeCardsByPlayer(cards);
  }

  private sampleDraftOptionCardIds(
    cards: EligibleDraftCard[],
    count: number,
  ): string[] {
    const sortedCards = [...cards].sort(
      (first, second) => second.overall - first.overall,
    );
    const selectedCards: EligibleDraftCard[] = [];
    const eliteCards = sortedCards.filter((card) => card.overall >= 86);
    const strongCards = sortedCards.filter((card) => card.overall >= 82);
    const solidCards = sortedCards.filter((card) => card.overall >= 78);
    const topWindow = sortedCards.slice(0, Math.min(sortedCards.length, 24));

    const pickFromPool = (pool: EligibleDraftCard[]) => {
      const availableCards = this.shuffleArray(pool)
        .filter(
          (card) =>
            !selectedCards.some(
              (selectedCard) => selectedCard.playerId === card.playerId,
            ),
        )
        .slice(0, 80);

      if (availableCards.length === 0) {
        return false;
      }

      selectedCards.push(this.pickWeightedByOverall(availableCards));

      return true;
    };

    while (
      selectedCards.length < count &&
      selectedCards.length < sortedCards.length
    ) {
      const roll = Math.random();
      const pool =
        selectedCards.length === 0 && roll < 0.65
          ? topWindow
          : roll < 0.28
            ? eliteCards
            : roll < 0.62
              ? strongCards
              : roll < 0.88
                ? solidCards
                : sortedCards;

      const wasPicked = pickFromPool(pool.length > 0 ? pool : sortedCards);

      if (!wasPicked) {
        pickFromPool(sortedCards);
      }
    }

    return this.shuffleArray(selectedCards).map((card) => card.id);
  }

  private pickWeightedByOverall(cards: EligibleDraftCard[]): EligibleDraftCard {
    const minOverall = Math.min(...cards.map((card) => card.overall));
    const weightedCards = cards.map((card) => ({
      card,
      weight: Math.max(1, card.overall - minOverall + 1) ** 1.35,
    }));
    const totalWeight = weightedCards.reduce(
      (sum, item) => sum + item.weight,
      0,
    );
    let randomWeight = Math.random() * totalWeight;

    for (const item of weightedCards) {
      randomWeight -= item.weight;

      if (randomWeight <= 0) {
        return item.card;
      }
    }

    return weightedCards[weightedCards.length - 1].card;
  }

  private dedupeCardsByPlayer<T extends { playerId: string }>(cards: T[]): T[] {
    const seenPlayerIds = new Set<string>();
    const result: T[] = [];

    for (const card of cards) {
      if (seenPlayerIds.has(card.playerId)) {
        continue;
      }

      seenPlayerIds.add(card.playerId);
      result.push(card);
    }

    return result;
  }

  private buildCardFilter(
    pickedCardIds: string[],
    pickedPlayerIds: string[],
    constraints: GoalkeeperConstraints,
    preferredPosition: string,
    usePositionFilter: boolean,
  ): Prisma.PlayerCardWhereInput {
    const andConditions: Prisma.PlayerCardWhereInput[] = [
      { rarity: "gold" },
      {
        OR: [
          {
            player: {
              imageUrl: {
                startsWith: "/player-images/",
              },
            },
          },
          {
            player: {
              league: "Fallback League",
            },
          },
        ],
      },
    ];

    if (pickedCardIds.length > 0) {
      andConditions.push({
        id: { notIn: pickedCardIds },
      });
    }

    if (pickedPlayerIds.length > 0) {
      andConditions.push({
        playerId: { notIn: pickedPlayerIds },
      });
    }

    if (constraints.mustPickGoalkeeper) {
      andConditions.push({ basePosition: "GK" });
    } else {
      if (constraints.forbidGoalkeeper) {
        andConditions.push({ basePosition: { not: "GK" } });
      }

      if (usePositionFilter && preferredPosition !== "ANY") {
        const aliases = POSITION_ALIASES[preferredPosition] ?? [
          preferredPosition,
        ];

        andConditions.push({
          basePosition: {
            in: aliases,
          },
        });
      }
    }

    if (andConditions.length === 0) {
      return {};
    }

    return {
      AND: andConditions,
    };
  }

  private getGoalkeeperConstraints(args: {
    remainingSlotsIncludingCurrent: number;
    goalkeepersRequired: number;
    goalkeepersPicked: number;
    slotPosition: string;
  }): GoalkeeperConstraints {
    const goalkeepersNeeded = args.goalkeepersRequired - args.goalkeepersPicked;

    if (goalkeepersNeeded < 0) {
      throw new ConflictException("Goalkeeper limit exceeded for this session");
    }

    const mustPickGoalkeeper =
      goalkeepersNeeded > 0 &&
      (args.slotPosition === "GK" ||
        args.remainingSlotsIncludingCurrent <= goalkeepersNeeded);

    const forbidGoalkeeper = goalkeepersNeeded === 0;

    return {
      mustPickGoalkeeper,
      forbidGoalkeeper,
    };
  }

  private async simulateRound(stage: TournamentStage, teams: Team[]) {
    if (teams.length % 2 !== 0) {
      throw new BadRequestException(`Invalid number of teams for ${stage}`);
    }

    const matches: SimulatedMatch[] = [];
    const winners: Team[] = [];

    for (let index = 0; index < teams.length; index += 2) {
      const homeTeam = teams[index];
      const awayTeam = teams[index + 1];

      const simulation = await this.matchSimulator.simulate({
        stage,
        homeTeamName: homeTeam.name,
        awayTeamName: awayTeam.name,
        homeStrength: homeTeam.strength,
        awayStrength: awayTeam.strength,
        homeChemistry: homeTeam.chemistry,
        awayChemistry: awayTeam.chemistry,
        useAi: homeTeam.isUser || awayTeam.isUser,
        homeLineup: homeTeam.lineup,
        awayLineup: awayTeam.lineup,
      });

      const winner = simulation.winner === "HOME" ? homeTeam : awayTeam;

      matches.push({
        stage,
        bracketIndex: index / 2 + 1,
        homeTeamName: homeTeam.name,
        awayTeamName: awayTeam.name,
        homeStrength: homeTeam.strength,
        awayStrength: awayTeam.strength,
        homeChemistry: homeTeam.chemistry,
        awayChemistry: awayTeam.chemistry,
        homeScore: simulation.homeScore,
        awayScore: simulation.awayScore,
        winnerTeamName: winner.name,
        isUserMatch: homeTeam.isUser || awayTeam.isUser,
        wentToPenalties: simulation.wentToPenalties,
        simulationProvider: simulation.provider,
        simulationReason: simulation.reason,
        events: simulation.events,
        stats: simulation.stats,
        homeLineup: homeTeam.lineup,
        awayLineup: awayTeam.lineup,
      });

      winners.push(winner);
    }

    return { matches, winners };
  }

  private calculateTeamStrength(overalls: number[], chemistry: number): number {
    if (overalls.length === 0) {
      return 70;
    }

    const averageOverall =
      overalls.reduce((sum, overall) => sum + overall, 0) / overalls.length;
    const chemistryBoost = (chemistry / 100) * 7;
    const randomBoost = Math.floor(Math.random() * 3);

    return this.clamp(
      Math.round(averageOverall + chemistryBoost + randomBoost),
      70,
      99,
    );
  }

  private calculateSquadRating(picks: PickWithCard[]): number {
    const starters = picks.filter((pick) => pick.slotNo <= 11);

    if (starters.length === 0) {
      return 0;
    }

    const totalOverall = starters.reduce(
      (sum, pick) => sum + pick.playerCard.overall,
      0,
    );

    return Math.round(totalOverall / starters.length);
  }

  private buildUserLineup(picks: PickWithCard[], formation: string): string[] {
    return picks
      .filter((pick) => pick.slotNo <= 11)
      .sort((first, second) => first.slotNo - second.slotNo)
      .map((pick) => {
        const position = getSlotPosition(formation, pick.slotNo);

        return `${position} ${pick.playerCard.player.fullName}`;
      });
  }

  private generateAiTeams(count: number, difficulty: AiDifficulty): Team[] {
    const names = this.sampleUnique([...AI_TEAM_NAMES], count);
    const difficultySettings: Record<
      AiDifficulty,
      {
        maxStrength: number;
        minBaseStrength: number;
        minChemistry: number;
        chemistrySpread: number;
        strengthSpread: number;
      }
    > = {
      easy: {
        maxStrength: 88,
        minBaseStrength: 68,
        minChemistry: 35,
        chemistrySpread: 20,
        strengthSpread: 12,
      },
      normal: {
        maxStrength: 97,
        minBaseStrength: 74,
        minChemistry: 55,
        chemistrySpread: 25,
        strengthSpread: 18,
      },
      hard: {
        maxStrength: 99,
        minBaseStrength: 82,
        minChemistry: 75,
        chemistrySpread: 20,
        strengthSpread: 15,
      },
    };
    const settings = difficultySettings[difficulty];

    return names.map((name) => {
      const chemistry = this.clamp(
        settings.minChemistry +
          Math.floor(Math.random() * settings.chemistrySpread),
        0,
        100,
      );
      const baseStrength = this.clamp(
        settings.minBaseStrength +
          Math.floor(Math.random() * settings.strengthSpread),
        60,
        settings.maxStrength,
      );

      return {
        name,
        chemistry,
        strength: this.clamp(
          Math.round(baseStrength + (chemistry / 100) * 4),
          60,
          settings.maxStrength,
        ),
        isUser: false,
        lineup: this.generateAiLineup(name),
      };
    });
  }

  private generateAiLineup(teamName: string): string[] {
    const positions = [
      "GK",
      "RB",
      "CB",
      "CB",
      "LB",
      "CM",
      "CM",
      "CAM",
      "RW",
      "ST",
      "LW",
    ];
    const surnames = [
      "Silva",
      "Costa",
      "Mendes",
      "Nakamura",
      "Rossi",
      "Keller",
      "Santos",
      "Garcia",
      "Dubois",
      "Kane",
      "Hughes",
      "Muller",
      "Okafor",
      "Petrov",
      "Marin",
      "Bakker",
    ];
    const teamSeed = teamName.length;

    return positions.map((position, index) => {
      const surname = surnames[(teamSeed + index * 3) % surnames.length];

      return `${position} ${surname}`;
    });
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }
  }

  private async ensureSessionOwnership(
    sessionId: string,
    userId: string,
  ): Promise<void> {
    const session = await this.prisma.draftSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!session) {
      throw new NotFoundException("Draft session not found");
    }

    if (session.userId !== userId) {
      throw new ForbiddenException(
        "You cannot access another user's draft session",
      );
    }
  }

  private async getSessionWithProgress(
    sessionId: string,
    userId: string,
  ): Promise<DraftSessionResponse> {
    const session = await this.prisma.draftSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        formation: true,
        status: true,
        currentSlot: true,
        totalSlots: true,
        goalkeepersRequired: true,
        startedAt: true,
        completedAt: true,
        tournament: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            picks: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException("Draft session not found");
    }

    if (session.userId !== userId) {
      throw new ForbiddenException(
        "You cannot access another user's draft session",
      );
    }

    const goalkeepersPicked = await this.prisma.draftPick.count({
      where: {
        sessionId,
        playerCard: {
          basePosition: "GK",
        },
      },
    });

    const { _count, tournament, ...sessionData } = session;

    return {
      ...sessionData,
      startedAt: sessionData.startedAt.toISOString(),
      completedAt: sessionData.completedAt?.toISOString() ?? null,
      pickedCount: _count.picks,
      remainingSlots: session.totalSlots - _count.picks,
      tournamentId: tournament?.id ?? null,
      goalkeepersPicked,
    };
  }

  private async fetchOptionsForSlot(
    sessionId: string,
    slotNo: number,
  ): Promise<DraftOptionResponse[]> {
    const options = await this.prisma.draftOption.findMany({
      where: {
        sessionId,
        slotNo,
      },
      orderBy: { optionIndex: "asc" },
      select: {
        optionIndex: true,
        playerCard: {
          select: {
            id: true,
            playerId: true,
            overall: true,
            basePosition: true,
            rarity: true,
            player: {
              select: {
                fullName: true,
                nation: true,
                club: true,
                league: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    const seenPlayerIds = new Set<string>();

    return options
      .filter((option) => {
        const hasDraftImage = Boolean(
          this.resolveVisiblePlayerImageUrl(option.playerCard.player.imageUrl),
        );
        const isFallbackPlayer =
          option.playerCard.player.league === "Fallback League";

        if (
          option.playerCard.rarity !== "gold" ||
          (!hasDraftImage && !isFallbackPlayer)
        ) {
          return false;
        }

        if (seenPlayerIds.has(option.playerCard.playerId)) {
          return false;
        }

        seenPlayerIds.add(option.playerCard.playerId);

        return true;
      })
      .map((option) => {
        const { playerId: _playerId, ...playerCard } = option.playerCard;

        return {
          ...option,
          playerCard: {
            ...playerCard,
            player: {
              ...playerCard.player,
              imageUrl: this.resolveVisiblePlayerImageUrl(
                playerCard.player.imageUrl,
              ),
            },
          },
        };
      });
  }

  private async fetchPicks(sessionId: string): Promise<PickWithCard[]> {
    const picks = await this.prisma.draftPick.findMany({
      where: { sessionId },
      orderBy: { slotNo: "asc" },
      select: {
        slotNo: true,
        pickedAt: true,
        playerCard: {
          select: {
            id: true,
            overall: true,
            basePosition: true,
            rarity: true,
            player: {
              select: {
                fullName: true,
                nation: true,
                club: true,
                league: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    return picks.map((pick) => ({
      ...pick,
      playerCard: {
        ...pick.playerCard,
        player: {
          ...pick.playerCard.player,
          imageUrl: this.resolveVisiblePlayerImageUrl(
            pick.playerCard.player.imageUrl,
          ),
        },
      },
    }));
  }

  private calculateChemistryFromPicks(
    picks: PickWithCard[],
    formation: string,
  ): DraftChemistryResponse {
    const starters = picks.filter((pick) => pick.slotNo <= 11);

    if (starters.length === 0) {
      return {
        teamChemistry: 0,
        maxTeamChemistry: 100,
        averagePlayerChemistry: 0,
        players: [] as Array<{
          slotNo: number;
          name: string;
          basePosition: string;
          chemistry: number;
          reasons: string[];
        }>,
      };
    }

    const maxPlayerChemistry = 5;
    const maxRawTeamChemistry = 11 * maxPlayerChemistry;
    const clubCounts = new Map<string, number>();
    const leagueCounts = new Map<string, number>();
    const nationCounts = new Map<string, number>();

    for (const pick of starters) {
      const club = pick.playerCard.player.club;
      const league = pick.playerCard.player.league;
      const nation = pick.playerCard.player.nation;

      clubCounts.set(club, (clubCounts.get(club) ?? 0) + 1);
      leagueCounts.set(league, (leagueCounts.get(league) ?? 0) + 1);
      nationCounts.set(nation, (nationCounts.get(nation) ?? 0) + 1);
    }

    const players = starters.map((pick) => {
      const requiredPosition = getSlotPosition(formation, pick.slotNo);
      const actualPosition = pick.playerCard.basePosition;

      const sameClubCount = clubCounts.get(pick.playerCard.player.club) ?? 1;
      const sameLeagueCount =
        leagueCounts.get(pick.playerCard.player.league) ?? 1;
      const sameNationCount =
        nationCounts.get(pick.playerCard.player.nation) ?? 1;

      const reasons: string[] = [];
      let chemistry = 0;

      if (requiredPosition === actualPosition) {
        chemistry += 1;
        reasons.push("position-fit");
      }

      if (sameClubCount >= 2) {
        chemistry += 2;
        reasons.push("club-link");
      }

      if (sameLeagueCount >= 2) {
        chemistry += 1;
        reasons.push("league-link");
      }

      if (sameNationCount >= 2) {
        chemistry += 1;
        reasons.push("nation-link");
      }

      chemistry = this.clamp(chemistry, 0, maxPlayerChemistry);

      return {
        slotNo: pick.slotNo,
        name: pick.playerCard.player.fullName,
        basePosition: actualPosition,
        chemistry,
        reasons,
      };
    });

    const rawTeamChemistry = players.reduce(
      (sum, item) => sum + item.chemistry,
      0,
    );
    const teamChemistry = this.clamp(
      Math.round((rawTeamChemistry / maxRawTeamChemistry) * 100),
      0,
      100,
    );

    return {
      teamChemistry,
      maxTeamChemistry: 100,
      averagePlayerChemistry: Number((rawTeamChemistry / 11).toFixed(2)),
      players,
    };
  }

  private stringifyMatchSimulationDetails(match: SimulatedMatch): string {
    return JSON.stringify({
      awayLineup: match.awayLineup,
      events: match.events,
      homeLineup: match.homeLineup,
      reason: match.simulationReason,
      stats: match.stats,
    });
  }

  private resolveVisiblePlayerImageUrl(imageUrl: string | null): string | null {
    if (!imageUrl) {
      return null;
    }

    if (!imageUrl.startsWith(PLAYER_IMAGE_PUBLIC_PATH)) {
      return imageUrl;
    }

    const playerImagesPath =
      process.env.PLAYER_IMAGE_CACHE_DIR ??
      join(process.cwd(), "public", "player-images");
    const localImagePath = join(playerImagesPath, basename(imageUrl));

    return existsSync(localImagePath) ? imageUrl : null;
  }

  private sanitizeSavedSquadSnapshot(
    snapshot: SavedSquadSnapshotResponse,
  ): SavedSquadSnapshotResponse {
    return {
      ...snapshot,
      picks: snapshot.picks.map((pick) => ({
        ...pick,
        playerCard: {
          ...pick.playerCard,
          player: {
            ...pick.playerCard.player,
            imageUrl: this.resolveVisiblePlayerImageUrl(
              pick.playerCard.player.imageUrl,
            ),
          },
        },
      })),
    };
  }

  private mapPicks(picks: PickWithCard[]): DraftPickResponseItem[] {
    return picks.map((pick) => ({
      ...pick,
      pickedAt: pick.pickedAt.toISOString(),
    }));
  }

  private mapSavedSquad(savedSquad: SavedSquad): SavedSquadResponse {
    return {
      id: savedSquad.id,
      sessionId: savedSquad.sessionId,
      name: savedSquad.name,
      formation: savedSquad.formation,
      rating: savedSquad.rating,
      chemistry: savedSquad.chemistry,
      snapshot: this.sanitizeSavedSquadSnapshot(
        savedSquad.snapshot as SavedSquadSnapshotResponse,
      ),
      createdAt: savedSquad.createdAt.toISOString(),
    };
  }

  private parseMatchSimulationDetails(rawDetails: string | null): {
    awayLineup: string[];
    events: MatchTimelineEvent[];
    homeLineup: string[];
    reason: string | null;
    stats: MatchStats | null;
  } {
    if (!rawDetails) {
      return {
        awayLineup: [],
        events: [],
        homeLineup: [],
        reason: null,
        stats: null,
      };
    }

    try {
      const parsed = JSON.parse(rawDetails) as Partial<{
        awayLineup: string[];
        events: MatchTimelineEvent[];
        homeLineup: string[];
        reason: string;
        stats: MatchStats;
      }>;

      return {
        awayLineup: Array.isArray(parsed.awayLineup) ? parsed.awayLineup : [],
        events: Array.isArray(parsed.events) ? parsed.events : [],
        homeLineup: Array.isArray(parsed.homeLineup) ? parsed.homeLineup : [],
        reason: parsed.reason ?? rawDetails,
        stats: parsed.stats ?? null,
      };
    } catch {
      return {
        awayLineup: [],
        events: [],
        homeLineup: [],
        reason: rawDetails,
        stats: null,
      };
    }
  }

  private mapTournamentResponse(tournament: {
    id: string;
    sessionId: string;
    status: TournamentStatus;
    userTeamName: string;
    championTeam: string | null;
    completedAt: Date | null;
    matches: {
      id: string;
      stage: TournamentStage;
      bracketIndex: number;
      homeTeamName: string;
      awayTeamName: string;
      homeStrength: number;
      awayStrength: number;
      homeChemistry: number;
      awayChemistry: number;
      homeScore: number;
      awayScore: number;
      winnerTeamName: string;
      isUserMatch: boolean;
      wentToPenalties: boolean;
      simulationProvider: string;
      simulationReason: string | null;
      playedAt: Date;
    }[];
  }): TournamentResponse {
    const stageOrder: Record<TournamentStage, number> = {
      QUARTERFINAL: 1,
      SEMIFINAL: 2,
      FINAL: 3,
    };

    const matches = [...tournament.matches]
      .sort((a, b) => {
        const stageDiff = stageOrder[a.stage] - stageOrder[b.stage];

        if (stageDiff !== 0) {
          return stageDiff;
        }

        return a.bracketIndex - b.bracketIndex;
      })
      .map((match) => {
        const details = this.parseMatchSimulationDetails(
          match.simulationReason,
        );

        return {
          ...match,
          awayLineup: details.awayLineup,
          events: details.events,
          homeLineup: details.homeLineup,
          playedAt: match.playedAt.toISOString(),
          simulationReason: details.reason,
          stats: details.stats,
        };
      });

    const userMatches = matches.filter((match) => match.isUserMatch);
    const lastUserMatch = userMatches[userMatches.length - 1] ?? null;

    const eliminatedIn =
      lastUserMatch && lastUserMatch.winnerTeamName !== tournament.userTeamName
        ? lastUserMatch.stage
        : null;

    return {
      tournament: {
        id: tournament.id,
        sessionId: tournament.sessionId,
        status: tournament.status,
        userTeamName: tournament.userTeamName,
        championTeam: tournament.championTeam,
        completedAt: tournament.completedAt?.toISOString() ?? null,
      },
      matches,
      userJourney: {
        matchesPlayed: userMatches.length,
        eliminatedIn,
        isChampion: tournament.status === TournamentStatus.CHAMPION,
      },
    };
  }

  private sampleUnique<T>(items: T[], count: number): T[] {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i -= 1) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
    }

    return copy.slice(0, Math.min(count, copy.length));
  }

  private shuffleArray<T>(items: T[]): T[] {
    return this.sampleUnique(items, items.length);
  }

  private clamp(value: number, min: number, max: number): number {
    if (value < min) {
      return min;
    }

    if (value > max) {
      return max;
    }

    return value;
  }
}
