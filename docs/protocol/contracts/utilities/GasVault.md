# GasVault.sol

## Overview

Manages gas funds for Paymaster operations, enabling gas-sponsored transactions for FMs and investors.

## Purpose

- Hold gas reserves (ETH)
- Fund Paymaster operations
- Track gas usage per user
- Enable gasless UX
- Emergency withdrawal capabilities

## State Variables

- `address public paymaster` - Paymaster address that receives funds
- `address public governance` - Governance address with administrative privileges
- `mapping(address => uint256) public gasUsage` - Tracks gas usage per user address

## Constructor

```solidity
constructor(address _governance)
```

**Parameters**:
- `_governance`: Initial governance address (cannot be address(0))

**Initialization**: Sets governance address and validates it is not zero address

## Functions

### `fundPaymaster`

```solidity
function fundPaymaster(uint256 amount) external onlyGovernance nonReentrant
```

**Purpose**: Transfer ETH funds from vault to Paymaster

**Parameters**:
- `amount`: ETH amount to transfer (must be > 0)

**Access Control**: Only governance

**Security**: Protected by ReentrancyGuard

**Reverts**:
- `AmountMustBeGreaterThanZero()` - If amount is zero
- `InvalidAddress()` - If paymaster is not set (address(0))
- `InsufficientBalance()` - If vault balance is less than amount or transfer fails
- `NotGovernance()` - If caller is not governance

**Events**: `PaymasterFunded(paymaster, amount, timestamp)`

### `trackGasUsage`

```solidity
function trackGasUsage(address user, uint256 gasUsed) external onlyPaymaster
```

**Purpose**: Track gas consumption per user for analytics and refill scheduling

**Parameters**:
- `user`: Address that used gas (cannot be address(0))
- `gasUsed`: Amount of gas used

**Access Control**: Only paymaster

**Reverts**:
- `InvalidAddress()` - If user is address(0)
- `NotPaymaster()` - If caller is not paymaster

**Events**: `GasUsageTracked(user, gasUsed, timestamp)`

### `withdraw`

```solidity
function withdraw(address to, uint256 amount) external onlyGovernance nonReentrant
```

**Purpose**: Withdraw ETH from vault to specified address (e.g., treasury)

**Parameters**:
- `to`: Address to receive the funds (cannot be address(0))
- `amount`: Amount of ETH to withdraw (must be > 0)

**Access Control**: Only governance

**Security**: Protected by ReentrancyGuard

**Reverts**:
- `InvalidAddress()` - If `to` is address(0)
- `AmountMustBeGreaterThanZero()` - If amount is zero
- `InsufficientBalance()` - If vault balance is less than amount or transfer fails
- `NotGovernance()` - If caller is not governance

**Events**: `Withdrawal(to, amount, timestamp)`

### `setPaymaster`

```solidity
function setPaymaster(address _paymaster) external onlyGovernance
```

**Purpose**: Set or update paymaster address

**Parameters**:
- `_paymaster`: New paymaster address (cannot be address(0))

**Access Control**: Only governance

**Reverts**:
- `InvalidAddress()` - If `_paymaster` is address(0)
- `NotGovernance()` - If caller is not governance

**Events**: `PaymasterUpdated(oldPaymaster, newPaymaster)`

### `emergencyWithdraw`

```solidity
function emergencyWithdraw(address to, uint256 amount) external onlyGovernance nonReentrant
```

**Purpose**: Emergency withdrawal of ETH from vault

**Parameters**:
- `to`: Address to receive the funds (cannot be address(0))
- `amount`: Amount of ETH to withdraw (must be > 0)

**Access Control**: Only governance

**Security**: Protected by ReentrancyGuard

**Reverts**:
- `InvalidAddress()` - If `to` is address(0)
- `AmountMustBeGreaterThanZero()` - If amount is zero
- `InsufficientBalance()` - If vault balance is less than amount or transfer fails
- `NotGovernance()` - If caller is not governance

**Events**: `EmergencyWithdrawal(to, amount, timestamp)`

### `setGovernance`

```solidity
function setGovernance(address newGovernance) external onlyGovernance
```

**Purpose**: Update governance address

**Parameters**:
- `newGovernance`: New governance address (cannot be address(0))

