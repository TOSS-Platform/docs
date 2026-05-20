# ADR-0011: EIP-2612 Permit + Snapshot-Based Voting in TOSS

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: token, governance, eip-2612

## Context and Problem Statement

The TOSS token plays three roles in the protocol: collateral for Fund Managers, vote weight for on-chain governance, and gas fuel for protocol-paid operations. Each of these roles introduces specific user-experience and security constraints that a plain ERC-20 implementation cannot satisfy alone.

The first friction point is approval flow. Standard ERC-20 spending requires `approve()` followed by a separate `transferFrom()` call, costing two transactions and two wallet confirmations. For onboarding flows where users deposit TOSS as FM collateral or stake it for voting, this is a significant drop-off. The protocol needs a way to authorize a single, atomic spend from an off-chain signature.

The second friction point is flash-loan governance attacks. With balance-based voting, an attacker can borrow a large quantity of TOSS, cast a vote in a proposal, and immediately repay the loan within the same transaction. The attacker pays only the flash-loan fee but moves a proposal with capital they never economically committed. Several DeFi governance systems have suffered this attack pattern, and the protocol must structurally prevent it.

These two problems require coordinated changes to the token contract itself: gasless approval on the spend side, and historical balance accounting on the vote-weight side.

## Decision Drivers

- Reduce user-facing transactions for approve-and-spend flows.
- Eliminate flash-loan governance as a viable attack vector.
- Maintain ERC-20 compatibility so wallets and exchanges keep working.
- Avoid introducing trusted off-chain components into the token core.

## Considered Options

1. **Standard ERC-20 approve+transferFrom** — keep the canonical two-transaction flow with no snapshots.
2. **EIP-2612 permit only** — add gasless approvals but keep balance-based voting.
3. **Permit + checkpoint snapshots** — combine gasless approval with historical balance accounting for vote weight.
4. **Meta-transaction relayer** — outsource approval UX to an off-chain relayer service.

## Decision Outcome

**Chosen option**: *Permit + checkpoint snapshots*, because it solves both the approval UX and the flash-loan vote attack with a single, well-audited token implementation.

### Positive Consequences

- One-transaction deposit and stake flows via off-chain `permit()` signatures.
- Flash-loan voting becomes economically pointless: vote weight is sampled at the proposal's snapshot block, before the loan exists.
- Reuses OpenZeppelin's audited `ERC20Permit` and `ERC20Votes` modules, reducing custom code.
- Snapshots are queryable on-chain, enabling other systems (rewards, eligibility) to reuse historical balances.

### Negative Consequences / Trade-offs

- Every transfer writes a checkpoint, increasing per-transfer gas cost relative to plain ERC-20.
- Checkpoint storage grows over time; long-term storage footprint is non-trivial.
- Signature replay protection requires a per-account nonce; clients must read it before signing.

## Pros and Cons of the Options

### Option A — Standard ERC-20 approve+transferFrom

- ✅ Pro: Maximum simplicity, minimal attack surface in the token.
- ✅ Pro: Lowest gas cost per transfer.
- ❌ Con: Two transactions for every approval-based flow.
- ❌ Con: No defense against flash-loan governance attacks.

### Option B — EIP-2612 permit only

- ✅ Pro: Solves the approval UX problem with a single signed message.
- ✅ Pro: Standardized and widely supported by wallets.
- ❌ Con: Flash-loan voting still possible because current balance drives vote weight.
- ❌ Con: No historical balance access for other protocol features.

### Option C — Permit + checkpoint snapshots

- ✅ Pro: Solves both UX and governance-attack problems in one contract.
- ✅ Pro: Snapshots enable additional features (historical airdrops, retroactive rewards).
- ❌ Con: Higher per-transfer gas due to checkpoint writes.
- ❌ Con: Slightly larger contract bytecode.

### Option D — Meta-transaction relayer

- ✅ Pro: Could subsidize gas entirely for end users.
- ❌ Con: Introduces a trusted off-chain relayer or relayer network.
- ❌ Con: Operational burden of running and securing the relayer.
- ❌ Con: Does not address flash-loan voting.

## Implementation Notes

- `TOSS` inherits from `ERC20Permit` (EIP-2612) and `ERC20Votes` (OpenZeppelin).
- `permit(owner, spender, value, deadline, v, r, s)` produces a same-transaction allowance via off-chain EIP-712 signature.
- `_afterTokenTransfer` writes checkpoints to both `_delegateCheckpoints` and `_totalSupplyCheckpoints`.
- Governance proposals record `snapshotBlock = block.number` at creation; vote weight is read via `getPastVotes(account, snapshotBlock)`.
- Delegation is explicit: holders must call `delegate(self)` to activate their own voting weight.

## Links

- **Source documentation**: `docs/protocol/contracts/core/TOSS.md`
- **Related ADRs**: ADR-0009, ADR-0033, ADR-0039
- **External references**: EIP-2612, OpenZeppelin `ERC20Permit`, `ERC20Votes`
