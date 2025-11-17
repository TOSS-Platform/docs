# TOSSTreasury.sol

## Overview

The protocol treasury contract manages protocol-owned assets, collects fees, and funds protocol operations through DAO-controlled allocation.

## Purpose

TOSSTreasury serves as the financial hub of the TOSS Protocol:
- Collects protocol fees from all funds
- Manages protocol-owned reserves
- Funds development, audits, grants
- Provides emergency liquidity
- Controlled entirely by DAO governance

## Core Responsibilities

- ✅ Receive and store protocol fees (TOSS, USDC, other tokens)
- ✅ Execute DAO-approved fund transfers
- ✅ Track income and expenses
- ✅ Provide reserve ratios and health metrics
- ✅ Emergency fund management

## State Variables

```solidity
// ===== Governance =====
address public governance;          // DAO governance address
address public guardian;            // Emergency guardian

// ===== Asset Tracking =====
mapping(address => uint256) public reserves;  // token => amount
address[] public supportedAssets;             // List of held assets

// ===== Allocation Tracking =====
struct Allocation {
    address recipient;
    uint256 amount;
    address asset;
    uint256 timestamp;
    string purpose;
    bool executed;
}
mapping(uint256 => Allocation) public allocations;
uint256 public allocationCount;

// ===== Limits =====
uint256 public dailySpendLimit;     // Max daily spending
uint256 public emergencyReserve;    // Min reserve to maintain
mapping(uint256 => uint256) public dailySpent;  // day => amount spent

// ===== Fee Collection =====
mapping(address => uint256) public collectedFees;  // Lifetime fees per asset
uint256 public totalFeesCollectedUSD;              // Total in USD equivalent
```

## Functions

### Constructor

```solidity
constructor(
    address _governance,
    address _guardian,
    uint256 _dailySpendLimit,
    uint256 _emergencyReserve
)
```

**Parameters**:
- `_governance`: DAO governance contract
- `_guardian`: Emergency guardian address
- `_dailySpendLimit`: Maximum daily spending (in USD equivalent)
- `_emergencyReserve`: Minimum reserve to maintain

### Fee Collection Functions

#### `collectProtocolFee`

```solidity
function collectProtocolFee(
    address asset,
    uint256 amount
) external onlyFundVault
```

**Purpose**: Receive protocol fees from fund operations

**Parameters**:
- `asset`: Token address (USDC, TOSS, etc.)
- `amount`: Fee amount

**Access Control**: Only registered FundManagerVaults

**Behavior**:
- Transfers tokens from vault to treasury
- Updates `reserves[asset]`
- Updates `collectedFees[asset]`
- Emits `FeeCollected` event

**Events**: `FeeCollected(asset, amount, fundId, timestamp)`

#### `receiveFunds`

```solidity
function receiveFunds(
    address asset,
    uint256 amount,
    string calldata source
) external
```

**Purpose**: Receive funds from external sources (donations, partnerships)

**Parameters**:
- `asset`: Token address
- `amount`: Amount received
- `source`: Description of fund source

**Events**: `FundsReceived(asset, amount, sender, source)`

### Fund Allocation Functions

#### `proposeAllocation`

```solidity
function proposeAllocation(
    address recipient,
    uint256 amount,
    address asset,
    string calldata purpose
) external onlyGovernance returns (uint256 allocationId)
```

**Purpose**: DAO proposes fund allocation

**Parameters**:
- `recipient`: Address to receive funds
- `amount`: Amount to allocate
- `asset`: Token to send
- `purpose`: Description (dev, audit, grant, etc.)

**Returns**: `allocationId` - unique allocation identifier

**Access Control**: Only governance

**Behavior**:
- Creates pending allocation
- Checks daily spend limit
- Checks emergency reserve not violated
- Requires separate execution call

**Events**: `AllocationProposed(allocationId, recipient, amount, asset, purpose)`

#### `executeAllocation`

```solidity
function executeAllocation(
    uint256 allocationId
) external onlyGovernance
```

**Purpose**: Execute approved allocation after timelock

**Parameters**:
- `allocationId`: Allocation to execute

**Access Control**: Only governance (after timelock)

**Behavior**:
- Validates allocation exists and not executed
- Checks daily limit not exceeded
- Transfers tokens to recipient
- Updates tracking

**Events**: `AllocationExecuted(allocationId, recipient, amount, asset)`

