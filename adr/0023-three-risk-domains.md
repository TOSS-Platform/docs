# ADR-0023: Three Risk Domains (Protocol / Fund / Investor)

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: risk, domains, architecture

## Context and Problem Statement

Risk in the TOSS Protocol does not originate from a single source. Three distinct concerns must be evaluated for any fund-mutating action: protocol-wide conditions (aggregate system leverage, market-wide circuit breakers, oracle confidence), fund-specific conditions (per-fund position limits, asset whitelist, FM stake adequacy), and investor-specific conditions (investor state machine, KYC class, Investor Composite Score). Each domain has its own data sources, update cadence, and ownership.

Combining all three concerns inside a single monolithic risk contract conflates separation of concerns: a change to investor reputation logic could destabilise protocol-wide checks, and the audit surface of the resulting contract becomes prohibitively large. Conversely, fully delegating each fund's risk to per-fund modules reintroduces the drift and attack-surface problems addressed in ADR-0022.

The middle ground is to keep the central enforcement point (the RiskEngine) but to factor its logic into three sibling Risk Domain contracts. Each domain owns one concern, is independently versionable, and contributes a partial FaultIndex score (ADR-0024). The RiskEngine composes them deterministically — `max()` for hard limits, weighted aggregation for soft signals — and returns a single decision.

## Decision Drivers

- Clean separation of concerns between protocol, fund, and investor risk.
- Independent evolution of each domain without cross-contamination.
- Manageable audit and formal-verification scope per contract.
- Deterministic, composable aggregation under the central RiskEngine.

## Considered Options

1. **Monolithic risk engine** — one contract owns all checks.
2. **Three-domain separation** — protocol, fund, and investor as siblings.
3. **Per-fund custom risk modules** — each FM ships their own module.

## Decision Outcome

**Chosen option**: *Three-domain separation*, because it preserves a single enforcement point while keeping each concern independently ownable, testable, and upgradeable.

### Positive Consequences

- Each domain can be audited and formally verified in isolation.
- Domain upgrades do not require touching unrelated logic.
- Clear ownership boundaries between the risk, fund, and investor teams.

### Negative Consequences / Trade-offs

- Three additional contract calls per validation (acceptable on L2 gas costs).
- Composition logic in the RiskEngine must be carefully specified to avoid ambiguous outcomes.
- Cross-domain invariants (e.g., investor class limits affecting fund caps) require explicit wiring.

## Pros and Cons of the Options

### Option A — Monolithic risk engine

- Pro: Single contract; one call site.
- Pro: No composition logic needed.
- Con: Mixed concerns — investor logic next to oracle thresholds.
- Con: Audit and verification scope grows unbounded.
- Con: Changes in one concern risk regressions in others.

### Option B — Three-domain separation

- Pro: Clear ownership and bounded audit scope per domain.
- Pro: Domains evolve independently; minor changes do not touch the engine.
- Pro: Composition is explicit and testable.
- Con: Slightly higher gas due to multiple delegated calls.
- Con: Engine must reason about cross-domain interactions explicitly.

### Option C — Per-fund custom risk modules

- Pro: Maximum flexibility for FM-specific strategies.
- Pro: No protocol-wide governance required for niche tweaks.
- Con: Reintroduces the drift problem ADR-0022 eliminates.
- Con: Expanded attack surface; every fund is a new audit target.
- Con: Cross-fund consistency becomes impossible to guarantee.

## Implementation Notes

- Contracts: `ProtocolRiskDomain`, `FundRiskDomain`, `InvestorRiskDomain`, all called from `RiskEngine.validate(...)`.
- Each domain exposes `evaluate(actionContext) returns (PartialFaultIndex)` and is stateless with respect to the caller.
- The RiskEngine aggregates results: hard limits use `max(severity)`; soft signals use the weighted formula from ADR-0024.
- Cross-domain dependencies (e.g., FundRiskDomain consulting InvestorClass) flow via read-only registry lookups, never via cross-domain writes.

## Links

- **Source documentation**: `docs/protocol/contracts/risk/FundRiskDomain.md`, `docs/protocol/contracts/risk/InvestorRiskDomain.md`, `docs/protocol/contracts/risk/ProtocolRiskDomain.md`
- **Related ADRs**: ADR-0022, ADR-0024
- **External references**: none
