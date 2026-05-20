# ADR-0012: Three-Layer Tokenomics (Immutable / Config / Logic)

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: tokenomics, governance, architecture

## Context and Problem Statement

The protocol's tokenomics combine elements that must be permanently trustable with elements that need to adapt over time. Slashing curves, FaultIndex weighting, and reward formulas are economic invariants that participants reason about before staking; allowing governance to change them at will would break the social contract. At the same time, parameters such as fee caps, minimum stake levels, or risk weights must respond to market conditions, network growth, and unforeseen edge cases.

A monolithic contract that exposes every parameter to governance gives the DAO too much power: a single compromised or malicious proposal could rewrite the protocol's economic core. A fully hardcoded contract has the opposite problem: the protocol cannot evolve without a migration, and operational tuning becomes a hard-fork-scale event.

A clean architectural separation between what is fixed by code, what is tunable by governance, and what executes business logic on top is required. The boundaries between these three concerns must be enforced by contract structure, not by convention, so that auditors and users can verify which surface area is mutable and which is not.

## Decision Drivers

- Provide credible economic invariants that cannot be governance-tweaked.
- Allow operational parameters to be tuned without redeploying logic.
- Limit the blast radius of a single governance proposal.
- Make the mutable surface explicit and auditable.

## Considered Options

1. **All hardcoded** — every formula and parameter compiled into bytecode.
2. **All configurable** — every value, including formulas, controlled by governance.
3. **Three-layer separation** — Immutable Layer, Config Layer, Logic Layer with distinct upgrade rules.
4. **Off-chain config oracle** — parameters pushed from a trusted off-chain service.

## Decision Outcome

**Chosen option**: *Three-layer separation*, because it codifies which surfaces are mutable and which are not, while keeping all enforcement on-chain.

### Positive Consequences

- Economic invariants (slashing curves, FaultIndex math) are guaranteed by bytecode.
- Operational tuning happens through a narrow, well-defined configuration surface.
- Audits can target each layer independently with different threat models.
- Governance proposals can only touch the Config Layer, bounded by Immutable Layer checks.

### Negative Consequences / Trade-offs

- Three layers add architectural overhead and more contracts to deploy and maintain.
- Logic Layer contracts must read from both Immutable and Config Layers on each operation, adding gas cost.
- Changing an invariant requires a full migration, not a parameter update.

## Pros and Cons of the Options

### Option A — All hardcoded

- ✅ Pro: Maximally trustable; nothing can be changed.
- ✅ Pro: Lowest runtime gas (no config reads).
- ❌ Con: No path to tune parameters as the market evolves.
- ❌ Con: Every adjustment forces a contract migration.

### Option B — All configurable

- ✅ Pro: Maximum flexibility for the DAO.
- ❌ Con: A single malicious proposal can rewrite economic invariants.
- ❌ Con: No credible guarantees for stakers and FMs.

### Option C — Three-layer separation

- ✅ Pro: Clear, auditable boundary between immutable and mutable.
- ✅ Pro: Governance power is bounded by code, not by social norms.
- ❌ Con: Higher contract count and architectural complexity.
- ❌ Con: Layer crossings add gas overhead per operation.

### Option D — Off-chain config oracle

- ✅ Pro: Allows arbitrarily complex pricing/risk logic off-chain.
- ❌ Con: Introduces a trusted oracle into the protocol core.
- ❌ Con: Outages or compromises of the oracle freeze or corrupt the protocol.

## Implementation Notes

- **Immutable Layer**: pure functions and constants — FaultIndex formula, slashing curve shape, fee accrual math. No setters, no proxies.
- **Config Layer**: `DAOConfigCore` (ADR-0013) stores governance-tunable parameters with min/max bounds. All writes go through governance.
- **Logic Layer**: execution contracts (e.g., `RewardDistributor`, `Slasher`, `FundTradeExecutor`) read both layers and apply Immutable formulas to Config values.
- Each Logic Layer contract may be upgraded independently; each upgrade is bounded by the Immutable Layer guarantees it consumes.

## Links

- **Source documentation**: `docs/protocol/tokenomics/overview.md`, `docs/protocol/tokenomics/immutable-layer.md`, `docs/protocol/tokenomics/config-layer.md`, `docs/protocol/tokenomics/logic-layer.md`
- **Related ADRs**: ADR-0013, ADR-0024, ADR-0025
- **External references**: —
