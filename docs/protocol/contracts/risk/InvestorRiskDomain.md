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

struct InvestorBehavior {
    uint256 totalDeposits;
    uint256 totalWithdrawals;
    uint256 lastDepositTime;
    uint256 lastWithdrawalTime;
    uint256 panicWithdrawals;  // Withdrawals during fund loss
    uint256 rapidCycles;       // Deposit-withdraw cycles < 24h
}

mapping(address => mapping(uint256 => InvestorBehavior)) public behavior;  // investor => fundId => behavior
```

## Functions

### `validate`

```solidity
function validate(
    uint256 fundId
) external view returns (bool passed, uint256 faultIndex)
```

**Purpose**: Check fund's investor behavior health

**Returns**:
- `passed`: Whether investor patterns normal
- `faultIndex`: Risk score from investor behavior

**Checks**:
1. **WBR** (Withdrawal Behavior Ratio)
2. **DVR** (Deposit Velocity Ratio)
3. **Panic Selling** Detection
4. **Coordinated Withdrawals**

### `recordInvestorAction`

```solidity
function recordInvestorAction(
    address investor,
    uint256 fundId,
    ActionType action,
    uint256 amount
) external onlyVault
```

**Purpose**: Record investor action for pattern analysis

**Parameters**:
- `investor`: Investor address
- `fundId`: Fund ID
- `action`: DEPOSIT or WITHDRAWAL
- `amount`: Action amount

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

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| RiskEngine integration | RiskEngine queries InvestorRiskDomain for investor risk | Investor risk assessed correctly, faultIndex returned |
| FundManagerVault integration | InvestorRiskDomain reads withdrawal requests from vault | Withdrawal patterns tracked correctly, analysis accurate |
| IntentDetection integration | InvestorRiskDomain uses IntentDetection for pattern analysis | Intent probability used in assessment, integration works correctly |
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

