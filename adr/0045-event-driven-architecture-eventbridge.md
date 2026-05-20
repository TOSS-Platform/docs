# ADR-0045: Event-Driven Service Architecture via EventBridge

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: architecture, events, eventbridge

## Context and Problem Statement

The TOSS off-chain plane consists of multiple cooperating services: the NAV Engine (ADR-0043), the Trade Router (ADR-0044), AnalyticsHub publishers, the compliance pipeline, alerting workers, and chain-event listeners. These services depend on each other transitively — a trade triggers a NAV recompute, which triggers an AnalyticsHub commit, which may trigger a compliance flag, which may trigger an alert.

Wiring this graph with direct HTTP calls produces a fragile point-to-point mesh. One slow service back-pressures every caller; one downed service silently drops downstream side effects unless every caller implements retries, dead-letter queues, and idempotency on its own. The mesh also grows quadratically in coupling as services are added.

Polling on-chain events from each service independently is similarly bad: every service maintains its own block cursor, every service hits the RPC node, and duplicate processing is hard to rule out. The RPC load alone triples or quadruples for no benefit.

A central event bus that decouples producers from consumers — with typed messages, at-least-once delivery, and per-consumer idempotency — solves both problems.

## Decision Drivers

- Services must remain decoupled: a new consumer must not require changes to producers.
- On-chain events should be ingested once, then fanned out to interested consumers.
- Operational overhead must stay low; the team will not run a Kafka cluster at this scale.
- Cross-service workflows must be expressible declaratively, not as ad-hoc HTTP chains.

## Considered Options

1. **Direct service-to-service HTTP** — Producers call consumers directly.
2. **Apache Kafka** — Self-hosted or managed Kafka cluster as the event backbone.
3. **AWS EventBridge** — Managed AWS event bus with typed rules and targets.

## Decision Outcome

**Chosen option**: *AWS EventBridge*, because it delivers managed pub/sub with native AWS integration at the scale the protocol actually needs, with zero cluster operations.

### Positive Consequences

- Producers publish without knowing consumers; new consumers plug in via rules.
- Single chain-listener service handles all on-chain ingestion; RPC load is minimized.
- Built-in retry, dead-letter, and archive replay reduce per-service boilerplate.
- Declarative EventBridge rules express cross-service workflows in IaC (per ADR-0049).

### Negative Consequences / Trade-offs

- Vendor lock-in to AWS for messaging semantics.
- EventBridge throughput is sufficient today but lower-ceiling than Kafka.
- Per-consumer idempotency is still each consumer's responsibility.

## Pros and Cons of the Options

### Option A — Direct service-to-service HTTP

- ✅ Pro: Simplest mental model, easy to debug a single call.
- ❌ Con: Brittle mesh; one slow consumer back-pressures producers.
- ❌ Con: Every service reimplements retry / DLQ / idempotency.

### Option B — Apache Kafka

- ✅ Pro: Highest throughput, replayable log, strong ordering.
- ❌ Con: Operating a Kafka cluster (or paying MSK) is heavy at our scale.
- ❌ Con: Schema and partition design overhead.

### Option C — AWS EventBridge

- ✅ Pro: Fully managed, integrates natively with Lambda, ECS, SQS, Step Functions.
- ✅ Pro: Declarative rules fit Terraform-managed infra.
- ❌ Con: AWS-specific; portability cost if we ever leave.
- ❌ Con: Throughput ceiling well below Kafka — fine for now, watch for growth.

## Implementation Notes

A single chain-listener service subscribes to zkSync Era and Ethereum L1 logs and translates them into typed EventBridge messages (e.g., `toss.fund.share_minted`, `toss.risk.fault_recorded`). Off-chain producers (NAV Engine, Trade Router) publish their own typed events.

Each consumer:

- Subscribes via an EventBridge rule with the minimal source/detail-type filter it needs.
- Maintains its own idempotency keys (event ID + consumer name) in PostgreSQL (ADR-0046).
- Pushes failed events to a per-consumer SQS dead-letter queue with alerting on depth.

Multi-step workflows (trade settled → NAV recompute → analytics commit → compliance check) are wired as EventBridge rules; no consumer calls another directly.

## Links

- **Source documentation**: `docs/technical/offchain/overview.md`
- **Related ADRs**: ADR-0043, ADR-0044, ADR-0047
- **External references**: AWS EventBridge documentation, EventBridge schema registry
