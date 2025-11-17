# BridgeGateway.sol

## Overview

Manages L1-L2 bridge interactions, coordinating deposits and withdrawals between Ethereum L1 and zkSync L2.

## Purpose

- Handle L1 → L2 deposits
- Process L2 → L1 withdrawals
- Coordinate with zkSync bridge contracts
- Track bridged assets
- Ensure atomic bridge operations

## Core Responsibilities

- ✅ Accept deposits on L1, initiate L2 mints
- ✅ Process withdrawal requests from L2
- ✅ Maintain L1/L2 asset parity
- ✅ Handle bridge failures and recovery
- ✅ Emit events for off-chain indexing

## State Variables

```solidity
address public l1Bridge;          // zkSync L1 bridge address
address public l2Bridge;          // zkSync L2 bridge address

mapping(address => address) public l1ToL2Token;  // L1 token → L2 token
mapping(uint256 => DepositStatus) public deposits;  // depositId → status
mapping(uint256 => WithdrawalStatus) public withdrawals;  // withdrawalId → status

uint256 public depositCount;
uint256 public withdrawalCount;
```

## Functions

### `depositToL2`

```solidity
function depositToL2(
    address l1Token,
    uint256 amount,
    address l2Receiver
) external payable returns (uint256 depositId)
```

**Purpose**: Deposit tokens from L1 to L2

**Parameters**:
- `l1Token`: Token address on L1 (e.g., USDC)
- `amount`: Amount to deposit
- `l2Receiver`: Recipient on L2

**Returns**: Deposit tracking ID

**Behavior**:
- Transfers `l1Token` from sender
- Calls zkSync L1 bridge
- Emits `DepositInitiated`

### `finalizeWithdrawal`

```solidity
function finalizeWithdrawal(
    uint256 l2BatchNumber,
    uint256 l2MessageIndex,
    uint256 l2TxNumberInBatch,
    bytes calldata message,
    bytes32[] calldata merkleProof
) external
```

**Purpose**: Finalize L2 → L1 withdrawal

**Parameters**:
- zkSync proof parameters
- `message`: Encoded withdrawal data
- `merkleProof`: Merkle proof from L2

**Behavior**:
- Verifies proof against L2 state root
- Transfers tokens to L1 recipient

## Test Scenarios

```typescript
it("should deposit to L2 successfully", async () => {
  await usdc.approve(bridge.address, 1000);
  const depositId = await bridge.depositToL2(usdc.address, 1000, l2Receiver);
  expect(depositId).to.be.gt(0);
});
```

---

**Next**: [TOSSChainState](/docs/protocol/contracts/core/TOSSChainState)
