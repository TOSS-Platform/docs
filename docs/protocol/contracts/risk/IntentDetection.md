# IntentDetection.sol

## Overview

Detects malicious intent in FM behavior using pattern recognition, anomaly detection, and behavioral analysis.

## Purpose

- Detect suspicious trading patterns
- Identify front-running attempts
- Flag wash trading
- Detect market manipulation
- Calculate Intent Probability (I component of FI)

## Functions

### `analyzeIntent`

```solidity
function analyzeIntent(
    uint256 fundId,
    TradeParams calldata params
) external view returns (uint256 intentProbability)
```

**Purpose**: Calculate probability of malicious intent

**Returns**: Intent probability (0-100)

**Signals Analyzed**:
1. Trade timing (front-running investor)
2. Asset manipulation (low liquidity)
3. Repeated violations
4. Unusual patterns

## Test Scenarios

```typescript
it("should detect front-running", async () => {
  // Investor requests large withdrawal
  await vault.requestWithdrawal(largeAmount);
  
  // FM immediately trades disadvantageously
  const intent = await intentDetection.analyzeIntent(fundId, suspiciousTrade);
  
  expect(intent).to.be.gt(70);  // High intent probability
});
```

---

**Next**: [RiskMathLib](/docs/protocol/contracts/risk/RiskMathLib)

