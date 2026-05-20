# ADR-0024: FaultIndex — Continuous Composite Severity Metric

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: risk, slashing, math

## Context and Problem Statement

A binary pass/fail outcome for risk validation is too coarse for the range of situations the protocol must handle. A minor parameter drift — a position slightly above its soft cap, a brief oracle confidence dip — should warn and continue. A moderate violation should reject the action. An egregious, intent-driven breach should both reject the action and slash the responsible Fund Manager. Without a graduated metric, the protocol must either over-react to noise or under-react to actual abuse.

Tracking separate thresholds for every risk component leads to combinatorial explosion: each component requires its own warn/reject/slash thresholds, and downstream consequences (slashing math, investor-state transitions, circuit breakers) need to consume them coherently. The system needs one comparable scalar per action that all downstream policy can reason about.

The chosen design produces a single `FaultIndex` in `[0, 100]` per validated action. Components contribute weighted partial scores, and the engine maps the composite score to a discrete consequence band. Weights are stored in the Immutable Layer (ADR-0012) so they cannot be silently mutated by governance actions outside the formal upgrade path.

## Decision Drivers

- Need for graduated rather than binary responses to risk.
- A single comparable scalar consumable by slashing, state machine, and circuit breakers.
- Predictable, auditable thresholds that operators and investors can reason about.
- Resistance to silent mutation — weights live in the Immutable Layer.

## Considered Options

1. **Binary threshold** — pass or fail per check, no aggregation.
2. **Separate per-component thresholds** — each domain decides its own action.
3. **Composite weighted FaultIndex** — one scalar with banded consequences.

## Decision Outcome

**Chosen option**: *Composite weighted FaultIndex*, because it is the only option that yields a single, comparable severity scalar usable by every downstream policy.

### Positive Consequences

- Graduated response: warn, reject, or slash based on band.
- Downstream consequences (slashing split, ICS deltas, breakers) consume one input.
- Weights and bands are explicit, versioned, and immutable per ADR-0012.

### Negative Consequences / Trade-offs

- Weight calibration requires careful empirical work and may need DAO retuning.
- Single-scalar collapse loses some information about which component dominated.
- Misweighted components could systematically over- or under-penalise certain patterns.

## Pros and Cons of the Options

### Option A — Binary threshold

- Pro: Trivial to implement and audit.
- Pro: No weight calibration required.
- Con: No room for warnings or graduated escalation.
- Con: Forces every component to use the same harsh boundary.

### Option B — Separate per-component thresholds

- Pro: Each domain expresses its own risk appetite directly.
- Pro: No central composition logic to misweight.
- Con: Combinatorial explosion of thresholds and policy interactions.
- Con: Downstream consumers must reason about N inputs, not one.

### Option C — Composite weighted FaultIndex

- Pro: One number; many consumers.
- Pro: Naturally supports banded consequences (allow / warn / reject / slash).
- Pro: Weight versioning makes policy changes explicit and reviewable.
- Con: Calibration is an ongoing exercise.
- Con: Loses per-component signal unless events also emit components.

## Implementation Notes

- Formula: `FI = 0.45·L + 0.25·B + 0.20·D + 0.10·I`
  - `L` — limit breach severity (FundRiskDomain).
  - `B` — behavioural signal (InvestorRiskDomain).
  - `D` — realised damage (ProtocolRiskDomain).
  - `I` — intent detection signal.
- Bands:
  - `FI < 20` — allow and log.
  - `20 ≤ FI < 60` — warn and monitor; tighter limits next action.
  - `60 ≤ FI < 80` — reject the action.
  - `FI ≥ 80` — reject and trigger slashing per ADR-0025.
- Weights and band edges are stored in the Immutable Layer (ADR-0012) and may only change via the formal upgrade path.
- Events emit both the composite `FI` and the four component scores for off-chain analysis.

## Links

- **Source documentation**: `docs/protocol/tokenomics/overview.md`, `docs/protocol/contracts/risk/RiskEngine.md`, `docs/protocol/contracts/risk/RiskMathLib.md`
- **Related ADRs**: ADR-0012, ADR-0025
- **External references**: none
