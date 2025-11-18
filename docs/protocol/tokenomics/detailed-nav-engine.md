# Detailed NAV Engine (Volume 5)

## Overview

The NAV (Net Asset Value) Engine is the core valuation system that calculates, validates, and publishes fund valuations with precision, accuracy, and security. This document provides comprehensive mathematical models, calculation formulas, edge case handling, and detailed examples.

## Core NAV Formula

### Basic NAV Calculation

```
NAV = Σ(Asset_Balance[i] × Price[i]) + Accrued_Income - Liabilities - Fees_Payable

Where:
- Asset_Balance[i]: Balance of asset i in the fund vault (in asset's native units)
- Price[i]: Current market price of asset i (in USD, 6 decimals)
- Accrued_Income: Unrealized gains, staking rewards, yield farming returns
- Liabilities: Pending withdrawals, outstanding loans, borrowed amounts
- Fees_Payable: Management fees, performance fees, withdrawal fees due
```

### Detailed Component Breakdown

#### 1. Asset Valuation

```typescript
function calculateAssetValue(
    asset: address,
    balance: uint256,
    decimals: uint8
): uint256 {
    // Get price from oracle (USD, 6 decimals)
    uint256 price = priceOracleRouter.getPrice(asset);
    uint256 priceConfidence = priceOracleRouter.getConfidence(asset);
    
    require(priceConfidence >= 50, "Low price confidence");
    
    // Convert balance to 18 decimals for calculation
    uint256 balance18 = balance * (10 ** (18 - decimals));
    
    // Calculate value: balance × price (both in 18 decimals)
    // Price from oracle is 6 decimals, convert to 18
    uint256 price18 = price * (10 ** 12);
    
    // Value in USD (18 decimals)
    uint256 value = (balance18 * price18) / 1e18;
    
    // Convert to 6 decimals (standard NAV precision)
    return value / 1e12;
}
```

**Example**:
```
Asset: WBTC
Balance: 10 WBTC (8 decimals)
Price: $42,000 (6 decimals = 42000000000)

Calculation:
- balance18 = 10 × 10^18 = 10,000,000,000,000,000,000
- price18 = 42000000000 × 10^12 = 42,000,000,000,000,000,000
- value = (10,000,000,000,000,000,000 × 42,000,000,000,000,000,000) / 10^18
        = 420,000,000,000,000,000,000 / 10^18
        = 420,000 (in 18 decimals)
- Convert to 6 decimals: 420,000 / 10^12 = 420000 (representing $420,000)
```

#### 2. Accrued Income Calculation

```
Accrued_Income = Staking_Rewards + Yield_Farming_Rewards + Unrealized_Gains

Staking_Rewards = Σ(Staked_Amount[i] × APY[i] × Days_Staked / 365)
Yield_Farming_Rewards = Σ(Farming_Position[i] × APY[i] × Days_Farming / 365)
Unrealized_Gains = Σ((Current_Price[i] - Entry_Price[i]) × Position_Size[i])
```

**Example**:
```
Staking:
- 100 ETH staked at 5% APY for 30 days
- Rewards = 100 × 0.05 × (30/365) = 0.411 ETH
- Value at $2,200/ETH = $904

Yield Farming:
- $50,000 in USDC-ETH LP at 12% APY for 45 days
- Rewards = 50,000 × 0.12 × (45/365) = $739

Unrealized Gains:
- Bought 10 BTC at $40,000, current price $42,000
- Gains = (42,000 - 40,000) × 10 = $20,000

Total Accrued Income = $904 + $739 + $20,000 = $21,643
```

#### 3. Liabilities Calculation

```
Liabilities = Pending_Withdrawals + Borrowed_Amounts + Margin_Calls

Pending_Withdrawals = Σ(Withdrawal_Request[i].shares × NAV_per_Share)
Borrowed_Amounts = Σ(Loan[i].principal + Loan[i].accrued_interest)
Margin_Calls = Σ(Margin_Position[i].maintenance_margin - Margin_Position[i].collateral)
```

**Example**:
```
Pending Withdrawals:
- Request 1: 10,000 shares at NAV $10/share = $100,000
- Request 2: 5,000 shares at NAV $10/share = $50,000
- Total: $150,000

Borrowed Amounts:
- Loan: $200,000 principal + $500 interest = $200,500

Margin Calls:
- Position requires $50,000 maintenance, has $45,000 collateral
- Deficit: $5,000

Total Liabilities = $150,000 + $200,500 + $5,000 = $355,500
```

#### 4. Fees Payable Calculation

