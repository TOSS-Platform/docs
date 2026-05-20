# ADR-0032: Multi-Domain DAO Structure (Protocol / FM / Investor)

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: governance, dao

## Context and Problem Statement

A single DAO that votes on every decision — protocol upgrades, FM standards, investor protection rules — concentrates governance power in whichever constituency holds the most voting weight. In practice this lets one camp dominate decisions that lie outside its economic interest. Fund Managers end up voting on investor protection rules; whales of one camp gerrymander another camp's standards. The result is governance friction and an erosion of legitimacy for decisions affecting the dominated constituency.

The TOSS protocol has three clearly distinct constituencies, each with its own decision scope. Protocol-wide concerns (upgrades, treasury, immutable bounds) require broad coordination. FM-specific concerns (stake formulas, eligibility, fee caps) require domain expertise and the consent of FMs operating within those rules. Investor-specific concerns (state machine thresholds, investor class definitions, ICS weights) directly affect the parties whose capital is at risk.

A structure that gives each constituency authority over its own domain — while preserving cross-domain coordination paths — better matches the actual interest alignment in the protocol than any single-body alternative.

## Decision Drivers

- Prevent cross-camp gerrymandering of domain-specific decisions.
- Give each constituency proportional voice in its own scope.
- Preserve a viable path for cross-domain coordination on shared concerns.
- Keep governance comprehensible and auditable.

## Considered Options

1. **Single unified DAO** — all decisions voted by all TOSS stakers.
2. **Bicameral DAO** — two chambers (e.g., users vs. operators).
3. **Three sibling DAOs** — Core, FM, and Investor DAOs, each with own voter base.
4. **Single DAO with per-topic weighted voting** — one body, weights vary by topic class.

## Decision Outcome

**Chosen option**: *Three sibling DAOs*, because it gives each constituency authority over its own domain without conflating voter bases.

### Positive Consequences

- Domain-specific decisions are made by the directly affected constituency.
- Voter registries per DAO are explicit and auditable via `VoterRegistry`.
- Cross-domain coordination uses an explicit representative mechanism rather than vote dilution.

### Negative Consequences / Trade-offs

- Three governance pipelines increase implementation and audit surface.
- Cross-domain proposals require negotiation between DAOs and can be slower.
- Voters in multiple constituencies must participate in multiple processes.

## Pros and Cons of the Options

### Option A — Single unified DAO

- ✅ Pro: One pipeline, one quorum to track, simplest implementation.
- ❌ Con: One constituency can capture decisions outside its interest.
- ❌ Con: Legitimacy of decisions affecting unrepresented camps is weak.

### Option B — Bicameral DAO

- ✅ Pro: Separates two broad classes with a check on each other.
- ❌ Con: Still merges two distinct constituencies (e.g., FMs with investors) into one chamber.
- ❌ Con: Bicameral deadlock requires a tie-breaking mechanism that re-introduces capture.

### Option C — Three sibling DAOs

- ✅ Pro: Each domain has a dedicated voter base aligned with the affected interest.
- ✅ Pro: `VoterRegistry` cleanly defines membership per DAO.
- ❌ Con: Higher operational and audit cost than a single body.

### Option D — Single DAO with per-topic weighted voting

- ✅ Pro: Single pipeline retained.
- ❌ Con: Topic classification becomes a contested governance question of its own.
- ❌ Con: Per-topic weights are hard to audit and easy to game.

## Implementation Notes

- Three independent governance contracts: `CoreDAO`, `FMDAO`, `InvestorDAO`.
- Shared `VoterRegistry` resolves eligibility for each DAO's voter base.
- Cross-domain proposals routed through an explicit representative protocol; no DAO can unilaterally bind another's domain.
- Each DAO retains its own quorum thresholds and proposal templates.

## Links

- **Source documentation**: `/home/user/docs/protocol/governance/dao-structure.md`, `/home/user/docs/protocol/governance/overview.md`
- **Related ADRs**: ADR-0033, ADR-0039
