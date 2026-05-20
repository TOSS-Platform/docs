# ADR-0025: Slashing Split with Gamma (Burn + NAV Compensation)

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: slashing, tokenomics, recovery

## Context and Problem Statement

When a Fund Manager violates risk parameters severely enough to trigger slashing (FaultIndex ≥ 80 per ADR-0024), two distinct goals compete. The first is deterrence: slashed stake should leave circulation so the act of misbehaving has a permanent cost, supporting deflationary pressure on TOSS. The second is restitution: investors in the harmed fund have suffered real economic damage and should see at least partial NAV recovery, otherwise they are bearing the full cost of FM misbehaviour.

Burning the entire slashed amount delivers maximum deterrence but leaves harmed investors uncompensated, producing a "deterrence theatre" where the protocol punishes the FM yet investors bear the loss. Transferring the entire slashed amount to investors maximises restitution but removes the deflationary pressure and creates a moral-hazard incentive: investors may welcome moderate misbehaviour because slashing recoveries supplement returns. Neither extreme is acceptable.

A split parameterised by `gamma` lets the protocol tune the trade-off explicitly. The default settles a meaningful but minority share to NAV recovery, with the majority burned. DAO can adjust `gamma` within bounds set in the Immutable Layer to respond to observed protocol conditions without removing either property entirely.

## Decision Drivers

- Need for both deterrence and restitution from the same slashing event.
- Avoidance of moral hazard from over-compensating investors.
- DAO tunability within hard bounds to permit calibration over time.
- Predictability and auditability of the recovery pathway.

## Considered Options

1. **100% burn** — all slashed stake leaves circulation.
2. **100% to investors** — all slashed stake compensates the harmed fund.
3. **Gamma-split** — a parameterised share to NAV, the rest burned.

## Decision Outcome

**Chosen option**: *Gamma-split*, because it is the only option that preserves both deflationary pressure and investor restitution while remaining tunable within safe bounds.

### Positive Consequences

- Deflationary pressure is maintained via the burn share.
- Harmed investors receive partial restitution, reducing tail-risk for them.
- DAO can adjust `gamma` within `[0%, 50%]` as protocol behaviour matures.

### Negative Consequences / Trade-offs

- The NAV-recovery path requires a TWAP swap from TOSS to USDC, adding execution complexity.
- Setting `gamma` too high reintroduces moral hazard; the upper bound mitigates this.
- TWAP execution can suffer slippage in thin liquidity windows.

## Pros and Cons of the Options

### Option A — 100% burn

- Pro: Maximum deflationary pressure.
- Pro: Simplest implementation; no swap path needed.
- Con: Investors bear the full economic damage.
- Con: Pure deterrence theatre from the investor perspective.

### Option B — 100% to investors

- Pro: Maximum restitution.
- Pro: Investors see direct, visible recovery.
- Con: No deflation; slashings become neutral on supply.
- Con: Moral hazard — investors may tolerate FM misbehaviour.

### Option C — Gamma-split

- Pro: Both objectives served from a single event.
- Pro: DAO-tunable within bounded, immutable limits.
- Pro: Clear, auditable accounting per slashing event.
- Con: Requires a TWAP swap path with its own failure modes.
- Con: Calibration of `gamma` is an ongoing governance concern.

## Implementation Notes

- Contract: `SlashingEngine.execute(fm, faultIndex, harmedFund)`.
- Default `gamma = 20%` (NAV recovery), `80%` burned.
- `gamma` is read from `DAOConfigCore` and constrained to `[0%, 50%]` by bounds in the Immutable Layer.
- NAV-recovery path: slashed TOSS is swapped via TWAP to USDC, then deposited into the harmed fund's NAV. The TWAP window and slippage cap are configured per RiskTier.
- Burn share is sent to `address(0)` via the canonical burn function on the TOSS token.
- Events emit `SlashExecuted(fm, faultIndex, gamma, burnAmount, navRecoveryAmount, harmedFund)`.

## Links

- **Source documentation**: `docs/protocol/contracts/risk/SlashingEngine.md`, `docs/protocol/contracts/core/DAOConfigCore.md`, `docs/protocol/tokenomics/slashing-mathematical-tables.md`
- **Related ADRs**: ADR-0010, ADR-0013, ADR-0024
- **External references**: none