```
Fees_Payable = Management_Fee_Due + Performance_Fee_Due + Withdrawal_Fee_Due

Management_Fee_Due = NAV × Management_Fee_Rate × Days_Since_Last_Collection / 365
Performance_Fee_Due = max(0, (Current_NAV - High_Water_Mark) × Performance_Fee_Rate)
Withdrawal_Fee_Due = Σ(Pending_Withdrawal[i].shares × NAV_per_Share × Withdrawal_Fee_Rate)
```

**Example**:
```
Management Fee:
- NAV: $1,000,000
- Management Fee Rate: 2% annual
- Days since last collection: 30
- Fee = 1,000,000 × 0.02 × (30/365) = $1,644

Performance Fee:
- Current NAV: $1,200,000
- High Water Mark: $1,000,000
- Performance Fee Rate: 20%
- Fee = (1,200,000 - 1,000,000) × 0.20 = $40,000

Withdrawal Fee:
- Pending withdrawal: $50,000
- Withdrawal Fee Rate: 1%
- Fee = 50,000 × 0.01 = $500

Total Fees Payable = $1,644 + $40,000 + $500 = $42,144
```

### Complete NAV Example

```
Fund Holdings:
- 10 WBTC @ $42,000 = $420,000
- 100 ETH @ $2,200 = $220,000
- 500,000 USDC @ $1.00 = $500,000
- 50,000 USDT @ $1.00 = $50,000

Accrued Income:
- Staking rewards: $2,000
- Yield farming: $1,500
- Unrealized gains: $5,000
Total: $8,500

Liabilities:
- Pending withdrawals: $100,000
- Borrowed amounts: $50,000
Total: $150,000

Fees Payable:
- Management fee: $2,000
- Performance fee: $20,000
- Withdrawal fees: $500
Total: $22,500

NAV Calculation:
NAV = (420,000 + 220,000 + 500,000 + 50,000) + 8,500 - 150,000 - 22,500
    = 1,190,000 + 8,500 - 150,000 - 22,500
    = $1,026,000
```

## NAV per Share Calculation

```
NAV_per_Share = NAV / Total_Shares_Outstanding

Where:
- NAV: Net Asset Value (USD, 6 decimals)
- Total_Shares_Outstanding: Total number of fund shares (18 decimals)

Example:
- NAV: $1,026,000 (6 decimals = 1,026,000,000,000)
- Total Shares: 1,000,000 (18 decimals = 1,000,000,000,000,000,000,000)

NAV_per_Share = 1,026,000,000,000 / 1,000,000,000,000,000,000,000
               = 0.000001026 (in raw units)
               = $1.026 per share (after decimal conversion)
```

## Price Oracle Integration

### Multi-Oracle Price Aggregation

```typescript
function getAggregatedPrice(asset: address): (uint256 price, uint256 confidence) {
    PriceData[] memory prices = new PriceData[](oracleCount);
    
    // Fetch prices from all oracles
    for (uint i = 0; i < oracleCount; i++) {
        (uint256 p, uint256 conf) = oracles[i].getPrice(asset);
        prices[i] = PriceData(p, conf, block.timestamp);
    }
    
    // Filter out stale prices (> 5 minutes old)
    prices = filterStalePrices(prices, block.timestamp - 300);
    
    // Calculate median price
    uint256 medianPrice = calculateMedian(prices);
    
    // Calculate weighted average with confidence
    uint256 weightedPrice = calculateWeightedAverage(prices);
    
    // Calculate deviation
    uint256 maxDeviation = calculateMaxDeviation(prices, medianPrice);
    
    // Check if deviation acceptable (< 5%)
    if (maxDeviation > 500) {  // 5% = 500 basis points
        // Use median if deviation too high
        return (medianPrice, 50);  // Lower confidence
    }
    
    // Calculate overall confidence
    uint256 avgConfidence = calculateAverageConfidence(prices);
    
    return (weightedPrice, avgConfidence);
}
```

### Price Confidence Calculation

```
Confidence = min(100, Base_Confidence × Deviation_Multiplier × Freshness_Multiplier)

Where:
- Base_Confidence: Average confidence from oracles (0-100)
- Deviation_Multiplier: 1.0 if deviation < 2%, 0.8 if < 5%, 0.5 otherwise
- Freshness_Multiplier: 1.0 if < 1 min, 0.9 if < 3 min, 0.7 if < 5 min, 0 otherwise
```

**Example**:
```
Oracle 1: $42,000, confidence 95%, 30 seconds old
Oracle 2: $41,800, confidence 90%, 45 seconds old
Oracle 3: $42,200, confidence 85%, 1 minute old

Median: $42,000
Deviation: Max(|42000-41800|, |42000-42200|) = 200
Deviation %: 200/42000 = 0.476% (< 2%)

Base Confidence: (95 + 90 + 85) / 3 = 90
Deviation Multiplier: 1.0 (deviation < 2%)
Freshness Multiplier: 1.0 (all < 1 min)

Final Confidence = min(100, 90 × 1.0 × 1.0) = 90
Final Price = $42,000 (weighted average)
```

