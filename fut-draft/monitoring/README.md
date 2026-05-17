# Monitoring

Prometheus scrapes backend metrics from:

```text
http://localhost:3001/api/metrics
```

Start the backend first, then run monitoring:

```bash
docker compose -f docker-compose.monitoring.yml up
```

Local URLs:

```text
Prometheus: http://localhost:9090
Grafana:    http://localhost:3002
```

Grafana default login is usually `admin` / `admin`.

## What We Collect

Backend HTTP:

```text
futdraft_http_requests_total
futdraft_http_errors_total
futdraft_http_request_duration_seconds
```

Business metrics:

```text
futdraft_auth_events_total
futdraft_draft_events_total
futdraft_tournament_events_total
futdraft_match_simulations_total
futdraft_match_simulation_duration_seconds
```

Frontend usage:

```text
futdraft_frontend_page_views_total
futdraft_frontend_events_total
```

## Useful PromQL

```promql
sum by(status, route) (futdraft_http_errors_total)
sum(rate(futdraft_http_errors_total{status=~"5.."}[5m]))
sum(rate(futdraft_http_errors_total{status=~"4.."}[5m]))
sum by(provider, status) (futdraft_match_simulations_total)
```

## Alerts

Alerts are declared in `monitoring/alerts.yml`. Prometheus shows them on the Alerts page.

`FutDraftHighServerErrors` counts only `5xx`, because `4xx` often means normal user/client behavior: invalid form, expired auth, not found session, already played tournament, and similar cases.

`FutDraftHighClientErrors` tracks a large amount of `4xx` separately as a softer warning.

`FutDraftAiSimulationFallbacks` means OpenRouter failed or timed out and the backend used local simulation. This alert can only happen on matches involving the user's squad, because bot-vs-bot matches are intentionally simulated locally to avoid slow tournament starts and extra AI calls.
