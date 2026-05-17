# Monitoring

Prometheus scrapes backend metrics from the deployed API:

```text
https://squaddraft.ru/api/metrics
```

For local-only testing, start the backend first, then run monitoring:

```bash
docker compose -f docker-compose.monitoring.yml up
```

Local URLs:

```text
Prometheus: http://localhost:9090
Grafana:    http://localhost:3000
```

Grafana admin login is configured as `admin` / `admin` for the project demo.
Anonymous viewing is enabled, so dashboards can be opened without logging in.

## Dokploy URLs

Recommended public routes:

```text
Prometheus: https://prometheus.squaddraft.ru -> service prometheus, port 9090
Grafana:    https://grafana.squaddraft.ru    -> service grafana, port 3000
```

In Dokploy, add these domains in the Docker Compose service Domains tab after
the first compose deploy. Enable HTTPS and use Let's Encrypt for both.

The compose file builds small Prometheus/Grafana images with configs and
dashboards copied into the images. Runtime volumes are used only for persisted
Prometheus and Grafana data.

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