## Edge Cases & Special Scenarios

### 1. First NAV Calculation (No Shares)

```
Scenario: Fund just created, no investors yet

NAV = Sum of seed capital
NAV_per_Share = NAV (1:1 ratio)

Example:
- Seed capital: $100,000 USDC
- NAV = $100,000
- Total Shares = 0

On first deposit:
- Deposit: $50,000
- Shares to issue: 50,000 (1:1)
- NAV after: $150,000
- Total Shares: 50,000
- NAV per Share: $3.00
```

### 2. NAV with Zero or Negative Holdings

```
Scenario: All assets liquidated, only liabilities remain

NAV = 0 + Accrued_Income - Liabilities - Fees_Payable

If NAV < 0:
- Mark fund as INSOLVENT
- Freeze all operations
- Trigger emergency procedures

Example:
- Holdings: $0
- Accrued Income: $1,000
- Liabilities: $10,000
- Fees: $500
- NAV = 0 + 1,000 - 10,000 - 500 = -$9,500 (INSOLVENT)
```

### 3. Oracle Price Unavailable

```
Scenario: Oracle returns zero price or low confidence

Action:
1. Use cached price (max 1 hour old)
2. Mark NAV as "ESTIMATED"
3. Reduce confidence score
4. Alert monitoring

Fallback Price = Last_Valid_Price × Time_Decay_Factor

Time_Decay_Factor:
- < 5 minutes: 1.0 (no decay)
- 5-15 minutes: 0.98 (2% decay)
- 15-30 minutes: 0.95 (5% decay)
- 30-60 minutes: 0.90 (10% decay)
- > 60 minutes: Use circuit breaker (halt NAV updates)
```

### 4. Large Price Deviation

```
Scenario: One oracle reports significantly different price

Detection:
- Price deviation > 10% from median
- Confidence < 50%

Action:
1. Exclude outlier from calculation
2. Recalculate with remaining oracles
3. If only 1 oracle remains, use cached price
4. Mark NAV with lower confidence

Example:
Oracle 1: $42,000 (confidence: 95%)
Oracle 2: $41,800 (confidence: 90%)
Oracle 3: $50,000 (confidence: 60%) ← Outlier (> 15% deviation)

Action: Exclude Oracle 3
Recalculated Price: ($42,000 + $41,800) / 2 = $41,900
Confidence: (95 + 90) / 2 = 92.5%
```

### 5. Rapid NAV Changes

```
Scenario: NAV changes > 30% without corresponding trades

Detection:
- NAV_change = |New_NAV - Old_NAV| / Old_NAV
- If NAV_change > 0.30 AND no_trades_detected:
  → Flag as suspicious

Action:
1. Don't publish new NAV immediately
2. Re-verify all prices
3. Check for oracle manipulation
4. Investigate off-chain activity
5. If verified, publish with "VERIFIED" flag
6. If suspicious, trigger circuit breaker

Example:
Old NAV: $1,000,000
New NAV: $1,400,000
Change: ($1,400,000 - $1,000,000) / $1,000,000 = 40%

If no trades detected:
→ Flag as suspicious
→ Investigate before publishing
```

### 6. Share Price Precision

```
Scenario: NAV per share calculation with very small NAV

Precision Handling:
- NAV: 6 decimals (micro-USD)
- Shares: 18 decimals (wei-equivalent)
- NAV per Share: 18 decimals (for precision)

Calculation:
NAV_per_Share = (NAV × 10^18) / Total_Shares

Example:
NAV: $0.001 (6 decimals = 1,000)
Total Shares: 1,000,000,000,000,000,000,000 (1e21)

NAV_per_Share = (1,000 × 10^18) / 10^21
               = 10^21 / 10^21
               = 1 (in raw units)
               = $0.000000000000000001 per share

Minimum precision: 1e-18 USD per share
```

### 7. Dividend Distribution Impact

```
Scenario: Fund distributes dividends to shareholders

NAV Impact:
- NAV decreases by dividend amount
- NAV per share decreases proportionally
- Total shares remain unchanged

Calculation:
Before Dividend:
- NAV: $1,000,000
- Total Shares: 1,000,000
- NAV per Share: $1.00

Dividend: $50,000 (5% of NAV)

After Dividend:
- NAV: $1,000,000 - $50,000 = $950,000
- Total Shares: 1,000,000 (unchanged)
- NAV per Share: $950,000 / 1,000,000 = $0.95
```

## NAV Update Frequency & Triggers

### Automatic Updates

