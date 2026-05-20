# ADR-0039: Proposal Lifecycle & Quorum Mechanics

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: governance, lifecycle, quorum

## Context and Problem Statement

Governance without a formal lifecycle drifts into ad hoc processes: proposals appear without notice, voting periods are inconsistent, and execution timing is contested. The protocol needs a single defined lifecycle so that proposers know how to submit, voters know when to engage, and observers know when execution will occur.

Quorum is the second concern. A proposal that passes with vanishingly small turnout reflects the preferences of an unrepresentative minority. A meaningful quorum prevents that outcome. For high-impact actions — protocol upgrades, treasury spends exceeding the daily cap, changes that interact with immutable bounds — a supermajority on top of higher quorum prevents narrow majorities from forcing changes that affect everyone.

Spam is the third concern. Without friction, any address can submit any proposal. A proposer stake — TOSS locked at submission and forfeited if the proposal is rejected as spam — raises the cost of low-effort proposals while preserving open access for serious ones.

## Decision Drivers

- Single predictable lifecycle across all proposals.
- Quorum thresholds proportional to proposal impact.
- Supermajority for protocol-critical actions.
- Proposer stake to deter spam without gating access.

## Considered Options

1. **Open-ended proposal cycles** — no formal lifecycle.
2. **Fixed lifecycle without proposer stake** — defined phases but free submission.
3. **Fixed lifecycle + proposer stake + quorum-supermajority for critical** — full structure.

## Decision Outcome

**Chosen option**: *Fixed lifecycle + proposer stake + quorum-supermajority for critical*, because it gives predictability, spam resistance, and proportional thresholds in one design.

### Positive Consequences

- All participants know the timing of each phase up front.
- Spam proposals carry an economic cost to the proposer.
- Protocol-critical actions require broad consent, not a narrow majority.

### Negative Consequences / Trade-offs

- Proposer stake is a friction for legitimate first-time proposers.
- Supermajority thresholds can deadlock contested decisions.
- Phase durations are sticky; changing them requires governance.

## Pros and Cons of the Options

### Option A — Open-ended proposal cycles

- ✅ Pro: Maximum flexibility.
- ❌ Con: Unpredictable timing for voters.
- ❌ Con: No spam resistance.

### Option B — Fixed lifecycle without proposer stake

- ✅ Pro: Predictable timing.
- ❌ Con: Spam proposals impose voter attention cost.
- ❌ Con: Quorum can be reached on low-quality proposals.

### Option C — Fixed lifecycle + proposer stake + quorum-supermajority for critical

- ✅ Pro: Predictable timing and bounded spam.
- ✅ Pro: Proportional thresholds protect high-impact actions.
- ❌ Con: Higher implementation and configuration surface.

## Implementation Notes

- Lifecycle phases:
  1. **Draft** — off-chain authoring.
  2. **Submit** — proposer locks TOSS stake; proposal recorded on-chain.
  3. **Discussion** — 3 days, no voting.
  4. **Active Voting** — 5 days.
  5. **Timelock** — per ADR-0036.
  6. **Execution** — or veto / expiry.
- Quorum thresholds:
  - **Standard**: 10% of eligible voting power.
  - **Protocol-critical** (upgrade, treasury > daily cap, immutable-bound change): 25% quorum AND 67% YES supermajority.
- Proposer stake forfeited if proposal rejected as spam; refunded on rejection-on-merit and on passage.

## Links

- **Source documentation**: `/home/user/docs/protocol/governance/proposal-lifecycle.md`
- **Related ADRs**: ADR-0033, ADR-0036, ADR-0037
