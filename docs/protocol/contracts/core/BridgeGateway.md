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

## Enums

### DepositStatus

```solidity
enum DepositStatus {
    Pending,    // Deposit initiated but not yet completed
    Completed,  // Deposit successfully processed
    Failed      // Deposit failed
}
```

### WithdrawalStatus

```solidity
enum WithdrawalStatus {
    Pending,    // Withdrawal initiated but not yet finalized
    Completed,  // Withdrawal successfully finalized
    Failed      // Withdrawal failed
}
```

## State Variables

```solidity
address public l1Bridge;          // zkSync L1 bridge address
address public l2Bridge;          // zkSync L2 bridge address (for future use)
address public governance;        // Governance address for admin functions
address public guardian;          // Guardian address for emergency functions

mapping(address => address) public l1ToL2Token;  // L1 token → L2 token mapping
mapping(uint256 => DepositStatus) public deposits;  // depositId → status
mapping(uint256 => WithdrawalStatus) public withdrawals;  // withdrawalId → status

uint256 public depositCount;      // Counter for deposit IDs
uint256 public withdrawalCount;   // Counter for withdrawal IDs

// Constants
uint256 public constant DEFAULT_L2_GAS_LIMIT = 200000;
uint256 public constant DEFAULT_L2_GAS_PER_PUBDATA_BYTE = 800;
```

## Modifiers

### `onlyGovernance`

Restricts function to governance address only.

### `onlyGuardian`

Restricts function to guardian address only.

### `onlyGuardianOrGovernance`

Restricts function to either guardian or governance address.

## Constructor

```solidity
constructor(
    address _l1Bridge,
    address _l2Bridge,
    address _governance,
    address _guardian
)
```

**Purpose**: Initialize BridgeGateway contract

**Parameters**:
- `_l1Bridge`: zkSync L1 bridge address (required, cannot be zero)
- `_l2Bridge`: zkSync L2 bridge address (can be address(0) initially)
- `_governance`: Governance address (required, cannot be zero)
- `_guardian`: Guardian address (required, cannot be zero)

**Validations**:
- `_l1Bridge` must not be zero address
- `_governance` must not be zero address
- `_guardian` must not be zero address

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
- `l1Token`: Token address on L1 (address(0) for ETH)
- `amount`: Amount to deposit (must be > 0)
- `l2Receiver`: Recipient on L2 (must not be zero address)

**Returns**: Deposit tracking ID

**Validations**:
- `l2Receiver` must not be zero address
- `amount` must be greater than 0
- For ETH deposits: `msg.value` must equal `amount`
- For token deposits: `msg.value` must be 0

**Behavior**:
- Generates unique deposit ID
- Tracks deposit as Pending
- For ERC20 tokens: Transfers tokens from sender, approves bridge
- For ETH: Uses `msg.value`
- Calls zkSync L1 bridge `deposit` function
- On success: Sets status to Completed, emits `DepositInitiated` and `DepositCompleted`
- On failure: Sets status to Failed, emits `DepositInitiated` and `DepositFailed`, refunds tokens/ETH

**Events**:
- `DepositInitiated(depositId, l1Sender, l2Receiver, l1Token, amount)`
- `DepositCompleted(depositId)` (on success)
- `DepositFailed(depositId, reason)` (on failure)

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
- `l2BatchNumber`: Batch number on L2
- `l2MessageIndex`: Message index in the batch
- `l2TxNumberInBatch`: Transaction number in the batch
- `message`: Encoded withdrawal message
- `merkleProof`: Merkle proof from L2

**Validations**:
- Withdrawal must not already be finalized (status != Completed)

**Behavior**:
- Calculates withdrawal ID as `uint256(keccak256(abi.encodePacked(l2BatchNumber, l2MessageIndex, message)))`
- Tracks withdrawal as Pending if not already tracked
- Calls zkSync L1 bridge `finalizeWithdrawal` function
- On success: Sets status to Completed, emits `WithdrawalFinalized`
- On failure: Sets status to Failed, emits `WithdrawalFailed`
- Does not revert on failure to allow tracking of failed withdrawals

**Events**:
- `WithdrawalFinalized(withdrawalId, l1Receiver, l1Token, amount)` (on success)
- `WithdrawalFailed(withdrawalId, reason)` (on failure)

**Note**: The actual withdrawal details (recipient, token, amount) are handled by the bridge. The event emits placeholder values (address(0), 0) as the message decoding is zkSync-specific and complex. Off-chain indexers should decode the message to get full details.

### `setL1Bridge`

```solidity
function setL1Bridge(address newL1Bridge, uint256 proposalId) external onlyGovernance
```

**Purpose**: Update L1 bridge address

**Parameters**:
- `newL1Bridge`: New L1 bridge address (must not be zero)
- `proposalId`: Governance proposal ID

**Access Control**: Only governance

**Validations**:
- `newL1Bridge` must not be zero address

**Events**:
- `L1BridgeUpdated(oldBridge, newL1Bridge)`

### `setL2Bridge`

```solidity
function setL2Bridge(address newL2Bridge, uint256 proposalId) external onlyGovernance
```

**Purpose**: Update L2 bridge address