**Access Control**: Only governance

**Reverts**:
- `InvalidAddress()` - If `newGovernance` is address(0)
- `NotGovernance()` - If caller is not governance

**Events**: `GovernanceUpdated(oldGovernance, newGovernance)`

### Query Functions

#### `getVaultBalance`

```solidity
function getVaultBalance() external view returns (uint256 balance)
```

**Purpose**: Get current ETH balance in vault

**Returns**: Current vault balance in wei

#### `getPaymasterBalance`

```solidity
function getPaymasterBalance() external view returns (uint256 balance)
```

**Purpose**: Get current ETH balance of paymaster

**Returns**: Current paymaster balance in wei (returns 0 if paymaster is not set)

#### `getGasUsage`

```solidity
function getGasUsage(address user) external view returns (uint256 gasUsed)
```

**Purpose**: Get gas usage for a specific user

**Parameters**:
- `user`: Address to query

**Returns**: Total gas used by the user

## Events

- `PaymasterFunded(address indexed paymaster, uint256 amount, uint256 timestamp)` - Emitted when paymaster is funded
- `Withdrawal(address indexed to, uint256 amount, uint256 timestamp)` - Emitted when funds are withdrawn from vault
- `PaymasterUpdated(address indexed oldPaymaster, address indexed newPaymaster)` - Emitted when paymaster address is updated
- `GasUsageTracked(address indexed user, uint256 gasUsed, uint256 timestamp)` - Emitted when gas usage is tracked
- `EmergencyWithdrawal(address indexed to, uint256 amount, uint256 timestamp)` - Emitted when emergency withdrawal is performed
- `GovernanceUpdated(address indexed oldGovernance, address indexed newGovernance)` - Emitted when governance address is updated

## Custom Errors

- `NotGovernance()` - Thrown when caller is not governance
- `NotPaymaster()` - Thrown when caller is not paymaster
- `InvalidAddress()` - Thrown when address parameter is address(0)
- `InsufficientBalance()` - Thrown when vault balance is insufficient or transfer fails
- `AmountMustBeGreaterThanZero()` - Thrown when amount parameter is zero

## Security Features

- **ReentrancyGuard**: All state-changing functions that transfer ETH are protected by OpenZeppelin's ReentrancyGuard
- **Access Control**: Functions are protected by `onlyGovernance` and `onlyPaymaster` modifiers
- **Input Validation**: All address parameters are validated to be non-zero
- **Balance Checks**: All withdrawal operations verify sufficient balance before transfer

## Receive Function

