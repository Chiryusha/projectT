import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import {
  TrackFrontendEventDto,
  TrackPageViewDto,
} from "./dto/track-frontend-event.dto";
import { MetricsService } from "./metrics.service";

type AnalyticsAckResponse = {
  success: true;
};

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly metrics: MetricsService) {}

  @ApiOperation({ summary: "Collect frontend page view metric" })
  @ApiResponse({ status: 201, description: "Page view metric collected" })
  @Post("page-view")
  trackPageView(@Body() dto: TrackPageViewDto): AnalyticsAckResponse {
    this.metrics.recordFrontendPageView(dto.page);

    return { success: true };
  }

  @ApiOperation({ summary: "Collect frontend interaction metric" })
  @ApiResponse({
    status: 201,
    description: "Frontend interaction metric collected",
  })
  @Post("event")
  trackEvent(@Body() dto: TrackFrontendEventDto): AnalyticsAckResponse {
    this.metrics.recordFrontendEvent(dto.event, dto.page ?? "unknown");

    if (dto.level === "error" || dto.level === "warning") {
      console.warn(
        JSON.stringify({
          event: dto.event,
          level: dto.level,
          message: dto.message ?? null,
          page: dto.page ?? "unknown",
          source: dto.source ?? null,
          timestamp: new Date().toISOString(),
          type: "frontend_log",
        }),
      );
    }

    return { success: true };
  }
}