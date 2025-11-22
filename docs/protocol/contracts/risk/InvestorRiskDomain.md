# InvestorRiskDomain.sol

## Overview

Monitors investor behavior patterns to detect manipulation, panic selling, and systemic risk from coordinated investor actions.

## Purpose

- Track withdrawal patterns (WBR)
- Monitor deposit velocity (DVR)
- Detect coordinated attacks
- Prevent bank run scenarios
- Flag suspicious investor behavior

## State Variables

```solidity
IInvestorRegistry public investorRegistry;
IInvestorStateMachine public stateMachine;
IFundRegistry public fundRegistry;

// Investor behavior tracking
struct InvestorBehavior {
    uint256 totalDeposits;           // Lifetime deposits
    uint256 totalWithdrawals;        // Lifetime withdrawals
    uint256 lastDepositTime;         // Timestamp of last deposit
    uint256 lastWithdrawalTime;      // Timestamp of last withdrawal
    uint256 panicWithdrawals;        // Withdrawals during fund loss
    uint256 rapidCycles;             // Deposit-withdraw cycles < 24h
    uint256 depositCount;            // Total deposit count
    uint256 withdrawalCount;         // Total withdrawal count
    uint256 recentDepositCount;      // Deposits in last 30 days
    uint256 recentWithdrawalCount;   // Withdrawals in last 30 days
}

mapping(address => mapping(uint256 => InvestorBehavior)) public behavior;  // investor => fundId => behavior

// Fund NAV tracking for panic detection
mapping(uint256 => uint256) public lastNAV;         // fundId => NAV
mapping(uint256 => uint256) public lastNAVUpdate;  // fundId => timestamp
mapping(uint256 => uint256) public highWaterMark;  // fundId => HWM

// Coordinated withdrawal tracking
struct WithdrawalWindow {
    uint256 startTime;
    uint256 withdrawalCount;
    uint256 totalAmount;
}

mapping(uint256 => WithdrawalWindow) public withdrawalWindows;  // fundId => window

// Access Control
address public governance;
mapping(address => bool) public authorizedVaults;  // Vault addresses authorized to call recordInvestorAction
```

## Functions

### Constructor

```solidity
constructor(
    address _investorRegistry,
    address _stateMachine,
    address _fundRegistry,
    address _governance
)
```

**Purpose**: Initialize InvestorRiskDomain contract

**Parameters**:
- `_investorRegistry`: InvestorRegistry contract address
- `_stateMachine`: InvestorStateMachine contract address
- `_fundRegistry`: FundRegistry contract address
- `_governance`: Governance address

**Validation**: All parameters must be non-zero addresses

### `validate`

```solidity
function validate(
    uint256 fundId
) external view returns (bool passed, uint256 faultIndex)
```

**Purpose**: Check fund's investor behavior health

**Returns**:
- `passed`: Whether investor patterns are normal
- `faultIndex`: Risk score from investor behavior (0-100)

**Checks**:
1. **NAV Drop Detection**: Checks for NAV drops from high water mark
2. **Coordinated Withdrawals**: Detects multiple withdrawals within 1 hour after NAV drop

**Note**: Individual investor WBR/DVR checks happen during `recordInvestorAction` to avoid gas-intensive iteration.

### `recordInvestorAction`

```solidity
function recordInvestorAction(
    address investor,
    uint256 fundId,
    uint8 action,
    uint256 amount
) external onlyAuthorizedVault
```

**Purpose**: Record investor action for pattern analysis

**Parameters**:
- `investor`: Investor address
- `fundId`: Fund ID
- `action`: Action type (0 = DEPOSIT, 1 = WITHDRAWAL)
- `amount`: Action amount

**Access Control**: Only authorized vaults can call this function

**Behavior**:
- Updates NAV tracking when action is recorded
- For DEPOSIT: Tracks deposit patterns, detects rapid cycles
- For WITHDRAWAL: Detects panic selling, updates withdrawal windows
- Emits `InvestorActionRecorded` event
- Emits `PanicSellingDetected` event if panic selling detected

### `setAuthorizedVault`

```solidity
function setAuthorizedVault(address vault, bool authorized) external onlyGovernance
```

**Purpose**: Authorize or revoke vault access to call `recordInvestorAction`

**Parameters**:
- `vault`: Vault contract address
- `authorized`: Whether vault is authorized

**Access Control**: Only governance can call this function

### `getInvestorBehavior`

