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

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Validate trade within PSL | FundRiskDomain validates trade within Position Size Limit | Trade validated, passed=true, faultIndex low, trade approved |
| Validate trade within PCL | FundRiskDomain validates trade within Position Concentration Limit | Trade validated, passed=true, concentration checked, trade approved |
| Validate trade within AEL | FundRiskDomain validates trade within Asset Exposure Limit | Trade validated, passed=true, exposure checked, trade approved |
| Validate trade within all limits | Trade meets all risk limits (PSL, PCL, AEL, volatility, drawdown) | Trade validated successfully, passed=true, low faultIndex |
| Query fund risk parameters | Query all risk limits for fund | Returns PSL, PCL, AEL, maxDrawdown, maxVolatility values |
| Calculate position concentration | Calculate current concentration for specific asset | Concentration calculated correctly, compared against PCL |
| Calculate asset exposure | Calculate exposure for asset class | Exposure calculated correctly, compared against AEL |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Trade exactly at PSL | Trade size exactly equals Position Size Limit | Trade may be approved or rejected depending on implementation (strict &lt; or &lt;=) |
| Trade exactly at PCL | Trade creates concentration exactly at Position Concentration Limit | Trade may be approved or rejected depending on implementation |
| Trade exactly at AEL | Trade creates exposure exactly at Asset Exposure Limit | Trade may be approved or rejected depending on implementation |
| Trade with zero NAV | Attempt to validate trade when fund NAV is zero | Transaction reverts or handles edge case (division by zero prevention) |
| Trade with minimum size | Trade size at minimum trade size limit | Trade approved at minimum boundary |
| Trade with maximum size | Trade size at maximum allowed (PSL limit) | Trade approved at maximum boundary if within limit |
| Multiple trades same asset | Multiple trades in same asset, cumulative concentration | Cumulative concentration checked correctly, PCL enforced |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Reject trade exceeding PSL | Trade size exceeds Position Size Limit | Trade rejected, passed=false, high faultIndex, SlashingTriggered if severe |
| Reject trade exceeding PCL | Trade creates concentration above Position Concentration Limit | Trade rejected, passed=false, high faultIndex, concentration violation detected |
| Reject trade exceeding AEL | Trade creates exposure above Asset Exposure Limit | Trade rejected, passed=false, high faultIndex, exposure violation detected |
| Reject trade exceeding drawdown | Trade would cause drawdown above maximum | Trade rejected, passed=false, high faultIndex, drawdown violation detected |
| Reject trade exceeding volatility | Trade would increase volatility above maximum | Trade rejected, passed=false, high faultIndex, volatility violation detected |
| Validate trade for non-existent fund | Attempt to validate trade for fund that doesn't exist | Transaction reverts with "Fund not found" error |
| Validate trade with invalid parameters | Attempt to validate trade with invalid parameters | Transaction reverts with validation error |
| Validate trade with disallowed asset | Attempt to validate trade for asset not in allowed list | Trade rejected, passed=false, asset not allowed error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent limit bypass | Attempt to bypass risk limits through multiple small trades | Cumulative limits checked, cannot bypass via splitting trades |
| Limit manipulation prevention | Attempt to manipulate risk limit calculations | Limits read from FundConfig, cannot manipulate in calculation |
| NAV manipulation prevention | Attempt to manipulate NAV to affect position size calculations | NAV read from vault, cannot manipulate |
| Concentration calculation accuracy | Verify concentration calculated correctly | Concentration calculated from holdings, calculation accurate |
| Exposure calculation accuracy | Verify exposure calculated correctly per asset class | Exposure calculated from portfolio, calculation accurate |
| Risk parameter integrity | Verify risk parameters cannot be manipulated | Parameters read from FundConfig, cannot manipulate |
| FaultIndex calculation accuracy | Verify faultIndex reflects actual limit breaches | FaultIndex calculated correctly, reflects severity of breaches |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Validate trade by any address | Any address validates trade | Transaction succeeds, validation is public |
| Query functions by any address | Any address queries risk parameters, concentrations | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| RiskEngine integration | RiskEngine queries FundRiskDomain for fund risk validation | Fund risk assessed correctly, faultIndex returned |
| FundConfig integration | FundRiskDomain reads risk limits from FundConfig | Limits read correctly, validation uses current fund limits |
| FundManagerVault integration | FundRiskDomain reads holdings and NAV from vault | Holdings and NAV read correctly, calculations accurate |
| Multiple limit checks | FundRiskDomain checks all limits (PSL, PCL, AEL, etc.) | All limits checked, worst violation used for faultIndex |
| Cumulative concentration tracking | Multiple trades in same asset, cumulative concentration tracked | Cumulative concentration calculated correctly, PCL enforced |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Trade validation gas | FundRiskDomain validates trade with all limit checks | Gas usage reasonable for validation operation |
| Concentration calculation gas | Calculate position concentration | Gas usage reasonable for calculation |
| Exposure calculation gas | Calculate asset exposure | Gas usage reasonable for calculation |
| Query operations gas | Multiple queries for risk parameters, concentrations | View functions consume no gas (read-only) |

---

**Next**: [InvestorRiskDomain](/docs/protocol/contracts/risk/InvestorRiskDomain)

