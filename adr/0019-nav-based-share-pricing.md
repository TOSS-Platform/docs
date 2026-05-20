# ADR-0019: NAV-Based Share Pricing

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: fund, nav, accounting

## Context and Problem Statement

A fund's value changes continuously as trades execute and held asset prices move. Shares represent a pro-rata claim on the fund's net assets, so the price at which shares are issued or redeemed must reflect the fund's current per-share Net Asset Value (NAV). Otherwise, the entry or exit transaction becomes an arbitrage event against existing holders.

Concretely, if shares are issued at a fixed exchange rate while NAV per share moves, a depositor entering after a NAV gain receives shares at a discount funded by existing holders; a redeemer exiting after a NAV loss receives a premium at the expense of remaining holders. In either direction, the fixed-rate model leaks value to the more-informed side of every transaction.

Bonding-curve pricing also fails for funds: the curve's slope is an arbitrary parameter unrelated to the fund's actual asset value, so the share price diverges from NAV by an amount that depends on trade history rather than fundamentals. The protocol needs share issuance and redemption to track NAV exactly, with NAV itself produced by a transparent, off-chain valuation pipeline (ADR-0043) and committed on-chain.

## Decision Drivers

- Fair entry and exit pricing for all investor cohorts.
- Compatibility with the ERC-4626 mental model and tooling.
- Compatibility with off-chain NAV computation pipelines that handle illiquid assets.
- Simple, auditable share-issuance formula.

## Considered Options

1. **Fixed share price** — shares minted 1:1 with deposit.
2. **NAV-based pricing (ERC-4626 style)** — shares minted proportional to deposit vs. current NAV.
3. **Bonding-curve pricing** — share price determined by a parametric curve over supply.

## Decision Outcome

**Chosen option**: *NAV-based pricing*, because it is the only model that keeps share value aligned with the fund's actual net assets across all entry and exit points.

### Positive Consequences

- `sharesIssued = depositAmount × totalShares / currentNAV` ensures every depositor receives exactly their pro-rata claim.
- Redemption uses the inverse formula, so redeemers receive exactly their pro-rata share of assets.
- Aligns with ERC-4626, allowing wallets and integrations to treat fund shares as familiar vault shares.
- Decouples valuation (off-chain NAV pipeline) from accounting (on-chain pro-rata math).

### Negative Consequences / Trade-offs

- Requires a trusted NAV value to be committed on-chain; staleness or manipulation of NAV affects pricing fairness.
- First deposit needs a bootstrap rule (typically 1:1) since NAV is undefined at zero supply.
- Rounding errors must be handled deliberately to avoid value leakage.

## Pros and Cons of the Options

### Option A — Fixed share price

- ✅ Pro: Trivial accounting.
- ❌ Con: Arbitrageable on every NAV move.
- ❌ Con: Bleeds value from informed to uninformed holders.

### Option B — NAV-based pricing (ERC-4626 style)

- ✅ Pro: Fair across all entries and exits.
- ✅ Pro: Standard, well-understood by tooling.
- ❌ Con: Depends on a reliable NAV oracle.
- ❌ Con: Rounding needs care.

### Option C — Bonding-curve pricing

- ✅ Pro: Self-contained, no external oracle.
- ❌ Con: Share price disconnects from NAV.
- ❌ Con: Distorts the semantic meaning of "share" for an actively managed fund.

## Implementation Notes

- Share issuance: `sharesIssued = depositAmount × totalShares / currentNAV`, with the special case `totalShares == 0 ⇒ sharesIssued = depositAmount` for the bootstrap deposit.
- Share redemption: `assetsReturned = burnedShares × currentNAV / totalShares`.
- NAV is read from the fund's `NavCommitter` contract, which stores the latest signed NAV update from the off-chain pipeline (ADR-0043).
- Issuance and redemption revert if the latest NAV update is older than the fund's `maxNavStaleness` parameter.
- Rounding is always against the depositor/redeemer in favor of the pool to prevent extraction via dust.
- NAV decimals match the fund's accounting token decimals to keep the share-price formula free of decimal-conversion adjustments.

## Links

- **Source documentation**: `docs/protocol/contracts/fund/FundManagerVault.md`
- **Related ADRs**: ADR-0017, ADR-0043
- **External references**: ERC-4626
