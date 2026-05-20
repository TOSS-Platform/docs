# ADR-0037: Guardian Committee 24-Hour Emergency Veto

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: governance, safety, emergency

## Context and Problem Statement

Even with graduated timelocks (ADR-0036), the DAO may not mobilize quickly enough to stop a clearly malicious or buggy proposal that has already passed. DAOs are slow by design: coordinating a counter-proposal, drafting it, and accumulating quorum within the timelock window is often infeasible for novel attacks. A focused emergency power is required to bridge the gap.

The risk in granting any emergency power is centralization. A team multisig with unilateral override would defeat the purpose of decentralized governance. The emergency power must therefore be narrow in scope (veto, not propose), strictly time-bounded, transparent on-chain, and revocable by the DAO that granted it. It must also be impossible to use the power to extend itself.

A small elected committee with a veto-only mandate, fixed term, and recall vote satisfies these constraints. The committee cannot initiate changes, cannot unpause the protocol on its own, and cannot extend its term — its only action is to stop an already-passed proposal during a short window.

## Decision Drivers

- DAO timelock is necessary but insufficient against fast-moving attacks.
- Emergency power must be narrow, time-bounded, and revocable.
- Power must be auditable on-chain and require multisig consent.
- Guardians must be elected and recallable; term cannot self-extend.

## Considered Options

1. **No emergency power** — rely solely on DAO timelock.
2. **Unilateral team multisig** — team can pause/cancel any proposal.
3. **Time-bounded veto-only Guardian Committee** — elected committee, narrow scope.

## Decision Outcome

**Chosen option**: *Time-bounded veto-only Guardian Committee*, because it provides a credible emergency stop without granting initiative power.

### Positive Consequences

- Emergency stop available within hours of a malicious proposal passing.
- Power scope is strictly negative: cannot propose, cannot extend term.
- Term limits and recall vote keep the committee accountable.

### Negative Consequences / Trade-offs

- Guardians become a high-value target for social engineering.
- A 3-of-5 multisig can collude to veto legitimate but unpopular proposals (mitigated by recall).
- Adds 24h of uncertainty to every protocol-level execution.

## Pros and Cons of the Options

### Option A — No emergency power

- ✅ Pro: Maximally decentralized.
- ❌ Con: DAO is too slow against novel exploits.
- ❌ Con: A single passed-but-malicious proposal could execute without an effective stop.

### Option B — Unilateral team multisig

- ✅ Pro: Fast response.
- ❌ Con: Centralizes ultimate authority outside the DAO.
- ❌ Con: Power scope is open-ended and hard to bound.

### Option C — Time-bounded veto-only Guardian Committee

- ✅ Pro: Fast emergency stop while preserving DAO sovereignty.
- ✅ Pro: Narrow scope reduces the cost of misuse.
- ❌ Con: Requires an election process and an active committee.

## Implementation Notes

- 5-member elected Guardian Committee; 3-of-5 multisig action required to veto.
- Veto window: first 24 hours of a Protocol-level proposal's timelock.
- Guardians cannot propose, cannot unilaterally unpause the protocol, cannot extend their own term.
- Term: 6 months. Recall vote available at any time via Core DAO.
- Election and recall procedures live in `GuardianRegistry`.
- Veto action is a single on-chain transaction signed by 3-of-5; cancellation is final for the proposal but does not block resubmission.
- All veto actions emit a structured event with the proposal id and signing guardian set for full auditability.

## Links

- **Source documentation**: `/home/user/docs/protocol/governance/overview.md`, `/home/user/docs/protocol/contracts/governance-layer.md`
- **Related ADRs**: ADR-0014, ADR-0036, ADR-0039
