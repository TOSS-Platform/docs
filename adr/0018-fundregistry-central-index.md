# ADR-0018: FundRegistry as Central Fund Index

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: fund, registry, indexing

## Context and Problem Statement

Many parts of the protocol need to enumerate or look up funds: the UI lists funds by class and risk tier, governance routes proposals to FM-specific actions, the RiskEngine monitors aggregate exposure, and slashing logic must verify that a target contract is in fact a registered fund. A reliable, on-chain canonical list of funds with their metadata is required.

Relying purely on event logs and off-chain indexers is fragile. Indexers can lag, reorganize, or miss events; consumers in other on-chain contracts cannot read events at all. Worse, without an on-chain check there is no way for a contract to distinguish a legitimate fund from an impostor clone deployed by an attacker mimicking the same interface.

Per-contract self-registration — where each fund writes itself into a shared list — has the opposite problem: any contract can register itself and claim to be a fund. The registry needs both authoritative writes (only the factory can register) and queryable, structured reads (filter by class, manager, status).

## Decision Drivers

- Provide a canonical on-chain list of funds.
- Prevent impostor funds from claiming protocol membership.
- Support filtering by manager, class, and status from on-chain and off-chain consumers.
- Keep mutable per-fund fields cheap to update without rewriting immutable identifiers.

## Considered Options

1. **Subgraph-only** — rely entirely on off-chain indexers.
2. **Event-driven discovery** — consumers reconstruct the list from logs.
3. **Central registry with factory-controlled writes** — `FundRegistry` is authoritative; only `FundFactory` may register.

## Decision Outcome

**Chosen option**: *Central registry with factory-controlled writes*, because it provides authoritative on-chain truth, prevents impersonation, and is queryable from both on-chain and off-chain consumers.

### Positive Consequences

- Any contract can verify membership by calling `registry.isRegistered(fundAddress)`.
- Off-chain indexers use the registry as ground truth and reconcile against events.
- The factory is the single trusted writer, simplifying access control.
- Splitting immutable identifiers from mutable metadata keeps frequent NAV updates cheap.

### Negative Consequences / Trade-offs

- On-chain storage of fund entries costs gas at registration.
- Registry becomes a critical dependency; an outage on its upgrade would block fund creation.
- Indexing convenience features (sorted lists, paginated views) cost gas if implemented on-chain.

## Pros and Cons of the Options

### Option A — Subgraph-only

- ✅ Pro: No on-chain storage cost.
- ✅ Pro: Flexible filtering and aggregation off-chain.
- ❌ Con: On-chain contracts cannot consume it.
- ❌ Con: Subject to indexer outages and reorgs.

### Option B — Event-driven discovery

- ✅ Pro: No additional contract.
- ❌ Con: Race conditions: a fund exists on-chain before any indexer sees it.
- ❌ Con: No way for other contracts to verify a fund's authenticity.

### Option C — Central registry with factory-controlled writes

- ✅ Pro: Authoritative, queryable on-chain.
- ✅ Pro: Distinguishes real funds from impostors.
- ❌ Con: Storage costs at registration time.
- ❌ Con: Critical-path dependency.

## Implementation Notes

- `FundRegistry.register(FundEntry)` is gated by an RBAC role granted only to `FundFactory`.
- `FundEntry` contains immutable fields: `address vault`, `address executor`, `address manager`, `bytes32 fundClass`, `uint8 riskTier`, `address implementation`, `uint64 createdAt`.
- A separate `FundMetadata` struct holds mutable fields: current NAV, investor count, status (Active/Paused/Closed). The vault writes these as they change.
- Read functions support pagination and filtering by manager and class.
- `FundRegistry` is itself upgradeable through governance (ADR-0033) since it is non-custodial.

## Links

- **Source documentation**: `docs/protocol/contracts/fund/FundRegistry.md`
- **Related ADRs**: ADR-0016, ADR-0031
- **External references**: —
