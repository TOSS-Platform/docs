# IntentDetection.sol

## Overview

Detects malicious intent in FM behavior using pattern recognition, anomaly detection, and behavioral analysis.

## Purpose

- Detect suspicious trading patterns
- Identify front-running attempts
- Flag wash trading
- Detect market manipulation
- Calculate Intent Probability (I component of FI)

## State Variables

```solidity
IFundRegistry public immutable fundRegistry;
IFundConfig public immutable fundConfig;

// ===== Withdrawal Tracking =====
struct WithdrawalRecord {
    uint256 timestamp;
    uint256 amount;
}

mapping(uint256 => WithdrawalRecord[]) public withdrawalHistory; // fundId => withdrawal records
mapping(uint256 => uint256) public withdrawalHistoryIndex; // fundId => current index (circular buffer)

// ===== Trade History =====
struct TradeRecord {
    address assetIn;
    address assetOut;
    uint256 amountIn;
    uint256 timestamp;
}

mapping(uint256 => TradeRecord[]) public tradeHistory; // fundId => trade records
mapping(uint256 => uint256) public tradeHistoryIndex; // fundId => current index (circular buffer)

// ===== Violation Tracking =====
mapping(uint256 => uint256) public violationCount; // fundId => violation count
mapping(uint256 => uint256) public lastViolationTime; // fundId => last violation timestamp

// ===== Access Control =====
address public governance;
mapping(address => bool) public authorizedVaults; // Vault addresses authorized to call recordWithdrawalRequest
```

## Constants

```solidity
uint256 private constant SECONDS_PER_DAY = 86400;
uint256 private constant MAX_INTENT_PROBABILITY = 100;
uint256 private constant WITHDRAWAL_HISTORY_SIZE = 100; // Circular buffer size
uint256 private constant TRADE_HISTORY_SIZE = 100; // Circular buffer size
uint256 private constant FRONT_RUNNING_WINDOW = 3600; // 1 hour window for front-running detection
uint256 private constant WASH_TRADING_WINDOW = 3600; // 1 hour window for wash trading detection
```

## Functions

### Constructor

```solidity
constructor(
    address _fundRegistry,
    address _fundConfig,
    address _governance
)
```

**Purpose**: Initialize IntentDetection contract

**Parameters**:
- `_fundRegistry`: FundRegistry contract address
- `_fundConfig`: FundConfig contract address
- `_governance`: Governance address

**Validation**: All parameters must be non-zero addresses

### `analyzeIntent`

```solidity
function analyzeIntent(
    uint256 fundId,
    IFundTradeExecutor.TradeParams calldata params
) external view returns (uint256 intentProbability)
```

**Purpose**: Calculate probability of malicious intent

**Parameters**:
- `fundId`: Fund ID
- `params`: Trade parameters (assetIn, assetOut, amountIn, minAmountOut, deadline, routeData)

**Returns**: Intent probability (0-100), where 0 = no malicious intent, 100 = maximum malicious intent

**Signals Analyzed**:
1. **Trade timing** (front-running investor) - 40% weight
2. **Asset manipulation** (low liquidity) - 30% weight
3. **Repeated violations** - 20% weight
4. **Unusual patterns** (wash trading, market manipulation) - 10% weight

**Calculation**:
```
intentProbability = (
    (frontRunningScore * 40) +
    (assetManipulationScore * 30) +
    (repeatedViolationsScore * 20) +
    (unusualPatternsScore * 10)
) / 100
```

**Front-Running Detection**:
- Checks for withdrawals within 1 hour before trade
- Large withdrawals (&gt;5% of NAV) + immediate trade = high suspicion (80)
- Medium withdrawals (&gt;2% of NAV) + trade = medium suspicion (50)
- Multiple withdrawals pattern = increased suspicion (40)

**Asset Manipulation Detection**:
- Checks if assets are allowed
- Unallowed assets = maximum suspicion (100)
- Large trade sizes relative to NAV = increased suspicion

**Repeated Violations Detection**:
- Recent violations (within 7 days) are more significant
- 5+ violations = 80, 3+ violations = 50, 1-2 violations = 30
- Older violations have reduced impact

