import { Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TournamentStage } from "@prisma/client";

import { MetricsService } from "../monitoring/metrics.service";

export type MatchEventType = "GOAL" | "MISSED_PENALTY" | "RED_CARD";

export type MatchTimelineEvent = {
  minute: number;
  type: MatchEventType;
  team: "HOME" | "AWAY";
  playerName: string;
  description: string;
};

export type TeamMatchStats = {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  missedPenalties: number;
  expectedGoals: number;
};

export type MatchStats = {
  home: TeamMatchStats;
  away: TeamMatchStats;
};

export type MatchSimulationInput = {
  stage: TournamentStage;
  homeTeamName: string;
  awayTeamName: string;
  homeStrength: number;
  awayStrength: number;
  homeChemistry: number;
  awayChemistry: number;
  useAi?: boolean;
  homeLineup: string[];
  awayLineup: string[];
};

export type MatchSimulationResult = {
  homeScore: number;
  awayScore: number;
  winner: "HOME" | "AWAY";
  wentToPenalties: boolean;
  provider: "local" | "ai";
  reason: string;
  events: MatchTimelineEvent[];
  stats: MatchStats;
};

type AiChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

@Injectable()
export class MatchSimulatorService {
  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  async simulate(input: MatchSimulationInput): Promise<MatchSimulationResult> {
    const startedAt = Date.now();
    const aiEnabled =
      this.configService.get<string>("AI_MATCH_SIMULATION_ENABLED") === "true" &&
      input.useAi !== false;
    const recordResult = (
      result: MatchSimulationResult,
      status: "success" | "fallback",
    ) => {
      this.metrics?.recordMatchSimulation(
        result.provider,
        status,
        (Date.now() - startedAt) / 1000,
      );

      return result;
    };

    if (aiEnabled) {
      try {
        return recordResult(await this.simulateWithAi(input), "success");
      } catch (error) {
        this.logAiSimulationFailure(error);
        this.metrics?.recordMatchSimulation(
          "ai",
          "failure",
          (Date.now() - startedAt) / 1000,
        );

        return recordResult(
          this.simulateLocally(
            input,
            "OpenRouter unavailable, fallback to local simulation",
          ),
          "fallback",
        );
      }
    }

    return recordResult(
      this.simulateLocally(input, "Local simulation by rating and chemistry"),
      "success",
    );
  }

