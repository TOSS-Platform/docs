# ADR-0015: High Water Mark for Performance Fees

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: fees, tokenomics, fund-standards

## Context and Problem Statement

Performance fees are the primary mechanism that compensates Fund Managers for value creation beyond a baseline management fee. They align FM incentives with investor returns, but the way performance is measured determines whether the alignment is genuine or exploitable.

Without a High Water Mark (HWM), an FM can charge performance fees on the same NAV growth more than once. If a fund grows from 100 to 120 (FM earns fees on +20), drops back to 100, then grows again to 120, the FM earns fees a second time on the same recovered ground. From the investor's perspective, they have not gained anything net, yet they have paid performance fees twice. This pattern can be amplified deliberately by trading strategies that oscillate.

A fund-wide HWM solves the double-charging issue for early investors but penalizes new investors who enter at a NAV below the fund-wide HWM: they would pay no performance fees until the fund recovers past a level they never saw. An annual HWM reset, common in traditional hedge funds, restores fairness across vintages but encourages year-end NAV manipulation. The protocol needs a model that prevents double-charging without these distortions.

## Decision Drivers

- Investors should never pay performance fees twice for the same NAV growth.
- New investors should not be penalized by previous-investor history.
- The model must not incentivize NAV manipulation at fee-crystallization boundaries.
- Bookkeeping must remain tractable on-chain.

## Considered Options

1. **No HWM / flat performance fee** — performance fee on any positive return per period.
2. **Annual HWM reset** — HWM resets at each fiscal year boundary.
3. **Permanent per-investor HWM** — each investor tracks their own HWM, never resets.
4. **Fund-wide HWM** — one HWM for the entire fund.

## Decision Outcome

**Chosen option**: *Permanent per-investor HWM*, because it prevents double-charging on the same NAV growth while remaining fair across investor cohorts.

### Positive Consequences

- An investor pays a performance fee only on NAV growth strictly above the highest NAV they have previously been charged on.
- New investors enter at the prevailing NAV and accrue their own HWM from that point — they are not blocked by the fund's previous peak.
- No year-end manipulation incentive because there is no calendar reset.
- The model is the de facto standard in regulated fund structures and is intuitive to LPs.

### Negative Consequences / Trade-offs

- Per-investor HWM storage scales with investor count.
- HWM bookkeeping must be updated on share transfers (the new holder inherits the seller's basis).
- Crystallization events must be defined clearly to avoid disputed accrual windows.

## Pros and Cons of the Options

### Option A — No HWM / flat performance fee

- ✅ Pro: Simplest accounting.
- ❌ Con: Double-charges on recovered losses.
- ❌ Con: Incentivizes NAV oscillation strategies.

### Option B — Annual HWM reset

- ✅ Pro: Familiar from traditional finance.
- ✅ Pro: Bounded historical bookkeeping.
- ❌ Con: Encourages NAV manipulation near year-end.
- ❌ Con: Resets effectively double-charge across years.

### Option C — Permanent per-investor HWM

- ✅ Pro: No double-charging, ever.
- ✅ Pro: Fair across investor cohorts.
- ❌ Con: Per-investor storage overhead.
- ❌ Con: Share transfers need explicit HWM transfer rules.

### Option D — Fund-wide HWM

- ✅ Pro: Single number to track.
- ❌ Con: Penalizes investors who enter below the fund's historic peak.
- ❌ Con: Discourages new deposits after drawdowns.

## Implementation Notes

- Each investor entry stores `highWaterMark` (in NAV units per share) and `sharesHeld`.
- Performance fee accrued at crystallization = `max(0, currentNAVPerShare - highWaterMark) × sharesHeld × performanceFeeRate`.
- HWM is updated to `currentNAVPerShare` only at crystallization events when fees are actually charged.
- On share transfer, the recipient inherits the seller's HWM pro-rata for the transferred shares; new deposits use `currentNAVPerShare` as the initial HWM.
- Crystallization events are defined per fund standard (e.g., on withdrawal, on fund-defined epoch, on management exit).

## Links

- **Source documentation**: `docs/protocol/tokenomics/overview.md`, `docs/protocol/standards/overview.md`
- **Related ADRs**: ADR-0019, ADR-0031
- **External references**: —
