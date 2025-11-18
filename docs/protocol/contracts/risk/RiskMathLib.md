# RiskMathLib.sol

## Overview

Solidity library providing mathematical functions for risk calculations, volatility computation, and statistical analysis.

## Purpose

- Calculate portfolio volatility
- Compute correlation matrices
- Calculate Value at Risk (VaR)
- Sharpe ratio calculations
- Drawdown computations

## Functions

### `calculateVolatility`

```solidity
function calculateVolatility(
    uint256[] memory returns,
    uint256 periods
) internal pure returns (uint256 volatility)
```

**Purpose**: Calculate annualized volatility

**Parameters**:
- `returns`: Array of period returns
- `periods`: Number of periods per year

**Returns**: Annualized volatility (basis points)

**Formula**: Standard deviation of returns × sqrt(periods)

### `calculateDrawdown`

```solidity
function calculateDrawdown(
    uint256 currentNAV,
    uint256 highWaterMark
) internal pure returns (uint256 drawdown)
```

**Purpose**: Calculate current drawdown percentage

**Formula**:
```
drawdown = ((highWaterMark - currentNAV) / highWaterMark) × 100
```

### `calculateSharpeRatio`

```solidity
function calculateSharpeRatio(
    uint256[] memory returns,
    uint256 riskFreeRate
) internal pure returns (int256 sharpe)
```

**Purpose**: Calculate risk-adjusted return

**Formula**:
```
sharpe = (avgReturn - riskFreeRate) / stdDev
```

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Calculate volatility | Calculate annualized volatility from daily returns array | Volatility calculated correctly using standard deviation formula, annualized correctly |
| Calculate drawdown | Calculate maximum drawdown from NAV series | Drawdown calculated correctly, maximum decline from peak identified |
| Calculate correlation | Calculate correlation between two asset returns | Correlation coefficient calculated correctly, range -1 to +1 |
| Calculate VaR (Value at Risk) | Calculate Value at Risk at specific confidence level | VaR calculated correctly, represents potential loss at confidence level |
| Calculate Sharpe ratio | Calculate Sharpe ratio from returns and risk-free rate | Sharpe ratio calculated correctly, risk-adjusted return metric accurate |
| Calculate position size | Calculate optimal position size based on risk parameters | Position size calculated correctly using risk formulas, respects limits |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Calculate volatility with zero returns | Calculate volatility for returns array with all zeros | Volatility equals 0, no variation detected |
| Calculate volatility with constant returns | Calculate volatility for returns array with same value | Volatility equals 0, no variation |
| Calculate volatility with single return | Calculate volatility for returns array with one value | Volatility calculated or reverts depending on implementation (need &gt; 1 value) |
| Calculate drawdown with no decline | Calculate drawdown for NAV that never declines | Drawdown equals 0, no decline from peak |
| Calculate drawdown with continuous decline | Calculate drawdown for NAV that continuously declines | Drawdown calculated correctly, represents total decline |
| Calculate correlation with identical returns | Calculate correlation between identical return series | Correlation equals 1.0, perfect positive correlation |
| Calculate correlation with opposite returns | Calculate correlation between opposite return series | Correlation equals -1.0, perfect negative correlation |
| Calculate VaR at boundary | Calculate VaR at 0% or 100% confidence level | VaR calculated correctly at boundaries, or reverts if invalid |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Calculate with empty array | Attempt to calculate volatility with empty returns array | Transaction reverts with "Empty array" error |
| Calculate with invalid time period | Attempt to calculate with invalid annualization period | Transaction reverts with validation error |
| Calculate with negative time period | Attempt to calculate with negative time period | Transaction reverts with "Invalid time period" error |
| Calculate with overflow values | Attempt to calculate with values that cause overflow | Transaction reverts with overflow error or handles gracefully |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent calculation manipulation | Attempt to manipulate calculation results | Calculations deterministic, formulas immutable, cannot manipulate |
| Overflow protection | Verify calculations protected against overflow | SafeMath or checked math used, overflow prevented |
| Precision accuracy | Verify calculations maintain sufficient precision | Decimal precision maintained, calculations accurate |
| Formula integrity | Verify formulas cannot be modified | Formulas implemented in library, immutable, cannot be changed |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Use library functions by any contract | Any contract calls RiskMathLib functions | Functions are public, any contract can use |
| Query functions by any address | Any address queries calculation results | Queries succeed, functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| RiskEngine uses calculations | RiskEngine uses RiskMathLib for FI and risk calculations | Calculations used correctly, results accurate |
| FundRiskDomain uses volatility | FundRiskDomain calculates volatility for risk assessment | Volatility calculated correctly, used for risk validation |
| Drawdown tracking integration | Drawdown calculated from NAV series for risk monitoring | Drawdown tracked correctly, used for risk warnings |
| Correlation analysis integration | Correlation calculated for portfolio risk assessment | Correlation analysis accurate, portfolio risk assessed correctly |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Volatility calculation gas | Calculate volatility from returns array | Gas usage reasonable for calculation |
| Drawdown calculation gas | Calculate drawdown from NAV series | Gas usage reasonable for calculation |
| Correlation calculation gas | Calculate correlation between return series | Gas usage reasonable for calculation |
| Library function gas | Multiple library functions called in sequence | Each function uses similar gas, no gas accumulation issues |

---

**Risk Layer Complete!** [Governance Contracts →](/protocol/contracts/governance/FundGovernance)