#### `batchAllocate`

```solidity
function batchAllocate(
    address[] calldata recipients,
    uint256[] calldata amounts,
    address asset,
    string calldata purpose
) external onlyGovernance
```

**Purpose**: Execute multiple allocations at once (e.g., salary payments)

**Parameters**:
- `recipients`: Array of recipient addresses
- `amounts`: Corresponding amounts
- `asset`: Token to distribute
- `purpose`: Batch description

**Access Control**: Only governance

**Use Case**: Monthly team payments, multiple grants

### Emergency Functions

#### `emergencyWithdraw`

```solidity
function emergencyWithdraw(
    address asset,
    uint256 amount,
    address destination
) external onlyGuardian
```

**Purpose**: Emergency withdrawal if treasury compromised

**Parameters**:
- `asset`: Token to withdraw
- `amount`: Amount to withdraw
- `destination`: Safe destination address

**Access Control**: Only guardian (3-of-5 multisig)

**Conditions**:
- Only usable if protocol paused
- Limited to emergency reserve amount
- Requires guardian consensus

**Events**: `EmergencyWithdrawal(asset, amount, destination, guardian)`

### Query Functions

#### `getReserveRatio`

```solidity
function getReserveRatio() external view returns (uint256)
```

**Purpose**: Calculate reserve health ratio

**Returns**: `uint256` - ratio as percentage (100 = 100%)

**Calculation**:
```
ratio = (currentReserves / targetReserves) × 100
```

#### `getAssetBalance`

```solidity
function getAssetBalance(address asset) external view returns (uint256)
```

**Purpose**: Query balance of specific asset

**Returns**: Current balance of asset in treasury

#### `getTotalValueUSD`

```solidity
function getTotalValueUSD() external view returns (uint256)
```

**Purpose**: Get total treasury value in USD

**Returns**: USD value of all assets using oracle prices

### Administrative Functions

#### `setDailySpendLimit`

```solidity
function setDailySpendLimit(uint256 newLimit) external onlyGovernance
```

**Purpose**: Update daily spending limit

**Access Control**: Only governance

**Events**: `DailySpendLimitUpdated(oldLimit, newLimit)`

#### `setEmergencyReserve`

```solidity
function setEmergencyReserve(uint256 newReserve) external onlyGovernance
```

**Purpose**: Update minimum emergency reserve

**Access Control**: Only governance

## DAO-Configurable Parameters

| Parameter | Initial Value | Governance Level | Update Frequency |
|-----------|---------------|------------------|------------------|
| `dailySpendLimit` | $100,000 | Protocol | Monthly |
| `emergencyReserve` | $500,000 | Protocol | Quarterly |
| `governance` | DAO address | Protocol | As needed |
| `guardian` | Multisig | Protocol | Annually |

## Deployment

### Dependencies

Must deploy after:
- TOSS.sol
- DAO Governance contracts

### Constructor Arguments

```typescript
const args = {
  governance: daoGovernance.address,
  guardian: guardianMultisig.address,
  dailySpendLimit: ethers.utils.parseUnits("100000", 6), // $100k USDC
  emergencyReserve: ethers.utils.parseUnits("500000", 6), // $500k USDC
};
```

### Post-Deployment

```solidity
// 1. Grant treasury access to fund vaults
await fundRegistry.authorizeTreasury(treasury.address);

// 2. Seed initial reserves (optional)
await usdc.transfer(treasury.address, initialReserve);

// 3. Verify access controls
assert(await treasury.governance() == daoGovernance.address);
```

## Access Control

### Roles

| Role | Address | Permissions |
|------|---------|-------------|
| **Governance** | DAO | Propose/execute allocations, change parameters |
| **Guardian** | Multisig | Emergency withdrawal (paused state only) |
| **Fund Vaults** | Registered vaults | Deposit protocol fees |

### Modifiers

```solidity
modifier onlyGovernance() {
    require(msg.sender == governance, "Not governance");
    _;
}

modifier onlyGuardian() {
    require(msg.sender == guardian, "Not guardian");
    _;
}

modifier onlyFundVault() {
    require(fundRegistry.isRegisteredVault(msg.sender), "Not registered vault");
    _;
}
```

## Security Considerations

### Attack Vectors

