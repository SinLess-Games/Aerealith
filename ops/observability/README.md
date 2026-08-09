# Observability operations

- Import `grafana/auth-overview.dashboard.json` into Grafana.
- Load `grafana/auth-alerts.yaml` through the Grafana Cloud metrics ruler API or
  your normal infrastructure-as-code pipeline.
- Replace the repository-relative `runbook_url` annotations with the deployed
  documentation URL before enabling notifications.
- Route critical alerts to an on-call contact and warnings to the owning team.

The dashboard intentionally uses only bounded labels. Request IDs and trace IDs
remain searchable log fields and are not metric labels.