The contract includes a `receive()` payable function to allow direct ETH deposits to the vault.

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Fund paymaster | Governance funds paymaster with ETH | ETH transferred to paymaster, paymaster balance increased, PaymasterFunded event emitted |
| Query vault balance | Query current ETH balance in GasVault | Balance returned correctly, amount accurate |
| Query paymaster balance | Query current ETH balance of paymaster | Paymaster balance returned correctly, amount accurate |
| Withdraw from vault | Governance withdraws ETH from vault to treasury | ETH transferred to treasury, vault balance decreased, Withdrawal event emitted |
| Fund multiple paymasters | Governance funds multiple paymasters | All paymasters funded correctly, balances updated independently |
| Emergency withdrawal | Governance performs emergency withdrawal | ETH withdrawn to designated address, emergency procedures followed |
| Set paymaster address | Governance sets or updates paymaster address | Paymaster address updated, future funding uses new address, PaymasterUpdated event emitted |
| Fund paymaster with large amount | Governance funds paymaster with large ETH amount | Large amounts handled correctly, paymaster balance updated accurately |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Fund paymaster with zero amount | Attempt to fund paymaster with 0 ETH | Transaction reverts with `AmountMustBeGreaterThanZero()` error |
| Fund paymaster with maximum amount | Attempt to fund paymaster with max uint256 ETH | Maximum amounts handled correctly, balance updated accurately |
| Query empty vault | Query vault balance when vault is empty | Returns zero balance, no error |
| Query before funding | Query paymaster balance before any funding | Returns current paymaster balance (may be zero or pre-existing balance) |
| Fund paymaster multiple times | Fund same paymaster multiple times | All funding transactions succeed, balance accumulates correctly |
| Withdraw entire balance | Governance withdraws entire vault balance | All ETH withdrawn, vault balance becomes zero |
| Fund paymaster after withdrawal | Fund paymaster after previous withdrawal | Funding succeeds, balance updated correctly |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Fund paymaster from non-authorized | Non-authorized address attempts to fund paymaster | Transaction reverts with `NotGovernance()` error |
| Withdraw from non-authorized | Non-authorized address attempts to withdraw from vault | Transaction reverts with `NotGovernance()` error |
| Set paymaster from non-authorized | Non-authorized address attempts to set paymaster address | Transaction reverts with `NotGovernance()` error |
| Track gas usage from non-paymaster | Non-paymaster address attempts to track gas usage | Transaction reverts with `NotPaymaster()` error |
| Set governance from non-authorized | Non-authorized address attempts to set governance | Transaction reverts with `NotGovernance()` error |
| Emergency withdraw from non-authorized | Non-authorized address attempts emergency withdrawal | Transaction reverts with `NotGovernance()` error |
| Fund invalid paymaster | Attempt to fund paymaster address(0) or invalid address | Transaction reverts with validation error |
| Withdraw more than balance | Attempt to withdraw more ETH than vault balance | Transaction reverts with "Insufficient balance" error |
| Fund paymaster with insufficient vault balance | Attempt to fund paymaster when vault has insufficient balance | Transaction reverts with "Insufficient balance" error |
| Set invalid paymaster | Attempt to set paymaster to address(0) | Transaction reverts with validation error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized funding | Attacker attempts to fund paymaster | Transaction reverts, only governance can fund paymaster |
| Prevent unauthorized withdrawal | Attacker attempts to withdraw from vault | Transaction reverts, only governance can withdraw |
| Prevent unauthorized paymaster update | Attacker attempts to change paymaster address | Transaction reverts, only governance can update paymaster |
| Vault balance integrity | Verify vault balance tracked correctly | Balance accounting accurate, cannot manipulate balance |
| Paymaster balance verification | Verify paymaster balance updated correctly | Paymaster balance matches funding amounts, accounting accurate |
| Emergency withdrawal security | Verify emergency withdrawal procedures secure | Emergency withdrawal restricted, proper authorization required |
| Reentrancy protection | Verify contract protected against reentrancy attacks | Reentrancy guards prevent recursive calls, safe from external callback attacks |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Fund paymaster by governance | Governance funds paymaster | Transaction succeeds |
| Fund paymaster by non-authorized | Non-authorized attempts to fund paymaster | Transaction reverts with "Not authorized" |
| Withdraw by governance | Governance withdraws from vault | Transaction succeeds |
| Withdraw by non-authorized | Non-authorized attempts to withdraw | Transaction reverts with "Not authorized" |
| Set paymaster by governance | Governance sets paymaster address | Transaction succeeds |
| Set paymaster by non-authorized | Non-authorized attempts to set paymaster | Transaction reverts with "Not authorized" |
| Query functions by any address | Any address queries vault balance, paymaster balance | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Paymaster funding flow | Governance funds paymaster, paymaster uses ETH for user transactions | Complete flow succeeds, paymaster operations work correctly |
| Gas abstraction integration | Paymaster provides gas abstraction using vault funds | Users can transact without paying gas, paymaster covers costs |
| Multiple paymaster funding | Governance funds multiple paymasters for different purposes | All paymasters funded independently, operations work correctly |
| Treasury withdrawal integration | Governance withdraws from vault to treasury | Withdrawal succeeds, treasury receives ETH, accounting accurate |
| Emergency procedures integration | Emergency withdrawal triggered, funds secured | Emergency procedures followed, funds transferred to secure address |
| Vault balance monitoring | External contracts monitor vault balance | Balance queries accurate, monitoring systems work correctly |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Fund paymaster gas | Governance funds paymaster | Gas usage reasonable for funding operation |
| Withdraw from vault gas | Governance withdraws from vault | Gas usage reasonable for withdrawal operation |
| Set paymaster gas | Governance sets paymaster address | Gas usage reasonable for update operation |
| Query operations gas | Multiple queries for vault balance, paymaster balance | View functions consume no gas (read-only) |

---

**All Utility Contracts Complete!**