**Unusual Patterns Detection**:
- Wash trading: buy and sell same asset within 1 hour = 70
- Rapid same-asset trading = +20 per occurrence
- High trade frequency (>10 trades/hour) = +30

### `recordWithdrawalRequest`

```solidity
function recordWithdrawalRequest(
    uint256 fundId,
    uint256 amount
) external onlyAuthorizedVault
```

**Purpose**: Record withdrawal request for pattern analysis

**Parameters**:
- `fundId`: Fund ID
- `amount`: Withdrawal amount

**Access Control**: Only authorized vaults (set by governance)

**Behavior**:
- Stores withdrawal in circular buffer (max 100 records per fund)
- Used for front-running detection
- Emits `WithdrawalRecorded` event

**Note**: Called automatically by FundManagerVault when withdrawal is requested

### `getRecentWithdrawals`

```solidity
function getRecentWithdrawals(
    uint256 fundId,
    uint256 timeWindow
) external view returns (uint256 count, uint256 totalAmount)
```

**Purpose**: Get recent withdrawal requests for a fund

**Parameters**:
- `fundId`: Fund ID
- `timeWindow`: Time window in seconds (e.g., 86400 for 24 hours)

**Returns**:
- `count`: Number of withdrawal requests in time window
- `totalAmount`: Total withdrawal amount in time window

### `recordViolation`

```solidity
function recordViolation(uint256 fundId) external
```

**Purpose**: Record a violation for a fund

**Parameters**:
- `fundId`: Fund ID

**Behavior**:
- Increments violation count for fund
- Updates last violation timestamp
- Emits `ViolationRecorded` event

**Note**: Called by RiskEngine when a violation is detected

### `recordTrade`

```solidity
function recordTrade(
    uint256 fundId,
    IFundTradeExecutor.TradeParams calldata params
) external
```

**Purpose**: Record a trade for pattern analysis

**Parameters**:
- `fundId`: Fund ID
- `params`: Trade parameters

**Behavior**:
- Stores trade in circular buffer (max 100 records per fund)
- Used for wash trading and unusual pattern detection

**Note**: Called by RiskEngine or FundTradeExecutor after trade execution

### `setAuthorizedVault`

```solidity
function setAuthorizedVault(address vault, bool enabled) external onlyGovernance
```

**Purpose**: Set authorized vault address

**Parameters**:
- `vault`: Vault address
- `enabled`: `true` to authorize, `false` to revoke

**Access Control**: Only governance

### `setGovernance`

```solidity
function setGovernance(address newGovernance) external onlyGovernance
```

**Purpose**: Update governance address

**Parameters**:
- `newGovernance`: New governance address

**Access Control**: Only governance

**Validation**: New governance address must be non-zero

## Events

```solidity
event WithdrawalRecorded(
    uint256 indexed fundId,
    uint256 amount,
    uint256 timestamp
);

event IntentAnalyzed(
    uint256 indexed fundId,
    uint256 intentProbability,
    uint256 timestamp
);
```

**Note**: `IntentAnalyzed` event is defined but not currently emitted in `analyzeIntent()` (view function). It can be emitted by callers if needed for logging purposes.

event ViolationRecorded(
    uint256 indexed fundId,
    uint256 violationCount,
    uint256 timestamp
);
```

## Custom Errors

```solidity
error InvalidFundRegistry();
error InvalidFundConfig();
error InvalidGovernance();
error FundNotFound();
error NotAuthorizedVault();
error NotGovernance();
```

## Access Control

### Roles

| Role | Addresses | Permissions |
|------|-----------|-------------|
| **Governance** | DAO | Set authorized vaults, update governance address |
| **Authorized Vault** | FundManagerVault | Record withdrawal requests |

### Modifiers

```solidity
modifier onlyAuthorizedVault() {
    if (!authorizedVaults[msg.sender]) revert NotAuthorizedVault();
    _;
}