```solidity
function getInvestorBehavior(
    address investor,
    uint256 fundId
) external view returns (InvestorBehavior memory)
```

**Purpose**: Get investor behavior data for a specific fund

**Parameters**:
- `investor`: Investor address
- `fundId`: Fund ID

**Returns**: `InvestorBehavior` struct with all behavior metrics

### `getWBR`

```solidity
function getWBR(address investor, uint256 fundId) external view returns (uint256 wbr)
```

**Purpose**: Get WBR (Withdrawal Behavior Ratio) for an investor

**Parameters**:
- `investor`: Investor address
- `fundId`: Fund ID

**Returns**: WBR value (0-100, representing 0.0-1.0)

### `getDVR`

```solidity
function getDVR(address investor, uint256 fundId) external view returns (uint256 dvr)
```

**Purpose**: Get DVR (Deposit Velocity Ratio) for an investor

**Parameters**:
- `investor`: Investor address
- `fundId`: Fund ID

**Returns**: DVR value (0-100, representing 0.0-1.0)

## Events

```solidity
event InvestorActionRecorded(
    address indexed investor,
    uint256 indexed fundId,
    uint8 action,
    uint256 amount,
    uint256 timestamp
);

event PanicSellingDetected(
    address indexed investor,
    uint256 indexed fundId,
    uint256 navDrop,
    uint256 timestamp
);

event CoordinatedWithdrawalDetected(
    uint256 indexed fundId,
    uint256 withdrawalCount,
    uint256 timestamp
);

event InvestorBehaviorValidated(
    uint256 indexed fundId,
    bool passed,
    uint256 faultIndex,
    uint256 timestamp
);

event AuthorizedVaultUpdated(address indexed vault, bool authorized);
event NAVTracked(uint256 indexed fundId, uint256 nav, uint256 timestamp);
```

## Custom Errors

```solidity
error NotGovernance();
error NotAuthorizedVault();
error InvalidInvestorRegistry();
error InvalidStateMachine();
error InvalidFundRegistry();
error InvalidGovernance();
error FundNotFound();
error InvalidAction();
```

## Constants and Thresholds

### WBR (Withdrawal Behavior Ratio) Thresholds
- **Normal**: WBR ≤ 0.5 (50 basis points)
- **Warning**: WBR > 0.5 (faultIndex += 20)
- **High Risk**: WBR > 0.8 (faultIndex += 50)

### DVR (Deposit Velocity Ratio) Thresholds
- **Normal**: DVR ≤ 0.7 (70 basis points)
- **Warning**: DVR > 0.7 (faultIndex += 15)
- **High Risk**: DVR > 0.9 (faultIndex += 40)

### Panic Selling Detection
- **NAV Drop Threshold**: 5% (500 basis points)
- **Panic Window**: 24 hours after NAV drop
- **LRI Normal**: ≤ 60%
- **LRI Warning**: > 60% (faultIndex += 25)
- **LRI High Risk**: > 80% (faultIndex += 60)

### Coordinated Withdrawal Detection
- **Window Duration**: 1 hour
- **Warning**: 2-5 withdrawals (faultIndex += 30)
- **High Risk**: 6-10 withdrawals (faultIndex += 70)
- **Critical**: >10 withdrawals (faultIndex = 100)

## Implementation Details

### NAV Tracking
- NAV is tracked automatically when `recordInvestorAction` is called
- `highWaterMark` tracks the highest NAV reached for each fund
- Panic detection uses `highWaterMark` to detect drops from peak NAV

### Panic Selling Detection Logic
1. NAV drop is calculated from `highWaterMark` to current NAV
2. If drop ≥ 5% and withdrawal occurs within 24 hours of NAV update, panic is detected
3. Panic withdrawals are tracked per investor per fund

### Coordinated Withdrawal Detection Logic
1. Withdrawal windows track withdrawals within 1-hour periods
2. If NAV drops ≥ 5% and multiple withdrawals occur within the window, coordinated pattern is detected
3. Fault index increases based on withdrawal count

### WBR Calculation
```
WBR = (Total Withdrawals / Total Deposits) × (Withdrawal Frequency / Deposit Frequency)
```

