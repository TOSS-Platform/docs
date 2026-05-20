# ADR-0038: Voting Delegation at All Three Levels

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: governance, delegation

## Context and Problem Statement

Most token holders and most fund investors do not vote. Reading proposals, evaluating trade-offs, and submitting on-chain transactions for every vote is expensive in time and attention. The empirical outcome is low turnout, low quorum, and capture by motivated minorities — sometimes a few highly active holders whose preferences may not match the broader holder base.

Delegation addresses this by allowing a passive holder to channel their voting power to an active participant they trust on a topic. The delegator retains ownership of the underlying tokens or shares; only the voice on proposals is transferred. Delegation must be instantly revocable so that delegators can withdraw consent the moment a delegate misbehaves.

Active delegates do work — reading proposals, writing rationales, voting consistently. A protocol-funded delegation rewards pool aligns incentives by paying delegates whose votes produce on-chain participation metrics (turnout shepherded, proposals shepherded to outcome). Without rewards, delegation tends to attract only ideologically motivated actors, narrowing the pool.

## Decision Drivers

- Reduce low-quorum capture by motivated minorities.
- Preserve delegator sovereignty via instant revocation.
- Apply consistently across all three governance levels (Fund / FM / Protocol).
- Encourage qualified delegates via rewards tied to measurable participation.

## Considered Options

1. **No delegation** — every voter must vote personally.
2. **Delegation only at protocol level** — fund and FM levels remain direct.
3. **Delegation at all levels with revocability and rewards** — consistent model across levels.

## Decision Outcome

**Chosen option**: *Delegation at all levels with revocability and rewards*, because passive-holder capture is a problem at every level and consistency reduces user confusion.

### Positive Consequences

- Quorum becomes achievable at all levels.
- Delegators can split power across multiple delegates by topic specialization.
- Rewards attract qualified delegates and create a market for delegation services.

### Negative Consequences / Trade-offs

- Delegate concentration is possible if a few delegates dominate; mitigated by revocability and vote-splitting.
- Reward computation introduces an off-chain attestation surface for participation metrics.
- Delegators who never review delegate behavior may suffer silent misalignment.

## Pros and Cons of the Options

### Option A — No delegation

- ✅ Pro: Simplest model; every vote is direct.
- ❌ Con: Low turnout and capture by motivated minorities.
- ❌ Con: Quorum thresholds become harder to meet.

### Option B — Delegation only at protocol level

- ✅ Pro: Addresses worst-case capture at the largest level.
- ❌ Con: Fund and FM levels still suffer low turnout.
- ❌ Con: Inconsistent UX across levels.

### Option C — Delegation at all levels with revocability and rewards

- ✅ Pro: Consistent model across all governance levels.
- ✅ Pro: Rewards attract qualified delegates.
- ❌ Con: Implementation surface and reward computation cost.

## Implementation Notes

- Delegation interfaces:
  - `delegate(uint level, address delegate, uint share)` — split power across delegates by share.
  - `revoke(uint level, address delegate)` — instant on-chain revocation.
- Snapshot voting power per level computed at proposal snapshot block including delegations.
- Delegation rewards pool funded from protocol fee streams; allocation based on participation metrics committed to `AnalyticsHub`.
- Participation metrics: proposals reviewed, votes cast that reached quorum, and delegator retention rate over the cycle.
- Delegators can override their delegate on a per-proposal basis without revoking the standing delegation.

## Links

- **Source documentation**: `/home/user/docs/protocol/governance/voting-mechanism.md`
- **Related ADRs**: ADR-0033, ADR-0035