**Parameters**:
- `newL2Bridge`: New L2 bridge address
- `proposalId`: Governance proposal ID

**Access Control**: Only governance

**Events**:
- `L2BridgeUpdated(oldBridge, newL2Bridge)`

### `setTokenMapping`

```solidity
function setTokenMapping(
    address l1Token,
    address l2Token,
    uint256 proposalId
) external onlyGovernance
```

**Purpose**: Map L1 token to L2 token address

**Parameters**:
- `l1Token`: L1 token address (must not be zero)
- `l2Token`: L2 token address (must not be zero)
- `proposalId`: Governance proposal ID

**Access Control**: Only governance

**Validations**:
- `l1Token` must not be zero address
- `l2Token` must not be zero address

**Events**:
- `TokenMappingUpdated(l1Token, l2Token)`

### `getDepositStatus`

```solidity
function getDepositStatus(uint256 depositId) external view returns (DepositStatus status)
```

**Purpose**: Get deposit status

**Parameters**:
- `depositId`: Deposit ID

**Returns**: Deposit status (Pending, Completed, or Failed)

### `getWithdrawalStatus`

```solidity
function getWithdrawalStatus(uint256 withdrawalId) external view returns (WithdrawalStatus status)
```

**Purpose**: Get withdrawal status

**Parameters**:
- `withdrawalId`: Withdrawal ID

**Returns**: Withdrawal status (Pending, Completed, or Failed)

### `getL2TokenAddress`

```solidity
function getL2TokenAddress(address l1Token) external view returns (address l2Token)
```

**Purpose**: Get L2 token address for L1 token

**Parameters**:
- `l1Token`: L1 token address

**Returns**: L2 token address (address(0) if not found)

**Behavior**:
- First checks manual mapping (`l1ToL2Token`)
- If not found, queries L1 bridge for default mapping
- Returns address(0) if not found in either location

### `emergencyRecover`

```solidity
function emergencyRecover(
    address token,
    uint256 amount,
    address destination
) external onlyGuardian
```

**Purpose**: Emergency function to recover stuck tokens (guardian only)

**Parameters**:
- `token`: Token address (address(0) for ETH)
- `amount`: Amount to recover
- `destination`: Destination address (must not be zero)

**Access Control**: Only guardian

**Validations**:
- `destination` must not be zero address

**Behavior**:
- For ETH: Transfers ETH to destination
- For ERC20: Transfers tokens to destination

### `receive`

```solidity
receive() external payable
```

**Purpose**: Receive ETH for deposits

**Behavior**: Allows contract to receive ETH directly for deposit operations

## Events

### `DepositInitiated`

```solidity
event DepositInitiated(
    uint256 indexed depositId,
    address indexed l1Sender,
    address indexed l2Receiver,
    address l1Token,
    uint256 amount
);
```

Emitted when a deposit is initiated.

### `DepositCompleted`

```solidity
event DepositCompleted(uint256 indexed depositId);
```

Emitted when a deposit is successfully completed.

### `DepositFailed`

```solidity
event DepositFailed(uint256 indexed depositId, string reason);
```

Emitted when a deposit fails.

### `WithdrawalFinalized`

```solidity
event WithdrawalFinalized(
    uint256 indexed withdrawalId,
    address indexed l1Receiver,
    address l1Token,
    uint256 amount
);
```

Emitted when a withdrawal is successfully finalized.

**Note**: The `l1Receiver`, `l1Token`, and `amount` fields are placeholders (address(0), 0) as message decoding is zkSync-specific. Off-chain indexers should decode the message to get actual values.

### `WithdrawalFailed`

```solidity
event WithdrawalFailed(uint256 indexed withdrawalId, string reason);
```

Emitted when a withdrawal fails.

### `L1BridgeUpdated`

```solidity
event L1BridgeUpdated(address indexed oldBridge, address indexed newBridge);
```

Emitted when L1 bridge address is updated.

### `L2BridgeUpdated`

```solidity
event L2BridgeUpdated(address indexed oldBridge, address indexed newBridge);
```

Emitted when L2 bridge address is updated.

### `TokenMappingUpdated`

```solidity
event TokenMappingUpdated(address indexed l1Token, address indexed l2Token);
```

