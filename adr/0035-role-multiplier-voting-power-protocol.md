# ADR-0035: Role-Multiplier Voting Power at Protocol Level

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: governance, voting, multipliers

## Context and Problem Statement

Protocol-level governance affects every participant. Pure 1-TOSS-1-vote is the simplest model, but it ignores stakeholder role. Passive holders carry the same weight per token as active FMs who operate funds under those rules, and as institutional investors with deep regulatory exposure. The result is governance that may underweight participants with operational responsibility and overweight those who treat TOSS as a speculative asset.

Lock-up commitment is an additional signal of alignment. A holder willing to lock tokens for years has greater stake in long-term outcomes than one who can exit any block. Rewarding lock with additional voice converts the protocol's time-preference signal into governance weight.

The combined formula must be auditable and bounded. Multipliers must not enable a small minority to dominate; lock-bonus must asymptote rather than grow without limit; role assignments must come from `VoterRegistry` and not be self-declared.

## Decision Drivers

- Reflect stakeholder role beyond raw token holdings.
- Reward long-term lock-up commitment.
- Keep formula auditable and bounded against capture.
- Multipliers must be immutable; bounds live in `DAOConfigCore` immutable layer.

## Considered Options

1. **Pure 1:1 token voting** — `votingPower = TOSS_staked`.
2. **Quadratic voting** — `votingPower = sqrt(TOSS_staked)`.
3. **Role-multiplier with lock-bonus** — `votingPower = TOSS_staked × (1 + lockBonus) × roleMultiplier`.
4. **Reputation-only voting** — power derived from contribution scores.

## Decision Outcome

**Chosen option**: *Role-multiplier with lock-bonus*, because it reflects role and time-preference within a bounded, auditable formula.

### Positive Consequences

- Active FMs and strategic investors gain voice commensurate with operational responsibility.
- Lock-bonus rewards long-term alignment without unbounded growth.
- Formula is closed-form and can be replayed for any block.

### Negative Consequences / Trade-offs

- Role classifications introduce a centralized assignment surface (`VoterRegistry`).
- Multiplier values are sticky; correcting an over-generous multiplier requires governance.
- Lock-bonus encourages capital lock-up, which reduces liquidity.

## Pros and Cons of the Options

### Option A — Pure 1:1 token voting

- ✅ Pro: Simplest formula; no role registry needed.
- ❌ Con: Ignores operational responsibility.
- ❌ Con: Passive whales dominate.

### Option B — Quadratic voting

- ✅ Pro: Dampens whale influence.
- ❌ Con: Sybil-vulnerable without strong identity; identity solutions are expensive and intrusive.
- ❌ Con: Token-cost of attack is much lower than under linear voting.

### Option C — Role-multiplier with lock-bonus

- ✅ Pro: Reflects role and time-preference in one formula.
- ✅ Pro: Bounded multipliers prevent unbounded capture.
- ❌ Con: Role assignment is a governance dependency.

### Option D — Reputation-only voting

- ✅ Pro: Aligns voice with contribution.
- ❌ Con: Hard to bootstrap; reputation accrual is contested.
- ❌ Con: Detaches voice from economic stake entirely.

## Implementation Notes

- Formula: `votingPower = TOSS_staked × (1 + lockBonus) × roleMultiplier`.
- `lockBonus ∈ [0, 1]`, curve asymptotic over 0–4 years; lives in immutable layer.
- `roleMultiplier`:
  - Default holder: 1.0
  - Active FM: 1.5
  - Institutional investor: 1.5
  - Strategic investor: 2.0
- Multipliers are immutable constants; role assignment via `VoterRegistry`.

## Links

- **Source documentation**: `/home/user/docs/protocol/contracts/governance-layer.md`, `/home/user/docs/protocol/governance/voting-mechanism.md`
- **Related ADRs**: ADR-0011, ADR-0029, ADR-0033
