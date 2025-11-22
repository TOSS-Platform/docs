# FundManagerVault.sol

## Overview

The vault contract that securely holds fund assets, manages share accounting, and enforces withdrawal rules. This is the most critical security component as it custodies all investor capital.

## Purpose

- Secure custody of multi-asset fund holdings
- ERC4626-like share-based accounting
- NAV-based share pricing
- Enforce withdrawal queues and limits
- Integrate with RiskEngine for trade validation

## Core Responsibilities

- ✅ Hold investor deposits securely
- ✅ Mint/burn fund shares based on NAV
- ✅ Execute trades only after RiskEngine approval
- ✅ Handle deposits and withdrawals
- ✅ Prevent unauthorized asset movement
- ✅ Support multi-asset funds (USDC, ETH, BTC, etc.)

## Constants

```solidity
uint256 public constant EMERGENCY_FEE_RATE = 500; // 5% (500 basis points)
uint256 public constant SECONDS_PER_YEAR = 365 days;
uint256 public constant NAV_DECIMALS = 1e6; // NAV in USD with 6 decimals
```

## State Variables

```solidity
// ===== Fund Identity =====
uint256 public fundId_;  // Fund ID (set via setFundId)
address public manager_;  // Fund Manager address
IFundRegistry public fundRegistry;
IRiskEngine public riskEngine;

// ===== Share Accounting =====
mapping(address => uint256) public shares;  // investor => shares
uint256 public totalShares;

// ===== Asset Holdings =====
mapping(address => uint256) public holdings;  // asset => amount
address[] public assets;  // List of held assets
mapping(address => bool) public isAssetTracked;  // Quick lookup

// ===== NAV Tracking =====
uint256 public currentNAV;  // Current NAV in USD (6 decimals)
uint256 public highWaterMark;  // Highest NAV reached
uint256 public lastNAVUpdate;  // Timestamp of last NAV update

// ===== Withdrawal Queue =====
struct WithdrawalRequest {
    address investor;
    uint256 shares;
    uint256 requestedAt;
    bool processed;
}
mapping(uint256 => WithdrawalRequest) public withdrawalQueue;
uint256 public queueLength;

// ===== Limits =====
uint256 public dailyWithdrawalLimit;  // Max daily withdrawal (in USD, 6 decimals)
uint256 public withdrawnToday;  // Amount withdrawn today (in USD, 6 decimals)
uint256 public lastWithdrawalReset;  // Timestamp of last reset

// ===== Configuration =====
FundConfig public config;  // Fund configuration
bool public initialized;  // Initialization flag

// ===== Fee Tracking =====
uint256 public lastFeeCollection;  // Timestamp of last fee collection

// ===== Dependencies =====
address public tradeExecutor;  // TradeExecutor contract address
address public navEngine;  // NAV Engine contract address
address public swapRouter;  // Swap router address
TOSSTreasury public treasury;  // Treasury for fee collection
```

## Functions

### Initialization

#### `initialize`

```solidity
function initialize(
    address _manager,
    FundConfig memory config
) external
```

**Purpose**: Initialize cloned fund contract (IFund interface)

**Parameters**:
- `_manager`: Fund Manager address
- `config`: Initial fund configuration

**Called By**: FundFactory during deployment

**Note**: Fund ID is set separately via `setFundId()` after registration in FundRegistry.

#### `setFundId`

```solidity
function setFundId(uint256 _fundId) external
```

**Purpose**: Set fund ID (called by FundFactory after registration)

**Parameters**:
- `_fundId`: Fund ID from registry

**Access Control**: Can only be called once (when fundId_ == 0)

#### `setDependencies`

```solidity
function setDependencies(
    address _fundRegistry,
    address _riskEngine,
    address _tradeExecutor,
    address _navEngine,
    address _swapRouter,
    address _treasury
) external
```

**Purpose**: Set contract dependencies (called after initialization)

**Parameters**:
- `_fundRegistry`: FundRegistry address
- `_riskEngine`: RiskEngine address
- `_tradeExecutor`: TradeExecutor address
- `_navEngine`: NAV Engine address
- `_swapRouter`: Swap router address
- `_treasury`: Treasury address

**Access Control**: Only manager or before fundId is set

### Deposit Functions

#### `deposit`

