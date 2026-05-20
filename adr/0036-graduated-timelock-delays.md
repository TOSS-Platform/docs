# ADR-0036: Graduated Timelock Delays (Fund / FM / Protocol)

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: governance, timelock, safety

## Context and Problem Statement

Once a proposal passes the voting stage, immediate execution leaves no window for the community, the Guardian Committee, or external observers to react if the outcome is malicious, buggy, or fraudulent. Timelocks between vote pass and execution are the standard countermeasure: they create a public delay during which exit, veto, or social-layer response is possible.

The required reaction window depends on blast radius. A fund-level fee change affects one fund's investors and can be unwound or exited in a short window. An FM-level standard change affects all FMs and requires more coordination time to react. A protocol-level upgrade affects every participant, requires deeper review, and must accommodate an emergency veto path.

A single timelock duration applied to all proposals serves none of these well: short delays expose protocol-level changes to attacks faster than the community can mobilize; long delays add friction to small fund-level tweaks that should be quick to roll out.

## Decision Drivers

- Reaction window must scale with blast radius.
- Emergency veto path (ADR-0037) must fit within the delay for protocol-level proposals.
- Fund-level operations should remain operationally responsive.
- Delays must be enforced on-chain by the timelock contract per level.

## Considered Options

1. **No timelock** — pass-then-execute atomically.
2. **Fixed timelock across all levels** — single duration applied uniformly.
3. **Graduated timelock by blast radius** — separate delays per governance level.

## Decision Outcome

**Chosen option**: *Graduated timelock by blast radius*, because it matches reaction window to actual impact.

### Positive Consequences

- Fund-level proposals execute within a day, supporting operational responsiveness.
- Protocol-level proposals carry a meaningful exit and veto window.
- Guardian Committee veto fits naturally inside the protocol-level delay.

### Negative Consequences / Trade-offs

- Three distinct timelock contracts (or one parameterized contract) increase implementation surface.
- Cross-level proposals must adopt the longest applicable delay.
- Slow protocol-level execution adds friction for genuine emergencies (mitigated by Guardian Committee veto, not by skipping timelock).

## Pros and Cons of the Options

### Option A — No timelock

- ✅ Pro: Minimal latency between vote and effect.
- ❌ Con: No reaction window if outcome is malicious or buggy.
- ❌ Con: Vote-then-execute attacks become trivial.

### Option B — Fixed timelock across all levels

- ✅ Pro: Simple; one duration to reason about.
- ❌ Con: Either too long for fund tweaks or too short for protocol upgrades.
- ❌ Con: Forces a compromise that satisfies neither extreme.

### Option C — Graduated timelock by blast radius

- ✅ Pro: Each level gets a delay appropriate to its impact.
- ✅ Pro: Guardian veto window aligns with protocol-level delay.
- ❌ Con: Multiple delay constants to manage.

## Implementation Notes

- Delays:
  - **Fund-level**: 24 hours.
  - **FM-level**: 72 hours.
  - **Protocol-level**: 7 days.
- Guardian Committee veto window: first 24 hours of the protocol-level timelock only (ADR-0037).
- Delay constants exposed via `DAOConfigCore`; bounded by immutable layer.
- Each level's executor refuses to execute before the delay elapses.

## Links

- **Source documentation**: `/home/user/docs/protocol/contracts/governance-layer.md`, `/home/user/docs/protocol/governance/proposal-lifecycle.md`
- **Related ADRs**: ADR-0033, ADR-0037
