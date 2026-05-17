import { Controller, Get, Res } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";

import { MetricsService } from "./metrics.service";

@ApiTags("metrics")
@Controller("metrics")
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @ApiOperation({ summary: "Expose Prometheus metrics" })
  @ApiResponse({ status: 200, description: "Prometheus text metrics" })
  @Get()
  async getMetrics(
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    response.type(this.metrics.contentType);
    return this.metrics.metricsText();
  }
}