# ADR-0043: Off-Chain NAV Engine with On-Chain Commitment

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: nav, offchain, hybrid

## Context and Problem Statement

Net Asset Value (NAV) for a TOSS fund depends on multi-source pricing feeds, position valuation across both CEX and DEX venues, accrued performance and management fees, and pending trades that have not yet settled on-chain. Computing the full NAV directly on-chain on every block is gas-prohibitive: a single fund with positions across several venues can require dozens of oracle reads and arithmetic operations that would dominate block gas usage.

Beyond raw cost, fully on-chain NAV introduces brittleness. If any oracle is stale, missing, or temporarily delisted, the on-chain compute path either reverts (blocking share pricing and withdrawals entirely) or silently returns wrong numbers. Neither failure mode is acceptable for a fund accounting layer.

Conversely, pushing NAV entirely off-chain and trusting the operator to report it removes verifiability. Investors cannot prove the share price they redeem at is honest, and the protocol cannot enforce slashing or fee logic against authoritative numbers. A hybrid that combines off-chain computation with on-chain attestation is required.

The decision must define where computation happens, what artifact lives on-chain, and how downstream contracts (share pricing, withdrawals, slashing) consume it.

## Decision Drivers

- Per-block gas cost must remain bounded regardless of the number of venues a fund touches.
- Reported NAV must be verifiable — anyone can recompute and challenge.
- A single stale oracle must not block share pricing for an entire epoch.
- NAV must update at least once per minute for active strategies.

## Considered Options

1. **Fully on-chain NAV** — Every component priced in a contract call.
2. **Fully off-chain reporting** — Operator publishes NAV to a backend with no on-chain artifact.
3. **Off-chain compute + on-chain commitment** — Off-chain engine, on-chain hash + snapshot.

## Decision Outcome

**Chosen option**: *Off-chain compute + on-chain commitment*, because it keeps gas bounded while preserving a tamper-evident on-chain record that downstream contracts can read and that anyone can re-derive.

### Positive Consequences

- Constant-gas reads from share pricing and withdrawal contracts regardless of venue count.
- Oracle staleness affects only the off-chain commit step; the last committed NAV remains usable.
- The committed hash + snapshot is sufficient for third-party verification.
- The NAV Engine can be horizontally scaled and replaced without contract upgrades.

### Negative Consequences / Trade-offs

- Adds an off-chain dependency: if the NAV Engine is fully offline, no new commits land.
- Requires a separate verification path to detect a malicious or buggy engine.
- Latency between true market state and committed NAV is at least one commit interval.

## Pros and Cons of the Options

### Option A — Fully on-chain NAV

- ✅ Pro: Maximal verifiability with zero off-chain trust.
- ❌ Con: Per-tx gas cost grows with venue count; fund operations become unaffordable.
- ❌ Con: Any failing oracle blocks the entire pricing path.

### Option B — Fully off-chain reporting

- ✅ Pro: Cheapest and fastest path.
- ❌ Con: No verifiable artifact — operator can publish any number.
- ❌ Con: Cannot anchor slashing or fee logic to authoritative state.

### Option C — Off-chain compute + on-chain commitment

- ✅ Pro: Bounded gas, verifiable artifact, decoupled oracle failures.
- ✅ Pro: NAV Engine can evolve independently of deployed contracts.
- ❌ Con: Introduces a service dependency.
- ❌ Con: Adds commitment lag (acceptable at minute granularity).

## Implementation Notes

A dedicated Node.js + TypeScript NAV Engine runs as an ECS Fargate service (per ADR-0047). Every minute it:

1. Pulls prices via `PriceOracleRouter` (ADR-0026) aggregating Chainlink, Pyth, and venue-native feeds.
2. Reads positions and pending orders from FundManagerVault state and the Trade Router (ADR-0044).
3. Adds accrued management and high-water-mark performance fees (ADR-0015).
4. Submits the detailed snapshot to FundManagerVault and commits the NAV hash via `AnalyticsHub` (ADR-0042).

Share pricing and withdrawal contracts read the on-chain committed NAV — never the off-chain raw value. A circuit breaker (ADR-0027) halts withdrawals if the committed NAV has not updated within a configured staleness window.

## Links

- **Source documentation**: `docs/technical/offchain/overview.md`, `docs/protocol/contracts/utilities/AnalyticsHub.md`
- **Related ADRs**: ADR-0019, ADR-0026, ADR-0042
- **External references**: Chainlink Data Feeds documentation, Pyth pull-oracle model
