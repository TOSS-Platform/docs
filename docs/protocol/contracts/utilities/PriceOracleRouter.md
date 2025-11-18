# PriceOracleRouter.sol

## Overview

Aggregates price feeds from multiple sources (Chainlink, CEX APIs, DEX TWAPs), detects anomalies, and provides reliable prices for NAV calculation and risk validation.

## Purpose

- Aggregate prices from multiple oracles
- Detect price manipulation/deviation
- Provide fallback mechanisms
- Circuit breaker for anomalies
- Support multiple assets

## State Variables

```solidity
struct PriceSource {
    address sourceAddress;
    SourceType sourceType;  // CHAINLINK, CEX_API, DEX_TWAP
    uint256 priority;       // 1 = primary, 2 = secondary, etc.
    bool active;
}

mapping(address => PriceSource[]) public priceSources;  // asset => sources
mapping(address => uint256) public lastPrice;           // asset => last valid price
uint256 public maxDeviation = 500;  // 5% max deviation between sources
```

## Functions

### `getPrice`

```solidity
function getPrice(
    address asset
) external view returns (uint256 price, uint256 confidence)
```

**Purpose**: Get reliable price for asset

**Parameters**:
- `asset`: Token address

**Returns**:
- `price`: Price in USD (8 decimals)
- `confidence`: Confidence level (0-100)

**Behavior**:
1. Query all active sources for asset
2. Calculate median price
3. Check deviation from median
4. Reject outliers (>5% deviation)
5. Return median with confidence score

**Confidence Calculation**:
```
confidence = 100 - (maxDeviation / threshold × 100)

If 3+ sources agree: confidence = 100
If 2 sources: confidence = 80
If 1 source: confidence = 50 (risky)
```

### `addPriceSource`

```solidity
function addPriceSource(
    address asset,
    address sourceAddress,
    SourceType sourceType,
    uint256 priority
) external onlyGovernance
```

**Purpose**: Add new price source

**Access Control**: Only protocol governance

### `triggerCircuitBreaker`

```solidity
function triggerCircuitBreaker(
    address asset,
    string calldata reason
) external onlyGuardianOrAuto
```

**Purpose**: Pause price feed if anomaly detected

**Conditions**:
- Price deviation &gt; 10%
- Source outage
- Suspected manipulation

## Security Considerations

**1. Oracle Manipulation**
- **Risk**: Attacker manipulates single source
- **Mitigation**: Multi-source median, deviation limits
- **Severity**: High → Mitigated