modifier onlyGovernance() {
    if (msg.sender != governance) revert NotGovernance();
    _;
}
```

### Permission Matrix

| Function | Anyone | Authorized Vault | Governance |
|----------|--------|-----------------|------------|
| `analyzeIntent` | ✅ | ✅ | ✅ |
| `getRecentWithdrawals` | ✅ | ✅ | ✅ |
| `recordWithdrawalRequest` | ❌ | ✅ | ❌ |
| `recordViolation` | ✅* | ✅* | ✅* |
| `recordTrade` | ✅* | ✅* | ✅* |
| `setAuthorizedVault` | ❌ | ❌ | ✅ |
| `setGovernance` | ❌ | ❌ | ✅ |

\* `recordViolation` and `recordTrade` are public but should only be called by RiskEngine or FundTradeExecutor

## Integration

### RiskEngine Integration

IntentDetection is integrated into RiskEngine's Fault Index (FI) calculation:

1. **In `validateTrade()`**:
   ```solidity
   uint256 intentProb = intentDetection.analyzeIntent(fundId, params);
   intentDetection.recordTrade(fundId, params);
   ```

2. **In `_calculateCombinedFI()`**:
   ```solidity
   function _calculateCombinedFI(
       uint256 protocolFI,
       uint256 fundFI,
       uint256 investorFI,
       uint256 intentProb
   ) internal pure returns (uint256 combinedFI) {
       // Intent probability weighted at 10%
       uint256 weightedFI = ((fundFI * 60) +
           (investorFI * 25) +
           (protocolFI * 15) +
           (intentProb * 10)) / 100;
       
       // Return worse of max or weighted (conservative)
       uint256 maxFI = max(protocolFI, fundFI, investorFI, intentProb);
       return maxFI > weightedFI ? maxFI : weightedFI;
   }
   ```

3. **When violation detected**:
   ```solidity
   intentDetection.recordViolation(fundId);
   ```

### FundManagerVault Integration

FundManagerVault automatically records withdrawal requests:

```solidity
function requestWithdrawal(uint256 amount) external {
    // ... withdrawal logic ...
    
    // Record withdrawal for intent detection
    try intentDetection.recordWithdrawalRequest(fundId, amount) {} catch {}
}
```

## Security Considerations

### Attack Vectors

#### 1. Intent Probability Manipulation

**Risk**: FM manipulates intent probability calculation

**Mitigation**:
- ✅ Intent calculation based on on-chain data (block timestamps, withdrawal history)
- ✅ Deterministic calculation, cannot be manipulated
- ✅ Circular buffers prevent history manipulation
- ✅ Access control prevents unauthorized data recording

**Severity**: Low → Mitigated

#### 2. Front-Running Detection Bypass

**Risk**: FM bypasses front-running detection

**Mitigation**:
- ✅ Withdrawal requests recorded automatically by vault
- ✅ Trade timing analyzed relative to withdrawals
- ✅ Large withdrawal thresholds (&gt;5% NAV) for high suspicion
- ✅ Multiple withdrawal patterns detected

**Severity**: Medium → Mitigated

#### 3. Wash Trading Detection Bypass

**Risk**: FM performs wash trading without detection

**Mitigation**:
- ✅ Trade history tracked in circular buffer
- ✅ Same asset buy/sell within 1 hour = wash trading (70 score)
- ✅ High trade frequency detection (&gt;10 trades/hour)
- ✅ Pattern recognition across multiple trades

**Severity**: Medium → Mitigated

#### 4. Unauthorized Data Recording

**Risk**: Unauthorized addresses record withdrawals or violations

**Mitigation**:
- ✅ `recordWithdrawalRequest` restricted to authorized vaults
- ✅ Only RiskEngine should call `recordViolation` (public but expected usage)
- ✅ Governance controls authorized vault list

**Severity**: Low → Mitigated

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Detect front-running | Investor requests large withdrawal, FM trades disadvantageously immediately after | Intent probability calculated as high (&gt; 70), front-running detected |
| Analyze trade intent | IntentDetection analyzes trade for malicious intent | Intent probability calculated based on timing, trade direction, and withdrawal patterns |
| Detect disadvantageous trading | FM executes trade that harms investors (e.g., selling before withdrawal) | High intent probability, malicious intent detected |
| Detect timing patterns | FM consistently trades before large withdrawals | Pattern detected, intent probability increases |
| Query intent probability | Query intent probability for specific trade | Returns intent score (0-100), higher score indicates higher malicious intent |
| Pattern recognition | IntentDetection recognizes suspicious trading patterns | Patterns identified, intent probability adjusted accordingly |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Intent probability at threshold | Trade analyzed with intent probability exactly at detection threshold | Intent probability returned, threshold comparison works correctly |
| Intent probability zero | Trade analyzed with no suspicious indicators | Intent probability equals 0, no malicious intent detected |
| Intent probability maximum | Trade analyzed with all suspicious indicators | Intent probability equals 100, maximum malicious intent |
| Analyze trade with no withdrawals | Analyze trade when no recent withdrawals | Intent probability calculated normally, no withdrawal-based boost |
| Analyze trade immediately after withdrawal | Analyze trade within seconds of withdrawal | Intent probability increases due to timing, front-running detected |
| Multiple withdrawals pattern | Analyze trade after multiple large withdrawals | Intent probability increases with pattern, malicious intent more likely |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Analyze intent for non-existent fund | Attempt to analyze intent for fund that doesn't exist | Transaction reverts with "Fund not found" error |
| Analyze intent with invalid parameters | Attempt to analyze intent with invalid trade parameters | Transaction reverts with validation error |
| Analyze intent during pause | Attempt to analyze intent when protocol paused | Transaction reverts with "Protocol paused" error or handled gracefully |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent intent manipulation | Attempt to manipulate intent probability calculation | Intent calculation deterministic, based on on-chain data, cannot manipulate |
| Pattern detection accuracy | Verify suspicious patterns detected correctly | Pattern recognition accurate, intent probability reflects actual behavior |
| Timing analysis integrity | Verify timing analysis cannot be manipulated | Timing calculated from block timestamps, cannot manipulate |
| Front-running detection | Verify front-running patterns detected correctly | Front-running detected when FM trades disadvantageously before withdrawal |
| Intent score integrity | Verify intent scores cannot be forged | Intent scores calculated from on-chain data, cannot forge |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Analyze intent by any address | Any address analyzes trade intent | Transaction succeeds, intent analysis is public |
| Query functions by any address | Any address queries intent probabilities, patterns | Queries succeed, read-only functions are public |
| Record withdrawal by authorized vault | Authorized vault records withdrawal request | Transaction succeeds, withdrawal recorded |
| Record withdrawal by unauthorized address | Unauthorized address attempts to record withdrawal | Transaction reverts with "NotAuthorizedVault" error |
| Set authorized vault by governance | Governance sets authorized vault address | Transaction succeeds, vault authorized |
| Set authorized vault by non-governance | Non-governance address attempts to set authorized vault | Transaction reverts with "NotGovernance" error |
| Set governance by governance | Governance updates governance address | Transaction succeeds, governance updated |
| Set governance by non-governance | Non-governance address attempts to set governance | Transaction reverts with "NotGovernance" error |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| RiskEngine intent integration | RiskEngine queries IntentDetection for intent component | Intent probability used in FI calculation, integrated correctly |
| Withdrawal pattern tracking | IntentDetection tracks withdrawal requests and timing | Withdrawal patterns tracked correctly, intent analysis accurate |
| Trade timing analysis | IntentDetection analyzes trade timing relative to withdrawals | Timing analysis accurate, front-running detected correctly |
| Pattern recognition integration | IntentDetection recognizes multi-transaction patterns | Patterns recognized correctly, intent probability reflects patterns |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Intent analysis gas | Analyze trade intent with pattern checks | Gas usage reasonable for intent analysis |
| Pattern recognition gas | Recognize trading patterns | Gas usage reasonable for pattern recognition |
| Query operations gas | Multiple queries for intent probabilities | View functions consume no gas (read-only) |

---

**Next**: [RiskMathLib](/protocol/contracts/risk/RiskMathLib)