Emitted when a token mapping is set or updated.

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Deposit tokens to L2 | User deposits USDC from L1 to L2 via zkSync bridge | Tokens transferred from user to bridge, deposit ID generated, DepositInitiated and DepositCompleted events emitted |
| Deposit ETH to L2 | User deposits ETH from L1 to L2 | ETH sent to bridge, deposit ID generated, events emitted |
| Finalize L2 withdrawal | User finalizes withdrawal from L2 to L1 with valid proof | Withdrawal verified against L2 state root, tokens transferred to L1 recipient, withdrawal completed, WithdrawalFinalized event emitted |
| Deposit multiple assets | User deposits multiple different tokens to L2 | Each asset deposited correctly, separate deposit IDs for each |
| Track deposit status | Query status of specific deposit ID | Deposit status returned correctly (Pending, Completed, or Failed) |
| Track withdrawal status | Query status of specific withdrawal ID | Withdrawal status returned correctly (Pending, Completed, or Failed) |
| Get L2 token address | Query L2 token address for L1 token | Returns correct L2 token address from mapping or bridge |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Deposit zero amount | User attempts to deposit 0 tokens | Transaction reverts with "Invalid amount" error |
| Deposit max uint256 | User attempts to deposit maximum possible amount | Transaction succeeds if balance sufficient |
| Deposit to zero address | User attempts to deposit with L2 receiver as address(0) | Transaction reverts with "Invalid L2 receiver" error |
| Deposit ETH with token | User attempts to deposit token with msg.value > 0 | Transaction reverts with "ETH sent with token deposit" error |
| Deposit token with wrong ETH amount | User attempts to deposit ETH with wrong msg.value | Transaction reverts with "ETH amount mismatch" error |
| Finalize withdrawal with zero amount | Attempt to finalize withdrawal with 0 amount | Transaction may succeed or revert depending on bridge validation |
| Query non-existent deposit | Query status for deposit ID that doesn't exist | Returns Pending (0) as default enum value |
| Query non-existent withdrawal | Query status for withdrawal ID that doesn't exist | Returns Pending (0) as default enum value |
| Get L2 address for unknown token | Query L2 address for unmapped L1 token | Returns address(0) |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Deposit exceeds balance | User attempts to deposit more tokens than they own | Transaction reverts with "ERC20: transfer amount exceeds balance" error |
| Deposit without approval | User attempts to deposit without approving bridge | Transaction reverts with "ERC20: insufficient allowance" error |
| Deposit bridge call fails | Bridge deposit call fails | Status set to Failed, DepositFailed event emitted, tokens/ETH refunded |
| Finalize with invalid proof | User attempts to finalize withdrawal with invalid merkle proof | Status set to Failed, WithdrawalFailed event emitted, transaction does not revert |
| Finalize with wrong message | User attempts to finalize with wrong withdrawal message | Status set to Failed, WithdrawalFailed event emitted |
| Finalize already finalized | User attempts to finalize withdrawal that was already finalized | Transaction reverts with "Withdrawal already finalized" error |
| Deposit with invalid L2 receiver | User attempts to deposit to invalid L2 address | Transaction reverts with "Invalid L2 receiver" error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent proof forgery | Attacker attempts to forge merkle proof for withdrawal | Proof validation by bridge prevents forgery, status set to Failed |
| Prevent replay attacks | User attempts to finalize same withdrawal twice | Second attempt reverts, withdrawal can only be finalized once |
| Bridge address validation | Verify only valid zkSync bridge can be called | Only configured L1 bridge address can interact |
| Message verification | Verify withdrawal message matches L2 transaction | Message hash verification prevents tampering |
| State root verification | Verify withdrawal proof verified against correct state root | State root validation ensures proof corresponds to actual L2 state |
| Deposit idempotency | Same deposit attempted multiple times | Each deposit gets unique ID, no duplicate processing |
| Reentrancy protection | Attempt reentrancy attack on deposit or withdrawal | ReentrancyGuard prevents reentrancy attacks |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Deposit by any user | Any address deposits tokens to L2 | Transaction succeeds if approved and sufficient balance |
| Finalize by any user | Any address finalizes withdrawal with valid proof | Transaction succeeds if proof valid (permissionless finalization) |
| Update bridge addresses | Update L1 or L2 bridge address (governance only) | Only governance can update, others revert with "Not governance" error |
| Set token mapping | Set token mapping (governance only) | Only governance can set, others revert |
| Emergency recover | Emergency recover tokens (guardian only) | Only guardian can recover, others revert with "Not guardian" error |
| Update with zero address | Governance attempts to update bridge to zero address | Transaction reverts with "Invalid L1 bridge" error |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| zkSync bridge integration | Deposit calls zkSync L1 bridge contract | Integration works correctly, deposit processed by zkSync |
| L2 mint on deposit | Deposit on L1 triggers L2 mint | L2 contract receives deposit message, mints tokens correctly |
| Withdrawal proof generation | Withdrawal initiated on L2, proof generated off-chain | Proof contains correct merkle path and message data |
| Multi-asset bridge flow | Multiple assets bridged between L1 and L2 | Each asset tracked separately, bridge state remains consistent |
| Bridge state synchronization | L1 and L2 states remain synchronized | Deposits and withdrawals tracked correctly on both chains |
| Deposit and withdrawal cycle | Complete cycle: deposit L1→L2, use on L2, withdraw L2→L1 | Full cycle completes successfully, tokens move correctly |
| Token mapping integration | Query L2 token address using mapping | Returns correct L2 address from manual mapping or bridge |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Deposit gas usage | User deposits tokens to L2 | Gas usage reasonable for deposit operation |
| Deposit ETH gas usage | User deposits ETH to L2 | Gas usage reasonable for ETH deposit |
| Finalize withdrawal gas | User finalizes withdrawal with proof | Gas usage reasonable for proof verification |
| Batch deposits gas | Multiple deposits in single transaction (if supported) | Batch uses less gas than individual deposits |

---

**Next**: [TOSSChainState](/protocol/contracts/core/TOSSChainState)