**2. Flash Crash**
- **Risk**: Temporary price spike affects NAV
- **Mitigation**: TWAP, circuit breakers, outlier rejection
- **Severity**: Medium → Mitigated

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Get price from multiple sources | PriceOracleRouter queries multiple oracle sources (Chainlink, Binance, Coinbase) | Median price returned, confidence score calculated, PriceQueried event emitted |
| Return median price | Three sources return $2000, $2010, $1995 | Median price ($2000) returned, all valid sources considered |
| Calculate confidence score | Multiple sources agree on price, low deviation | High confidence score (e.g., 90-100), price reliable |
| Query price for supported asset | Query price for asset with configured oracles | Price returned correctly, confidence score included |
| Update oracle source | Governance adds or removes oracle source | Source list updated, future queries use new source list |
| Get price with high confidence | All sources report similar prices | High confidence score, median price reflects consensus |
| Query price with single source | Only one oracle source configured | Price from single source returned, confidence may be lower |
| Query multiple assets | Query prices for multiple assets simultaneously | All prices returned correctly, each asset's confidence calculated independently |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Get price with zero sources | Query price when no oracle sources configured | Transaction reverts with "No oracle sources" error |
| Get price with one source | Only one oracle source configured | Price from single source returned, confidence may be lower |
| Get price with maximum sources | Maximum allowed number of oracle sources (e.g., 10) | All sources considered, median calculated correctly |
| Outlier price rejection | One source reports outlier price (e.g., 50% deviation), others agree | Outlier rejected, median calculated from valid sources, confidence reduced |
| All sources disagree | All sources report significantly different prices | Median returned but confidence very low, circuit breaker may trigger |
| Price at boundary | Prices at boundary values (zero, max uint256) | Boundary values handled correctly, validation prevents invalid prices |
| Stale price detection | Oracle source returns stale price (old timestamp) | Stale price rejected or flagged, confidence reduced |
| Network partition | Some oracle sources unavailable, others respond | Available sources used, median calculated, confidence adjusted |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Query price for unsupported asset | Query price for asset not configured with oracles | Transaction reverts with "Asset not supported" error |
| Circuit breaker active | Price deviation exceeds threshold (e.g., 15%), circuit breaker triggers | Transaction reverts with "Circuit breaker active" error |
| All sources unavailable | All oracle sources fail to respond | Transaction reverts with "All sources unavailable" error |
| Invalid oracle source | Attempt to add invalid oracle source address | Transaction reverts with validation error |
| Update source from non-authorized | Non-authorized address attempts to update oracle sources | Transaction reverts with "Not authorized" error |
| Remove all sources | Attempt to remove all oracle sources | Transaction reverts with "Must have at least one source" error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent price manipulation | Attacker attempts to manipulate price by controlling one source | Outlier detection rejects manipulated price, median remains accurate |
| Oracle source integrity | Verify oracle sources cannot be manipulated | Source list controlled by governance, unauthorized changes rejected |
| Confidence calculation accuracy | Verify confidence score calculated correctly | Confidence reflects price agreement, outlier rejection reduces confidence |
| Circuit breaker effectiveness | Verify circuit breaker prevents extreme price deviations | Circuit breaker triggers correctly, protects against manipulation |
| Outlier detection effectiveness | Verify outlier prices detected and rejected | Outlier detection works correctly, manipulated prices filtered out |
| Stale price protection | Verify stale prices rejected or flagged | Stale price detection works, old data doesn't affect current price |
| Price freshness enforcement | Verify prices must be recent (within time window) | Old prices rejected, only recent prices accepted |
| Source reliability tracking | Verify oracle source reliability tracked | Unreliable sources flagged, confidence adjusted based on history |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Query price by any address | Any address queries price for asset | Transaction succeeds, price queries are public |
| Update oracle sources by governance | Governance adds or removes oracle sources | Transaction succeeds |
| Update oracle sources by non-authorized | Non-authorized attempts to update sources | Transaction reverts with "Not authorized" |
| Configure circuit breaker by governance | Governance configures circuit breaker thresholds | Transaction succeeds |
| Configure circuit breaker by non-authorized | Non-authorized attempts to configure circuit breaker | Transaction reverts with "Not authorized" |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Chainlink oracle integration | PriceOracleRouter queries Chainlink oracle | Chainlink price retrieved correctly, included in median calculation |
| External oracle integration | PriceOracleRouter queries external oracle (e.g., Binance, Coinbase) | External prices retrieved correctly, included in median calculation |
| NAV calculation integration | Fund uses price oracle for NAV calculation | NAV calculated correctly using accurate prices |
| Trade execution integration | FundTradeExecutor uses price oracle for trade validation | Trade prices validated against oracle, price manipulation prevented |
| Risk engine integration | RiskEngine uses price oracle for risk calculations | Risk calculated correctly using accurate prices |
| Multiple asset queries | Query prices for multiple assets in single transaction | All prices returned correctly, batch queries efficient |
| Oracle source update flow | Governance updates oracle sources, next query uses new sources | Source update succeeds, future queries use updated source list |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Price query gas | Query price for asset with multiple oracle sources | Gas usage reasonable for query operation |
| Median calculation gas | Calculate median from multiple price sources | Median calculation efficient, gas usage reasonable |
| Outlier detection gas | Detect and reject outlier prices | Outlier detection efficient, gas usage reasonable |
| Query operations gas | Multiple queries for different assets | View functions consume no gas (read-only) |
| Batch price queries | Query prices for multiple assets in batch | Batch queries efficient, gas usage reasonable |

---

**Next**: [AnalyticsHub](/protocol/contracts/utilities/AnalyticsHub)

