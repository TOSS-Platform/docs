# RiskMathLib.sol

## Overview

Solidity library providing mathematical functions for risk calculations, volatility computation, and statistical analysis.

## Purpose

- Calculate portfolio volatility
- Compute correlation matrices
- Calculate Value at Risk (VaR)
- Sharpe ratio calculations
- Drawdown computations
- Position size calculations based on risk parameters

## Constants

The library uses the following constants:

- `BASIS_POINTS = 10000`: Used for percentage calculations (10000 = 100%)
- `PRECISION = 1e18`: Used for high-precision calculations (e.g., square root operations)

## Custom Errors

The library defines the following custom errors:

- `EmptyArray()`: Thrown when an empty array is provided
- `InvalidPeriods()`: Thrown when periods parameter is zero or invalid
- `InvalidHighWaterMark()`: Thrown when high water mark is zero
- `ArrayLengthMismatch()`: Thrown when two arrays have different lengths
- `InvalidConfidenceLevel()`: Thrown when confidence level is outside valid range (0-10000)
- `DivisionByZero()`: Thrown when division by zero would occur
- `InvalidNAV()`: Thrown when NAV is zero or invalid
- `InvalidMaxPositionSize()`: Thrown when max position size is zero or exceeds 100%
- `InvalidStopLoss()`: Thrown when stop loss is zero or exceeds 100%

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

- `returns`: Array of period returns (basis points, where 10000 = 100% = no change)
- `periods`: Number of periods per year (e.g., 365 for daily, 12 for monthly, 52 for weekly)

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

**Parameters**:
- `currentNAV`: Current NAV value (same units as highWaterMark)
- `highWaterMark`: High water mark value (peak NAV)

**Returns**: Drawdown percentage in basis points (0-10000, where 10000 = 100%)

**Formula**:

```
drawdown = ((highWaterMark - currentNAV) / highWaterMark) × 100
```

**Notes**:
- Returns 0 if `currentNAV >= highWaterMark` (no decline)
- Reverts with `InvalidHighWaterMark` if `highWaterMark` is zero

### `calculateSharpeRatio`

```solidity
function calculateSharpeRatio(
    uint256[] memory returns,
    uint256 riskFreeRate
) internal pure returns (int256 sharpe)
```

**Purpose**: Calculate risk-adjusted return

**Parameters**:
- `returns`: Array of period returns (basis points)
- `riskFreeRate`: Risk-free rate in basis points (e.g., 200 = 2%)

**Returns**: Sharpe ratio as signed integer (can be negative)

**Formula**:

```
sharpe = (avgReturn - riskFreeRate) / stdDev
```

**Notes**:
- Returns 0 if standard deviation is 0 (division by zero protection)
- Returns 0 if only one return value provided (need at least 2 for stdDev)
- Negative values indicate returns below risk-free rate

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

### `calculatePositionSize`

```solidity
function calculatePositionSize(
    uint256 nav,
    uint256 maxPositionSize,
    uint256 currentVolatility,
    uint256 targetVolatility
) internal pure returns (uint256 positionSize)
```

**Purpose**: Calculate optimal position size based on NAV and risk limits

**Parameters**:

- `nav`: Current NAV (Net Asset Value)
- `maxPositionSize`: Maximum position size limit in basis points (e.g., 2000 = 20%)
- `currentVolatility`: Current portfolio volatility in basis points (0 to disable adjustment)
- `targetVolatility`: Target volatility in basis points (0 to disable adjustment)

**Returns**: Optimal position size in same units as NAV

**Formula**:

```
Base: positionSize = (NAV × maxPositionSize) / BASIS_POINTS
With volatility adjustment (if currentVolatility > targetVolatility):
  positionSize = basePositionSize × (targetVolatility / currentVolatility)
```

**Notes**:

- If `currentVolatility` or `targetVolatility` is 0, volatility adjustment is disabled
- Position size is reduced if current volatility exceeds target volatility
- Position size respects the maximum position size limit (PSL)

### `calculatePositionSizeByRisk`

```solidity
function calculatePositionSizeByRisk(
    uint256 nav,
    uint256 riskAmount,
    uint256 stopLoss
) internal pure returns (uint256 positionSize)
```

**Purpose**: Calculate position size based on risk amount and stop loss percentage

**Parameters**:

- `nav`: Current NAV (Net Asset Value)
- `riskAmount`: Maximum risk amount in same units as NAV
- `stopLoss`: Stop loss percentage in basis points (e.g., 500 = 5%)

