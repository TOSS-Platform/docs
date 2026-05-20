# ADR-0042: AnalyticsHub — On-Chain Data Warehouse Anchors

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: analytics, observability, data-warehouse

## Context and Problem Statement

External tooling — dashboards, BI systems, off-chain risk monitors — needs efficient, verifiable access to aggregated protocol metrics: per-fund NAV, AUM, trade counts, fault counts, and similar series. Reading raw events for every dashboard query is expensive and prone to indexer lag, especially as the protocol scales to many funds and many participants. Each consumer ends up re-implementing the same aggregation pipeline.

Pushing aggregates only off-chain solves the cost problem but loses verifiability. Consumers must trust whatever indexer produced the aggregate; there is no on-chain anchor to detect tampering or to dispute. For a financial protocol where governance, fees, and reporting depend on these aggregates, untrusted off-chain values are not acceptable.

A middle ground stores compact aggregate hashes on-chain, paired with a structured event payload that points to the off-chain detail. Off-chain consumers fetch the detail and verify it against the on-chain hash. The hub never trusts user-supplied data — only attested submissions from authorized off-chain services are accepted, and even those are recorded as hashes that consumers can independently verify.

## Decision Drivers

- External tools need fast, verifiable access to aggregated metrics.
- Full on-chain aggregation is too expensive at scale.
- Pure off-chain analytics are not verifiable.
- Submissions must be attested and source-controlled.

## Considered Options

1. **Pure off-chain analytics** — indexers compute everything; no on-chain anchor.
2. **Full on-chain aggregation** — contracts compute all aggregates from events.
3. **On-chain hash anchors with off-chain detail** — attested snapshots, on-chain hash, off-chain payload.

## Decision Outcome

**Chosen option**: *On-chain hash anchors with off-chain detail*, because it gives verifiability without paying gas for full aggregation.

### Positive Consequences

- Consumers can verify off-chain aggregates against on-chain hashes.
- Gas cost is bounded — only a hash and a structured event per snapshot.
- Multiple consumers can share the same off-chain payload.
- Authorized submitters are explicit and revocable.

### Negative Consequences / Trade-offs

- Requires an off-chain submitter service to remain live for fresh anchors.
- Hash mismatches must be handled by consumers (retry, dispute).
- Historical detail availability depends on off-chain storage of payloads.

## Pros and Cons of the Options

### Option A — Pure off-chain analytics

- ✅ Pro: Zero on-chain cost.
- ❌ Con: Not verifiable; consumers must trust the indexer.
- ❌ Con: No on-chain anchor for governance or fee calculations.

### Option B — Full on-chain aggregation

- ✅ Pro: Maximally trustworthy; everything verifiable on-chain.
- ❌ Con: Gas cost is prohibitive at scale.
- ❌ Con: Aggregation logic upgrades touch core contracts.

### Option C — On-chain hash anchors with off-chain detail

- ✅ Pro: Verifiable without paying for full aggregation.
- ✅ Pro: Submitter set is bounded and governance-controlled.
- ❌ Con: Requires consumers to perform a verify step.

## Implementation Notes

- Interface:
  - `submit(bytes32 snapshotId, bytes32 payloadHash, bytes calldata structuredEvent)` — restricted to authorized submitters.
  - `latest(bytes32 snapshotId) returns (bytes32 payloadHash, uint256 timestamp)`.
- Authorized submitter set managed by governance.
- Hub never trusts user-supplied analytics; only attested submitters write.
- Off-chain payload location encoded in the structured event (URI / content hash).

## Links

- **Source documentation**: `/home/user/docs/protocol/contracts/utilities/AnalyticsHub.md`
- **Related ADRs**: ADR-0043, ADR-0045
