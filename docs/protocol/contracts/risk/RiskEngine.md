# RiskEngine.sol

## Overview

The central risk validation system that validates every fund operation, calculates Fault Index (FI), and triggers slashing when violations occur. This is the core security mechanism of TOSS.

## Purpose

- Validate all FM trading actions before execution
- Coordinate checks across risk domains
- Calculate FaultIndex for violations
- Trigger slashing when necessary
- Prevent bypassing of risk limits
- Maintain audit trail of all risk decisions

## Core Responsibilities

- ✅ Pre-validate every trade request
- ✅ Query all three risk domains
- ✅ Calculate combined FaultIndex
- ✅ Approve or reject trades
- ✅ Trigger SlashingEngine if FI exceeds threshold
- ✅ Maintain violation history

## State Variables

```solidity
// ===== Risk Domains =====
IProtocolRiskDomain public protocolDomain;
IFundRiskDomain public fundDomain;
IInvestorRiskDomain public investorDomain;
ISlashingEngine public slashingEngine;

// ===== Validation State =====
mapping(bytes32 => bool) public approvedTrades;  // tradeHash => approved
mapping(bytes32 => uint256) public tradeFaultIndex;  // tradeHash => FI

// ===== Violation Tracking =====
struct Violation {
    uint256 fundId;
    uint256 faultIndex;
    uint256 timestamp;
    ViolationType vType;
    bool slashingTriggered;
}
mapping(uint256 => Violation[]) public fundViolations;  // fundId => violations

// ===== Thresholds =====
uint256 public warningThreshold = 10;   // FI 0.10
uint256 public slashingThreshold = 30;  // FI 0.30

// ===== Statistics =====
uint256 public totalValidations;
uint256 public totalRejections;
uint256 public totalSlashings;
```

## Functions

### `validateTrade`

```solidity
function validateTrade(
    uint256 fundId,
    TradeParams calldata params
) external returns (
    bool approved,
    uint256 faultIndex,
    bytes memory approvalSignature
)
```

**Purpose**: Validate trade request from FM

**Parameters**:
- `fundId`: Fund requesting trade
- `params`: Trade parameters (asset, amount, direction, etc.)

**Returns**:
- `approved`: Whether trade is approved
- `faultIndex`: FI score (0-100, 0 = no violation)
- `approvalSignature`: Signature for TradeExecutor

**Access Control**: Anyone can call (result depends on validation)

**Behavior**:
1. **Check Protocol Domain**:
   ```solidity
   (bool protocolOk, uint256 protocolFI) = protocolDomain.validate();
   if (!protocolOk) return (false, protocolFI, bytes(""));
   ```

2. **Check Fund Domain**:
   ```solidity
   (bool fundOk, uint256 fundFI) = fundDomain.validate(fundId, params);
   ```

3. **Check Investor Domain**:
   ```solidity
   (bool investorOk, uint256 investorFI) = investorDomain.validate(fundId);
   ```

4. **Calculate Combined FI**:
   ```solidity
   uint256 combinedFI = _calculateCombinedFI(protocolFI, fundFI, investorFI);
   ```

5. **Decision Logic**:
   ```solidity
   if (combinedFI < warningThreshold) {
       // Approve
       return (true, combinedFI, _signApproval(fundId, params));
   }
   else if (combinedFI < slashingThreshold) {
       // Warn but approve
       emit RiskWarning(fundId, combinedFI);
       return (true, combinedFI, _signApproval(fundId, params));
   }
   else {
       // Reject and trigger slashing
       _triggerSlashing(fundId, combinedFI);
       return (false, combinedFI, bytes(""));
   }
   ```

**Events**: `TradeValidated(fundId, approved, faultIndex, timestamp)`

### `calculateFaultIndex`

```solidity
function calculateFaultIndex(
    uint256 limitBreach,     // L: 0-100
    uint256 behaviorAnomaly, // B: 0-100
    uint256 damageRatio,     // D: 0-100
    uint256 intentProb       // I: 0-100
) public pure returns (uint256 faultIndex)
```

**Purpose**: Calculate FI from components