```solidity
function deposit(
    uint256 amount,
    address asset
) external returns (uint256 shares)
```

**Purpose**: Investor deposits capital, receives shares

**Parameters**:
- `amount`: Amount to deposit (in asset)
- `asset`: Token address (must be in allowed assets)

**Returns**: Number of shares minted

**Behavior**:
1. Validate asset is allowed
2. Transfer asset from investor
3. Calculate shares based on current NAV
4. Mint shares to investor
5. Update holdings

**Formula**:
```
If first deposit:
    shares = amount  (1:1 ratio)
Else:
    shares = (amount × totalShares) / currentNAV
```

**Events**: `Deposit(investor, amount, asset, shares, timestamp)`

#### `depositMultiAsset`

```solidity
function depositMultiAsset(
    address[] calldata assets,
    uint256[] calldata amounts
) external returns (uint256 shares)
```

**Purpose**: Deposit multiple assets in one transaction

**Use Case**: Large investors depositing diversified portfolio

### Withdrawal Functions

#### `requestWithdrawal`

```solidity
function requestWithdrawal(
    uint256 shares
) external returns (uint256 requestId)
```

**Purpose**: Request withdrawal (enters queue)

**Parameters**:
- `shares`: Number of shares to redeem

**Returns**: Withdrawal request ID

**Behavior**:
- Validates investor owns shares
- Checks lockup period passed
- Adds to withdrawal queue
- Burns shares immediately (prevents double-withdrawal)

**Events**: `WithdrawalRequested(investor, shares, requestId, timestamp)`

#### `processWithdrawal`

```solidity
function processWithdrawal(
    uint256 requestId
) external returns (uint256 amount)
```

**Purpose**: Process queued withdrawal

**Parameters**:
- `requestId`: Withdrawal request to process

**Returns**: Amount transferred to investor

**Behavior**:
1. Validate request exists and not processed
2. Check daily withdrawal limit
3. Calculate value based on current NAV
4. Transfer assets proportionally
5. Update daily limit tracking

**Access Control**: Anyone can process (automated by keeper)

**Events**: `WithdrawalProcessed(requestId, investor, amount, timestamp)`

#### `emergencyWithdraw`

```solidity
function emergencyWithdraw(
    uint256 shares
) external returns (uint256 amount)
```

**Purpose**: Immediate withdrawal (higher fees, fund emergency only)

**Conditions**:
- Fund in LIQUIDATING state
- Pays 5% emergency fee
- No queue wait

### Trade Execution Functions

#### `executeTrade`

```solidity
function executeTrade(
    address assetIn,
    address assetOut,
    uint256 amountIn,
    uint256 minAmountOut,
    bytes calldata routeData
) external onlyTradeExecutor returns (uint256 amountOut)
```

**Purpose**: Execute validated trade

**Parameters**:
- `assetIn`: Asset to sell
- `assetOut`: Asset to buy
- `amountIn`: Amount to sell
- `minAmountOut`: Minimum acceptable (slippage protection)
- `routeData`: Encoded route information

**Access Control**: Only FundTradeExecutor (after RiskEngine validation)

**Behavior**:
- Validates RiskEngine approved this trade
- Executes swap via router
- Updates holdings
- Emits trade event

**Events**: `TradeExecuted(assetIn, assetOut, amountIn, amountOut, timestamp)`

### NAV Functions

#### `updateNAV`

```solidity
function updateNAV(
    uint256 newNAV
) external onlyNAVEngine
```

**Purpose**: Update fund's Net Asset Value

**Parameters**:
- `newNAV`: New NAV in USD (6 decimals)

**Access Control**: Only NAV Engine

**Behavior**:
- Updates `currentNAV`
- Updates `highWaterMark` if new high
- Updates FundRegistry via `fundRegistry.updateFundNAV(fundId_, newNAV)`
- Emits NAV update event

**Events**: `NAVUpdated(oldNAV, newNAV, timestamp)`

### Fee Functions

#### `collectManagementFee`

```solidity
function collectManagementFee() external returns (uint256 fee)
```

**Purpose**: Calculate and collect management fee

**Returns**: Fee amount collected

**Formula**:
```
timeSinceLastCollection = now - lastFeeCollection
annualFeeRate = managementFee  // e.g., 2%
fee = NAV × annualFeeRate × timeSinceLastCollection / 365 days
```

