# ADR-0033: Three-Level Governance (Fund / FM / Protocol)

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: governance, levels

## Context and Problem Statement

Governance proposals in the TOSS protocol vary widely in scope. A change to a single fund's fee schedule affects roughly the investors of that fund — perhaps hundreds of accounts. A change to an FM standard such as stake-bond formulas affects everyone operating as an FM. A protocol-wide upgrade to the bridge contracts or treasury policy affects every participant in the system.

Treating every proposal as protocol-level introduces unnecessary friction for fund-specific tweaks: investors of one fund should not need a protocol-wide vote to adjust the management fee within their own legal bounds. Conversely, treating every proposal as fund-level loses the coordination needed for FM standards and protocol upgrades — there is no single fund where those decisions belong.

A scheme that matches proposal scope to voter scope reduces friction at the small end and preserves coordination at the large end. Each level needs its own lifecycle, quorum, and voting-power model because the eligible voters differ.

## Decision Drivers

- Match proposal blast radius to the right voter base.
- Avoid protocol-wide bottlenecks for fund-local decisions.
- Preserve protocol-wide coordination for shared infrastructure.
- Keep each level's voting-power formula auditable.

## Considered Options

1. **Single-level governance** — every proposal goes through one protocol-wide flow.
2. **Two-level (fund + protocol)** — fund-scoped and protocol-scoped, no FM tier.
3. **Three-level (fund / FM / protocol)** — separate lifecycle and voting power per level.

## Decision Outcome

**Chosen option**: *Three-level governance*, because matching scope to voter base reduces friction and improves legitimacy at each level.

### Positive Consequences

- Fund tweaks no longer require protocol-wide quorum.
- FM standards are owned by the constituency that operates under them.
- Protocol-wide concerns retain a clear, slow, high-quorum path.

### Negative Consequences / Trade-offs

- Three governance pipelines must be implemented and audited.
- Voters with positions at multiple levels must engage in multiple processes.
- Boundary ambiguity (which level owns a proposal) must be resolved by clear rules.

## Pros and Cons of the Options

### Option A — Single-level governance

- ✅ Pro: Simplest model with one quorum and one lifecycle.
- ❌ Con: Fund-local changes face protocol-wide friction and capture risk.
- ❌ Con: FM standards lose their natural constituency.

### Option B — Two-level (fund + protocol)

- ✅ Pro: Captures the largest blast-radius gap (single fund vs. whole protocol).
- ❌ Con: FM-camp coordination has no natural home and bleeds into protocol-level.
- ❌ Con: FM standards end up gated by TOSS stakers rather than FMs.

### Option C — Three-level (fund / FM / protocol)

- ✅ Pro: Each level's voters match the decision's actual impact.
- ✅ Pro: Clear ownership of standards by the constituency that operates under them.
- ❌ Con: Higher implementation surface than two-level.

## Implementation Notes

- Voting power formula per level:
  - **Fund**: share-weighted (ADR-0034).
  - **FM**: AUM + reputation-weighted.
  - **Protocol**: TOSS-staked with role multiplier and lock-bonus (ADR-0035).
- Each level has an independent timelock per ADR-0036.
- Proposals declare their level at submission; routing is enforced by `GovernanceRouter`.

## Links

- **Source documentation**: `/home/user/docs/protocol/governance/voting-mechanism.md`, `/home/user/docs/protocol/contracts/governance-layer.md`
- **Related ADRs**: ADR-0032, ADR-0034, ADR-0035
