# PriceOracleRouter.sol

## Overview

Aggregates price feeds from multiple sources (Chainlink, CEX APIs, DEX TWAPs), detects anomalies, and provides reliable prices for NAV calculation and risk validation.

## Purpose

- Aggregate prices from multiple oracles
- Detect price manipulation/deviation
- Provide fallback mechanisms
- Circuit breaker for anomalies
- Support multiple assets

## Types

```solidity
enum SourceType {
    CHAINLINK,
    CEX_API,
    DEX_TWAP
}

struct PriceSource {
    address sourceAddress;
    SourceType sourceType;  // CHAINLINK, CEX_API, DEX_TWAP
    uint256 priority;       // 1 = primary, 2 = secondary, etc.
    bool active;
}
```

## State Variables

```solidity
mapping(address => PriceSource[]) public priceSources;  // asset => sources
mapping(address => uint256) public lastPrice;           // asset => last valid price (fallback)
mapping(address => bool) public circuitBreakerActive;  // asset => circuit breaker status
uint256 public maxDeviation = 500;  // 5% max deviation between sources (basis points)

// Access Control
address public governance;  // Protocol governance address
address public guardian;    // Emergency guardian address
```

## Constants

```solidity
uint256 private constant BASIS_POINTS = 10000;
uint256 private constant CIRCUIT_BREAKER_THRESHOLD = 1000;  // 10% deviation threshold (basis points)
uint256 private constant PRICE_DECIMALS = 8;  // Price in USD with 8 decimals
```

## Constructor

```solidity
constructor(
    address _governance,
    address _guardian,
    uint256 _initialMaxDeviation
)
```

**Purpose**: Initialize PriceOracleRouter contract

**Parameters**:
- `_governance`: Governance address (cannot be zero)
- `_guardian`: Guardian address (cannot be zero)
- `_initialMaxDeviation`: Initial max deviation in basis points (default: 500 = 5%, max: 10000 = 100%)

**Validation**:
- Reverts if `_governance` is zero address
- Reverts if `_guardian` is zero address
- Reverts if `_initialMaxDeviation` > 10000 (100%)

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
1. Check circuit breaker status (reverts if active)
2. Query all active sources for asset
3. Handle source failures gracefully (skip failed sources)
4. If all sources fail, use `lastPrice` if available (confidence: 30) or revert
5. Calculate median price from valid sources
6. Reject outliers (&gt;5% deviation from median)
7. If all prices are outliers, use `lastPrice` if available (confidence: 20) or return median with low confidence
8. Recalculate median from filtered prices
9. Calculate confidence score based on source count and deviation
10. Return median with confidence score

**Error Handling**:
- Reverts with `CircuitBreakerActive` if circuit breaker is active for asset
- Reverts with `NoOracleSources` if no active sources configured or all sources fail
- Failed sources are skipped (try-catch), allowing partial source availability

**Fallback Mechanism**:
- If all sources fail, uses `lastPrice[asset]` if available (confidence: 30)
- If all prices are outliers, uses `lastPrice[asset]` if available (confidence: 20)
- Note: `lastPrice` is not automatically updated (view function limitation)

