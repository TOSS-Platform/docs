# ADR-0003: Ethereum L1 as Final Settlement Layer

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: architecture, security, ethereum

## Context and Problem Statement

A decentralized fund protocol custodying user capital must inherit credible neutrality and the deepest economic security available. Execution on zkSync L2 (ADR-0002) provides the cost and throughput needed for daily operation, but L2 state alone is not a sufficient root of trust: the L2 sequencer, validity-proof verifier, and bridge contracts must all anchor to a base layer that is operated by no single entity.

Ethereum L1 is the only production chain with the validator set, economic security, and regulatory familiarity required for a custody-grade settlement layer. Bridging the canonical TOSS token, USDC settlement balances, and the zkSync proof verifier to Ethereum L1 makes TOSS state final under Ethereum's security budget rather than under any L2-operator assumption.

This decision is partly a hedge: even if zkSync's sequencer halts or its operator misbehaves, user funds and protocol state must remain recoverable from L1. L1 settlement also makes it possible to compose with other L1 protocols (USDC issuance, established custodians) without proxying through an L2-only bridge.

## Decision Drivers

- Maximum economic security for custodied assets and canonical TOSS supply
- Recoverability of user funds if zkSync sequencer or operator fails
- Composability with USDC issuer and other L1-native counterparties
- Data availability guarantees that match the security of the settlement asset

## Considered Options

1. **Pure L2 with no L1 anchor** — keep all state on zkSync, no L1 bridge contracts.
2. **Ethereum L1 settlement** — canonical state, bridges, and verifier on Ethereum mainnet.
3. **Alternative L1 (e.g., Bitcoin)** — settle on a different base chain.
4. **Validium with off-chain DA** — keep data availability off Ethereum to lower cost.

## Decision Outcome

**Chosen option**: *Ethereum L1 settlement*, because it is the only configuration that gives TOSS Ethereum-level security for canonical state while remaining compatible with the zkSync execution layer chosen in ADR-0002.

All critical state roots, the TOSS and USDC bridge contracts, and the zkSync proof verifier live on Ethereum L1. L2 execution does not replace L1 security — it inherits it through periodic validity-proof submission.

### Positive Consequences

- Canonical token supply and bridge balances are secured by Ethereum's full validator set.
- A zkSync operator failure does not by itself put user funds at risk; L1 forced-exit paths remain.
- USDC and other L1-native assets integrate without an additional cross-chain trust hop.

### Negative Consequences / Trade-offs

- L1 gas costs apply to proof submission, bridge operations, and certain governance actions.
- Some operations (e.g., parameter changes that must be reflected on L1) require multi-step L1/L2 coordination.
- Ethereum L1 congestion or fee spikes can delay finalization windows.

## Pros and Cons of the Options

### Option A — Pure L2 with no L1 anchor

- ✅ Pro: Maximum throughput and lowest cost; no L1 gas footprint at all.
- ❌ Con: All trust collapses to the L2 operator; an outage strands user funds.
- ❌ Con: No path to compose with L1-native counterparties (USDC, custodians).

### Option B — Ethereum L1 settlement

- ✅ Pro: Inherits Ethereum's economic security for canonical state.
- ✅ Pro: USDC and other L1-native assets integrate natively.
- ✅ Pro: Forced-exit and proof-verification paths remain available if L2 degrades.
- ❌ Con: L1 gas costs and longer finalization for bridge and proof operations.

### Option C — Alternative L1 (e.g., Bitcoin)

- ✅ Pro: Bitcoin has the largest settlement security budget by some measures.
- ❌ Con: No mature ZK rollup ecosystem; would require bespoke bridge and verifier.
- ❌ Con: Smart contract expressiveness is insufficient for TOSS bridge logic.

### Option D — Validium with off-chain DA

- ✅ Pro: Significantly lower L1 cost than rollup-mode operation.
- ❌ Con: Data availability committee is a separate trust assumption weaker than Ethereum DA.
- ❌ Con: A DA failure can freeze withdrawals even when the rollup itself is honest.

## Implementation Notes

- L1 bridge contracts hold canonical USDC balances and the TOSS supply contract.
- The zkSync proof verifier is the only contract authorized to update the canonical L2 state root on L1.
- Forced-exit procedures are documented and tested as part of the disaster-recovery runbook.

## Links

- **Source documentation**: `docs/protocol/architecture/overview.md`, `docs/protocol/architecture/l1-l2-communication.md`
- **Related ADRs**: ADR-0002, ADR-0006
- **External references**: zkSync L1<->L2 messaging documentation
