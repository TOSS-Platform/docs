# ADR-0030: Investor Composite Score (ICS) — Multi-Factor Reputation

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: investor, reputation, scoring

## Context and Problem Statement

A single-signal reputation metric — staked TOSS, transaction count, tenure — is easy to game and does not capture the multi-dimensional reality of investor behaviour on the protocol. An account with high stake but a history of penalties is not the same as a long-tenured account with consistent deposits and active governance participation. The protocol needs a reputation metric that combines several signals so that gaming any one of them is insufficient.

Off-chain reputation systems are not acceptable for the same reason off-chain risk validation is not: any input to on-chain consequences must itself be on-chain, deterministic, and verifiable. A trusted operator computing reputation introduces censorship and operator-risk concerns the protocol explicitly avoids elsewhere.

The chosen design defines an on-chain Investor Composite Score in `[0, 100]` computed deterministically from five factor groups. The score is recomputed on relevant events (stake changes, penalty events, governance votes, deposits, FundClass diversifications) and persisted in `InvestorRegistry`. Downstream consumers — InvestorClass (ADR-0029) and the state machine (ADR-0028) — read the persisted value, not a recomputed one, to keep gas costs bounded.

## Decision Drivers

- Resistance to single-signal gaming.
- On-chain, deterministic, and verifiable computation.
- Composability with InvestorClass and InvestorStateMachine.
- Bounded gas cost for downstream reads.

## Considered Options

1. **Single-factor score** — e.g., stake only.
2. **Off-chain reputation** — computed by a trusted operator.
3. **On-chain composite ICS** — multi-factor weighted aggregate.

## Decision Outcome

**Chosen option**: *On-chain composite ICS*, because it resists single-signal gaming, runs deterministically on-chain, and feeds the other investor systems without introducing trust assumptions.

### Positive Consequences

- Gaming a single factor produces only partial score gains.
- Downstream consumers read a persisted scalar — no per-action recomputation.
- Score updates are event-driven, keeping recomputation work bounded.

### Negative Consequences / Trade-offs

- Weight calibration is empirical and must be revisited as data accumulates.
- Persisted score can lag real-time activity until the next recompute event.
- Adding factors later requires a careful upgrade path so historical scores do not regress.

## Pros and Cons of the Options

### Option A — Single-factor score

- Pro: Easiest to implement and explain.
- Pro: No weight calibration.
- Con: Trivially gameable by maximising the single factor.
- Con: Misses behavioural and participation signals.

### Option B — Off-chain reputation

- Pro: Flexible; can use arbitrary data sources.
- Pro: Easy to iterate off-chain.
- Con: Introduces an operator-risk surface.
- Con: Non-deterministic from the protocol's perspective.

### Option C — On-chain composite ICS

- Pro: Resistant to single-signal gaming.
- Pro: Deterministic, verifiable, composable.
- Pro: Event-driven recomputation keeps gas bounded.
- Con: Calibration is ongoing.
- Con: Persisted value can lag; this is usually acceptable.

## Implementation Notes

- Contract: `InvestorScoreCalculator.recompute(investor)`.
- Five factor groups (weights tuned in the Immutable Layer):
  - Staking depth and duration.
  - Historical penalty deductions (FaultIndex history).
  - Governance participation rate.
  - Tenure and deposit consistency.
  - FundClass diversity across the investor's portfolio.
- Output: `ICS ∈ [0, 100]`, persisted on `InvestorRegistry`.
- Recompute triggers: stake change, penalty event, governance vote cast, deposit, FundClass entry/exit.
- Downstream consumers read the persisted value via `InvestorRegistry.getICS(investor)`.
- Events: `ICSUpdated(investor, oldScore, newScore, trigger)`.

## Links

- **Source documentation**: `docs/protocol/contracts/investor/InvestorScoreCalculator.md`, `docs/protocol/contracts/investor/InvestorRegistry.md`
- **Related ADRs**: ADR-0028, ADR-0029
- **External references**: none