**Returns**: Optimal position size in same units as NAV (capped at NAV)

**Formula**:

```
positionSize = (riskAmount × BASIS_POINTS) / stopLoss
if (positionSize > nav) positionSize = nav
```

**Notes**:

- Ensures that if stop loss is hit, loss equals `riskAmount`
- Position size is capped at NAV to prevent over-leveraging
- Useful for risk-based position sizing strategies

## Usage

All functions are `internal pure` and must be used via `using` statement:

```solidity
using RiskMathLib for uint256[];

// Example: Calculate volatility
uint256[] memory returns = [10000, 10500, 9800, 10200];
uint256 volatility = RiskMathLib.calculateVolatility(returns, 365);

// Example: Calculate position size
uint256 nav = 1_000_000; // $1M NAV
uint256 maxPositionSize = 2000; // 20% = 2000 basis points
uint256 positionSize = RiskMathLib.calculatePositionSize(
    nav,
    maxPositionSize,
    0, // No volatility adjustment
    0
); // Returns $200,000

// Example: Calculate position size by risk
uint256 riskAmount = 10_000; // $10,000 risk
uint256 stopLoss = 500; // 5% stop loss
uint256 positionSizeByRisk = RiskMathLib.calculatePositionSizeByRisk(
    nav,
    riskAmount,
    stopLoss
); // Returns $200,000 (ensures $10K loss if 5% stop loss hit)
```

## Test Scenarios

### Happy Path Tests

| Test Name                       | Scenario                                                     | Expected Result                                                                        |
| ------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Calculate volatility            | Calculate annualized volatility from daily returns array     | Volatility calculated correctly using standard deviation formula, annualized correctly |
| Calculate drawdown              | Calculate maximum drawdown from NAV series                   | Drawdown calculated correctly, maximum decline from peak identified                    |
| Calculate correlation           | Calculate correlation between two asset returns              | Correlation coefficient calculated correctly, range -1 to +1                           |
| Calculate VaR (Value at Risk)   | Calculate Value at Risk at specific confidence level         | VaR calculated correctly, represents potential loss at confidence level                |
| Calculate Sharpe ratio          | Calculate Sharpe ratio from returns and risk-free rate       | Sharpe ratio calculated correctly, risk-adjusted return metric accurate                |
| Calculate position size         | Calculate optimal position size based on NAV and risk limits | Position size calculated correctly using risk formulas, respects limits                |
| Calculate position size by risk | Calculate position size based on risk amount and stop loss   | Position size calculated correctly, ensures loss equals risk amount if stop loss hit   |

### Edge Cases

| Test Name                                             | Scenario                                                       | Expected Result                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Calculate volatility with zero returns                | Calculate volatility for returns array with all zeros          | Volatility equals 0, no variation detected                                       |
| Calculate volatility with constant returns            | Calculate volatility for returns array with same value         | Volatility equals 0, no variation                                                |
| Calculate volatility with single return               | Calculate volatility for returns array with one value          | Volatility calculated or reverts depending on implementation (need &gt; 1 value) |
| Calculate drawdown with no decline                    | Calculate drawdown for NAV that never declines                 | Drawdown equals 0, no decline from peak                                          |
| Calculate drawdown with continuous decline            | Calculate drawdown for NAV that continuously declines          | Drawdown calculated correctly, represents total decline                          |
| Calculate correlation with identical returns          | Calculate correlation between identical return series          | Correlation equals 1.0, perfect positive correlation                             |
| Calculate correlation with opposite returns           | Calculate correlation between opposite return series           | Correlation equals -1.0, perfect negative correlation                            |
| Calculate VaR at boundary                             | Calculate VaR at 0% or 100% confidence level                   | VaR calculated correctly at boundaries, or reverts if invalid                    |
| Calculate position size with volatility adjustment    | Calculate position size when current volatility exceeds target | Position size reduced proportionally to volatility ratio                         |
| Calculate position size without volatility adjustment | Calculate position size when volatility adjustment disabled    | Position size equals NAV × maxPositionSize                                       |
| Calculate position size by risk with stop loss        | Calculate position size based on risk amount and stop loss     | Position size ensures loss equals risk amount if stop loss hit                   |
| Calculate position size by risk exceeding NAV         | Calculate position size that would exceed NAV                  | Position size capped at NAV                                                      |

### Failure Cases

