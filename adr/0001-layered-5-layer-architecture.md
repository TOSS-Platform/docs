# ADR-0001: Adopt Layered 5-Layer Architecture

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: architecture, foundation

## Context and Problem Statement

TOSS Protocol spans a wide surface area: settlement on Ethereum L1, execution on zkSync L2, economic logic encoded in smart contracts, off-chain services (NAV computation, analytics, trade routing), and user-facing applications. Each of these has different trust models, latency profiles, upgrade cadences, and audit requirements.

Without a strict layering, cross-cutting concerns such as security, upgradeability, and composability leak across components. A single off-chain service can reach directly into core contracts, a UI can bypass risk validation, and an upgrade in one area can silently break invariants in another. This makes the system harder to audit and impossible to reason about as a whole.

The team therefore needs a foundational architectural contract that fixes the placement of responsibilities and the allowed direction of dependencies, before more concrete decisions (execution layer, RBAC, tokenomics) are made on top of it.

## Decision Drivers

- Independent upgradeability of each concern via DAO without forking the protocol
- Clear audit boundaries between settlement, execution, economic logic, services, and UI
- Prevention of cross-layer dependency loops that obstruct reasoning and upgrades
- Compatibility with downstream choices (zkSync L2, RBAC, Paymaster, tokenomics)

## Considered Options

1. **Monolithic single-layer** — all logic in one contract suite, no formal separation.
2. **3-layer (chain / contracts / apps)** — minimum split commonly used by DeFi protocols.
3. **5-layer (L0–L4)** — settlement, execution, core protocol, off-chain services, applications.
4. **Microservices without layering** — components addressed by capability, no vertical order.

## Decision Outcome

**Chosen option**: *5-layer architecture (L0–L4)*, because it is the minimum decomposition that cleanly separates Ethereum settlement from zkSync execution while keeping protocol logic, off-chain services, and applications as distinct upgrade units.

The layers are: **L0 Ethereum L1 Settlement** -> **L1 zkSync L2 Execution** -> **L2 Core Protocol** -> **L3 Off-chain Services** -> **L4 Application**. Each layer is independently upgradeable via DAO. Cross-layer dependency loops are forbidden; calls flow strictly upward from lower trust to higher trust or downward through well-defined interfaces.

### Positive Consequences

- Each layer has an isolated audit scope and upgrade path.
- Settlement risk (L0) is structurally separated from execution risk (L1).
- Off-chain services (L3) cannot bypass core protocol invariants (L2).
- New applications (L4) can be built without touching consensus-critical code.

### Negative Consequences / Trade-offs

- Higher up-front design cost and more inter-layer interfaces to specify.
- Some operations require crossing more layers, adding latency and coordination overhead.
- Teams must enforce dependency direction in code review; tooling cannot guarantee it alone.

## Pros and Cons of the Options

### Option A — Monolithic single-layer

- ✅ Pro: Simplest to ship initially; no inter-layer plumbing.
- ❌ Con: Any change forces a full re-audit; impossible to upgrade pieces independently.
- ❌ Con: Off-chain logic and on-chain logic share trust assumptions, expanding the attack surface.

### Option B — 3-layer (chain / contracts / apps)

- ✅ Pro: Familiar pattern; low cognitive overhead.
- ❌ Con: Collapses L1/L2 distinction, making the Ethereum-vs-zkSync trust split implicit.
- ❌ Con: Off-chain services have no defined home and tend to leak into either contracts or apps.

### Option C — 5-layer (L0–L4)

- ✅ Pro: Explicit separation between settlement and execution; matches the L1+L2 deployment.
- ✅ Pro: Off-chain services get a first-class layer with defined boundaries.
- ✅ Pro: Each layer is a natural DAO upgrade unit.
- ❌ Con: More layers means more interface contracts to maintain and audit.

### Option D — Microservices without layering

- ✅ Pro: Maximum flexibility in component composition.
- ❌ Con: No vertical trust order makes reasoning about end-to-end safety intractable.
- ❌ Con: Dependency graphs cycle easily without an explicit layer rule.

## Implementation Notes

- Each layer publishes a versioned interface contract; lower layers do not import higher layers.
- Cross-layer calls go through documented entrypoints only; direct storage access is forbidden.
- Layer boundaries are enforced via repository structure and code review checklist, not at compile time.

## Links

- **Source documentation**: `docs/protocol/architecture/overview.md`, `docs/protocol/architecture/layered-system.md`
- **Related ADRs**: ADR-0002, ADR-0003
- **External references**: n/a
