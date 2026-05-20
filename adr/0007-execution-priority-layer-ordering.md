# ADR-0007: Execution Priority Layer (5-Level Ordering)

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: architecture, security, execution

## Context and Problem Statement

Every protocol entrypoint — trade, deposit, redemption, fund-action — must pass through multiple categories of checks: hardcoded safety invariants, configurable risk validation, role-based access control, contract-state preconditions, and the actual effect. The order in which these checks run matters. Running access control before pause flags can let a privileged caller execute when the protocol is meant to be frozen. Running state validation before risk validation can let a misconfigured contract accept a trade that the RiskEngine would have rejected.

Without a fixed ordering, each contract implements checks in whatever order the author chose at the time, and a future change can subtly reorder them. The result is that a misconfigured contract — or a forgotten check in a newly added entrypoint — can let risky actions slip past hard limits or skip access control entirely. The cost of detecting this in audit is high; the cost of detecting it in production is much higher.

What is needed is a single, explicit ordering rule that every entrypoint follows, that audit can verify mechanically by reading the function body top-to-bottom, and that code review can enforce as a hard requirement.

## Decision Drivers

- A single, mechanically verifiable ordering rule that audit can check
- Hard, non-configurable safety invariants always run before any configurable check
- Access control runs only after safety and risk have already passed
- Effect and event emission happen only at the end, never interleaved with validation

## Considered Options

1. **Per-contract ad-hoc ordering** — each entrypoint chooses its own order.
2. **Single combined check** — collapse all gating into one modifier or function.
3. **5-level priority pipeline** — strict ordering: Safety, Risk, Access, State, Execution.

## Decision Outcome

**Chosen option**: *5-level priority pipeline*, because it gives the audit team a single rule to enforce and makes any deviation an obvious code-review failure.

Every protocol entrypoint enforces this ordering:
1. **Critical Safety** — immutable, hardcoded invariants: pause flags, reentrancy guards, version pinning.
2. **Risk Validation** — DAO-configurable RiskEngine call: limits, exposures, blacklists.
3. **Access Control** — RBAC role checks for the calling identity.
4. **State Validation** — contract-state preconditions: nonces, balances, status flags.
5. **Execution** — effect plus event emission.

Skipping any level — or reordering them — is a code-review-blocking violation.

### Positive Consequences

- Audit reduces to a structural check: each entrypoint has five labeled sections in order.
- Safety always wins: pause flags cannot be bypassed by any role.
- Configurable risk policy runs before access decisions, so an over-privileged role cannot bypass risk.

### Negative Consequences / Trade-offs

- Some entrypoints carry checks that are trivially true at one of the levels; verbosity is unavoidable.
- Refactoring a check from one level to another requires explicit review and justification.
- A naive reading of gas cost suggests inefficiency, though most checks are cheap and the order matters more than the count.

## Pros and Cons of the Options

### Option A — Per-contract ad-hoc ordering

- ✅ Pro: Maximum flexibility; each entrypoint optimizes locally.
- ❌ Con: No global rule for audit to enforce; reorderings slip in over time.
- ❌ Con: A new entrypoint can silently miss a category of check.

### Option B — Single combined check

- ✅ Pro: Single function to call; less boilerplate per entrypoint.
- ❌ Con: Cannot express priority between safety and configurable checks.
- ❌ Con: Composition with per-call parameters (limits, scopes) becomes awkward.

### Option C — 5-level priority pipeline

- ✅ Pro: Mechanically verifiable structure for every entrypoint.
- ✅ Pro: Safety invariants are guaranteed to run before any configurable logic.
- ❌ Con: Verbose for simple entrypoints; some checks degenerate to a single `require`.

## Implementation Notes

- Each entrypoint uses five labeled blocks: `// 1. Critical Safety`, `// 2. Risk Validation`, `// 3. Access Control`, `// 4. State Validation`, `// 5. Execution`.
- A lint rule and a checklist line in the PR template enforce the presence and order of the labels.
- Auditors review entrypoints by reading the labels top-to-bottom before reading the bodies.

## Links

- **Source documentation**: `docs/protocol/architecture/execution-priority-layer.md`
- **Related ADRs**: ADR-0008, ADR-0022
- **External references**: n/a
