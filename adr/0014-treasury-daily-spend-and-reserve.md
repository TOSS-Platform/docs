# ADR-0014: Treasury Daily Spend Limit + Emergency Reserve

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: treasury, security, governance

## Context and Problem Statement

The protocol treasury accumulates fee revenue, slashed stake residues, and initial token allocations. It funds ongoing development, security audits, liquidity incentives, and integrations. Because it is on-chain and DAO-controlled, it is also a high-value target: a single compromised or maliciously crafted governance proposal could drain the treasury in one transaction before any social response is possible.

A naive defense — moving all assets to a multisig — sacrifices the DAO-aligned property that on-chain control provides. A blanket monthly cap is too coarse and either lets a large drain proceed in a single window or starves legitimate weekly operations. The protocol needs a treasury that supports continuous operation while making catastrophic, instantaneous depletion structurally impossible.

A second concern is the protocol's ability to recover from a worst-case event. If the entire treasury is spendable, then after a drain there is no capital left to fund recovery, audits, or compensation. A floor reserved for emergencies, accessible only under specific conditions, preserves the protocol's ability to respond.

## Decision Drivers

- Allow continuous operational spending under DAO control.
- Make a single-transaction drain structurally impossible.
- Preserve recovery capital after worst-case events.
- Keep all enforcement on-chain.

## Considered Options

1. **No limits** — DAO proposals can move any amount.
2. **Fixed monthly cap** — single rolling window limits spending.
3. **Daily cap + emergency reserve floor** — fine-grained rate limit plus an untouchable floor unlocked only by the Guardian Committee while paused.
4. **Multisig-only treasury** — assets held by a trusted multisig outside DAO control.

## Decision Outcome

**Chosen option**: *Daily cap + emergency reserve floor*, because it bounds both the rate and the lifetime impact of any single proposal while keeping treasury control on-chain.

### Positive Consequences

- A compromised proposal can drain at most one day's allowance.
- The emergency reserve remains intact even after a compromised governance run, preserving recovery capital.
- The Guardian Committee can authorize reserve spending only while the protocol is paused, requiring a public emergency posture.
- Both limits are tunable within `DAOConfigCore` bounds (ADR-0013), so the DAO can adjust them within safe ranges.

### Negative Consequences / Trade-offs

- Large legitimate expenditures (audits, partnerships) must be split across days or batched through reserve unlock.
- The Guardian Committee introduces a privileged role that must itself be governed and rotated.
- Daily cap requires per-spend bookkeeping (timestamp, used-amount).

## Pros and Cons of the Options

### Option A — No limits

- ✅ Pro: Maximum DAO flexibility, no friction.
- ❌ Con: One bad proposal can empty the treasury.
- ❌ Con: No reserved capital for recovery.

### Option B — Fixed monthly cap

- ✅ Pro: Simple to implement.
- ❌ Con: Coarse; a single tx can still drain a month's allowance.
- ❌ Con: Hard to align with weekly operational rhythm.

### Option C — Daily cap + emergency reserve floor

- ✅ Pro: Bounded daily drain plus protected recovery capital.
- ✅ Pro: Guardian path provides controlled emergency access.
- ❌ Con: Larger spends require multi-day batching.
- ❌ Con: Adds Guardian Committee governance surface.

### Option D — Multisig-only treasury

- ✅ Pro: No on-chain governance attack surface for the treasury.
- ❌ Con: Trust shifts entirely to multisig signers, breaking DAO alignment.
- ❌ Con: Centralized accountability gap.

## Implementation Notes

- `TOSSTreasury` tracks `dailySpent` and `lastResetTimestamp`. On any spend, if `block.timestamp ≥ lastResetTimestamp + 1 days`, reset and set `lastResetTimestamp = block.timestamp - (block.timestamp % 1 days)`.
- Default daily cap: equivalent of $100k at protocol oracle rate; default reserve floor: equivalent of $500k.
- `spend(token, to, amount)` callable only by the governance `Executor`; reverts if `treasuryBalance - amount < reserveFloor` or `dailySpent + amount > dailyCap`.
- `emergencySpend(token, to, amount)` callable only by the Guardian Committee and only while `Pauser.paused() == true`; may dip into the reserve.
- Both `dailyCap` and `reserveFloor` are `DAOConfigCore` keys with immutable min/max bounds.

## Links

- **Source documentation**: `docs/protocol/contracts/core/TOSSTreasury.md`
- **Related ADRs**: ADR-0013, ADR-0037
- **External references**: —