**Behavior**:
- Mints shares to FM (dilutes other investors)
- Or transfers protocol fee to treasury
- Updates last collection timestamp

#### `collectPerformanceFee`

```solidity
function collectPerformanceFee() external returns (uint256 fee)
```

**Purpose**: Collect performance fee above high water mark

**Formula**:
```
if (currentNAV > highWaterMark):
    profit = currentNAV - highWaterMark
    fee = profit × performanceFeeRate
    highWaterMark = currentNAV
```

**Conditions**:
- Only if NAV > HWM
- Only when investor withdraws or on schedule (quarterly)

**Behavior**:
- Calculates profit = currentNAV - highWaterMark
- Calculates fee = profit × performanceFeeRate
- Updates highWaterMark = currentNAV
- Mints shares to FM (dilution)
- Updates lastFeeCollection timestamp

### View Functions

#### `getShares`

```solidity
function getShares(address investor) external view returns (uint256)
```

**Purpose**: Get investor's share balance

**Parameters**:
- `investor`: Investor address

**Returns**: Number of shares owned

#### `getHoldings`

```solidity
function getHoldings(address asset) external view returns (uint256)
```

**Purpose**: Get holdings for specific asset

**Parameters**:
- `asset`: Asset address

**Returns**: Amount held

#### `getAssets`

```solidity
function getAssets() external view returns (address[] memory)
```

**Purpose**: Get list of held assets

**Returns**: Array of asset addresses

#### `getWithdrawalRequest`

```solidity
function getWithdrawalRequest(uint256 requestId) external view returns (WithdrawalRequest memory)
```

**Purpose**: Get withdrawal request details

**Parameters**:
- `requestId`: Request ID

**Returns**: WithdrawalRequest struct

#### `calculateShares`

```solidity
function calculateShares(uint256 amount, address asset) external view returns (uint256)
```

**Purpose**: Calculate shares for deposit amount

**Parameters**:
- `amount`: Amount to deposit
- `asset`: Asset address

**Returns**: Number of shares that would be minted

#### `calculateWithdrawalAmount`

```solidity
function calculateWithdrawalAmount(uint256 shares) external view returns (uint256 amount)
```

**Purpose**: Calculate withdrawal amount for shares

**Parameters**:
- `shares`: Number of shares to redeem

**Returns**: Amount that would be received (after fees)

**Note**: Uses named return variable `amount` for clarity

### Admin Functions

#### `setTradeExecutor`

```solidity
function setTradeExecutor(address _tradeExecutor) external onlyManager
```

**Purpose**: Set TradeExecutor address

**Parameters**:
- `_tradeExecutor`: TradeExecutor address

**Access Control**: Only manager

#### `setNAVEngine`

```solidity
function setNAVEngine(address _navEngine) external onlyManager
```

**Purpose**: Set NAV Engine address

**Parameters**:
- `_navEngine`: NAV Engine address

**Access Control**: Only manager

#### `setSwapRouter`

```solidity
function setSwapRouter(address _swapRouter) external onlyManager
```

**Purpose**: Set swap router address

**Parameters**:
- `_swapRouter`: Swap router address

**Access Control**: Only manager

#### `setTreasury`

```solidity
function setTreasury(address _treasury) external onlyManager
```

**Purpose**: Set treasury address

**Parameters**:
- `_treasury`: Treasury address

**Access Control**: Only manager

#### `setDailyWithdrawalLimit`

```solidity
function setDailyWithdrawalLimit(uint256 _limit) external onlyManager
```

**Purpose**: Set daily withdrawal limit

**Parameters**:
- `_limit`: New daily withdrawal limit (in USD, 6 decimals)

**Access Control**: Only manager

## DAO-Configurable Parameters

| Parameter | Config Level | Who Can Change |
|-----------|--------------|----------------|
| `dailyWithdrawalLimit` | Fund | Fund Governance |
| `lockupPeriod` | Fund | Fund Governance |
| `allowedAssets` | Fund | Fund Governance (within tier limits) |
| `emergencyFeeRate` | Protocol | Protocol Governance |

## Deployment

**Deployed via**: FundFactory (minimal proxy per fund)

