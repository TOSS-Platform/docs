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

```typescript
it("should calculate volatility correctly", async () => {
  const returns = [5, -3, 8, 2, -1, 4];  // Daily returns %
  const vol = await RiskMathLib.calculateVolatility(returns, 365);
  
  expect(vol).to.be.closeTo(expectedVolatility, 10);  // Within tolerance
});
```

---

**Risk Layer Complete!** [Governance Contracts →](/docs/protocol/contracts/governance/FundGovernance)