**Formula**:
```
FI = 0.45×L + 0.25×B + 0.20×D + 0.10×I

Where all components scaled 0-100
Result: 0-100 (converted to basis points 0-10000 internally)
```

**Returns**: FaultIndex (0-100)

### `checkFundHealth`

```solidity
function checkFundHealth(
    uint256 fundId
) external view returns (
    bool healthy,
    uint256 currentFI,
    string memory issues
)
```

**Purpose**: Check fund's current risk status

**Returns**:
- `healthy`: Whether fund is within limits
- `currentFI`: Current fault index if violation
- `issues`: Human-readable description

**Use Case**: Off-chain monitoring, FM dashboard

### `triggerManualReview`

```solidity
function triggerManualReview(
    uint256 fundId,
    string calldata reason
) external onlyGuardian
```

**Purpose**: Guardian forces manual review of fund

**Parameters**:
- `fundId`: Fund to review
- `reason`: Reason for manual review

**Access Control**: Only Guardian Committee

**Effect**:
- Pauses fund trading
- Requires DAO vote to resume
- Used for suspicious activity

## FaultIndex Calculation Details

### Component Weights

```solidity
uint256 constant WEIGHT_LIMIT_BREACH = 45;    // 45%
uint256 constant WEIGHT_BEHAVIOR = 25;        // 25%
uint256 constant WEIGHT_DAMAGE = 20;          // 20%
uint256 constant WEIGHT_INTENT = 10;          // 10%
```

### Calculation Logic

```solidity
function _calculateCombinedFI(
    uint256 protocolFI,
    uint256 fundFI,
    uint256 investorFI
) internal pure returns (uint256) {
    // Each domain returns FI score
    // Take maximum (worst case)
    uint256 maxFI = protocolFI;
    if (fundFI > maxFI) maxFI = fundFI;
    if (investorFI > maxFI) maxFI = investorFI;
    
    // Apply domain-specific weights
    uint256 weightedFI = (
        (fundFI * 60) +        // Fund violations weight 60%
        (investorFI * 25) +    // Investor violations 25%
        (protocolFI * 15)      // Protocol issues 15%
    ) / 100;
    
    // Return worse of max or weighted (conservative)
    return maxFI > weightedFI ? maxFI : weightedFI;
}
```

### FI Ranges & Actions

| FI Range | Severity | Action |
|----------|----------|--------|
| 0-10 | Safe | Approve, no warning |
| 10-30 | Warning | Approve with warning, monitor |
| 30-60 | Moderate | Reject + Slash 1-10% |
| 60-85 | Major | Reject + Slash 10-50% |
| 85-100 | Critical | Reject + Slash 50-100% + Ban |

## DAO-Configurable Parameters

| Parameter | Initial Value | Governance Level | Range |
|-----------|---------------|------------------|-------|
| `warningThreshold` | 10 (FI 0.10) | Protocol | 5-20 |
| `slashingThreshold` | 30 (FI 0.30) | Protocol | 20-50 |
| `protocolDomain` | [address] | Protocol | Contract address |
| `fundDomain` | [address] | Protocol | Contract address |
| `investorDomain` | [address] | Protocol | Contract address |

## Deployment

### Deploy Order

```
1. Deploy domain contracts (Protocol, Fund, Investor)
2. Deploy SlashingEngine
3. Deploy RiskEngine
4. Configure domain addresses
5. Set slashing thresholds
```

### Constructor Arguments

```typescript
const args = {
  protocolDomain: protocolDomain.address,
  fundDomain: fundDomain.address,
  investorDomain: investorDomain.address,
  slashingEngine: slashingEngine.address
};

const riskEngine = await ethers.deployContract("RiskEngine", Object.values(args));
```

## Access Control

| Function | Anyone | FM | Guardian | Governance |
|----------|--------|-----|----------|------------|
| `validateTrade` | ✅ | ✅ | ✅ | ✅ |
| `checkFundHealth` | ✅ (view) | ✅ | ✅ | ✅ |
| `triggerManualReview` | ❌ | ❌ | ✅ | ❌ |
| `setThreshold` | ❌ | ❌ | ❌ | ✅ |

## Security Considerations

