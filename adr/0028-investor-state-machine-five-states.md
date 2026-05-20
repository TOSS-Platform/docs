# ADR-0028: Investor State Machine (5 States + Auto Recovery)

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: investor, state-machine, compliance

## Context and Problem Statement

Investor-level risk signals — wash-trading patterns, scripted abuse, repeated interactions with sanctioned counterparties, sudden ICS collapse — are inherently noisy. Treating every signal as a hard ban produces too many false positives and traps innocent users. Treating every signal as a warning produces too many false negatives and lets abusive accounts persist. The protocol needs a graduated response that can escalate as signals accumulate and de-escalate when the account demonstrates clean behaviour.

A purely continuous score (ADR-0030 provides ICS) is hard to reason about from a user-experience perspective: investors and auditors need to know "what can this account do right now?" without re-evaluating the entire scoring formula. A small set of discrete states answers that question directly: each state has explicit allowed actions, deposit limits, and exit terms.

The chosen design defines five discrete states with deterministic transitions driven by RiskEngine events and ICS deltas. Low-severity transitions auto-recover after a clean-behaviour window. The terminal `BANNED` state is only reachable via deliberate transition from `FROZEN` and is reversible only through DAO governance.

## Decision Drivers

- Need for graduated response to noisy signals.
- Clear, user-facing description of "what can this account do?".
- Automatic rehabilitation for low-severity transitions.
- Deliberate, governance-gated exit from the most severe state.

## Considered Options

1. **Binary allow/block** — a single flag per investor.
2. **Continuous score without states** — drive every decision from ICS directly.
3. **Discrete state machine with auto-recovery** — five states, auto-downgrade.

## Decision Outcome

**Chosen option**: *Discrete state machine with auto-recovery*, because it gives investors a clear, predictable view of their privileges while allowing graduated escalation and rehabilitation.

### Positive Consequences

- Each state has explicit, contract-enforced allowed actions.
- Auto-recovery removes most low-severity transitions from human review queues.
- DAO oversight is reserved for the terminal `BANNED` state.

### Negative Consequences / Trade-offs

- Five states require a clear transition matrix; ambiguity is a bug.
- Auto-recovery parameters need calibration; too fast invites abuse, too slow frustrates users.
- Bans are slow to lift (DAO proposal cadence) by design.

## Pros and Cons of the Options

### Option A — Binary allow/block

- Pro: Trivial to implement and audit.
- Pro: Easy to communicate.
- Con: Too coarse; high false-positive and false-negative rates.
- Con: No path to rehabilitation short of unblock.

### Option B — Continuous score without states

- Pro: Maximum expressive resolution.
- Pro: No discrete-transition modelling.
- Con: Hard for users to know what they can do right now.
- Con: Every policy must reduce the score to a decision in-line.

### Option C — Discrete state machine with auto-recovery

- Pro: Clear, contract-enforced privileges per state.
- Pro: Auto-recovery scales without DAO overhead.
- Pro: Composes cleanly with ICS and the InvestorClass system.
- Con: Transition matrix must be fully specified.
- Con: Recovery cadence requires calibration.

## Implementation Notes

- States: `ACTIVE → LIMITED → HIGH_RISK → FROZEN → BANNED`.
- Allowed actions per state:
  - `ACTIVE` — full access.
  - `LIMITED` — deposits and trades subject to tighter caps; voting unchanged.
  - `HIGH_RISK` — no new deposits; withdrawals and governance only.
  - `FROZEN` — no actions except DAO-approved withdrawal.
  - `BANNED` — terminal; no actions.
- Transitions:
  - Forward transitions driven by RiskEngine events (FaultIndex bands) and ICS deltas.
  - Auto-recovery: one-step downgrade after 30 days of clean behaviour (no rejections, no slashing-relevant events).
  - `BANNED` only reachable from `FROZEN` via explicit RiskEngine action; only reversible via DAO proposal.
- Contract: `InvestorStateMachine` is consulted by `InvestorRiskDomain` on every action.
- Events: `InvestorStateChanged(investor, from, to, reason)`.

## Links

- **Source documentation**: `docs/protocol/contracts/investor/InvestorStateMachine.md`, `docs/protocol/architecture/investor-state-machine.md`
- **Related ADRs**: ADR-0023, ADR-0030
- **External references**: none
