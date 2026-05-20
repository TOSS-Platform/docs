# ADR-0016: Minimal Proxy (EIP-1167) for Fund Deployment

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: fund, deployment, eip-1167, gas

## Context and Problem Statement

Each new fund in the protocol requires its own set of stateful contracts — at minimum a vault and a trade executor — but every fund of a given class shares the same logic. Deploying full contract bytecode for each new fund is wasteful: the same code is stored on-chain repeatedly, and per-fund deployment gas is high enough to discourage long-tail FMs from launching smaller funds.

Deterministic addressing also matters. Off-chain indexers, UI integrations, and FM onboarding flows benefit from predicting a fund's address before it is deployed, so that approvals, signatures, and analytics can be staged in parallel with the deployment transaction. Plain `CREATE` does not provide this; `CREATE2` does, but only when paired with a stable deployer and salt.

Finally, upgrade semantics need to be deliberate. Beacon proxies couple all funds to a single implementation, so any upgrade affects every existing fund — including funds whose investors did not consent to a logic change. Transparent or UUPS per-fund upgrade introduces an admin role that can rewrite a fund's logic after investors deposited capital. Either extreme is wrong for funds that act as custodial wrappers around investor assets.

## Decision Drivers

- Minimize per-fund deployment gas.
- Provide deterministic, pre-computable fund addresses.
- Avoid cross-fund upgrade coupling.
- Avoid per-fund administrative upgrade powers over investor assets.

## Considered Options

1. **Full deployment per fund** — deploy full bytecode for every fund.
2. **EIP-1167 minimal proxy (Clones)** — each fund is a tiny proxy delegating to a shared, audited implementation, frozen at clone time.
3. **Transparent upgradeable proxy** — per-fund upgrade controlled by an admin.
4. **UUPS proxy** — per-fund upgrade controlled by logic embedded in the implementation.
5. **Beacon proxy** — all funds share one beacon; upgrade affects all funds.

## Decision Outcome

**Chosen option**: *EIP-1167 minimal proxy with CREATE2 deterministic addresses*, because it minimizes deployment cost, gives predictable addresses, and locks each fund to the implementation it was launched with.

### Positive Consequences

- Per-fund deployment cost reduced to the cost of deploying a roughly 45-byte proxy.
- Deterministic addresses via `CREATE2(salt = keccak256(manager, fundId))` enable pre-signing and pre-indexing.
- Each fund is bound at clone time to a specific, audited implementation address — no surprise upgrades for investors.
- New fund classes can be introduced by deploying a new implementation and pointing future clones at it, without touching existing funds.

### Negative Consequences / Trade-offs

- A bug in the implementation cannot be patched in-place for existing funds; remediation requires migration.
- All clones share a single delegate target, so calls always traverse the proxy hop (small but non-zero gas overhead).
- Storage layout of the implementation is effectively immutable across the lifetime of every clone using it.

## Pros and Cons of the Options

### Option A — Full deployment per fund

- ✅ Pro: No proxy hop; lowest runtime gas.
- ✅ Pro: Each fund is fully independent at the bytecode level.
- ❌ Con: High deployment cost per fund.
- ❌ Con: Non-deterministic addresses by default.

### Option B — EIP-1167 minimal proxy

- ✅ Pro: Cheapest deployment.
- ✅ Pro: Implementation per clone is immutable once deployed.
- ❌ Con: Cannot patch a deployed fund's logic in place.
- ❌ Con: Adds a delegatecall hop on every call.

### Option C — Transparent upgradeable proxy

- ✅ Pro: Per-fund upgradability.
- ❌ Con: Admin role can rewrite fund logic over investor assets.
- ❌ Con: Higher deployment and runtime overhead.

### Option D — UUPS proxy

- ✅ Pro: Smaller proxy, per-fund upgradability.
- ❌ Con: Same admin-trust problem as transparent proxies.

### Option E — Beacon proxy

- ✅ Pro: Single point of upgrade for all funds.
- ❌ Con: Couples every fund to one upgrade decision.
- ❌ Con: Investors in any fund cannot opt out of a logic change.

## Implementation Notes

- `FundFactory.createFund(manager, fundId, params)` calls `Clones.cloneDeterministic(implementation, salt)` with `salt = keccak256(abi.encode(manager, fundId))`.
- Address can be pre-computed by clients via `Clones.predictDeterministicAddress(implementation, salt, address(factory))`.
- The clone's implementation address is captured at clone time and is not updatable.
- New `FundClass` deployments register a new implementation address in `FundFactory`; only funds created after that point use it.
- `FundRegistry` (ADR-0018) records the implementation address used for each fund for auditability.

## Links

- **Source documentation**: `docs/protocol/contracts/fund/FundFactory.md`
- **Related ADRs**: ADR-0017, ADR-0018
- **External references**: EIP-1167, OpenZeppelin `Clones` library