**Confidence Calculation**:
```
Base Confidence:
- 3+ sources: confidence = 100
- 2 sources: confidence = 80
- 1 source: confidence = 50

Deviation Adjustment:
- If maxDeviation > 500 (5%): reduce confidence by 30
- If maxDeviation > 200 (2%): reduce confidence by 10
- Final confidence capped at 0-100
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

**Validation**:
- Reverts if `asset` is zero address
- Reverts if `sourceAddress` is zero address
- Reverts if `priority` is zero
- Reverts if source already exists (duplicate check)

**Events**:
- `PriceSourceAdded(asset, sourceAddress, sourceType, priority)`

### `triggerCircuitBreaker`

```solidity
function triggerCircuitBreaker(
    address asset,
    string calldata reason
) external onlyGuardianOrAuto
```

**Purpose**: Pause price feed if anomaly detected

**Access Control**: Guardian or contract itself (for automatic triggers)

**Parameters**:
- `asset`: Asset address
- `reason`: Reason for triggering circuit breaker

**Conditions**:
- Price deviation > 10%
- Source outage
- Suspected manipulation

**Events**:
- `CircuitBreakerTriggered(asset, reason)`

### `resetCircuitBreaker`

```solidity
function resetCircuitBreaker(address asset) external
```

**Purpose**: Reset circuit breaker for asset

**Access Control**: Guardian or governance

**Parameters**:
- `asset`: Asset address

**Events**:
- `CircuitBreakerReset(asset)`

### `removePriceSource`

```solidity
function removePriceSource(
    address asset,
    address sourceAddress
) external onlyGovernance
```

**Purpose**: Remove price source for asset

**Access Control**: Only protocol governance

**Validation**:
- Reverts if source not found
- Reverts if removing would leave asset with no active sources

**Events**:
- `PriceSourceRemoved(asset, sourceAddress)`

### `updatePriceSource`

```solidity
function updatePriceSource(
    address asset,
    address sourceAddress,
    bool active,
    uint256 priority
) external onlyGovernance
```

**Purpose**: Update price source (priority or active status)

**Access Control**: Only protocol governance

**Parameters**:
- `asset`: Asset address
- `sourceAddress`: Oracle source address
- `active`: Whether source is active
- `priority`: New priority level

**Validation**:
- Reverts if `priority` is zero
- Reverts if source not found
- Reverts if deactivating would leave asset with no active sources

**Events**:
- `PriceSourceUpdated(asset, sourceAddress, active, priority)`

### `setMaxDeviation`

```solidity
function setMaxDeviation(uint256 newMaxDeviation) external onlyGovernance
```

**Purpose**: Set max deviation threshold

**Access Control**: Only protocol governance

**Parameters**:
- `newMaxDeviation`: New max deviation in basis points (max: 10000 = 100%)

**Validation**:
- Reverts if `newMaxDeviation` > 10000 (100%)

**Events**:
- `MaxDeviationUpdated(oldValue, newMaxDeviation)`

### `setGovernance`

```solidity
function setGovernance(address newGovernance) external onlyGovernance
```

**Purpose**: Update governance address

**Access Control**: Only current governance

**Parameters**:
- `newGovernance`: New governance address

**Validation**:
- Reverts if `newGovernance` is zero address

**Events**:
- `GovernanceUpdated(oldGovernance, newGovernance)`

### `setGuardian`

```solidity
function setGuardian(address newGuardian) external onlyGovernance
```

**Purpose**: Update guardian address

**Access Control**: Only governance

**Parameters**:
- `newGuardian`: New guardian address

**Validation**:
- Reverts if `newGuardian` is zero address

**Events**:
- `GuardianUpdated(oldGuardian, newGuardian)`

### `isHealthy`

```solidity
function isHealthy() external view returns (bool healthy)
```

**Purpose**: Check if oracle is healthy

**Returns**:
- `healthy`: Whether oracles are functioning correctly

**Behavior**:
- Returns `true` if `maxDeviation > 0` (indicating contract is configured)
- Simplified check - in production, could check specific assets or circuit breaker status

### `getSourceCount`

```solidity
function getSourceCount(address asset) external view returns (uint256 count)
```

**Purpose**: Get number of price sources for asset

**Parameters**:
- `asset`: Asset address

**Returns**:
- `count`: Number of sources (including inactive)

### `getPriceSources`

```solidity
function getPriceSources(address asset) external view returns (PriceSource[] memory sources)
```

**Purpose**: Get all price sources for asset

**Parameters**:
- `asset`: Asset address

**Returns**:
- `sources`: Array of PriceSource structs

## Events

```solidity
event PriceSourceAdded(
    address indexed asset,
    address indexed source,
    SourceType sourceType,
    uint256 priority
);
event PriceSourceRemoved(address indexed asset, address indexed source);
event PriceSourceUpdated(
    address indexed asset,
    address indexed source,
    bool active,
    uint256 priority
);
event PriceQueried(
    address indexed asset,
    uint256 price,
    uint256 confidence,
    uint256 sourceCount
);
event CircuitBreakerTriggered(address indexed asset, string reason);
event CircuitBreakerReset(address indexed asset);
event MaxDeviationUpdated(uint256 oldValue, uint256 newValue);
event GovernanceUpdated(
    address indexed oldGovernance,
    address indexed newGovernance
);
event GuardianUpdated(address indexed oldGuardian, address indexed newGuardian);
```

**Note**: `PriceQueried` event is defined but cannot be emitted in `getPrice` because it's a view function. If event emission is needed, a non-view wrapper function would be required.

## Custom Errors

```solidity
error NotGovernance();
error NotGuardian();
error NotGuardianOrAuto();
error InvalidAddress();
error NoOracleSources();
error AssetNotSupported();
error CircuitBreakerActive();
error InvalidSourceType();
error DuplicateSource();
error MustHaveAtLeastOneSource();
error InvalidMaxDeviation();
error SourceNotFound();
```

## Access Control

### Roles

| Role | Address | Permissions |
|------|---------|-------------|
| **Governance** | `governance` | Add/remove/update sources, set max deviation, update governance/guardian |
| **Guardian** | `guardian` | Trigger circuit breaker, reset circuit breaker |
| **Anyone** | Any address | Query prices (view functions) |

### Modifiers

```solidity
modifier onlyGovernance() {
    if (msg.sender != governance) revert NotGovernance();
    _;
}