**Master Contract**: Deployed once, cloned for each fund

```typescript
// Deploy master implementation
const FundManagerVault = await ethers.getContractFactory("FundManagerVault");
const vaultImpl = await FundManagerVault.deploy();

// Used by FundFactory for cloning
fundFactory.setFundImplementation(vaultImpl.address);
```

## Modifiers

- `onlyManager()`: Only fund manager can call
- `onlyTradeExecutor()`: Only TradeExecutor contract can call
- `onlyNAVEngine()`: Only NAV Engine contract can call
- `whenInitialized()`: Contract must be initialized

## Access Control

### Permission Matrix

| Function | Anyone | Investor | FM | TradeExecutor | NAVEngine |
|----------|--------|----------|-----|---------------|-----------|
| `deposit` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `requestWithdrawal` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `processWithdrawal` | ✅* | ✅ | ✅ | ❌ | ❌ |
| `executeTrade` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `updateNAV` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `collectManagementFee` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `collectPerformanceFee` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `setTradeExecutor` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `setNAVEngine` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `setSwapRouter` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `setTreasury` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `setDailyWithdrawalLimit` | ❌ | ❌ | ✅ | ❌ | ❌ |

*Anyone can process withdrawal (permissionless keeper network)

## Security Considerations

### Critical Attack Vectors

**1. Unauthorized Asset Transfer**
- **Risk**: Attacker drains vault
- **Mitigation**: Only TradeExecutor can move assets, after RiskEngine approval
- **Severity**: CRITICAL → Mitigated

**2. Share Manipulation**
- **Risk**: Inflate shares before NAV update
- **Mitigation**: Snapshot-based share calculation, NAV oracle
- **Severity**: High → Mitigated

**3. Withdrawal Front-Running**
- **Risk**: FM trades disadvantageously before large withdrawal
- **Mitigation**: Withdrawal queue, time delays, slippage limits
- **Severity**: Medium → Mitigated

**4. Reentrancy on Withdrawal**
- **Risk**: Reenter during withdrawal, drain funds
- **Mitigation**: Check-effects-interactions, nonReentrant modifier
- **Severity**: CRITICAL → Mitigated

### Audit Focus Areas

1. **Reentrancy Protection**: All external calls protected
2. **Share Math**: Verify deposit/withdrawal calculations
3. **Access Controls**: Only authorized contracts can move funds
4. **Asset Isolation**: Each fund's assets isolated
5. **NAV Manipulation**: Cannot manipulate share price

## Events

