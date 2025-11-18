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

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Deposit tokens to L2 | User deposits USDC from L1 to L2 via zkSync bridge | Tokens transferred from user to bridge, deposit ID generated, DepositInitiated event emitted |
| Finalize L2 withdrawal | User finalizes withdrawal from L2 to L1 with valid proof | Withdrawal verified against L2 state root, tokens transferred to L1 recipient, withdrawal completed |
| Deposit multiple assets | User deposits multiple different tokens to L2 | Each asset deposited correctly, separate deposit IDs for each |
| Track deposit status | Query status of specific deposit ID | Deposit status returned correctly (pending, completed, failed) |
| Track withdrawal status | Query status of specific withdrawal ID | Withdrawal status returned correctly |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Deposit zero amount | User attempts to deposit 0 tokens | Transaction may succeed or revert depending on implementation (zero may be invalid) |
| Deposit max uint256 | User attempts to deposit maximum possible amount | Transaction succeeds if balance sufficient |
| Deposit to zero address | User attempts to deposit with L2 receiver as address(0) | Transaction reverts with zero address validation error |
| Finalize withdrawal with zero amount | Attempt to finalize withdrawal with 0 amount | Transaction reverts or handles correctly |
| Query non-existent deposit | Query status for deposit ID that doesn't exist | Returns invalid status or reverts |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Deposit exceeds balance | User attempts to deposit more tokens than they own | Transaction reverts with "Insufficient balance" error |
| Deposit without approval | User attempts to deposit without approving bridge | Transaction reverts with "ERC20: insufficient allowance" error |
| Finalize with invalid proof | User attempts to finalize withdrawal with invalid merkle proof | Transaction reverts with "Invalid proof" error |
| Finalize with wrong message | User attempts to finalize with wrong withdrawal message | Transaction reverts with "Invalid message" error |
| Finalize already finalized | User attempts to finalize withdrawal that was already finalized | Transaction reverts with "Already finalized" error |
| Deposit with invalid L2 receiver | User attempts to deposit to invalid L2 address | Transaction reverts with validation error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent proof forgery | Attacker attempts to forge merkle proof for withdrawal | Transaction reverts, proof validation prevents forgery |
| Prevent replay attacks | User attempts to finalize same withdrawal twice | Second attempt reverts, withdrawal can only be finalized once |
| Bridge address validation | Verify only valid zkSync bridge can be called | Only configured L1/L2 bridge addresses can interact |
| Message verification | Verify withdrawal message matches L2 transaction | Message hash verification prevents tampering |
| State root verification | Verify withdrawal proof verified against correct state root | State root validation ensures proof corresponds to actual L2 state |
| Deposit idempotency | Same deposit attempted multiple times | Each deposit gets unique ID, no duplicate processing |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Deposit by any user | Any address deposits tokens to L2 | Transaction succeeds if approved and sufficient balance |
| Finalize by any user | Any address finalizes withdrawal with valid proof | Transaction succeeds if proof valid (permissionless finalization) |
| Update bridge addresses | Update L1 or L2 bridge address (governance only) | Only governance can update, others revert |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| zkSync bridge integration | Deposit calls zkSync L1 bridge contract | Integration works correctly, deposit processed by zkSync |
| L2 mint on deposit | Deposit on L1 triggers L2 mint | L2 contract receives deposit message, mints tokens correctly |
| Withdrawal proof generation | Withdrawal initiated on L2, proof generated off-chain | Proof contains correct merkle path and message data |
| Multi-asset bridge flow | Multiple assets bridged between L1 and L2 | Each asset tracked separately, bridge state remains consistent |
| Bridge state synchronization | L1 and L2 states remain synchronized | Deposits and withdrawals tracked correctly on both chains |
| Deposit and withdrawal cycle | Complete cycle: deposit L1→L2, use on L2, withdraw L2→L1 | Full cycle completes successfully, tokens move correctly |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Deposit gas usage | User deposits tokens to L2 | Gas usage reasonable for deposit operation |
| Finalize withdrawal gas | User finalizes withdrawal with proof | Gas usage reasonable for proof verification |
| Batch deposits gas | Multiple deposits in single transaction (if supported) | Batch uses less gas than individual deposits |

---

**Next**: [TOSSChainState](/protocol/contracts/core/TOSSChainState)