**1. Unauthorized Withdrawal**
- **Risk**: Attacker drains treasury
- **Mitigation**: All withdrawals via DAO with timelock
- **Severity**: Critical → Mitigated

**2. Daily Limit Bypass**
- **Risk**: Drain via multiple transactions
- **Mitigation**: Daily tracking, resets at midnight UTC
- **Severity**: Medium → Mitigated

**3. Emergency Reserve Violation**
- **Risk**: Treasury depleted, cannot handle emergencies
- **Mitigation**: Enforced minimum reserve, allocation rejections
- **Severity**: Medium → Mitigated

**4. Guardian Abuse**
- **Risk**: Guardian withdraws inappropriately
- **Mitigation**: Only during pause, limited to emergency reserve, 3-of-5 consensus
- **Severity**: Low → Mitigated

### Audit Focus Areas

1. **Access Controls**: Verify only governance can allocate
2. **Daily Limits**: Check limit tracking and reset logic
3. **Emergency Reserve**: Ensure minimum maintained
4. **Asset Tracking**: Verify accurate balance tracking
5. **Batch Operations**: Check for reentrancy in batch allocations

## Events

```solidity
event FeeCollected(
    address indexed asset,
    uint256 amount,
    uint256 indexed fundId,
    uint256 timestamp
);

event AllocationProposed(
    uint256 indexed allocationId,
    address indexed recipient,
    uint256 amount,
    address asset,
    string purpose
);

event AllocationExecuted(
    uint256 indexed allocationId,
    address indexed recipient,
    uint256 amount,
    address asset
);

event EmergencyWithdrawal(
    address indexed asset,
    uint256 amount,
    address indexed destination,
    address guardian
);

event DailySpendLimitUpdated(uint256 oldLimit, uint256 newLimit);
event EmergencyReserveUpdated(uint256 oldReserve, uint256 newReserve);
event FundsReceived(address indexed asset, uint256 amount, address indexed sender, string source);
```

## Integration Points

**Incoming**:
- FundManagerVault → `collectProtocolFee()`
- Governance → `proposeAllocation()`, `executeAllocation()`
- Guardian → `emergencyWithdraw()` (emergency only)
- External → `receiveFunds()` (donations)

