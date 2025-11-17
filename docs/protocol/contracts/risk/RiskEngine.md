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

```typescript
describe("RiskEngine - Validation", () => {
  it("should approve trade within limits", async () => {
    const params = createSafeTradeParams();
    const { approved, faultIndex } = await riskEngine.validateTrade(fundId, params);
    
    expect(approved).to.be.true;
    expect(faultIndex).to.be.lt(10);  // Below warning threshold
  });
  
  it("should reject trade exceeding limits", async () => {
    const params = createRiskyTradeParams();  // Exceeds PSL
    const { approved, faultIndex } = await riskEngine.validateTrade(fundId, params);
    
    expect(approved).to.be.false;
    expect(faultIndex).to.be.gte(30);  // Above slashing threshold
  });
  
  it("should calculate FI correctly", async () => {
    const fi = await riskEngine.calculateFaultIndex(
      50,  // L: 50% limit breach
      20,  // B: 20% behavior anomaly
      30,  // D: 30% damage ratio
      10   // I: 10% intent probability
    );
    
    // FI = 0.45×50 + 0.25×20 + 0.20×30 + 0.10×10 = 22.5 + 5 + 6 + 1 = 34.5
    expect(fi).to.be.closeTo(34, 1);
  });
  
  it("should trigger slashing for high FI", async () => {
    const params = createMaliciousTradeParams();
    
    await riskEngine.validateTrade(fundId, params);
    
    // Should emit SlashingTriggered event
    const events = await riskEngine.queryFilter("SlashingTriggered");
    expect(events.length).to.be.gt(0);
  });
  
  it("should coordinate all domains", async () => {
    // Mock domain responses
    await protocolDomain.setHealth(true, 0);
    await fundDomain.mockValidation(fundId, true, 15);
    await investorDomain.mockValidation(fundId, true, 5);
    
    const { approved, faultIndex } = await riskEngine.validateTrade(fundId, params);
    
    // Should use worst FI from domains
    expect(faultIndex).to.equal(15);
  });
});

describe("RiskEngine - Security", () => {
  it("should prevent approval forgery", async () => {
    const fakeApproval = ethers.utils.randomBytes(65);
    
    await expect(
      tradeExecutor.executeTrade(fundId, params, fakeApproval)
    ).to.be.revertedWith("Invalid approval");
  });
  
  it("should prevent replay attacks", async () => {
    const { approved, signature } = await riskEngine.validateTrade(fundId, params);
    
    // Use signature once - ok
    await tradeExecutor.executeTrade(fundId, params, signature);
    
    // Try to reuse - fails
    await expect(
      tradeExecutor.executeTrade(fundId, params, signature)
    ).to.be.revertedWith("Approval already used");
  });
});
```

---

**Next**: [ProtocolRiskDomain](/docs/protocol/contracts/risk/ProtocolRiskDomain)

