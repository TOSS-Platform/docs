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

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Detect front-running | Investor requests large withdrawal, FM trades disadvantageously immediately after | Intent probability calculated as high (&gt; 70), front-running detected |
| Analyze trade intent | IntentDetection analyzes trade for malicious intent | Intent probability calculated based on timing, trade direction, and withdrawal patterns |
| Detect disadvantageous trading | FM executes trade that harms investors (e.g., selling before withdrawal) | High intent probability, malicious intent detected |
| Detect timing patterns | FM consistently trades before large withdrawals | Pattern detected, intent probability increases |
| Query intent probability | Query intent probability for specific trade | Returns intent score (0-100), higher score indicates higher malicious intent |
| Pattern recognition | IntentDetection recognizes suspicious trading patterns | Patterns identified, intent probability adjusted accordingly |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Intent probability at threshold | Trade analyzed with intent probability exactly at detection threshold | Intent probability returned, threshold comparison works correctly |
| Intent probability zero | Trade analyzed with no suspicious indicators | Intent probability equals 0, no malicious intent detected |
| Intent probability maximum | Trade analyzed with all suspicious indicators | Intent probability equals 100, maximum malicious intent |
| Analyze trade with no withdrawals | Analyze trade when no recent withdrawals | Intent probability calculated normally, no withdrawal-based boost |
| Analyze trade immediately after withdrawal | Analyze trade within seconds of withdrawal | Intent probability increases due to timing, front-running detected |
| Multiple withdrawals pattern | Analyze trade after multiple large withdrawals | Intent probability increases with pattern, malicious intent more likely |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Analyze intent for non-existent fund | Attempt to analyze intent for fund that doesn't exist | Transaction reverts with "Fund not found" error |
| Analyze intent with invalid parameters | Attempt to analyze intent with invalid trade parameters | Transaction reverts with validation error |
| Analyze intent during pause | Attempt to analyze intent when protocol paused | Transaction reverts with "Protocol paused" error or handled gracefully |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent intent manipulation | Attempt to manipulate intent probability calculation | Intent calculation deterministic, based on on-chain data, cannot manipulate |
| Pattern detection accuracy | Verify suspicious patterns detected correctly | Pattern recognition accurate, intent probability reflects actual behavior |
| Timing analysis integrity | Verify timing analysis cannot be manipulated | Timing calculated from block timestamps, cannot manipulate |
| Front-running detection | Verify front-running patterns detected correctly | Front-running detected when FM trades disadvantageously before withdrawal |
| Intent score integrity | Verify intent scores cannot be forged | Intent scores calculated from on-chain data, cannot forge |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Analyze intent by any address | Any address analyzes trade intent | Transaction succeeds, intent analysis is public |
| Query functions by any address | Any address queries intent probabilities, patterns | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| RiskEngine intent integration | RiskEngine queries IntentDetection for intent component | Intent probability used in FI calculation, integrated correctly |
| Withdrawal pattern tracking | IntentDetection tracks withdrawal requests and timing | Withdrawal patterns tracked correctly, intent analysis accurate |
| Trade timing analysis | IntentDetection analyzes trade timing relative to withdrawals | Timing analysis accurate, front-running detected correctly |
| Pattern recognition integration | IntentDetection recognizes multi-transaction patterns | Patterns recognized correctly, intent probability reflects patterns |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Intent analysis gas | Analyze trade intent with pattern checks | Gas usage reasonable for intent analysis |
| Pattern recognition gas | Recognize trading patterns | Gas usage reasonable for pattern recognition |
| Query operations gas | Multiple queries for intent probabilities | View functions consume no gas (read-only) |

---

**Next**: [RiskMathLib](/protocol/contracts/risk/RiskMathLib)

