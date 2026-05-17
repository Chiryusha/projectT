import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import type { Request, Response } from "express";
import { catchError, tap, throwError } from "rxjs";

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const requestId = this.getRequestId(request);
    const startedAt = Date.now();

    response.setHeader("X-Request-Id", requestId);

    return next.handle().pipe(
      tap(() => {
        this.logRequest({
          durationMs: Date.now() - startedAt,
          method: request.method,
          path: this.getSafePath(request),
          requestId,
          statusCode: response.statusCode,
        });
      }),
      catchError((error: unknown) => {
        this.logRequest({
          durationMs: Date.now() - startedAt,
          errorName:
            error instanceof Error ? error.constructor.name : "UnknownError",
          method: request.method,
          path: this.getSafePath(request),
          requestId,
          statusCode: this.getErrorStatusCode(error, response.statusCode),
        });

        return throwError(() => error);
      }),
    );
  }

  private getRequestId(request: Request) {
    const requestId = request.header("x-request-id");

    return requestId?.trim() || randomUUID();
  }

  private getSafePath(request: Request) {
    return request.originalUrl.split("?")[0] ?? request.path;
  }

  private getErrorStatusCode(error: unknown, fallbackStatusCode: number) {
    if (error instanceof HttpException) {
      return error.getStatus();
    }

    return fallbackStatusCode >= 400 ? fallbackStatusCode : 500;
  }

  private logRequest(entry: {
    durationMs: number;
    errorName?: string;
    method: string;
    path: string;
    requestId: string;
    statusCode: number;
  }) {
    const payload = {
      durationMs: entry.durationMs,
      errorName: entry.errorName,
      level: entry.statusCode >= 500 ? "error" : "info",
      method: entry.method,
      path: entry.path,
      requestId: entry.requestId,
      statusCode: entry.statusCode,
      timestamp: new Date().toISOString(),
      type: "http_request",
    };

    if (entry.statusCode >= 500) {
      console.error(JSON.stringify(payload));
      return;
    }

    console.log(JSON.stringify(payload));
  }
}