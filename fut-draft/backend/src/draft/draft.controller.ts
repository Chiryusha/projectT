import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthUser } from "../auth/types/auth-user.type";
import { CreateDraftSessionDto } from "./dto/create-draft-session.dto";
import { PickPlayerDto } from "./dto/pick-player.dto";
import { SaveSquadDto } from "./dto/save-squad.dto";
import { StartTournamentDto } from "./dto/start-tournament.dto";
import { SwapPicksDto } from "./dto/swap-picks.dto";
import { DraftService } from "./draft.service";

@ApiTags("draft")
@Controller("draft")
export class DraftController {
  constructor(private readonly draftService: DraftService) {}

  @ApiOperation({ summary: "Get available draft formations" })
  @ApiResponse({ status: 200, description: "Available formations list" })
  @Get("formations")
  getFormations() {
    return this.draftService.getFormations();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new draft session" })
  @ApiResponse({ status: 201, description: "Draft session created" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @UseGuards(JwtAuthGuard)
  @Post("sessions")
  createSession(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateDraftSessionDto,
  ) {
    return this.draftService.createSession(user.sub, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Get draft session state" })
  @ApiResponse({ status: 200, description: "Draft session state" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Draft session not found" })
  @UseGuards(JwtAuthGuard)
  @Get("sessions/:sessionId")
  getSessionState(
    @CurrentUser() user: AuthUser,
    @Param("sessionId", ParseUUIDPipe) sessionId: string,
  ) {
    return this.draftService.getSessionState(sessionId, user.sub);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current draft slot options" })
  @ApiResponse({ status: 200, description: "Current slot options" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @UseGuards(JwtAuthGuard)
  @Get("sessions/:sessionId/options")
  getCurrentOptions(
    @CurrentUser() user: AuthUser,
    @Param("sessionId", ParseUUIDPipe) sessionId: string,
  ) {
    return this.draftService.getCurrentOptions(sessionId, user.sub);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Generate and get options for a selected slot" })
  @ApiResponse({ status: 200, description: "Selected slot options" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 409, description: "Slot already contains a player" })
  @UseGuards(JwtAuthGuard)
  @Get("sessions/:sessionId/options/:slotNo")
  getSlotOptions(
    @CurrentUser() user: AuthUser,
    @Param("sessionId", ParseUUIDPipe) sessionId: string,
    @Param("slotNo", ParseIntPipe) slotNo: number,
  ) {
    return this.draftService.getOptionsForSlot(sessionId, user.sub, slotNo);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Get picked players for draft session" })
  @ApiResponse({ status: 200, description: "Draft picks list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @UseGuards(JwtAuthGuard)
  @Get("sessions/:sessionId/picks")
  getPicks(
    @CurrentUser() user: AuthUser,
    @Param("sessionId", ParseUUIDPipe) sessionId: string,
  ) {
    return this.draftService.getPicks(sessionId, user.sub);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Save completed draft squad snapshot" })
  @ApiResponse({ status: 201, description: "Squad saved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @UseGuards(JwtAuthGuard)
  @Post("sessions/:sessionId/saved-squad")
  saveSquad(
    @CurrentUser() user: AuthUser,
    @Param("sessionId", ParseUUIDPipe) sessionId: string,
    @Body() dto: SaveSquadDto,
  ) {
    return this.draftService.saveSquad(sessionId, user.sub, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's saved squads" })
  @ApiResponse({ status: 200, description: "Saved squads list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @UseGuards(JwtAuthGuard)
  @Get("saved-squads")
  getSavedSquads(@CurrentUser() user: AuthUser) {
    return this.draftService.getSavedSquads(user.sub);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete all current user's saved squads" })
  @ApiResponse({ status: 200, description: "Saved squads deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @UseGuards(JwtAuthGuard)
  @Delete("saved-squads")
  clearSavedSquads(@CurrentUser() user: AuthUser) {
    return this.draftService.clearSavedSquads(user.sub);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete one saved squad" })
  @ApiResponse({ status: 200, description: "Saved squad deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @UseGuards(JwtAuthGuard)
  @Delete("saved-squads/:savedSquadId")
  deleteSavedSquad(
    @CurrentUser() user: AuthUser,
    @Param("savedSquadId", ParseUUIDPipe) savedSquadId: string,
  ) {
    return this.draftService.deleteSavedSquad(savedSquadId, user.sub);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Pick player card for a draft slot" })
  @ApiResponse({ status: 201, description: "Player picked successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 409, description: "Player or slot conflict" })
  @UseGuards(JwtAuthGuard)
  @Post("sessions/:sessionId/pick")
  pickPlayer(
    @CurrentUser() user: AuthUser,
    @Param("sessionId", ParseUUIDPipe) sessionId: string,
    @Body() dto: PickPlayerDto,
  ) {
    return this.draftService.pickPlayer(sessionId, user.sub, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Swap two picked players between slots" })
  @ApiResponse({ status: 201, description: "Picks swapped successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @UseGuards(JwtAuthGuard)
  @Post("sessions/:sessionId/picks/swap")
  swapPicks(
    @CurrentUser() user: AuthUser,
    @Param("sessionId", ParseUUIDPipe) sessionId: string,
    @Body() dto: SwapPicksDto,
  ) {
    return this.draftService.swapPicks(sessionId, user.sub, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Start tournament for completed draft session" })
  @ApiResponse({ status: 201, description: "Tournament started" })
  @ApiResponse({ status: 400, description: "Draft session is not ready" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 409, description: "Tournament already exists" })
  @UseGuards(JwtAuthGuard)
  @Post("sessions/:sessionId/tournament/start")
  startTournament(
    @CurrentUser() user: AuthUser,
    @Param("sessionId", ParseUUIDPipe) sessionId: string,
    @Body() dto: StartTournamentDto,
  ) {
    return this.draftService.startTournament(
      sessionId,
      user.sub,
      dto?.aiDifficulty,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Get tournament state for draft session" })
  @ApiResponse({ status: 200, description: "Tournament state" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Tournament not found" })
  @UseGuards(JwtAuthGuard)
  @Get("sessions/:sessionId/tournament")
  getTournament(
    @CurrentUser() user: AuthUser,
    @Param("sessionId", ParseUUIDPipe) sessionId: string,
  ) {
    return this.draftService.getTournament(sessionId, user.sub);
  }
}