```
Standard Schedule:
- Every 60 minutes (hourly)
- At block timestamp: 00:00, 01:00, 02:00, ...

High Volatility Schedule:
- Every 15 minutes
- Triggered when asset volatility > 80% (annualized)
- Continues for 24 hours after volatility returns to normal

Emergency Schedule:
- Real-time on each trade
- Triggered on:
  * Large trade (> 10% of NAV)
  * Oracle price change > 5%
  * Circuit breaker activation
```

### Manual Triggers

```
Authorized Triggers:
1. Fund Manager: Force NAV update (max once per hour)
2. Guardian: Emergency NAV update
3. NAV Engine: Scheduled update
4. Risk Engine: Post-trade update (if emergency)

Access Control:
- Only NAV Engine can write NAV on-chain
- Manual triggers queue NAV calculation
```

## Validation & Safety Checks

### Pre-Calculation Validation

```typescript
function validateBeforeCalculation(fundId: uint256): bool {
    // Check fund exists
    require(fundRegistry.exists(fundId), "Fund not found");
    
    // Check fund status
    require(fundRegistry.getStatus(fundId) == FundStatus.ACTIVE, "Fund not active");
    
    // Check oracle connectivity
    require(priceOracleRouter.isHealthy(), "Oracles not healthy");
    
    // Check last update time (prevent spam)
    uint256 lastUpdate = vault.getLastNAVUpdate(fundId);
    require(block.timestamp - lastUpdate >= 60, "Update too frequent");
    
    return true;
}
```

### Post-Calculation Validation

```typescript
function validateNAV(uint256 fundId, uint256 calculatedNAV): bool {
    uint256 previousNAV = vault.getNAV(fundId);
    
    // Check NAV is non-negative
    require(calculatedNAV >= 0, "NAV cannot be negative");
    
    // Check for suspicious changes
    uint256 changePercent = abs(calculatedNAV - previousNAV) * 10000 / previousNAV;
    
    if (changePercent > 3000) {  // > 30% change
        // Verify with additional checks
        require(verifyLargeNAVChange(fundId, calculatedNAV), "Suspicious NAV change");
    }
    
    // Check NAV consistency
    require(checkNAVConsistency(fundId, calculatedNAV), "NAV inconsistent");
    
    return true;
}
```

## High Water Mark (HWM) Updates

### HWM Calculation

```
HWM_Update_Rule:
if (Current_NAV > High_Water_Mark) {
    High_Water_Mark = Current_NAV
    emit HighWaterMarkUpdated(fundId, Current_NAV)
}

HWM_Reset_Rule:
- HWM never decreases (only increases)
- HWM resets only on fund closure/reopening
- HWM used for performance fee calculation
```

**Example Timeline**:
```
Day 1: NAV = $1,000,000, HWM = $1,000,000
Day 2: NAV = $1,200,000, HWM = $1,200,000 (updated)
Day 3: NAV = $1,100,000, HWM = $1,200,000 (unchanged, NAV < HWM)
Day 4: NAV = $1,300,000, HWM = $1,300,000 (updated)
Day 5: NAV = $1,000,000, HWM = $1,300,000 (unchanged)

Performance Fee Calculation:
- Performance Fee = (NAV - HWM) × Performance_Fee_Rate
- Day 5: Fee = ($1,000,000 - $1,300,000) × 0.20 = -$60,000 → $0 (no fee, NAV < HWM)
```

## Gas Optimization

### Batch NAV Updates

```
For multiple funds:
- Single transaction batches updates
- Reduces per-fund gas overhead
- Efficient for hourly updates

Gas Cost:
- Single fund: ~30,000 gas
- 10 funds batch: ~150,000 gas (avg 15,000 per fund)
- 100 funds batch: ~1,000,000 gas (avg 10,000 per fund)

Optimization: 33-66% gas reduction for batch updates
```

## Security Considerations

### 1. Oracle Manipulation Prevention

```
Measures:
- Multi-oracle aggregation (3+ oracles)
- Median price calculation
- Deviation limits (max 10%)
- Confidence thresholds (min 50%)
- Time-weighted price validation
```

### 2. NAV Inflation Attacks

```
Prevention:
- Hourly automatic updates (no timing manipulation)
- Price deviation checks
- Consistency validation
- Circuit breakers for rapid changes
- Withdrawal queue delays
```

### 3. Share Price Manipulation

```
Prevention:
- Precise decimal handling (18 decimals)
- Rounding rules (always round down for withdrawals)
- Minimum share price validation
- Share count consistency checks
```

---

**Related**: [NAV Update Process](/protocol/processes/system/nav-update), [PriceOracleRouter](/protocol/contracts/utilities/PriceOracleRouter), [FundManagerVault](/protocol/contracts/fund/FundManagerVault)

