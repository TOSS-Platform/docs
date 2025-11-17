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

## State Variables

```solidity
// ===== Fund Identity =====
uint256 public fundId;
address public manager;
IFundRegistry public fundRegistry;
IRiskEngine public riskEngine;

// ===== Share Accounting =====
mapping(address => uint256) public shares;  // investor => shares
uint256 public totalShares;

// ===== Asset Holdings =====
mapping(address => uint256) public holdings;  // asset => amount
address[] public assets;  // List of held assets

// ===== NAV Tracking =====
uint256 public currentNAV;
uint256 public highWaterMark;
uint256 public lastNAVUpdate;

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
uint256 public dailyWithdrawalLimit;
uint256 public withdrawnToday;
uint256 public lastWithdrawalReset;
```

## Functions

### Initialization

#### `initialize`

```solidity
function initialize(
    uint256 _fundId,
    address _manager,
    FundConfig memory config
) external
```

**Purpose**: Initialize cloned fund contract

**Parameters**:
- `_fundId`: Unique fund identifier
- `_manager`: Fund Manager address
- `config`: Initial fund configuration

**Called By**: FundFactory during deployment

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
- Fund in EMERGENCY state
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

## Access Control

### Permission Matrix

| Function | Anyone | Investor | FM | TradeExecutor | NAVEngine | SlashingEngine |
|----------|--------|----------|-----|---------------|-----------|----------------|
| `deposit` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `requestWithdrawal` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `processWithdrawal` | ✅* | ✅ | ✅ | ❌ | ❌ | ❌ |
| `executeTrade` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `updateNAV` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `slashFM` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

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
event Deposit(address indexed investor, uint256 amount, address asset, uint256 shares, uint256 timestamp);
event WithdrawalRequested(address indexed investor, uint256 shares, uint256 requestId, uint256 timestamp);
event WithdrawalProcessed(uint256 indexed requestId, address investor, uint256 amount, uint256 timestamp);
event TradeExecuted(address assetIn, address assetOut, uint256 amountIn, uint256 amountOut, uint256 timestamp);
event NAVUpdated(uint256 oldNAV, uint256 newNAV, uint256 timestamp);
event FeeCollected(FeeType feeType, uint256 amount, uint256 timestamp);
```

## Test Scenarios

```typescript
describe("FundManagerVault - Critical Security", () => {
  it("should prevent unauthorized trade execution", async () => {
    await expect(
      vault.connect(attacker).executeTrade(...)
    ).to.be.revertedWith("Only TradeExecutor");
  });
  
  it("should prevent reentrancy on withdrawal", async () => {
    const malicious = await deployReentrantContract();
    await vault.connect(malicious).requestWithdrawal(shares);
    
    await expect(
      vault.processWithdrawal(requestId)
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");
  });
  
  it("should isolate assets between funds", async () => {
    // Fund A and Fund B both hold USDC
    const fund A_balance = await usdc.balanceOf(vaultA.address);
    const fundB_balance = await usdc.balanceOf(vaultB.address);
    
    // FM of Fund A cannot access Fund B assets
    await expect(
      vaultA.connect(fmA).executeTrade(/* use Fund B assets */)
    ).to.be.reverted;
  });
  
  it("should calculate shares correctly on deposits", async () => {
    // First deposit: 1:1
    await vault.deposit(1000, usdc.address);
    expect(await vault.shares(investor.address)).to.equal(1000);
    
    // NAV doubles
    await vault.updateNAV(2000);
    
    // Second deposit: half the shares
    await vault.deposit(1000, usdc.address);
    expect(await vault.shares(investor.address)).to.equal(1500);  // 1000 + 500
  });
});
```

---

**Next**: [FundConfig](/docs/protocol/contracts/fund/FundConfig)