```solidity
event FundInitialized(address indexed manager, IFundRegistry.FundClass fundClass, DAOConfigCore.RiskTier riskTier);
event Deposit(address indexed investor, uint256 amount, address asset, uint256 shares, uint256 timestamp);
event WithdrawalRequested(address indexed investor, uint256 shares, uint256 requestId, uint256 timestamp);
event WithdrawalProcessed(uint256 indexed requestId, address investor, uint256 amount, uint256 timestamp);
event TradeExecuted(address assetIn, address assetOut, uint256 amountIn, uint256 amountOut, uint256 timestamp);
event NAVUpdated(uint256 oldNAV, uint256 newNAV, uint256 timestamp);
event FeeCollected(FeeType feeType, uint256 amount, uint256 timestamp);
```

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Deposit tokens | Investor deposits USDC into fund vault | Tokens transferred, shares minted based on NAV, Deposit event emitted |
| First deposit (1:1 ratio) | First investor deposits when fund has no shares | Shares minted at 1:1 ratio, totalShares equals deposit amount |
| Subsequent deposit | Investor deposits after NAV has changed | Shares calculated as (amount × totalShares) / currentNAV, proportional share issuance |
| Request withdrawal | Investor requests withdrawal of shares | Shares burned, withdrawal request added to queue, WithdrawalRequested event emitted |
| Process withdrawal | Keeper processes withdrawal request from queue | Assets transferred to investor based on current NAV, daily limit checked, WithdrawalProcessed event emitted |
| Execute trade (authorized) | TradeExecutor executes validated trade | Assets swapped via router, holdings updated, TradeExecuted event emitted |
| Update NAV | NAV Engine updates fund's Net Asset Value | NAV updated, highWaterMark updated if new high, NAVUpdated event emitted |
| Collect management fee | Management fee collected on schedule | Fee calculated, shares minted to FM (dilution) or fee transferred, FeeCollected event emitted |
| Collect performance fee | Performance fee collected when NAV &gt; HWM | Fee calculated on profit, highWaterMark updated, FeeCollected event emitted |
| Deposit multiple assets | Investor deposits multiple assets in one transaction | All assets transferred, shares calculated based on total value, deposit succeeds |
| Emergency withdrawal | Investor performs emergency withdrawal when fund in LIQUIDATING state | Immediate withdrawal with 5% fee, no queue wait, emergency fee collected |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Deposit zero amount | Investor attempts to deposit 0 tokens | Transaction may succeed or revert depending on implementation (zero may be invalid) |
| Deposit to fund with zero NAV | Investor deposits when NAV is 0 | Transaction reverts or handles edge case (division by zero prevention) |
| Request withdrawal for zero shares | Investor attempts to withdraw 0 shares | Transaction reverts with "Zero shares" error |
| Process withdrawal when NAV is zero | Keeper processes withdrawal when NAV is 0 | Transaction reverts or handles edge case (cannot calculate value) |
| Execute trade with zero input | TradeExecutor executes trade with 0 input amount | Transaction reverts with "Zero amount" error |
| Update NAV to zero | NAV Engine updates NAV to 0 | NAV updated to 0, highWaterMark remains at previous value |
| Update NAV to maximum | NAV Engine updates NAV to max uint256 | NAV updated correctly, no overflow issues |
| Withdrawal queue empty | Attempt to process withdrawal from empty queue | Transaction reverts with "Invalid request" error |
| Daily withdrawal limit reached | Attempt to process withdrawal when daily limit exceeded | Transaction reverts with "Daily limit exceeded" error |
| Deposit after lockup period | Investor deposits after fund lockup period has passed | Deposit succeeds, lockup doesn't affect deposits |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Deposit without approval | Investor attempts to deposit without approving vault | Transaction reverts with "ERC20: insufficient allowance" error |
| Deposit exceeds balance | Investor attempts to deposit more tokens than they own | Transaction reverts with "ERC20: transfer amount exceeds balance" error |
| Deposit asset not allowed | Investor attempts to deposit asset not in allowed list | Transaction reverts with "Asset not allowed" error |
| Request withdrawal exceeds shares | Investor attempts to withdraw more shares than they own | Transaction reverts with "Insufficient shares" error |
| Request withdrawal before lockup | Investor attempts to withdraw before lockup period ends | Transaction reverts with "Lockup not expired" error |
| Process withdrawal from non-queue | Attempt to process withdrawal request that wasn't queued | Transaction reverts with "Invalid request" error |
| Process already processed withdrawal | Attempt to process withdrawal request that was already processed | Transaction reverts with "Already processed" error |
| Execute trade without RiskEngine approval | TradeExecutor attempts to execute trade without RiskEngine validation | Transaction reverts with "Not approved" error |
| Execute trade from non-TradeExecutor | Unauthorized address attempts to execute trade | Transaction reverts with "Only TradeExecutor" error |
| Execute trade exceeding slippage | Trade executed but output amount below minAmountOut | Transaction reverts with "Slippage exceeded" error |
| Update NAV from non-NAV Engine | Non-NAV Engine attempts to update NAV | Transaction reverts with "Only NAV Engine" error |
| Emergency withdrawal when not in emergency | Investor attempts emergency withdrawal when fund not in LIQUIDATING | Transaction reverts with "Not in emergency" error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized trade execution | Attacker attempts to execute trade directly | Transaction reverts, only TradeExecutor can execute trades |
| Prevent reentrancy on withdrawal | Malicious contract attempts reentrancy during withdrawal processing | Reentrancy guard prevents recursive calls, funds secure |
| Asset isolation between funds | Verify Fund A assets cannot be accessed by Fund B manager | Each fund's assets isolated, cross-fund access prevented |
| Share calculation accuracy | Verify share calculations cannot be manipulated | NAV-based calculations deterministic, cannot inflate shares |
| Prevent NAV manipulation | Attacker attempts to manipulate NAV to affect share prices | Only NAV Engine can update NAV, manipulation prevented |
| Prevent unauthorized asset movement | Attacker attempts to move assets without trade execution | All asset movements via TradeExecutor, unauthorized access prevented |
| Withdrawal queue integrity | Verify withdrawal queue cannot be manipulated | Queue append-only, requests processed in order, cannot skip or reorder |
| Daily withdrawal limit enforcement | Multiple withdrawals attempted to bypass daily limit | Daily limit enforced, cannot bypass via multiple transactions |
| Fee collection authorization | Verify only authorized contracts can collect fees | Fee collection restricted to specific roles, unauthorized collection prevented |
| Deposit fee accuracy | Verify deposit fees calculated correctly | Fees calculated as percentage of deposit, deducted correctly |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Deposit by any investor | Any investor deposits tokens | Transaction succeeds if asset allowed and approved |
| Request withdrawal by investor | Investor requests withdrawal | Transaction succeeds if owns shares and lockup expired |
| Process withdrawal by keeper | Keeper processes withdrawal from queue | Transaction succeeds if request valid and daily limit not exceeded |
| Execute trade by TradeExecutor | TradeExecutor executes validated trade | Transaction succeeds if RiskEngine approved |
| Execute trade by non-TradeExecutor | Non-TradeExecutor attempts to execute trade | Transaction reverts with "Only TradeExecutor" |
| Update NAV by NAV Engine | NAV Engine updates NAV | Transaction succeeds |
| Update NAV by non-NAV Engine | Non-NAV Engine attempts to update NAV | Transaction reverts with "Only NAV Engine" |
| Collect fees by FM | Fund Manager collects management/performance fees | Transaction succeeds if conditions met |
| Emergency withdrawal by investor | Investor performs emergency withdrawal | Transaction succeeds if fund in LIQUIDATING state |
| Query functions by any address | Any address queries shares, NAV, holdings | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| RiskEngine trade validation flow | TradeExecutor validates trade with RiskEngine, then executes | RiskEngine approval required, trade executes only if approved |
| NAV calculation and share pricing | NAV updated, new deposits use updated NAV for share calculation | Share prices reflect current NAV, proportional share issuance |
| Withdrawal queue processing | Multiple withdrawals requested, processed by keeper | Queue processed in order, daily limits respected, all withdrawals processed |
| Fee collection integration | Management and performance fees collected, distributed | Fees calculated correctly, distributed to FM and protocol treasury |
| Multi-asset fund management | Fund holds multiple assets, trades between them | Asset holdings tracked correctly, trades update holdings accurately |
| Trade execution via router | TradeExecutor routes trade through swap router | Swap executed correctly, output amount validated, holdings updated |
| Share dilution from fees | Management fee collected via share minting | Shares minted to FM, existing investors diluted proportionally |
| High water mark tracking | NAV increases above HWM, performance fee calculated | HWM updated, performance fee calculated on profit above HWM |
| Emergency procedures | Fund enters LIQUIDATING state, investors can emergency withdraw | LIQUIDATING state allows immediate withdrawals with fees |

### State Transition Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Fund state: ACTIVE → PAUSED | Fund paused, operations blocked | Deposit/withdrawal/trade operations blocked, only emergency withdrawals allowed (when in LIQUIDATING state) |
| Fund state: PAUSED → ACTIVE | Fund unpaused, operations resume | All operations resume normally |
| Fund state: ACTIVE → CLOSED | Fund closed, no new operations | New deposits/withdrawals blocked, existing withdrawals processed, fund winding down |
| Withdrawal state: QUEUED → PROCESSED | Withdrawal request queued, then processed | Request state transitions correctly, shares burned then assets transferred |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Deposit gas usage | Investor deposits tokens | Gas usage reasonable for deposit operation |
| Withdrawal request gas | Investor requests withdrawal | Gas usage reasonable for queue operation |
| Trade execution gas | TradeExecutor executes trade | Gas usage reasonable, includes router call gas |
| NAV update gas | NAV Engine updates NAV | Gas usage reasonable for state update |
| Query operations gas | Multiple queries for shares, NAV, holdings | View functions consume no gas (read-only) |
| Batch deposit gas | Investor deposits multiple assets in one transaction | Batch deposit uses less gas than individual deposits |

---

**Next**: [FundConfig](/protocol/contracts/fund/FundConfig)