modifier onlyGuardian() {
    if (msg.sender != guardian) revert NotGuardian();
    _;
}

modifier onlyGuardianOrAuto() {
    if (msg.sender != guardian && msg.sender != address(this))
        revert NotGuardianOrAuto();
    _;
}
```

### Permission Matrix

| Function | Anyone | Governance | Guardian |
|----------|--------|------------|----------|
| `getPrice` | ✅ | ✅ | ✅ |
| `isHealthy` | ✅ | ✅ | ✅ |
| `getSourceCount` | ✅ | ✅ | ✅ |
| `getPriceSources` | ✅ | ✅ | ✅ |
| `addPriceSource` | ❌ | ✅ | ❌ |
| `removePriceSource` | ❌ | ✅ | ❌ |
| `updatePriceSource` | ❌ | ✅ | ❌ |
| `triggerCircuitBreaker` | ❌ | ❌ | ✅ |
| `resetCircuitBreaker` | ❌ | ✅ | ✅ |
| `setMaxDeviation` | ❌ | ✅ | ❌ |
| `setGovernance` | ❌ | ✅ | ❌ |
| `setGuardian` | ❌ | ✅ | ❌ |

## Security Considerations

**1. Oracle Manipulation**
- **Risk**: Attacker manipulates single source
- **Mitigation**: Multi-source median, deviation limits
- **Severity**: High → Mitigated

**2. Flash Crash**
- **Risk**: Temporary price spike affects NAV
- **Mitigation**: Circuit breakers, outlier rejection, median calculation
- **Severity**: Medium → Mitigated

**3. Source Failure**
- **Risk**: All oracle sources fail simultaneously
- **Mitigation**: Multiple sources, graceful failure handling, `lastPrice` fallback
- **Severity**: Medium → Mitigated

**4. Unauthorized Access**
- **Risk**: Unauthorized modification of sources or parameters
- **Mitigation**: Access control (governance/guardian), validation checks
- **Severity**: Low → Mitigated

**5. Reentrancy**
- **Risk**: Reentrancy attacks during price queries
- **Mitigation**: ReentrancyGuard, view functions for queries
- **Severity**: Low → Mitigated

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Get price from multiple sources | PriceOracleRouter queries multiple oracle sources (Chainlink, Binance, Coinbase) | Median price returned, confidence score calculated |
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
| Stale price detection | Oracle source returns stale price (old timestamp) | Note: Stale price detection not implemented in current version |
| Network partition | Some oracle sources unavailable, others respond | Available sources used, median calculated, confidence adjusted |
| Source failure handling | One or more sources fail to respond | Failed sources skipped, remaining sources used, confidence adjusted |
| All sources fail with fallback | All sources fail but lastPrice exists | Returns lastPrice with confidence 30 |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Query price for unsupported asset | Query price for asset not configured with oracles | Transaction reverts with "No oracle sources" error |
| Circuit breaker active | Price deviation exceeds threshold (e.g., 15%), circuit breaker triggers | Transaction reverts with "Circuit breaker active" error |
| All sources unavailable | All oracle sources fail to respond | Transaction reverts with "No oracle sources" error (or returns lastPrice with low confidence if available) |
| Invalid oracle source | Attempt to add invalid oracle source address | Transaction reverts with validation error |
| Update source from non-authorized | Non-authorized address attempts to update oracle sources | Transaction reverts with "NotGovernance" error |
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

## Implementation Details

### Price Query Flow

1. **Circuit Breaker Check**: If circuit breaker is active for asset, revert immediately
2. **Source Collection**: Collect all active sources for the asset
3. **Price Fetching**: Query each source using `_querySource()` helper
   - Uses `staticcall` to avoid state changes
   - Handles failures gracefully with try-catch
   - Skips sources that return zero or revert
4. **Fallback Handling**: If all sources fail:
   - Check `lastPrice[asset]` if available → return with confidence 30
   - Otherwise revert with `NoOracleSources`
5. **Median Calculation**: Calculate median from valid prices
6. **Outlier Rejection**: Filter prices with &gt;5% deviation from median
7. **Final Calculation**: Recalculate median from filtered prices
8. **Confidence Scoring**: Calculate confidence based on source count and deviation

### Helper Functions

**Internal Functions** (not directly callable):

- `_querySource(source, asset)`: Query price from single source (external for try-catch)
- `_calculateMedian(prices)`: Calculate median from sorted price array
- `_rejectOutliers(prices, median)`: Filter prices with &gt;5% deviation
- `_calculateDeviation(price, median)`: Calculate deviation in basis points
- `_calculateMaxDeviation(prices, median)`: Find max deviation in array
- `_calculateConfidence(sourceCount, maxDev)`: Calculate confidence score (0-100)

### Oracle Source Interface

PriceOracleRouter expects oracle sources to implement:

```solidity
function getPrice(address asset) external view returns (uint256 price);
```

The router uses `staticcall` to query sources, making it compatible with:
- Chainlink Price Feeds
- Custom oracle contracts
- Any contract implementing the `getPrice(address)` interface

### Circuit Breaker Mechanism

Circuit breakers are asset-specific:
- Each asset can have its own circuit breaker status
- Triggered by guardian or automatically (contract itself)
- Reset by guardian or governance
- When active, all price queries for that asset revert

### Last Price Fallback

The `lastPrice` mapping is intended as a fallback mechanism:
- Currently not automatically updated (view function limitation)
- Can be updated by governance in future versions
- Used when all sources fail or all prices are outliers
- Provides low confidence (20-30) to indicate stale data

### Gas Optimization

- View functions (`getPrice`, `isHealthy`, `getSourceCount`, `getPriceSources`) consume no gas
- Median calculation uses bubble sort (efficient for small arrays, typically &lt;10 sources)
- Failed sources are skipped early to avoid unnecessary gas usage
- Outlier rejection happens before final median calculation

---

**Next**: [AnalyticsHub](/protocol/contracts/utilities/AnalyticsHub)

