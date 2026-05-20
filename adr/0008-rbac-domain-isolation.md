# ADR-0008: RBAC with Domain Isolation

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: security, rbac, architecture

## Context and Problem Statement

TOSS Protocol involves many distinct actor types: protocol governance, Fund Managers, investors, risk operators, and system services (NAV engine, Paymaster, oracle relayers). Each has its own legitimate authority over different parts of the system. A flat permission scheme — where every role lives in a single global namespace — either grants too much (a single highly privileged role becomes a privilege-escalation target) or proliferates dozens of roles without any semantic structure.

A flat namespace also makes it easy to make mistakes: an operator role added for one purpose can accidentally satisfy a role check intended for an entirely different domain, simply because the role name happens to match. As the role set grows, the chance of such collisions grows with it.

Domain isolation gives each cluster of related authority its own namespace. A role in one domain has no implicit authority in another. Cross-domain access exists, but it is explicit, auditable, and rare.

## Decision Drivers

- Avoid privilege escalation through implicit role overlap
- Give auditors a clear, bounded scope per domain rather than one monolithic role set
- Allow each domain to evolve its own roles without coordinating with every other domain
- Keep cross-domain grants explicit and visible in code review

## Considered Options

1. **Single owner / Ownable** — one privileged account controls everything.
2. **Flat RBAC** — a single global set of roles managed centrally.
3. **Domain-isolated RBAC** — roles partitioned into named domains with explicit cross-domain links.
4. **Capability-based access** — unforgeable capability tokens passed at call time.

## Decision Outcome

**Chosen option**: *Domain-isolated RBAC*, because it bounds blast radius per domain and makes cross-domain authority explicit without introducing the audit and tooling risk of a capability system.

The protocol uses OpenZeppelin AccessControl with five domain-isolated role namespaces:
- **Protocol Domain** — governance, upgrade authority, parameter management.
- **Fund Domain** — fund creation, FM identity, fund-level operations.
- **Investor Domain** — investor-level rights such as redemption requests and voting.
- **Risk Domain** — risk-operator roles, slashing operators, oracle relayers.
- **System Domain** — system services (NAV engine, Paymaster, automated keepers).

Cross-domain access is explicit (a contract in one domain must explicitly check a role from another) and audited. No role in one domain implicitly grants privileges in another.

### Positive Consequences

- Compromise of a role in one domain does not propagate authority into other domains.
- Audit scope per domain is bounded and clear.
- New roles can be added to a domain without touching the others.

### Negative Consequences / Trade-offs

- Slightly more verbose: cross-domain checks must name both the domain and the role.
- The role list grows in two dimensions; tooling must visualize the matrix.
- Mistakes in domain boundaries (a role placed in the wrong domain) require a migration to fix.

## Pros and Cons of the Options

### Option A — Single owner / Ownable

- ✅ Pro: Simplest possible model; minimal code.
- ❌ Con: One account holds total authority; a single compromise is catastrophic.
- ❌ Con: Inconsistent with a decentralized governance posture.

### Option B — Flat RBAC

- ✅ Pro: Familiar OpenZeppelin pattern; minimal tooling effort.
- ❌ Con: Role names compete in a single namespace; collisions are easy.
- ❌ Con: An over-privileged operator can satisfy unrelated checks accidentally.

### Option C — Domain-isolated RBAC

- ✅ Pro: Bounded blast radius per domain; explicit cross-domain grants.
- ✅ Pro: Audit scope per domain is small and well-defined.
- ❌ Con: More boilerplate at cross-domain call sites.

### Option D — Capability-based access

- ✅ Pro: Most expressive model; fine-grained, unforgeable authority.
- ❌ Con: Unfamiliar to most auditors; tooling support is thin in Solidity.
- ❌ Con: Capability passing introduces a new class of bugs (capability leakage).

## Implementation Notes

- Each domain defines its roles in a dedicated `*RolesLib` library.
- Role identifiers are namespaced: `keccak256("PROTOCOL.UPGRADER")`, `keccak256("FUND.MANAGER")`, etc.
- Cross-domain checks reference the source domain explicitly in the require message.

## Links

- **Source documentation**: `docs/protocol/architecture/rbac-domain-diagram.md`
- **Related ADRs**: ADR-0007, ADR-0013
- **External references**: OpenZeppelin AccessControl documentation
