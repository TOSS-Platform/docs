# ADR-0002: Use zkSync Era L2 as Execution Layer

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: zksync, infrastructure, architecture

## Context and Problem Statement

TOSS Protocol must validate trades through a RiskEngine on every Fund Manager action, support frequent NAV updates, and keep per-transaction cost low enough that automated strategies remain economically viable. The internal target is a typical user transaction at or below 0.10 USD-equivalent in gas, with sub-second confirmation for trading UX.

Ethereum L1 cannot meet these cost or latency targets at any realistic throughput. Optimistic rollups bring cost down but introduce multi-day fraud windows that delay withdrawals and complicate slashing finality — a fund redemption blocked by a 7-day challenge window is unacceptable, and slashing enforcement against a misbehaving FM should be final much sooner than that.

A ZK rollup with validity proofs gives us short proof-based finality on L1, low fees, and Ethereum-level data availability. Among production ZK rollups, native Account Abstraction and a Paymaster system are required (see ADR-0004 and ADR-0005), which narrows the choice further.

## Decision Drivers

- Per-transaction cost target at or below 0.10 USD-equivalent
- Sub-second L2 confirmation for trading flows; hours-scale L1 finality acceptable
- Native Account Abstraction support for FM session keys (ADR-0004)
- Inheritance of Ethereum security through validity proofs, not fraud proofs

## Considered Options

1. **Ethereum L1** — deploy all execution directly on Ethereum mainnet.
2. **Optimistic rollup (Arbitrum, Optimism)** — cheap, but fraud-proof-based.
3. **zkSync Era** — ZK rollup with validity proofs and native Account Abstraction.
4. **Sidechain (e.g., Polygon PoS)** — independent consensus, no Ethereum security inheritance.
5. **Appchain / Cosmos zone** — sovereign chain dedicated to TOSS.

## Decision Outcome

**Chosen option**: *zkSync Era*, because it is the only mature option that combines validity-proof finality, native Account Abstraction, and a Paymaster system, all anchored to Ethereum L1 (ADR-0003).

All execution — RiskEngine validation, trade routing, NAV publication, FM operations — runs on zkSync Era. Final settlement of bridge state stays on Ethereum L1.

### Positive Consequences

- Fees fit the cost envelope; high-frequency validation becomes viable.
- ZK validity proofs give cryptographic finality on L1 without multi-day fraud windows.
- Native AA enables session keys and Paymaster sponsorship without ERC-4337 overhead.
- Withdrawals are bounded by proof submission cadence, not a fraud-proof challenge window.

### Negative Consequences / Trade-offs

- Tooling and library coverage on zkSync trail Ethereum mainnet; some contracts require zkSync-specific patterns.
- Bytecode and gas semantics differ slightly from EVM mainnet; tests must run against zkSync.
- Dependence on a single L2 vendor; an exit plan is needed if zkSync degrades.

## Pros and Cons of the Options

### Option A — Ethereum L1

- ✅ Pro: Maximum security and the broadest tooling ecosystem.
- ❌ Con: Per-trade cost blows past the budget by one to two orders of magnitude.
- ❌ Con: No native AA; session-key UX must be emulated.

### Option B — Optimistic rollup

- ✅ Pro: Lower fees, EVM-equivalent, mature deployments.
- ❌ Con: 7-day fraud window blocks withdrawals and delays slashing finality.
- ❌ Con: No first-class AA; ERC-4337 adds cost and complexity.

### Option C — zkSync Era

- ✅ Pro: Validity-proof finality avoids fraud-window UX problems.
- ✅ Pro: Native AA and Paymaster system are first-class.
- ✅ Pro: Anchored to Ethereum L1 for security.
- ❌ Con: Different bytecode, smaller tool ecosystem, single-vendor risk.

### Option D — Sidechain

- ✅ Pro: Full EVM equivalence and low cost.
- ❌ Con: Independent consensus; does not inherit Ethereum security.
- ❌ Con: Bridge trust assumptions are weaker than a rollup.

### Option E — Appchain / Cosmos zone

- ✅ Pro: Maximum sovereignty over execution and fee logic.
- ❌ Con: Bootstrap cost — validators, security budget, bridges — is prohibitive.
- ❌ Con: No inherited Ethereum security; bespoke bridge required.

## Implementation Notes

- All core contracts compile and deploy via the zkSync toolchain.
- L1 bridge contracts remain on Ethereum; L2 contracts call L1 through the canonical messenger.
- An L2-exit playbook exists in case of prolonged sequencer outage.

## Links

- **Source documentation**: `docs/protocol/zksync/overview.md`, `docs/protocol/architecture/overview.md`
- **Related ADRs**: ADR-0003, ADR-0004, ADR-0005
- **External references**: zkSync Era documentation