**Outgoing**:
- None (treasury doesn't call other contracts)

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Collect protocol fee | Registered fund vault collects and deposits protocol fee in USDC | Fee transferred to treasury, reserves updated, collectedFees tracking incremented, FeeCollected event emitted |
| Receive external funds | External address donates funds to treasury | Funds transferred to treasury, reserves updated, FundsReceived event emitted |
| Propose allocation | Governance proposes allocation for developer grant | Allocation created with pending status, AllocationProposed event emitted, daily limit checked |
| Execute allocation | Governance executes approved allocation after timelock period | Funds transferred to recipient, allocation marked as executed, AllocationExecuted event emitted |
| Batch allocation | Governance allocates funds to multiple recipients in one transaction | All recipients receive funds, batch operation completes atomically, events emitted for each |
| Query reserve ratio | Query current reserve health ratio | Returns ratio percentage, calculated as (currentReserves / targetReserves) × 100 |
| Query asset balance | Query balance of specific asset in treasury | Returns current balance of asset |
| Query total value USD | Query total treasury value in USD equivalent | Returns USD value calculated using oracle prices for all assets |
| Update daily spend limit | Governance updates daily spending limit | New limit set, DailySpendLimitUpdated event emitted |
| Update emergency reserve | Governance updates minimum emergency reserve | New reserve threshold set, EmergencyReserveUpdated event emitted |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Collect zero fee | Fund vault attempts to collect 0 fee | Transaction succeeds (zero is valid), no state change except event emission |
| Allocate exact daily limit | Governance allocates exactly the daily spending limit | Transaction succeeds, daily spent tracking updated, no violation |
| Allocate exact emergency reserve | Governance allocates amount that leaves exactly emergency reserve | Transaction succeeds, reserves at minimum threshold |
| Batch allocation with empty arrays | Governance attempts batch allocation with empty recipient/amount arrays | Transaction reverts with validation error |
| Query non-existent asset balance | Query balance for asset treasury doesn't hold | Returns 0 (asset not in reserves) |
| Allocate when reserves equal emergency reserve | Attempt allocation when reserves exactly equal emergency reserve | Transaction reverts, cannot allocate below emergency reserve |
| Daily limit reset at midnight | Allocate at limit, wait for new day, allocate again | Daily tracking resets, new allocations allowed |
| Multiple allocations same day | Governance makes multiple allocations within daily limit | All allocations succeed if total within limit |
| Receive funds in unsupported asset | External address sends asset not previously held by treasury | Asset added to supportedAssets list, reserves updated |
| Allocate to zero address | Governance attempts to allocate to address(0) | Transaction reverts with zero address validation error |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Collect fee from unauthorized source | Unregistered address attempts to collect protocol fee | Transaction reverts with "Not registered vault" error |
| Propose allocation from non-governance | Non-governance address attempts to propose allocation | Transaction reverts with "Not governance" error |
| Execute allocation from non-governance | Non-governance address attempts to execute allocation | Transaction reverts with "Not governance" error |
| Execute allocation before timelock | Governance attempts to execute allocation before timelock period | Transaction reverts with "Timelock not passed" error |
| Execute already executed allocation | Governance attempts to execute allocation that was already executed | Transaction reverts with "Already executed" error |
| Propose allocation exceeding daily limit | Governance proposes allocation that would exceed daily spending limit | Transaction reverts with "Daily limit exceeded" error |
| Propose allocation violating emergency reserve | Governance proposes allocation that would leave reserves below emergency threshold | Transaction reverts with "Would violate emergency reserve" error |
| Execute allocation exceeding daily limit | Governance executes allocation that would exceed remaining daily limit | Transaction reverts with "Daily limit exceeded" error |
| Emergency withdraw from non-guardian | Non-guardian address attempts emergency withdrawal | Transaction reverts with "Not guardian" error |
| Emergency withdraw when not paused | Guardian attempts emergency withdrawal when protocol is active | Transaction reverts with "Protocol not paused" error |
| Emergency withdraw exceeding reserve | Guardian attempts to withdraw more than emergency reserve allows | Transaction reverts with "Exceeds emergency reserve limit" error |
| Update parameters from non-governance | Non-governance address attempts to update daily limit or emergency reserve | Transaction reverts with "Not governance" error |
| Allocate to invalid recipient | Governance attempts to allocate to contract that doesn't accept tokens | Transaction may succeed but funds may be locked (depends on recipient contract) |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized fee collection | Attacker attempts to collect fees by calling collectProtocolFee directly | Transaction reverts, only registered vaults can collect fees |
| Prevent unauthorized allocation | Attacker attempts to propose or execute allocations | Transaction reverts, only governance can allocate funds |
| Prevent emergency abuse | Guardian attempts to withdraw when protocol is active | Transaction reverts, emergency withdrawal only when paused |
| Daily limit tracking accuracy | Multiple allocations made, verify daily spent tracked correctly | Daily spent accurately reflects total allocations, prevents bypass via multiple small allocations |
| Emergency reserve enforcement | Attempt allocations that would violate emergency reserve | All attempts revert, emergency reserve always maintained |
| Reentrancy protection | Malicious contract attempts reentrancy during allocation execution | Reentrancy guard prevents recursive calls, funds secure |
| Timelock enforcement | Attempt to execute allocation immediately after proposal | Transaction reverts, timelock period must pass |
| Batch allocation atomicity | Batch allocation with invalid recipient, verify atomic rollback | Entire batch reverts if any allocation invalid, no partial execution |
| Reserve calculation accuracy | Collect fees, allocate funds, verify reserve tracking remains accurate | Reserves accurately reflect all inflows and outflows |
| Access control on parameter updates | Verify only governance can update daily limit and emergency reserve | Unauthorized parameter updates revert, governance maintains control |
| Emergency withdrawal limits | Guardian attempts to withdraw more than emergency reserve allows | Transaction reverts, withdrawal limited to emergency reserve amount |
| Allocation execution idempotency | Attempt to execute same allocation multiple times | Only first execution succeeds, subsequent attempts revert |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Collect fee from registered vault | Registered fund vault collects protocol fee | Transaction succeeds, fee collected |
| Collect fee from non-registered address | Unregistered address attempts to collect fee | Transaction reverts with "Not registered vault" |
| Propose allocation by governance | Governance proposes allocation | Transaction succeeds, allocation created |
| Propose allocation by non-governance | Non-governance address proposes allocation | Transaction reverts with "Not governance" |
| Execute allocation by governance | Governance executes allocation after timelock | Transaction succeeds, funds transferred |
| Execute allocation by non-governance | Non-governance address attempts to execute | Transaction reverts with "Not governance" |
| Emergency withdraw by guardian | Guardian performs emergency withdrawal when paused | Transaction succeeds, funds withdrawn |
| Emergency withdraw by non-guardian | Non-guardian attempts emergency withdrawal | Transaction reverts with "Not guardian" |
| Update daily limit by governance | Governance updates daily spend limit | Transaction succeeds, limit updated |
| Update daily limit by non-governance | Non-governance attempts to update limit | Transaction reverts with "Not governance" |
| Receive funds from any address | Any address sends funds to treasury | Transaction succeeds, treasury accepts funds from anyone |
| Query functions from any address | Any address queries reserve ratio, balances, etc. | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Fund vault collects and deposits fee | FundManagerVault collects management fee, sends protocol fee to treasury | Fee flows from vault to treasury, tracking updated correctly |
| Governance proposes and executes flow | Complete flow: proposal creation, timelock wait, execution | All steps succeed, funds allocated as intended |
| Daily limit reset integration | Allocations made, new day starts, verify daily tracking resets | Daily tracking resets correctly, new allocations allowed |
| Emergency withdrawal during pause | Protocol paused, guardian performs emergency withdrawal | Withdrawal succeeds, funds moved to safe address |
| Multiple asset fee collection | Treasury receives fees in multiple assets (USDC, TOSS, ETH) | All assets tracked correctly, reserves updated for each |
| Batch allocation to multiple recipients | Governance allocates to 10 recipients in single batch | All recipients receive funds, transaction atomic |
| Oracle price integration | Query total value USD requires price oracle for multiple assets | Total value calculated correctly using current prices |
| Timelock integration | Allocation proposal creates timelock, execution respects delay | Timelock enforced, execution only after delay period |
| Reserve health monitoring | Off-chain system monitors reserve ratio via events | Reserve ratio queries and events enable proper monitoring |
| Treasury upgrade with preserved state | Treasury upgraded via proxy, state preserved | All reserves and tracking remain intact after upgrade |

### State Transition Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Allocation state: pending → executed | Allocation created as pending, executed after timelock | State transitions correctly, executed flag set |
| Daily spent tracking reset | Daily spent at limit, new day begins | Daily spent resets to zero, new allocations allowed |
| Emergency reserve violation prevention | Reserves at emergency level, attempt allocation | Allocation rejected, reserves remain at emergency level |
| Multiple allocations state tracking | Multiple allocations proposed and executed in sequence | Each allocation tracked independently, state transitions correctly |
| Guardian emergency state | Protocol paused, guardian performs emergency withdrawal | Emergency state allows guardian action, protocol state checked |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Single allocation gas usage | Governance proposes and executes single allocation | Gas usage reasonable for standard allocation |
| Batch allocation gas efficiency | Governance allocates to 5 recipients via batch vs individual | Batch allocation uses less gas than 5 separate transactions |
| Fee collection gas usage | Fund vault collects fee | Gas usage efficient for fee collection operation |
| Query operations gas usage | Multiple queries for reserve ratio, balances | View functions consume no gas (read-only) |
| Emergency withdrawal gas | Guardian performs emergency withdrawal | Gas usage reasonable for emergency operation |

## Upgrade Strategy

**Upgradeable via Transparent Proxy**

```
TransparentUpgradeableProxy
├── Implementation: TOSSTreasury
├── Admin: ProxyAdmin (DAO-controlled)
└── Upgrade Process: DAO proposal → Timelock → Execute
```

**Upgrade Considerations**:
- Storage layout must be preserved
- New variables append only
- Test upgrade on testnet first

## Example Usage

```typescript
// Collect fee from fund vault
await usdc.approve(treasury.address, feeAmount);
await treasury.collectProtocolFee(usdc.address, feeAmount);

// DAO allocates funds for development
const allocationId = await treasury.connect(dao).proposeAllocation(
  devTeam.address,
  ethers.utils.parseUnits("50000", 6),
  usdc.address,
  "Q1 2025 Development Budget"
);

// After 48h timelock
await treasury.connect(dao).executeAllocation(allocationId);
```

---

**Next**: [RewardDistributor](/docs/protocol/contracts/core/RewardDistributor)
