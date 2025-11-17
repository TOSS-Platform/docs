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
- Price deviation > 10%
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

```typescript
describe("PriceOracleRouter", () => {
  it("should return median price from multiple sources", async () => {
    // Setup sources: Chainlink $2000, Binance $2010, Coinbase $1995
    const price = await oracle.getPrice(ethAddress);
    expect(price).to.equal(2000);  // Median
  });
  
  it("should reject outlier prices", async () => {
    // Setup: Chainlink $2000, Binance $2010, Attacker $5000
    const { price, confidence } = await oracle.getPrice(ethAddress);
    
    expect(price).to.equal(2005);  // Median of valid (2000, 2010)
    expect(confidence).to.be.lt(100);  // Reduced confidence
  });
  
  it("should trigger circuit breaker on high deviation", async () => {
    // Simulate 15% deviation
    await mockOracle.setPrice(ethAddress, 2300);  // was 2000
    
    await expect(
      oracle.getPrice(ethAddress)
    ).to.be.revertedWith("Circuit breaker active");
  });
});
```

---

**Next**: [AnalyticsHub](/docs/protocol/contracts/utilities/AnalyticsHub)

