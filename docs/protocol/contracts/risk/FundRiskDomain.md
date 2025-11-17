# FundRiskDomain.sol

## Overview

Validates fund-specific risk limits including position sizes, concentration, exposure, volatility, and drawdown constraints.

## Purpose

- Enforce Position Size Limit (PSL)
- Enforce Portfolio Concentration Limit (PCL)
- Enforce Asset Exposure Limit (AEL)
- Monitor volatility and drawdown
- Validate trades against fund-specific limits

## State Variables

```solidity
IFundConfig public fundConfig;
IFundRegistry public fundRegistry;

// ===== Real-time Tracking =====
struct FundRiskState {
    uint256 currentVolatility;     // 30-day trailing
    uint256 currentDrawdown;       // From HWM
    uint256 largestPosition;       // Current largest position %
    mapping(address => uint256) assetExposure;  // asset => % of NAV
}

mapping(uint256 => FundRiskState) public fundStates;
```

## Functions

### `validate`

```solidity
function validate(
    uint256 fundId,
    TradeParams calldata params
) external view returns (bool passed, uint256 faultIndex)
```

**Purpose**: Validate trade against fund risk limits

**Parameters**:
- `fundId`: Fund executing trade
- `params`: Trade parameters

**Returns**:
- `passed`: Whether trade passes all checks
- `faultIndex`: Severity of violation if any

**Checks Performed**:
1. **PSL Check**: Position size ≤ maxPositionSize
2. **PCL Check**: Concentration ≤ maxConcentration  
3. **AEL Check**: Exposure ≤ maxAssetExposure
4. **Volatility Check**: Current vol ≤ maxVolatility
5. **Drawdown Check**: Current DD ≤ maxDrawdown
6. **Asset Allowed**: Asset in whitelist

**FI Calculation**:
```solidity
if (violation) {
    limitBreach = (actualValue - limitValue) / limitValue * 100;
    faultIndex = limitBreach * severity_weight;
}
```

### `updateFundState`

```solidity
function updateFundState(
    uint256 fundId,
    uint256 newVolatility,
    uint256 newDrawdown
) external onlyNAVEngine
```

**Purpose**: Update fund's current risk metrics

**Access Control**: Only NAV Engine (calculates off-chain)

## Test Scenarios

```typescript
describe("FundRiskDomain", () => {
  it("should reject trade exceeding PSL", async () => {
    const config = await fundConfig.getConfig(fundId);
    const nav = 1000000;  // $1M
    const psl = config.maxPositionSize;  // e.g., 10%
    
    const oversizedTrade = {
      asset: "ETH",
      amount: nav * 0.15,  // 15% > 10% PSL
    };
    
    const { passed, faultIndex } = await fundDomain.validate(fundId, oversizedTrade);
    expect(passed).to.be.false;
    expect(faultIndex).to.be.gt(30);  // Should trigger slashing
  });
  
  it("should allow trade within all limits", async () => {
    const safeTrade = {
      asset: "ETH",
      amount: nav * 0.05,  // 5% < 10% PSL
    };
    
    const { passed } = await fundDomain.validate(fundId, safeTrade);
    expect(passed).to.be.true;
  });
});
```

---

**Next**: [InvestorRiskDomain](/docs/protocol/contracts/risk/InvestorRiskDomain)

