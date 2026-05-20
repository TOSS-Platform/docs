# ADR-0013: DAOConfigCore — Central Configuration with Immutable Bounds

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: governance, configuration, security

## Context and Problem Statement

Dozens of protocol contracts depend on tunable numerical parameters: the gamma split that allocates slashed stake between treasury and harmed parties, base FM stake amounts, fee caps, timelock durations, risk weights, and withdrawal limits. If each contract owns its own parameters, values drift across the system, auditors must trace every setter, and operational updates touch many independent contracts.

Even with central configuration, unbounded write access creates a different risk. A single governance proposal could move a parameter from a reasonable value to a catastrophic one — for example, raising the daily redemption cap to 100% during a market crash, or zeroing the slashing rate. Even a benign mistake in a proposal could damage the protocol before the next governance cycle can correct it.

The protocol needs one source of truth for tunables, and structural limits on how much each parameter can move in a single proposal, so that the DAO retains meaningful control without being able to push values outside safe ranges.

## Decision Drivers

- Eliminate parameter drift across contracts.
- Bound the impact of any single governance proposal.
- Make every tunable surface explicit and queryable.
- Keep upgrade-free flexibility for operational tuning.

## Considered Options

1. **Per-contract parameters** — each contract stores and exposes its own setters.
2. **Unbounded central config** — one contract holds all parameters with arbitrary governance writes.
3. **Central config with immutable bounds and delta caps** — all parameters in one contract with code-enforced min/max, per-proposal change limits, and cooldowns.

## Decision Outcome

**Chosen option**: *Central config with immutable bounds and delta caps*, because it gives a single audited surface for tunables while structurally preventing extreme parameter moves.

### Positive Consequences

- One contract (`DAOConfigCore`) is the authoritative source for all tunables.
- Each parameter declares its safe range in bytecode; proposals outside the range revert.
- Delta caps (e.g., max 20% change per proposal) and cooldowns prevent rapid oscillation or compounded attacks across consecutive proposals.
- Logic Layer contracts read parameters with simple `get(key)` calls, simplifying integration.

### Negative Consequences / Trade-offs

- Every parameter read crosses a contract boundary, costing gas.
- Adding a new tunable parameter requires updating `DAOConfigCore` and its bound definitions.
- Genuine emergency moves outside the delta cap require multiple sequential proposals.

## Pros and Cons of the Options

### Option A — Per-contract parameters

- ✅ Pro: No extra cross-contract calls.
- ✅ Pro: Local reasoning for each contract.
- ❌ Con: Parameters drift across contracts over time.
- ❌ Con: Auditing every setter across the codebase is expensive.

### Option B — Unbounded central config

- ✅ Pro: Single source of truth.
- ✅ Pro: Maximum flexibility for the DAO.
- ❌ Con: One bad proposal can rewrite economic invariants.
- ❌ Con: No structural protection against parameter overshoot.

### Option C — Central config with immutable bounds and delta caps

- ✅ Pro: Single source of truth and bounded blast radius.
- ✅ Pro: Cooldowns prevent rapid back-to-back attacks.
- ❌ Con: Adds gas to every parameter read.
- ❌ Con: Slower response to legitimate emergencies.

## Implementation Notes

- Parameters are addressed by `bytes32` keys (e.g., `keccak256("FM_BASE_STAKE")`).
- Each key has a `ParamSpec { uint256 min; uint256 max; uint256 maxDeltaBps; uint256 cooldown; }` declared in the constructor or a one-time initializer.
- `set(key, value)` checks: `value ∈ [min, max]`, `|value - current| ≤ current × maxDeltaBps / 10_000`, and `block.timestamp ≥ lastChanged[key] + cooldown`.
- Only the governance `Executor` may call `set`. Reads via `get(key)` are public and view-only.
- Bounds are immutable after construction; changing them requires deploying a new `DAOConfigCore` and migrating.

## Links

- **Source documentation**: `docs/protocol/contracts/core/DAOConfigCore.md`
- **Related ADRs**: ADR-0012, ADR-0033, ADR-0036
- **External references**: —