### DVR Calculation
```
DVR = Rapid Deposit Count / Total Deposit Count
Rapid deposit: Deposit within 1 hour of withdrawal
```

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Validate investor behavior | InvestorRiskDomain validates investor behavior for fund | Investor behavior assessed, healthy status returned, faultIndex calculated |
| Detect panic selling | Fund NAV drops significantly, investor immediately withdraws | Panic selling detected, high faultIndex, PanicSelling event emitted |
| Detect coordinated withdrawals | Multiple investors withdraw simultaneously after NAV drop | Coordinated withdrawal pattern detected, high faultIndex, suspicious behavior flagged |
| Analyze withdrawal patterns | InvestorRiskDomain analyzes withdrawal timing and patterns | Patterns recognized, intent probability calculated, behavior assessed |
| Query investor risk status | Query current investor risk status for fund | Returns healthy status and faultIndex, investor behavior assessed |
| Normal withdrawal behavior | Investor withdraws during normal fund conditions | No panic detected, low faultIndex, normal behavior recognized |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| NAV drop at threshold | Fund NAV drops exactly at panic threshold | Panic may be detected or not depending on implementation |
| Withdrawal timing at boundary | Investor withdraws immediately after NAV drop (within seconds) | High panic probability, front-running detected |
| Withdrawal timing after delay | Investor withdraws days after NAV drop | Low panic probability, normal withdrawal behavior |
| Single investor withdrawal | Single investor withdraws after NAV drop | Panic probability calculated, may trigger detection |
| Multiple investor withdrawals | Multiple investors withdraw after NAV drop | Coordinated pattern detected, higher faultIndex |
| Withdrawal amount at boundary | Investor withdraws exactly at detection threshold | Panic detection may trigger or not depending on amount |
| NAV drop with no withdrawals | Fund NAV drops but no investors withdraw | No panic detected, low faultIndex, normal behavior |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Validate for non-existent fund | Attempt to validate investor behavior for fund that doesn't exist | Transaction reverts with "Fund not found" error |
| Validate with invalid parameters | Attempt to validate with invalid parameters | Transaction reverts with validation error |
| Validate during protocol pause | Attempt to validate when protocol paused | Returns unhealthy status or reverts depending on implementation |
| Unauthorized vault calls recordInvestorAction | Unauthorized vault attempts to record investor action | Transaction reverts with "NotAuthorizedVault" error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent pattern manipulation | Attempt to manipulate withdrawal patterns to avoid detection | Patterns analyzed from on-chain data, cannot manipulate |
| Timing analysis integrity | Verify timing analysis cannot be manipulated | Timing calculated from block timestamps, cannot manipulate |
| Panic detection accuracy | Verify panic selling detected correctly | Panic detection accurate, patterns recognized correctly |
| Withdrawal amount integrity | Verify withdrawal amounts cannot be manipulated | Amounts read from vault, cannot manipulate |
| FaultIndex calculation accuracy | Verify faultIndex reflects actual investor risk | FaultIndex calculated correctly, reflects investor behavior issues |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Validate by any address | Any address validates investor behavior | Transaction succeeds, validation is public |
| Query functions by any address | Any address queries investor risk status, patterns | Queries succeed, read-only functions are public |
| setAuthorizedVault by governance | Governance sets authorized vault | Transaction succeeds, vault authorized |
| setAuthorizedVault by non-governance | Non-governance attempts to set authorized vault | Transaction reverts with "NotGovernance" error |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| RiskEngine integration | RiskEngine queries InvestorRiskDomain for investor risk | Investor risk assessed correctly, faultIndex returned |
| FundManagerVault integration | FundManagerVault calls recordInvestorAction during deposit/withdrawal | Investor actions tracked correctly, analysis accurate |
| InvestorRegistry integration | InvestorRiskDomain reads investor data from InvestorRegistry | Investor data retrieved correctly, integration works |
| InvestorStateMachine integration | InvestorRiskDomain checks investor state from InvestorStateMachine | State checks work correctly, integration works |
| NAV tracking integration | InvestorRiskDomain tracks NAV changes and withdrawal timing | NAV drops and withdrawals correlated, panic detection accurate |
| Pattern recognition integration | InvestorRiskDomain recognizes withdrawal patterns over time | Patterns recognized correctly, faultIndex reflects patterns |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Investor validation gas | InvestorRiskDomain validates investor behavior | Gas usage reasonable for validation operation |
| Pattern analysis gas | Analyze withdrawal patterns and timing | Gas usage reasonable for pattern analysis |
| Query operations gas | Multiple queries for investor risk status, patterns | View functions consume no gas (read-only) |

---

**Next**: [SlashingEngine](/protocol/contracts/risk/SlashingEngine)