  private async simulateWithAi(input: MatchSimulationInput): Promise<MatchSimulationResult> {
    const endpoint =
      this.configService.get<string>("AI_MATCH_SIMULATION_ENDPOINT") ??
      "https://openrouter.ai/api/v1/chat/completions";
    const apiKey =
      this.configService.get<string>("OPENROUTER_API_KEY") ??
      this.configService.get<string>("AI_MATCH_SIMULATION_API_KEY") ??
      this.configService.get<string>("DEEPSEEK_API_KEY") ??
      "";
    const model =
      this.configService.get<string>("AI_MATCH_SIMULATION_MODEL") ??
      "deepseek/deepseek-v4-flash:free";
    const referer =
      this.configService.get<string>("OPENROUTER_HTTP_REFERER") ??
      "http://localhost:5173";
    const appTitle =
      this.configService.get<string>("OPENROUTER_APP_TITLE") ?? "Fut Draft";
    const timeoutMs = Number(
      this.configService.get<string>("AI_MATCH_SIMULATION_TIMEOUT_MS") ??
        "15000",
    );
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

    if (!apiKey) {
      throw new Error("OpenRouter API key is empty");
    }

    let response: Response;

    try {
      response = await fetch(endpoint, {
        method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": referer,
        "X-Title": appTitle,
      },
      body: JSON.stringify({
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content:
              "You simulate knockout football matches. Return only valid JSON, no markdown.",
          },
          {
            role: "user",
            content: this.buildAiPrompt(input),
          },
        ],
        model,
        response_format: { type: "json_object" },
        temperature: 0.9,
      }),
        signal: abortController.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `OpenRouter simulation failed with status ${response.status}: ${errorBody.slice(0, 300)}`,
      );
    }

    const data = (await response.json()) as AiChatCompletionResponse | Partial<MatchSimulationResult>;
    const rawContent =
      "choices" in data ? data.choices?.[0]?.message?.content : undefined;
    const parsed = rawContent
      ? (JSON.parse(rawContent) as Partial<MatchSimulationResult>)
      : (data as Partial<MatchSimulationResult>);

    return this.normalizeSimulation(input, {
      ...parsed,
      provider: "ai",
      reason: parsed.reason ?? "OpenRouter simulation based on squads, rating and chemistry",
    });
  }

  private logAiSimulationFailure(error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown AI error";

    console.warn(
      JSON.stringify({
        level: "warn",
        message,
        timestamp: new Date().toISOString(),
        type: "ai_match_simulation_failure",
      }),
    );
  }

  private buildAiPrompt(input: MatchSimulationInput) {
    return JSON.stringify({
      instruction:
        "Generate one realistic knockout football match. Scores must not end level. Events must match the final score: number of GOAL events for HOME equals homeScore, for AWAY equals awayScore. Include missed penalties and red cards occasionally. Keep minutes 1-90.",
      outputShape: {
        awayScore: "number 0-7",
        events:
          "array of { minute:number, type:'GOAL'|'MISSED_PENALTY'|'RED_CARD', team:'HOME'|'AWAY', playerName:string, description:string }",
        homeScore: "number 0-7",
        reason: "short string",
        stats:
          "{ home:{possession,shots,shotsOnTarget,corners,fouls,yellowCards,redCards,missedPenalties,expectedGoals}, away:{...same} }",
        wentToPenalties: "boolean",
        winner: "'HOME'|'AWAY'",
      },
      match: input,
    });
  }

  private simulateLocally(input: MatchSimulationInput, reason: string): MatchSimulationResult {
    const homeAdjusted = input.homeStrength + input.homeChemistry * 0.04;
    const awayAdjusted = input.awayStrength + input.awayChemistry * 0.04;

    const strengthGap = homeAdjusted - awayAdjusted;

    const homeExpected = 1.15 + strengthGap / 24 + Math.random() * 1.65;
    const awayExpected = 1.15 - strengthGap / 24 + Math.random() * 1.65;

    let homeScore = this.clamp(Math.round(homeExpected), 0, 6);
    let awayScore = this.clamp(Math.round(awayExpected), 0, 6);
    let wentToPenalties = false;

    if (homeScore === awayScore) {
      wentToPenalties = true;
      if (Math.random() >= 0.5) {
        homeScore += 1;
      } else {
        awayScore += 1;
      }
    }

    const stats = this.createLocalStats(input, homeScore, awayScore);
    const events = this.createLocalEvents(input, homeScore, awayScore, stats);

    return this.normalizeSimulation(input, {
      awayScore,
      events,
      homeScore,
      provider: "local",
      reason,
      stats,
      wentToPenalties,
      winner: homeScore > awayScore ? "HOME" : "AWAY",
    });
  }

  private normalizeSimulation(
    input: MatchSimulationInput,
    result: Partial<MatchSimulationResult>,
  ): MatchSimulationResult {
    let homeScore = this.clamp(Math.round(result.homeScore ?? 0), 0, 7);
    let awayScore = this.clamp(Math.round(result.awayScore ?? 0), 0, 7);
    let wentToPenalties = Boolean(result.wentToPenalties);

    if (homeScore === awayScore) {
      wentToPenalties = true;
      if (
        input.homeStrength + input.homeChemistry * 0.04 >=
        input.awayStrength + input.awayChemistry * 0.04
      ) {
        homeScore += 1;
      } else {
        awayScore += 1;
      }
    }

    const winner = homeScore > awayScore ? "HOME" : "AWAY";
    const stats = this.normalizeStats(result.stats, homeScore, awayScore);
    const events = this.normalizeEvents(
      input,
      result.events ?? [],
      homeScore,
      awayScore,
      stats,
    );

    return {
      awayScore,
      events,
      homeScore,
      provider: result.provider === "ai" ? "ai" : "local",
      reason: result.reason ?? "Match simulation",
      stats,
      wentToPenalties,
      winner,
    };
  }

  private createLocalStats(
    input: MatchSimulationInput,
    homeScore: number,
    awayScore: number,
  ): MatchStats {
    const homeEdge =
      input.homeStrength +
      input.homeChemistry * 0.08 -
      input.awayStrength -
      input.awayChemistry * 0.08;
    const homePossession = this.clamp(Math.round(50 + homeEdge / 2 + this.randomInt(-6, 7)), 38, 64);
    const awayPossession = 100 - homePossession;
    const homeShots = this.clamp(homeScore * 3 + this.randomInt(5, 10), 4, 22);
    const awayShots = this.clamp(awayScore * 3 + this.randomInt(5, 10), 4, 22);

    return {
      away: {
        corners: this.randomInt(1, 8),
        expectedGoals: Number((awayScore * 0.7 + Math.random() * 1.4).toFixed(1)),
        fouls: this.randomInt(6, 16),
        missedPenalties: Math.random() > 0.82 ? 1 : 0,
        possession: awayPossession,
        redCards: Math.random() > 0.9 ? 1 : 0,
        shots: awayShots,
        shotsOnTarget: this.clamp(awayScore + this.randomInt(2, 6), awayScore, awayShots),
        yellowCards: this.randomInt(0, 4),
      },
      home: {
        corners: this.randomInt(1, 8),
        expectedGoals: Number((homeScore * 0.7 + Math.random() * 1.4).toFixed(1)),
        fouls: this.randomInt(6, 16),
        missedPenalties: Math.random() > 0.82 ? 1 : 0,
        possession: homePossession,
        redCards: Math.random() > 0.9 ? 1 : 0,
        shots: homeShots,
        shotsOnTarget: this.clamp(homeScore + this.randomInt(2, 6), homeScore, homeShots),
        yellowCards: this.randomInt(0, 4),
      },
    };
  }

  private createLocalEvents(
    input: MatchSimulationInput,
    homeScore: number,
    awayScore: number,
    stats: MatchStats,
  ): MatchTimelineEvent[] {
    const events: MatchTimelineEvent[] = [];

    for (let index = 0; index < homeScore; index += 1) {
      const playerName = this.pickPlayerName(input.homeLineup, index);
      events.push({
        description: `${playerName} sends ${input.homeTeamName} ahead`,
        minute: this.randomInt(8, 88),
        playerName,
        team: "HOME",
        type: "GOAL",
      });
    }

    for (let index = 0; index < awayScore; index += 1) {
      const playerName = this.pickPlayerName(input.awayLineup, index);
      events.push({
        description: `${playerName} scores for ${input.awayTeamName}`,
        minute: this.randomInt(8, 88),
        playerName,
        team: "AWAY",
        type: "GOAL",
      });
    }

    this.addDisciplineEvents(events, input.homeLineup, "HOME", stats.home);
    this.addDisciplineEvents(events, input.awayLineup, "AWAY", stats.away);

    return events.sort((a, b) => a.minute - b.minute);
  }

  private addDisciplineEvents(
    events: MatchTimelineEvent[],
    lineup: string[],
    team: "HOME" | "AWAY",
    stats: TeamMatchStats,
  ) {
    for (let index = 0; index < stats.missedPenalties; index += 1) {
      const playerName = this.pickPlayerName(lineup, index + 3);
      events.push({
        description: `${playerName} misses from the spot`,
        minute: this.randomInt(18, 86),
        playerName,
        team,
        type: "MISSED_PENALTY",
      });
    }

    for (let index = 0; index < stats.redCards; index += 1) {
      const playerName = this.pickPlayerName(lineup, index + 6);
      events.push({
        description: `${playerName} is sent off`,
        minute: this.randomInt(28, 89),
        playerName,
        team,
        type: "RED_CARD",
      });
    }
  }

  private normalizeStats(
    stats: MatchStats | undefined,
    homeScore: number,
    awayScore: number,
  ): MatchStats {
    const fallback = this.createLocalStats(
      {
        awayChemistry: 0,
        awayLineup: [],
        awayStrength: 75,
        awayTeamName: "Away",
        homeChemistry: 0,
        homeLineup: [],
        homeStrength: 75,
        homeTeamName: "Home",
        stage: TournamentStage.QUARTERFINAL,
      },
      homeScore,
      awayScore,
    );

    return {
      away: this.normalizeTeamStats(stats?.away, fallback.away, awayScore),
      home: this.normalizeTeamStats(stats?.home, fallback.home, homeScore),
    };
  }

  private normalizeTeamStats(
    stats: TeamMatchStats | undefined,
    fallback: TeamMatchStats,
    score: number,
  ): TeamMatchStats {
    return {
      corners: this.clamp(Math.round(stats?.corners ?? fallback.corners), 0, 18),
      expectedGoals: Number(
        this.clamp(Number(stats?.expectedGoals ?? fallback.expectedGoals), 0, 8).toFixed(1),
      ),
      fouls: this.clamp(Math.round(stats?.fouls ?? fallback.fouls), 0, 35),
      missedPenalties: this.clamp(Math.round(stats?.missedPenalties ?? fallback.missedPenalties), 0, 3),
      possession: this.clamp(Math.round(stats?.possession ?? fallback.possession), 25, 75),
      redCards: this.clamp(Math.round(stats?.redCards ?? fallback.redCards), 0, 3),
      shots: this.clamp(Math.round(stats?.shots ?? fallback.shots), score, 35),
      shotsOnTarget: this.clamp(Math.round(stats?.shotsOnTarget ?? fallback.shotsOnTarget), score, 25),
      yellowCards: this.clamp(Math.round(stats?.yellowCards ?? fallback.yellowCards), 0, 8),
    };
  }

  private normalizeEvents(
    input: MatchSimulationInput,
    events: MatchTimelineEvent[],
    homeScore: number,
    awayScore: number,
    stats: MatchStats,
  ): MatchTimelineEvent[] {
    const normalizedEvents = events
      .filter((event) =>
        event &&
        (event.type === "GOAL" || event.type === "MISSED_PENALTY" || event.type === "RED_CARD") &&
        (event.team === "HOME" || event.team === "AWAY"),
      )
      .map((event) => ({
        description: String(event.description ?? event.type),
        minute: this.clamp(Math.round(Number(event.minute) || 1), 1, 90),
        playerName: String(event.playerName ?? "Unknown player"),
        team: event.team,
        type: event.type,
      }));

    const homeGoals = normalizedEvents.filter(
      (event) => event.type === "GOAL" && event.team === "HOME",
    ).length;
    const awayGoals = normalizedEvents.filter(
      (event) => event.type === "GOAL" && event.team === "AWAY",
    ).length;

    for (let index = homeGoals; index < homeScore; index += 1) {
      const playerName = this.pickPlayerName(input.homeLineup, index);
      normalizedEvents.push({
        description: `${playerName} scores for ${input.homeTeamName}`,
        minute: this.randomInt(8, 88),
        playerName,
        team: "HOME",
        type: "GOAL",
      });
    }

    for (let index = awayGoals; index < awayScore; index += 1) {
      const playerName = this.pickPlayerName(input.awayLineup, index);
      normalizedEvents.push({
        description: `${playerName} scores for ${input.awayTeamName}`,
        minute: this.randomInt(8, 88),
        playerName,
        team: "AWAY",
        type: "GOAL",
      });
    }

    this.ensureSpecialEvents(normalizedEvents, input.homeLineup, "HOME", stats.home);
    this.ensureSpecialEvents(normalizedEvents, input.awayLineup, "AWAY", stats.away);

    return normalizedEvents.sort((a, b) => a.minute - b.minute);
  }

  private ensureSpecialEvents(
    events: MatchTimelineEvent[],
    lineup: string[],
    team: "HOME" | "AWAY",
    stats: TeamMatchStats,
  ) {
    const missedPenaltyEvents = events.filter(
      (event) => event.team === team && event.type === "MISSED_PENALTY",
    ).length;
    const redCardEvents = events.filter(
      (event) => event.team === team && event.type === "RED_CARD",
    ).length;

    for (let index = missedPenaltyEvents; index < stats.missedPenalties; index += 1) {
      const playerName = this.pickPlayerName(lineup, index + 3);
      events.push({
        description: `${playerName} misses a penalty`,
        minute: this.randomInt(18, 86),
        playerName,
        team,
        type: "MISSED_PENALTY",
      });
    }

    for (let index = redCardEvents; index < stats.redCards; index += 1) {
      const playerName = this.pickPlayerName(lineup, index + 6);
      events.push({
        description: `${playerName} receives a red card`,
        minute: this.randomInt(28, 89),
        playerName,
        team,
        type: "RED_CARD",
      });
    }
  }

  private pickPlayerName(lineup: string[], index: number) {
    if (lineup.length === 0) {
      return "Player";
    }

    return lineup[index % lineup.length].replace(/^[A-Z]{1,3}\s+/, "");
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