### Attack Vectors

**1. Domain Manipulation**
- **Risk**: Compromised domain returns false approvals
- **Mitigation**: Domains immutable, audit all domains, multi-domain checks
- **Severity**: CRITICAL → Mitigated

**2. Replay Attack**
- **Risk**: Reuse old approval for different trade
- **Mitigation**: Approval includes trade hash + nonce + timestamp
- **Severity**: High → Mitigated

**3. FI Calculation Manipulation**
- **Risk**: Manipulate FI to avoid slashing
- **Mitigation**: FI calculation in pure function, deterministic, audited
- **Severity**: High → Mitigated

**4. DoS via Constant Validation Calls**
- **Risk**: Spam validation requests
- **Mitigation**: Gas costs, rate limiting at protocol level
- **Severity**: Low → Mitigated

### Audit Focus Areas

1. **FI Calculation**: Verify math correctness, no overflow
2. **Domain Coordination**: Ensure all domains checked
3. **Slashing Trigger**: Verify appropriate FI triggers slashing
4. **Approval Signatures**: Ensure not forgeable or replayable
5. **Gas Optimization**: Validation should be gas-efficient

## Events

```solidity
event TradeValidated(
    uint256 indexed fundId,
    bool approved,
    uint256 faultIndex,
    uint256 timestamp
);

event RiskWarning(
    uint256 indexed fundId,
    uint256 faultIndex,
    string warning,
    uint256 timestamp
);

event SlashingTriggered(
    uint256 indexed fundId,
    address indexed manager,
    uint256 faultIndex,
    uint256 slashAmount,
    uint256 timestamp
);

event ManualReviewTriggered(
    uint256 indexed fundId,
    address indexed triggeredBy,
    string reason,
    uint256 timestamp
);

event ThresholdUpdated(
    string thresholdType,
    uint256 oldValue,
    uint256 newValue
);
```

## Integration Points

**Incoming**:
- FundTradeExecutor → `validateTrade()`
- Off-chain Monitoring → `checkFundHealth()`
- Guardian → `triggerManualReview()`