| Test Name                                             | Scenario                                                             | Expected Result                                               |
| ----------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- |
| Calculate with empty array                            | Attempt to calculate volatility with empty returns array             | Transaction reverts with "Empty array" error                  |
| Calculate with invalid time period                    | Attempt to calculate with invalid annualization period               | Transaction reverts with "InvalidPeriods" error               |
| Calculate with zero periods                           | Attempt to calculate with zero periods                               | Transaction reverts with "InvalidPeriods" error               |
| Calculate with overflow values                        | Attempt to calculate with values that cause overflow                 | Transaction reverts with overflow error or handles gracefully |
| Calculate with mismatched arrays                      | Attempt to calculate correlation with different array lengths        | Transaction reverts with "ArrayLengthMismatch" error          |
| Calculate with invalid confidence level               | Attempt to calculate VaR with confidence level > 100%                | Transaction reverts with "InvalidConfidenceLevel" error       |
| Calculate with zero high water mark                   | Attempt to calculate drawdown with zero high water mark              | Transaction reverts with "InvalidHighWaterMark" error         |
| Calculate with division by zero                       | Attempt to calculate with values that cause division by zero         | Transaction reverts with "DivisionByZero" error or returns 0  |
| Calculate position size with zero NAV                 | Attempt to calculate position size with zero NAV                     | Transaction reverts with "InvalidNAV" error                   |
| Calculate position size with zero max position size   | Attempt to calculate position size with zero max position size       | Transaction reverts with "InvalidMaxPositionSize" error       |
| Calculate position size with max position size > 100% | Attempt to calculate position size with max position size above 100% | Transaction reverts with "InvalidMaxPositionSize" error       |
| Calculate position size by risk with zero stop loss   | Attempt to calculate position size by risk with zero stop loss       | Transaction reverts with "InvalidStopLoss" error              |
| Calculate position size by risk with stop loss > 100% | Attempt to calculate position size by risk with stop loss above 100% | Transaction reverts with "InvalidStopLoss" error              |

### Security Tests

| Test Name                        | Scenario                                          | Expected Result                                                   |
| -------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| Prevent calculation manipulation | Attempt to manipulate calculation results         | Calculations deterministic, formulas immutable, cannot manipulate |
| Overflow protection              | Verify calculations protected against overflow    | SafeMath or checked math used, overflow prevented                 |
| Precision accuracy               | Verify calculations maintain sufficient precision | Decimal precision maintained, calculations accurate               |
| Formula integrity                | Verify formulas cannot be modified                | Formulas implemented in library, immutable, cannot be changed     |

### Access Control Tests

| Test Name                             | Scenario                                                      | Expected Result                                                                         |
| ------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Use library functions by any contract | Any contract uses RiskMathLib functions via `using` statement | Functions are internal pure, any contract can use via `using RiskMathLib for uint256[]` |
| Query functions by any address        | Any address queries calculation results                       | Queries succeed, functions are internal pure and accessible via library usage           |

### Integration Tests

| Test Name                        | Scenario                                                 | Expected Result                                                  |
| -------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| RiskEngine uses calculations     | RiskEngine uses RiskMathLib for FI and risk calculations | Calculations used correctly, results accurate                    |
| FundRiskDomain uses volatility   | FundRiskDomain calculates volatility for risk assessment | Volatility calculated correctly, used for risk validation        |
| Drawdown tracking integration    | Drawdown calculated from NAV series for risk monitoring  | Drawdown tracked correctly, used for risk warnings               |
| Correlation analysis integration | Correlation calculated for portfolio risk assessment     | Correlation analysis accurate, portfolio risk assessed correctly |
| Position size calculation integration | Position size calculated for trade validation | Position size calculated correctly, used for PSL validation |

### Gas Optimization Tests

| Test Name                   | Scenario                                      | Expected Result                                            |
| --------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| Volatility calculation gas  | Calculate volatility from returns array       | Gas usage reasonable for calculation                       |
| Drawdown calculation gas    | Calculate drawdown from NAV series            | Gas usage reasonable for calculation                       |
| Correlation calculation gas | Calculate correlation between return series   | Gas usage reasonable for calculation                       |
| Position size calculation gas | Calculate position size from NAV and limits | Gas usage reasonable for calculation |
| Library function gas        | Multiple library functions called in sequence | Each function uses similar gas, no gas accumulation issues |

---

**Risk Layer Complete!** [Governance Contracts →](/protocol/contracts/governance/FundGovernance)
