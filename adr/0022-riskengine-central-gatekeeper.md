# ADR-0022: RiskEngine as Central Gatekeeper

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: risk, security, gatekeeper

## Context and Problem Statement

The TOSS Protocol allows independent Fund Managers (FMs) to deploy and operate funds that accept investor capital and execute trades on external venues. Each fund-mutating action — trade, deposit, configuration change, governance update — must respect a set of protocol-wide and fund-specific risk invariants. If every fund or peripheral contract performs its own risk validation, implementations drift over time, edge cases are handled inconsistently, and a single buggy or malicious fund contract becomes an attack vector against the rest of the protocol.

Off-chain risk services are not a viable alternative: any check that can be skipped, front-run, or executed outside the atomic transaction boundary is effectively optional. Risk validation must be atomic with the action it gates and impossible to bypass from any execution path.

A central, mandatory enforcement point removes the drift problem and shrinks the trusted surface to a single, auditable contract. It also gives the protocol a single location to compose results from independent Risk Domains (ADR-0023) and emit the composite FaultIndex (ADR-0024) used by downstream consequences.

## Decision Drivers

- Consistency of risk semantics across every fund and every action.
- Impossibility of bypass — risk checks must be atomic with mutating actions.
- Auditable, single-source enforcement point that minimises trusted code.
- Composability with separate Risk Domains and the FaultIndex pipeline.

## Considered Options

1. **Per-contract risk checks** — each fund implements its own validation.
2. **Off-chain risk service** — an external system signs/approves actions.
3. **Central on-chain RiskEngine** — one mandatory contract every path calls.

## Decision Outcome

**Chosen option**: *Central on-chain RiskEngine*, because it is the only option that is simultaneously atomic, uniform across funds, and auditable as a single piece of trusted code.

### Positive Consequences

- One contract to audit, formally verify, and upgrade for risk logic.
- Identical semantics across every fund regardless of FM implementation.
- Natural integration point for FaultIndex aggregation and circuit breakers.

### Negative Consequences / Trade-offs

- RiskEngine becomes a hot path; every fund-mutating call routes through it.
- A bug in RiskEngine has protocol-wide blast radius — mitigated by strict scope and formal review.
- Upgrades to risk policy must clear governance, slowing reactive changes.

## Pros and Cons of the Options

### Option A — Per-contract risk checks

- Pro: Maximum flexibility per fund.
- Pro: Local upgrades do not block protocol governance.
- Con: Semantic drift between funds becomes inevitable.
- Con: Each fund contract is a new attack surface.
- Con: No single audit target; coverage is combinatorial.

### Option B — Off-chain risk service

- Pro: Cheap to update and iterate.
- Pro: Can use richer data sources than on-chain context.
- Con: Skippable by anyone bypassing the service.
- Con: Non-atomic with the action it is supposed to gate.
- Con: Introduces a trusted operator into the security model.

### Option C — Central on-chain RiskEngine

- Pro: Atomic, mandatory, and uniform.
- Pro: Composes cleanly with Risk Domains and FaultIndex.
- Pro: Single, well-scoped audit and formal-verification target.
- Con: Single point of failure for risk policy; needs formal scrutiny.
- Con: Adds one external call to every mutating path (acceptable on L2).

## Implementation Notes

- Contract: `RiskEngine.validate(actionContext) returns (FaultIndex)`.
- All fund-mutating entry points (trade router, deposit router, governance executor) must terminate in a `validate(...)` call that reverts on rejection.
- RiskEngine internally calls `ProtocolRiskDomain`, `FundRiskDomain`, and `InvestorRiskDomain`, then composes their partial FaultIndex contributions per ADR-0024.
- Bypass paths are forbidden by construction — there is no fund-mutating function that does not route through the engine.

## Links

- **Source documentation**: `docs/protocol/contracts/risk/RiskEngine.md`, `docs/protocol/architecture/execution-priority-layer.md`
- **Related ADRs**: ADR-0007, ADR-0023, ADR-0024
- **External references**: none
