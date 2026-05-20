# ADR-0020: Withdrawal Queue with Daily Limits

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: fund, withdrawal, liquidity

## Context and Problem Statement

Funds in the protocol hold a mix of liquid and illiquid assets. An actively managed fund may hold positions whose liquidation cost increases sharply when the position is exited in a hurry — slippage, market impact, and execution fees compound under forced selling. If the fund must serve arbitrary instant withdrawals, the first few redeemers exit at NAV while remaining investors absorb the liquidation cost.

This dynamic creates a bank-run pattern. Once redemptions begin at scale, every remaining investor's NAV per share is reduced by forced liquidation, which encourages them to redeem before further damage occurs. The behavior is rational individually but destructive collectively. Pure instant redemption is incompatible with funds that hold anything less liquid than spot stablecoins.

At the same time, locking up redemptions in long epochs harms user experience and discourages deposits. The protocol needs a middle path: investors can request withdrawals at any time, but the fund processes them within a pace that does not force fire-sale liquidations.

## Decision Drivers

- Prevent forced fire-sale liquidations during stress.
- Treat all redeemers fairly across the queue.
- Allow investors to cancel pending requests.
- Keep daily processing pace transparent and tunable within safe bounds.

## Considered Options

1. **Instant withdrawal** — redemption is immediate.
2. **Time-locked epochs** — withdrawals only at scheduled epoch boundaries.
3. **FIFO queue with daily cap** — investors submit requests at any time; queue processes up to a daily NAV-percentage cap.
4. **Auction-based redemption** — periodic auctions clear redemption demand against liquidity.

## Decision Outcome

**Chosen option**: *FIFO queue with daily cap*, because it lets investors request exits whenever they want while bounding the daily liquidation pressure on the fund.

### Positive Consequences

- Investors can request withdrawal at any time without waiting for an epoch.
- Daily cap (percentage of NAV, configurable within `DAOConfigCore` bounds) prevents fire-sale liquidations.
- FIFO ordering eliminates ambiguity over who gets paid first.
- Pending requests can be cancelled, returning the investor's shares unchanged.

### Negative Consequences / Trade-offs

- In a stress scenario, investors at the back of the queue may wait multiple days.
- Daily cap is a coarse instrument; finer policies (per-asset-class liquidity tiers) would require more bookkeeping.
- Queue state must be persisted and traversed during processing, which costs gas.

## Pros and Cons of the Options

### Option A — Instant withdrawal

- ✅ Pro: Best UX in normal conditions.
- ❌ Con: Fire-sale risk under stress.
- ❌ Con: First-mover advantage induces bank runs.

### Option B — Time-locked epochs

- ✅ Pro: Predictable liquidation windows.
- ✅ Pro: Allows the FM to plan exits.
- ❌ Con: Poor UX between epochs.
- ❌ Con: All-or-nothing per epoch creates demand spikes.

### Option C — FIFO queue with daily cap

- ✅ Pro: Always-on request submission with bounded daily impact.
- ✅ Pro: Cancellable, fair order.
- ❌ Con: Possible multi-day wait under stress.
- ❌ Con: Gas cost for queue traversal.

### Option D — Auction-based redemption

- ✅ Pro: Market-clearing pricing of urgency.
- ❌ Con: Complex implementation.
- ❌ Con: Less intuitive for retail investors.

## Implementation Notes

- `FundManagerVault.requestWithdrawal(shares)` enqueues an entry with `(investor, shares, requestedAt)`. Shares are locked (non-transferable) while the request is pending.
- `FundManagerVault.cancelWithdrawal(requestId)` is callable only by the requester and releases the locked shares.
- `processWithdrawals()` may be called by anyone (typically a keeper). It walks the FIFO head, paying out at current NAV up to `dailyRedemptionCap × NAV / 10_000`.
- `dailyRedemptionCap` is a per-fund parameter stored in `DAOConfigCore` with immutable bounds (ADR-0013).
- The queue is the only path to redemption; direct burn of shares without a request is disabled.

## Links

- **Source documentation**: `docs/protocol/contracts/fund/FundManagerVault.md`
- **Related ADRs**: ADR-0019, ADR-0028
- **External references**: —
