# ADR-0054: CloudWatch + BetterStack Observability Stack

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: observability, monitoring, logging

## Context and Problem Statement

The distributed off-chain plane needs three observability primitives: structured logs from every service, runtime metrics (CPU, memory, request rates, error counts), and alerting that pages an on-call engineer when something is on fire. Without a unified view, debugging cross-service incidents — for example, a NAV commit failure triggered by a Trade Router timeout that surfaced as a Redis miss — degenerates into manually correlating timestamps across many consoles.

AWS CloudWatch provides native metric and log integration for every AWS resource (ECS task logs, Lambda logs, RDS metrics, ALB request logs). It is the obvious default destination because the integration is automatic. However, its log search UI is slow, expensive at scale, and lacks the saved-query and dashboarding ergonomics that engineers need during an incident.

A unified engineer-facing log platform with fast full-text search, saved queries, and incident-grade alerting fills that gap. Commercial options include Datadog, Splunk, and BetterStack. Self-hosted ELK is an alternative but adds another stateful platform for the team to operate, which conflicts with the off-chain plane's general "managed-only" stance.

Alerting that pages on-call cannot share a channel with low-priority noise. The platform must integrate with a pager (Opsgenie or PagerDuty) and respect existing escalation rules.

## Decision Drivers

- Native AWS metrics and alarms must remain available with no extra integration cost.
- Engineers need a fast, full-text log search with saved queries and dashboards.
- Alerting must page on-call through Opsgenie or PagerDuty.
- Tool cost must be reasonable at our scale; Datadog-class pricing is out of scope.

## Considered Options

1. **CloudWatch only** — Use CloudWatch for everything.
2. **Datadog** — Full Datadog observability stack.
3. **BetterStack + CloudWatch hybrid** — CloudWatch native, BetterStack as the log UI.
4. **ELK self-hosted** — Run Elasticsearch + Logstash + Kibana ourselves.

## Decision Outcome

**Chosen option**: *BetterStack + CloudWatch hybrid*, because it keeps native AWS integration via CloudWatch while giving engineers a fast modern log UI and incident-grade alerting at a price that fits our scale.

### Positive Consequences

- AWS metrics, alarms, and per-service log groups stay native; zero integration cost.
- Engineers get fast full-text search, saved queries, and dashboards in BetterStack.
- Alerting flows through Opsgenie/PagerDuty without the platform competing for the same channel.
- Per-tool cost is significantly below Datadog-class platforms.

### Negative Consequences / Trade-offs

- Two systems to maintain queries and dashboards in.
- Log shipping pipeline (Vector / CloudWatch subscription filter) is one more thing to monitor.
- BetterStack is a third-party dependency in the incident-response path.

## Pros and Cons of the Options

### Option A — CloudWatch only

- ✅ Pro: Zero extra integration, single bill.
- ❌ Con: Log search UX is slow; engineers actively avoid it during incidents.
- ❌ Con: Cross-service correlation is awkward.

### Option B — Datadog

- ✅ Pro: Best-in-class unified observability platform.
- ❌ Con: Cost at our log volume is multiples of the alternative.
- ❌ Con: Vendor concentration risk.

### Option C — BetterStack + CloudWatch hybrid

- ✅ Pro: Native AWS + fast modern UI + good price point.
- ✅ Pro: PagerDuty / Opsgenie integration is first-class.
- ❌ Con: Two systems to query when debugging.
- ❌ Con: Log shipping pipeline to maintain.

### Option D — ELK self-hosted

- ✅ Pro: Full control, no per-GB pricing.
- ❌ Con: Operating an HA Elasticsearch cluster is significant work.
- ❌ Con: Contradicts the off-chain plane's managed-services posture.

## Implementation Notes

**CloudWatch** (native, default destination):

- Per-service CloudWatch log groups for every ECS task (ADR-0047) and Lambda function.
- CloudWatch metrics for RDS, ElastiCache, ALB, EventBridge, NAT gateways.
- CloudWatch alarms on infrastructure-level conditions (CPU, memory, replication lag, queue depth).
- Alarms publish to an SNS topic that fans out to BetterStack and to PagerDuty.

**BetterStack** (engineer-facing logs and alerting):

- Logs stream from CloudWatch log groups via subscription filter into Vector, which forwards to BetterStack.
- Full-text indexed; engineers run saved queries and build per-service dashboards.
- Incident rules in BetterStack page the on-call engineer via PagerDuty.
- Structured log fields are required: every service emits JSON logs with `service`, `request_id`, `fund_id` where applicable.

**Convention**:

- Infrastructure alarms originate in CloudWatch.
- Application-level incident rules (e.g., NAV commit gap > 5 min, trade failure burst) originate in BetterStack.
- Engineers query BetterStack first during incidents; drop to CloudWatch only for metric drill-downs not yet imported.

## Links

- **Source documentation**: `docs/technical/infrastructure/overview.md`
- **Related ADRs**: ADR-0047
- **External references**: Amazon CloudWatch, BetterStack Logs, Vector log router
