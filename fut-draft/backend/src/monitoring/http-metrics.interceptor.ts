import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Request } from "express";
import { catchError, tap, throwError } from "rxjs";

import { MetricsService } from "./metrics.service";

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<{ statusCode: number }>();
    const startedAt = process.hrtime.bigint();
    const method = request.method;
    const route = this.getRouteLabel(request);

    return next.handle().pipe(
      tap(() => {
        this.record({
          method,
          route,
          startedAt,
          statusCode: response.statusCode,
        });
      }),
      catchError((error: unknown) => {
        this.record({
          method,
          route,
          startedAt,
          statusCode: this.getErrorStatusCode(error, response.statusCode),
        });

        return throwError(() => error);
      }),
    );
  }

  private record(args: {
    method: string;
    route: string;
    startedAt: bigint;
    statusCode: number;
  }) {
    const durationSeconds =
      Number(process.hrtime.bigint() - args.startedAt) / 1_000_000_000;

    this.metrics.recordHttpRequest({
      durationSeconds,
      method: args.method,
      route: args.route,
      statusCode: args.statusCode,
    });
  }

  private getErrorStatusCode(error: unknown, fallbackStatusCode: number) {
    if (error instanceof HttpException) {
      return error.getStatus();
    }

    return fallbackStatusCode >= 400 ? fallbackStatusCode : 500;
  }

  private getRouteLabel(request: Request) {
    const routePath = request.route?.path;

    if (typeof routePath === "string") {
      return `${request.baseUrl}${routePath}` || "unknown";
    }

    return request.path
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi,
        ":id",
      )
      .replace(/\/\d+(?=\/|$)/g, "/:number");
  }
}