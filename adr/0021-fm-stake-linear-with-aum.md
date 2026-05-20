# ADR-0021: FM Stake Linear with AUM (Base + Per-AUM Ratio)

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: tokenomics, stake, fund-manager

## Context and Problem Statement

Fund Manager (FM) collateral exists to align FM incentives with investor outcomes and to provide a slashable pool that can compensate harmed parties when an FM misbehaves. The amount required from each FM should scale with the risk the FM imposes on the protocol — a $100M AUM fund creates orders of magnitude more potential harm than a $100k AUM fund.

A flat stake disconnects collateral from risk. At a level high enough to secure a $100M fund, it excludes small FMs entirely; at a level affordable to small FMs, it provides no meaningful skin-in-the-game for large ones. Exponential stake curves, in contrast, penalize FM growth: each additional dollar of AUM costs disproportionately more in stake, discouraging the FMs the protocol most wants to retain. Reputation-only systems remove economic security altogether.

The protocol needs a stake formula that scales smoothly with AUM, sets a credible floor for small FMs, and remains affordable for large successful FMs. Both the floor and the slope should be governance-tunable within safe immutable bounds so that the protocol can respond to changing economic conditions without giving the DAO unbounded control.

## Decision Drivers

- Stake must scale with the risk the FM imposes on the protocol.
- Stake must not penalize FM growth.
- A meaningful floor must apply to small FMs.
- Parameters must be tunable but bounded.

## Considered Options

1. **Fixed flat stake** — one stake amount for every FM.
2. **Linear scaling** — `baseStake + AUM × ratio`.
3. **Exponential scaling** — stake grows super-linearly with AUM.
4. **Reputation-based** — stake replaced by reputation score from prior performance.

## Decision Outcome

**Chosen option**: *Linear scaling with a base stake*, because it provides a credible floor for small FMs and proportional collateral for large FMs without discouraging growth.

### Positive Consequences

- Every FM has at least `baseStake` skin-in-the-game.
- Additional AUM brings proportional additional stake, keeping collateral roughly aligned with potential harm.
- Linear shape is simple to reason about and predict for FMs scaling their funds.
- Both `baseStake` and `stakePerAUMRatio` live in `DAOConfigCore` (ADR-0013) with immutable min/max bounds.

### Negative Consequences / Trade-offs

- Linear scaling does not capture risk differences across strategies; a high-leverage fund pays the same per-AUM stake as a low-leverage one.
- Stake must be updated as AUM grows; a top-up flow is required when AUM crosses thresholds.
- Locked stake reduces FM operational capital.

## Pros and Cons of the Options

### Option A — Fixed flat stake

- ✅ Pro: Trivial to implement.
- ❌ Con: Not risk-proportional.
- ❌ Con: Either excludes small FMs or leaves large funds undercollateralized.

### Option B — Linear scaling

- ✅ Pro: Proportional collateral.
- ✅ Pro: Predictable for FMs.
- ❌ Con: Does not differentiate by strategy risk.
- ❌ Con: Requires top-ups as AUM grows.

### Option C — Exponential scaling

- ✅ Pro: Heavily penalizes outsized funds.
- ❌ Con: Punishes growth and discourages retention of large FMs.
- ❌ Con: Parameter calibration is sensitive and brittle.

### Option D — Reputation-based

- ✅ Pro: No upfront capital required.
- ❌ Con: No economic security against misbehavior.
- ❌ Con: Reputation systems are gameable and slow to bootstrap.

## Implementation Notes

- Required stake formula: `requiredStake = baseStake + (AUM × stakePerAUMRatio) / 10_000`, with `stakePerAUMRatio` expressed in basis points.
- Defaults: `baseStake = 10_000 TOSS`, `stakePerAUMRatio = 10 bps` (0.1%).
- Immutable bounds: `baseStake ∈ [5_000, 50_000] TOSS`, `stakePerAUMRatio ∈ [5, 50] bps`.
- `FundFactory.createFund` locks `requiredStake(initialAUM)` at creation; `FundManagerVault` enforces top-ups via `requireTopUp()` when current AUM grows beyond the level covered by the existing stake.
- Stake remains locked during fund operation and through a post-closure withdrawal delay (defined in DAOConfigCore) so that late-emerging claims remain collateralized.

## Links

- **Source documentation**: `docs/protocol/contracts/fund/FundFactory.md`, `docs/protocol/contracts/core/DAOConfigCore.md`, `docs/protocol/standards/overview.md`
- **Related ADRs**: ADR-0013, ADR-0025
- **External references**: —
