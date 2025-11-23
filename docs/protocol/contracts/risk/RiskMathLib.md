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

### `calculateCorrelation`

```solidity
function calculateCorrelation(
    uint256[] memory returns1,
    uint256[] memory returns2
) internal pure returns (int256 correlation)
```

**Purpose**: Calculate Pearson correlation coefficient between two return series

**Parameters**:
- `returns1`: First return series (basis points)
- `returns2`: Second return series (basis points)

**Returns**: Correlation coefficient in basis points (-10000 to +10000, where -10000 = -1.0, +10000 = +1.0)

**Formula**: Pearson correlation coefficient
```
correlation = covariance(returns1, returns2) / (stdDev1 × stdDev2)
```

**Notes**:
- Both arrays must have the same length
- Returns 0 if either standard deviation is 0 (division by zero protection)
- Returns BASIS_POINTS (10000) for single point (perfect correlation)

### `calculateVaR`

```solidity
function calculateVaR(
    uint256[] memory returns,
    uint256 confidenceLevel
) internal pure returns (uint256 varValue)
```

**Purpose**: Calculate Value at Risk (VaR) at specified confidence level

**Parameters**:
- `returns`: Array of period returns (basis points)
- `confidenceLevel`: Confidence level in basis points (e.g., 9500 = 95%)

**Returns**: Value at Risk in basis points (potential loss percentage)

**Formula**: Historical VaR method
- Sorts returns in ascending order
- Finds percentile based on confidence level
- Returns absolute value of negative return (loss)

**Notes**:
- Uses historical VaR method (sorts returns and finds percentile)
- For 95% confidence, finds 5th percentile (worst 5% of returns)
- Returns 0 if all returns are positive (no loss expected)
- Confidence level must be between 1 and 10000 (0.01% to 100%)

## Usage

All functions are `internal pure` and must be used via `using` statement:

```solidity
using RiskMathLib for uint256[];

// Example usage
uint256[] memory returns = [10000, 10500, 9800, 10200];
uint256 volatility = RiskMathLib.calculateVolatility(returns, 365);
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
| Calculate with invalid time period | Attempt to calculate with invalid annualization period | Transaction reverts with "InvalidPeriods" error |
| Calculate with zero periods | Attempt to calculate with zero periods | Transaction reverts with "InvalidPeriods" error |
| Calculate with overflow values | Attempt to calculate with values that cause overflow | Transaction reverts with overflow error or handles gracefully |
| Calculate with mismatched arrays | Attempt to calculate correlation with different array lengths | Transaction reverts with "ArrayLengthMismatch" error |
| Calculate with invalid confidence level | Attempt to calculate VaR with confidence level > 100% | Transaction reverts with "InvalidConfidenceLevel" error |

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
| Use library functions by any contract | Any contract uses RiskMathLib functions via `using` statement | Functions are internal pure, any contract can use via `using RiskMathLib for uint256[]` |
| Query functions by any address | Any address queries calculation results | Queries succeed, functions are internal pure and accessible via library usage |

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