**Outgoing**:
- ProtocolRiskDomain → `validate()`
- FundRiskDomain → `validate(fundId, params)`
- InvestorRiskDomain → `validate(fundId)`
- SlashingEngine → `executeSlashing(fundId, faultIndex)`

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Approve trade within limits | RiskEngine validates trade that meets all risk limits | Trade approved, faultIndex below warning threshold, approval signature generated |
| Validate safe trade | TradeExecutor requests validation for trade within all limits | Validation succeeds, approved=true, faultIndex &lt; 10 |
| Calculate FaultIndex correctly | RiskEngine calculates FI from L, B, D, I components | FI calculated as weighted sum: wL×L + wB×B + wD×D + wI×I, formula applied correctly |
| Coordinate all domains | RiskEngine queries Protocol, Fund, and Investor domains | All domains checked, worst FI used, trade approved if all domains pass |
| Generate approval signature | RiskEngine generates approval signature for validated trade | Signature generated correctly, can be verified by TradeExecutor |
| Check fund health | RiskEngine checks overall fund health status | Fund health assessed, health status returned, faults identified |
| Trigger manual review | Guardian triggers manual review for suspicious activity | Manual review flag set, ManualReviewTriggered event emitted |
| Query validation result | Query previous validation result for trade | Returns approval status and faultIndex for trade |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Trade exactly at limit | Trade exactly meets position size limit (PSL) | Trade approved at boundary, faultIndex at threshold |
| Trade exactly at warning threshold | FaultIndex exactly equals warning threshold (e.g., 10) | Trade approved with warning, warning event emitted |
| Trade exactly at slashing threshold | FaultIndex exactly equals slashing threshold (e.g., 30) | Trade may be approved or rejected depending on implementation, slashing triggered |
| Calculate FI with zero components | Calculate FI with all components zero | FI equals 0, no fault detected |
| Calculate FI with maximum components | Calculate FI with all components at maximum (100) | FI equals 100, maximum fault detected |
| All domains pass | All three domains return healthy status | Trade approved, FI is zero or minimum |
| Single domain fails | One domain fails, others pass | Worst FI used, trade rejected if FI above threshold |
| Multiple domains fail | Multiple domains fail with different FIs | Worst FI used for overall assessment |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Reject trade exceeding limits | RiskEngine validates trade that exceeds PSL or other limits | Trade rejected, approved=false, faultIndex ≥30, SlashingTriggered event emitted |
| Reject trade with high FI | Trade has high FaultIndex above slashing threshold | Trade rejected, slashing triggered, SlashingTriggered event emitted |
| Invalid trade parameters | TradeExecutor requests validation with invalid parameters | Transaction reverts with validation error |
| Domain validation failure | One or more domains return unhealthy status | Trade rejected, faultIndex reflects worst domain FI |
| Fund not found | Attempt to validate trade for non-existent fund | Transaction reverts with "Fund not found" error |
| Validation during pause | Attempt to validate trade when protocol paused | Transaction reverts with "Protocol paused" error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent approval forgery | Attacker attempts to forge RiskEngine approval signature | Signature validation fails, forged approval rejected by TradeExecutor |
| Prevent replay attacks | Attacker attempts to reuse approval signature multiple times | Signature marked as used or nonce-based, replay attempts rejected |
| Prevent FI manipulation | Attempt to manipulate FaultIndex calculation | FI calculation deterministic, weights from DAOConfigCore, cannot manipulate |
| Domain validation integrity | Verify domain responses cannot be forged | Domain contracts queried directly, responses cannot be spoofed |
| Approval signature integrity | Verify approval signatures include all trade parameters | Signature includes all trade params, parameter substitution invalidates signature |
| Weight manipulation prevention | Attempt to manipulate FI weights | Weights read from DAOConfigCore, cannot modify in calculation |
| Slashing threshold enforcement | Verify slashing triggered correctly for high FI | Threshold enforced, slashing triggered when FI exceeds threshold |
| Manual review authorization | Verify only Guardian can trigger manual review | Transaction reverts if not Guardian, manual review protected |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Validate trade by TradeExecutor | TradeExecutor requests trade validation | Transaction succeeds |
| Validate trade by non-TradeExecutor | Non-TradeExecutor attempts to validate trade | Transaction succeeds (validation may be public) or reverts depending on implementation |
| Trigger manual review by Guardian | Guardian triggers manual review | Transaction succeeds |
| Trigger manual review by non-Guardian | Non-Guardian attempts to trigger manual review | Transaction reverts with "Not Guardian" |
| Query functions by any address | Any address queries validation results, fund health | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Complete validation flow | TradeExecutor requests validation, RiskEngine validates, approval generated | Complete flow succeeds, trade can proceed if approved |
| Domain coordination | RiskEngine queries all three domains, coordinates responses | All domains checked, worst FI used, validation accurate |
| SlashingEngine integration | RiskEngine triggers slashing via SlashingEngine | Slashing triggered correctly, FI passed to SlashingEngine |
| TradeExecutor integration | RiskEngine approval verified by TradeExecutor | Approval signature verified, trade executed if valid |
| DAOConfigCore integration | RiskEngine reads FI weights from DAOConfigCore | Weights read correctly, FI calculation uses current weights |
| FundConfig integration | RiskEngine reads fund limits from FundConfig | Limits read correctly, validation uses current fund limits |
| Multiple trade validations | Multiple trades validated simultaneously | All validations independent, no interference |
| Approval signature lifecycle | Approval generated, used once, cannot be reused | Single-use approval, replay prevention works correctly |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Trade validation gas | RiskEngine validates trade with all domain checks | Gas usage reasonable for validation operation |
| FI calculation gas | RiskEngine calculates FaultIndex | Gas usage reasonable for calculation |
| Approval signature generation gas | RiskEngine generates approval signature | Gas usage reasonable for signature generation |
| Query operations gas | Multiple queries for validation results, fund health | View functions consume no gas (read-only) |
| Batch validation gas | Multiple trades validated in sequence | Each validation uses similar gas, no gas accumulation |

---

**Next**: [ProtocolRiskDomain](/protocol/contracts/risk/ProtocolRiskDomain)

