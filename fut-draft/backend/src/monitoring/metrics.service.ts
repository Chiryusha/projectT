import { Injectable } from "@nestjs/common";
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from "prom-client";

type HttpMetricInput = {
  durationSeconds: number;
  method: string;
  route: string;
  statusCode: number;
};

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();
  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpErrorsTotal: Counter<string>;
  private readonly httpRequestDurationSeconds: Histogram<string>;
  private readonly authEventsTotal: Counter<string>;
  private readonly draftEventsTotal: Counter<string>;
  private readonly tournamentEventsTotal: Counter<string>;
  private readonly matchSimulationsTotal: Counter<string>;
  private readonly matchSimulationDurationSeconds: Histogram<string>;
  private readonly frontendPageViewsTotal: Counter<string>;
  private readonly frontendEventsTotal: Counter<string>;

  constructor() {
    this.registry.setDefaultLabels({
      app: "fut-draft-backend",
    });

    collectDefaultMetrics({
      prefix: "futdraft_node_",
      register: this.registry,
    });

    this.httpRequestsTotal = new Counter({
      help: "Total HTTP requests handled by the Nest backend.",
      labelNames: ["method", "route", "status"],
      name: "futdraft_http_requests_total",
      registers: [this.registry],
    });

    this.httpErrorsTotal = new Counter({
      help: "Total HTTP responses with status code >= 400.",
      labelNames: ["method", "route", "status"],
      name: "futdraft_http_errors_total",
      registers: [this.registry],
    });

    this.httpRequestDurationSeconds = new Histogram({
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      help: "HTTP request duration in seconds.",
      labelNames: ["method", "route", "status"],
      name: "futdraft_http_request_duration_seconds",
      registers: [this.registry],
    });

    this.authEventsTotal = new Counter({
      help: "Authentication business events.",
      labelNames: ["event", "status"],
      name: "futdraft_auth_events_total",
      registers: [this.registry],
    });

    this.draftEventsTotal = new Counter({
      help: "Draft feature business events.",
      labelNames: ["event", "context"],
      name: "futdraft_draft_events_total",
      registers: [this.registry],
    });

    this.tournamentEventsTotal = new Counter({
      help: "Tournament business events.",
      labelNames: ["event", "difficulty"],
      name: "futdraft_tournament_events_total",
      registers: [this.registry],
    });

    this.matchSimulationsTotal = new Counter({
      help: "Match simulations grouped by provider and result status.",
      labelNames: ["provider", "status"],
      name: "futdraft_match_simulations_total",
      registers: [this.registry],
    });

    this.matchSimulationDurationSeconds = new Histogram({
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
      help: "Match simulation duration in seconds.",
      labelNames: ["provider", "status"],
      name: "futdraft_match_simulation_duration_seconds",
      registers: [this.registry],
    });

    this.frontendPageViewsTotal = new Counter({
      help: "Frontend page views sent by the browser.",
      labelNames: ["page"],
      name: "futdraft_frontend_page_views_total",
      registers: [this.registry],
    });

    this.frontendEventsTotal = new Counter({
      help: "Frontend interaction events sent by the browser.",
      labelNames: ["event", "page"],
      name: "futdraft_frontend_events_total",
      registers: [this.registry],
    });
  }

  get contentType() {
    return this.registry.contentType;
  }

  metricsText() {
    return this.registry.metrics();
  }

  recordHttpRequest(input: HttpMetricInput) {
    const labels = {
      method: input.method,
      route: this.normalizeRoute(input.route),
      status: String(input.statusCode),
    };

    this.httpRequestsTotal.inc(labels);
    this.httpRequestDurationSeconds.observe(labels, input.durationSeconds);

    if (input.statusCode >= 400) {
      this.httpErrorsTotal.inc(labels);
    }
  }

  recordAuthEvent(event: string, status: "success" | "failure") {
    this.authEventsTotal.inc({
      event: this.normalizeLabel(event),
      status,
    });
  }

  recordDraftEvent(event: string, context = "general") {
    this.draftEventsTotal.inc({
      context: this.normalizeLabel(context),
      event: this.normalizeLabel(event),
    });
  }

  recordTournamentEvent(event: string, difficulty: string, matchesCount = 1) {
    this.tournamentEventsTotal.inc(
      {
        difficulty: this.normalizeLabel(difficulty),
        event: this.normalizeLabel(event),
      },
      matchesCount,
    );
  }

  recordMatchSimulation(
    provider: string,
    status: "success" | "failure" | "fallback",
    durationSeconds: number,
  ) {
    const labels = {
      provider: this.normalizeLabel(provider),
      status,
    };

    this.matchSimulationsTotal.inc(labels);
    this.matchSimulationDurationSeconds.observe(labels, durationSeconds);
  }

  recordFrontendPageView(page: string) {
    this.frontendPageViewsTotal.inc({
      page: this.normalizePage(page),
    });
  }

  recordFrontendEvent(event: string, page: string) {
    this.frontendEventsTotal.inc({
      event: this.normalizeLabel(event),
      page: this.normalizePage(page),
    });
  }

  private normalizeRoute(route: string) {
    return this.normalizeLabel(route.replace(/\/+/g, "/"), "unknown", 160);
  }

  private normalizePage(page: string) {
    return this.normalizeLabel(page.split("?")[0] ?? "/", "/", 120);
  }

  private normalizeLabel(value: string, fallback = "unknown", maxLength = 80) {
    const trimmedValue = value.trim();

    return (trimmedValue || fallback).slice(0, maxLength);
  }
}