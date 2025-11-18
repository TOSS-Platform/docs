# FundClass & InvestorClass Mathematical Models

## Overview

This document provides comprehensive mathematical models for FundClass and InvestorClass systems, including formulas, thresholds, calculations, and upgrade paths.

## FundClass Mathematical Model

### FundClass Types

| FundClass | Description | Risk Profile | Target AUM | Typical Investors |
|-----------|-------------|--------------|------------|-------------------|
| **ALPHA** | High-risk, high-reward strategies | Very High | $100K - $10M | Strategic, Institutional |
| **BALANCED** | Moderate risk, diversified | Medium | $500K - $50M | Premium, Institutional, Strategic |
| **STABLE** | Low-risk, capital preservation | Low | $1M - $100M | All classes |
| **QUANT** | Algorithmic, rule-based trading | Medium-High | $200K - $20M | Institutional, Strategic |
| **INDEX** | Passive, predefined basket | Low-Medium | $500K - $50M | All classes |

### FundClass Risk Parameters

#### 1. Base Risk Limits

```solidity
struct FundClassRiskLimits {
    uint256 maxPositionSize;      // PSL (% of NAV)
    uint256 maxConcentration;     // PCL (% of NAV)
    uint256 maxAssetExposure;     // AEL (% per asset)
    uint256 maxVolatility;        // Annualized volatility (%)
    uint256 maxDrawdown;          // Maximum drawdown (%)
    uint256 maxLeverage;          // Leverage ratio
}
```

#### 2. ALPHA Fund Parameters

```
Risk Limits:
- PSL: 20% of NAV (max position size)
- PCL: 40% of NAV (max concentration)
- AEL: 60% per asset (max asset exposure)
- Max Volatility: 100% annualized
- Max Drawdown: 50%
- Max Leverage: 5x

Fee Ranges:
- Management Fee: 1.5% - 3.0% annual
- Performance Fee: 15% - 30% above HWM

Operational:
- Min Lockup: 30 days
- Max Daily Trades: 100
- Allowed Assets: Top 200 by market cap
- KYC Required: No
```

**Mathematical Formula**:
```
Position_Size_Limit = NAV × 0.20  // Max 20% of NAV per position
Concentration_Limit = NAV × 0.40  // Max 40% in single asset
Asset_Exposure_Limit = NAV × 0.60  // Max 60% exposure to one asset
Max_Leverage = 5.0x
Max_Daily_Trades = 100
```

#### 3. BALANCED Fund Parameters

```
Risk Limits:
- PSL: 15% of NAV
- PCL: 30% of NAV
- AEL: 50% per asset
- Max Volatility: 60% annualized
- Max Drawdown: 30%
- Max Leverage: 2.5x

Fee Ranges:
- Management Fee: 1.0% - 2.5% annual
- Performance Fee: 10% - 25% above HWM

Operational:
- Min Lockup: 14 days
- Max Daily Trades: 50
- Allowed Assets: Top 50 by market cap
- KYC Required: Optional
```

**Mathematical Formula**:
```
Position_Size_Limit = NAV × 0.15  // Max 15% of NAV per position
Concentration_Limit = NAV × 0.30  // Max 30% in single asset
Asset_Exposure_Limit = NAV × 0.50  // Max 50% exposure to one asset
Max_Leverage = 2.5x
Max_Daily_Trades = 50
```

#### 4. STABLE Fund Parameters

```
Risk Limits:
- PSL: 10% of NAV
- PCL: 25% of NAV
- AEL: 40% per asset
- Max Volatility: 30% annualized
- Max Drawdown: 15%
- Max Leverage: 1.5x

Fee Ranges:
- Management Fee: 0.5% - 1.5% annual
- Performance Fee: 5% - 15% above HWM

Operational:
- Min Lockup: 7 days
- Max Daily Trades: 20
- Allowed Assets: Top 10 by market cap + stablecoins
- KYC Required: Yes (for compliance)
```

**Mathematical Formula**:
```
Position_Size_Limit = NAV × 0.10  // Max 10% of NAV per position
Concentration_Limit = NAV × 0.25  // Max 25% in single asset
Asset_Exposure_Limit = NAV × 0.40  // Max 40% exposure to one asset
Max_Leverage = 1.5x
Max_Daily_Trades = 20
```

#### 5. QUANT Fund Parameters

```
Risk Limits:
- PSL: 18% of NAV
- PCL: 35% of NAV
- AEL: 55% per asset
- Max Volatility: 80% annualized
- Max Drawdown: 40%
- Max Leverage: 4x

Fee Ranges:
- Management Fee: 1.2% - 2.8% annual
- Performance Fee: 12% - 28% above HWM

Operational:
- Min Lockup: 21 days
- Max Daily Trades: 200
- Allowed Assets: Top 100 by market cap
- KYC Required: No
```

**Mathematical Formula**:
```
Position_Size_Limit = NAV × 0.18  // Max 18% of NAV per position
Concentration_Limit = NAV × 0.35  // Max 35% in single asset
Asset_Exposure_Limit = NAV × 0.55  // Max 55% exposure to one asset
Max_Leverage = 4.0x
Max_Daily_Trades = 200
```

#### 6. INDEX Fund Parameters

```
Risk Limits:
- PSL: 12% of NAV
- PCL: 28% of NAV
- AEL: 45% per asset
- Max Volatility: 40% annualized
- Max Drawdown: 20%
- Max Leverage: 2x

Fee Ranges:
- Management Fee: 0.8% - 2.0% annual
- Performance Fee: 8% - 20% above HWM

Operational:
- Min Lockup: 7 days
- Max Daily Trades: 10 (minimal rebalancing)
- Allowed Assets: Fixed basket (defined at creation)
- KYC Required: Optional
```

**Mathematical Formula**:
```
Position_Size_Limit = NAV × 0.12  // Max 12% of NAV per position
Concentration_Limit = NAV × 0.28  // Max 28% in single asset
Asset_Exposure_Limit = NAV × 0.45  // Max 45% exposure to one asset
Max_Leverage = 2.0x
Max_Daily_Trades = 10
```

### FundClass Assignment Formula

```solidity
function assignFundClass(
    string calldata strategyDescription,
    FundRiskParams calldata params
) external view returns (FundClass) {
    // Calculate risk score
    uint256 riskScore = calculateRiskScore(params);
    
    // Match to FundClass
    if (riskScore >= 80) return FundClass.ALPHA;
    if (riskScore >= 60) return FundClass.QUANT;
    if (riskScore >= 40) return FundClass.BALANCED;
    if (riskScore >= 20) return FundClass.INDEX;
    return FundClass.STABLE;
}

function calculateRiskScore(FundRiskParams calldata params) internal pure returns (uint256) {
    uint256 score = 0;
    
    // Volatility component (0-30 points)
    score += (params.maxVolatility / 10) * 3;  // Up to 100% volatility = 30 points
    
    // Leverage component (0-25 points)
    score += (params.maxLeverage / 2) * 10;  // Up to 5x leverage = 25 points
    
    // Drawdown component (0-25 points)
    score += (params.maxDrawdown / 2);  // Up to 50% drawdown = 25 points
    
    // Position size component (0-20 points)
    score += (params.maxPositionSize / 2);  // Up to 20% position size = 20 points
    
    return min(score, 100);
}
```

### FundClass Fee Calculation

#### Management Fee

```
Annual_Management_Fee = NAV × Management_Fee_Rate

Where:
- Management_Fee_Rate: Annual percentage (e.g., 2% = 0.02)
- NAV: Current Net Asset Value

Monthly_Management_Fee = Annual_Management_Fee / 12
Daily_Management_Fee = Annual_Management_Fee / 365
```

#### Performance Fee

```
Performance_Fee = max(0, (Current_NAV - High_Water_Mark) × Performance_Fee_Rate)

Where:
- Current_NAV: Current Net Asset Value
- High_Water_Mark: Highest NAV achieved
- Performance_Fee_Rate: Percentage above HWM (e.g., 20% = 0.20)

Example:
- HWM: $1,000,000
- Current NAV: $1,200,000
- Performance Fee Rate: 20%
- Performance Fee = ($1,200,000 - $1,000,000) × 0.20 = $40,000
```

## InvestorClass Mathematical Model

### InvestorClass Types

| InvestorClass | Description | TOSS Stake Required | ICS Required | Access Tier |
|---------------|-------------|---------------------|--------------|-------------|
| **RETAIL** | Entry-level investors | 0-999 TOSS | 0-49 | Tier 1-2 |
| **PREMIUM** | Mid-tier investors | 1,000-9,999 TOSS | 50-69 | Tier 1-3 |
| **INSTITUTIONAL** | High-tier investors | 10,000-99,999 TOSS | 70-84 | Tier 1-4 |
| **STRATEGIC** | Top-tier investors | 100,000+ TOSS | 85-100 | All tiers |

### InvestorClass Upgrade Formula

#### 1. Upgrade Requirements

```solidity
struct UpgradeRequirements {
    InvestorClass fromClass;
    InvestorClass toClass;
    uint256 tossStakeRequired;  // Minimum TOSS staked
    uint256 icsRequired;        // Minimum ICS score
    uint256 timeLockup;         // Minimum lockup period (days)
}

Upgrade Paths:
- RETAIL → PREMIUM: 1,000 TOSS + ICS 50 + 0 days lockup
- PREMIUM → INSTITUTIONAL: 10,000 TOSS + ICS 70 + 30 days lockup
- INSTITUTIONAL → STRATEGIC: 100,000 TOSS + ICS 85 + 90 days lockup
```

#### 2. Upgrade Calculation

```solidity
function canUpgrade(
    address investor,
    InvestorClass targetClass
) external view returns (bool, string memory) {
    InvestorClass currentClass = investorRegistry.getClass(investor);
    uint256 tossStaked = investorRegistry.getTOSSStaked(investor);
    uint256 icsScore = investorRegistry.getICS(investor);
    uint256 registeredAt = investorRegistry.getRegisteredAt(investor);
    uint256 timeSinceRegistration = block.timestamp - registeredAt;
    
    // Check upgrade path
    if (!isValidUpgradePath(currentClass, targetClass)) {
        return (false, "Invalid upgrade path");
    }
    
    // Get requirements
    UpgradeRequirements memory req = getUpgradeRequirements(currentClass, targetClass);
    
    // Check TOSS stake
    if (tossStaked < req.tossStakeRequired) {
        return (false, "Insufficient TOSS stake");
    }
    
    // Check ICS score
    if (icsScore < req.icsRequired) {
        return (false, "Insufficient ICS score");
    }
    
    // Check time lockup
    if (timeSinceRegistration < req.timeLockup) {
        return (false, "Time lockup not met");
    }
    
    // Check investor state
    if (investorStateMachine.getState(investor) != InvestorState.ACTIVE) {
        return (false, "Investor not in ACTIVE state");
    }
    
    return (true, "");
}
```

#### 3. Access Tier Calculation

```solidity
function getAccessTiers(InvestorClass investorClass) internal pure returns (RiskTier[] memory) {
    if (investorClass == InvestorClass.RETAIL) {
        return [RiskTier.TIER_1, RiskTier.TIER_2];
    }
    if (investorClass == InvestorClass.PREMIUM) {
        return [RiskTier.TIER_1, RiskTier.TIER_2, RiskTier.TIER_3];
    }
    if (investorClass == InvestorClass.INSTITUTIONAL) {
        return [RiskTier.TIER_1, RiskTier.TIER_2, RiskTier.TIER_3, RiskTier.TIER_4];
    }
    if (investorClass == InvestorClass.STRATEGIC) {
        return [RiskTier.TIER_1, RiskTier.TIER_2, RiskTier.TIER_3, RiskTier.TIER_4];
    }
    return new RiskTier[](0);
}
```

### ICS (Investor Composite Score) Calculation

#### ICS Components

```
ICS = w1 × Loyalty_Score + w2 × Volume_Score + w3 × Behavior_Score + w4 × Staking_Score

Where:
- w1 = 0.30 (Loyalty weight)
- w2 = 0.25 (Volume weight)
- w3 = 0.25 (Behavior weight)
- w4 = 0.20 (Staking weight)
- All scores normalized to 0-100 scale
```

#### 1. Loyalty Score

```
Loyalty_Score = min(100, (Days_Registered / 365) × 20 + (Funds_Invested / 5) × 10)

Where:
- Days_Registered: Days since investor registration
- Funds_Invested: Number of funds invested in

Maximum: 100 points
```

#### 2. Volume Score

```
Volume_Score = min(100, log10(Total_Invested_USD / 1000) × 20)

Where:
- Total_Invested_USD: Lifetime USD invested

Examples:
- $1,000 invested = log10(1) × 20 = 0 points
- $10,000 invested = log10(10) × 20 = 20 points
- $100,000 invested = log10(100) × 20 = 40 points
- $1,000,000 invested = log10(1000) × 20 = 60 points
- $10,000,000 invested = log10(10000) × 20 = 80 points
- $100,000,000 invested = log10(100000) × 20 = 100 points (capped)

Maximum: 100 points
```

#### 3. Behavior Score

```
Behavior_Score = 100 - (Violation_Penalty × 10) - (State_Penalty × 20)

Where:
- Violation_Penalty: Number of violations in last 90 days
- State_Penalty: 1 if LIMITED, 2 if HIGH_RISK, 3 if FROZEN, 4 if BANNED, 0 if ACTIVE

Examples:
- ACTIVE, 0 violations = 100 points
- ACTIVE, 1 violation = 90 points
- LIMITED, 0 violations = 80 points
- LIMITED, 1 violation = 70 points
- HIGH_RISK, 0 violations = 60 points
- HIGH_RISK, 2 violations = 40 points

Minimum: 0 points (cannot go negative)
Maximum: 100 points
```

#### 4. Staking Score

```
Staking_Score = min(100, (TOSS_Staked / 1000) × 10)

Where:
- TOSS_Staked: Current TOSS staked

Examples:
- 0 TOSS staked = 0 points
- 100 TOSS staked = 1 point
- 1,000 TOSS staked = 10 points
- 10,000 TOSS staked = 100 points (capped)

Maximum: 100 points
```

#### Complete ICS Example

```
Investor Profile:
- Days Registered: 180 days
- Funds Invested: 3 funds
- Total Invested: $50,000 USD
- Violations (90 days): 0
- State: ACTIVE
- TOSS Staked: 5,000 TOSS

Calculations:
- Loyalty_Score = min(100, (180/365) × 20 + (3/5) × 10) = min(100, 9.86 + 6) = 15.86 points
- Volume_Score = min(100, log10(50000/1000) × 20) = min(100, log10(50) × 20) = min(100, 1.699 × 20) = 33.98 points
- Behavior_Score = 100 - (0 × 10) - (0 × 20) = 100 points
- Staking_Score = min(100, (5000/1000) × 10) = min(100, 50) = 50 points

ICS = 0.30 × 15.86 + 0.25 × 33.98 + 0.25 × 100 + 0.20 × 50
    = 4.758 + 8.495 + 25 + 10
    = 48.25 points

Result: ICS = 48.25 (RETAIL class, can upgrade to PREMIUM with 1,000 TOSS stake)
```

### InvestorClass Benefits

#### Fee Discounts

```
Fee_Discount = Base_Fee × (1 - Discount_Rate)

Discount Rates by Class:
- RETAIL: 0% discount
- PREMIUM: 10% discount
- INSTITUTIONAL: 20% discount
- STRATEGIC: 25% discount

Example (Management Fee):
- Base Fee: $100
- PREMIUM discount: 10%
- Discounted Fee: $100 × (1 - 0.10) = $90
```

#### Voting Power Multipliers

```
Governance_Voting_Power = Base_Power × Multiplier

Multipliers by Class:
- RETAIL: 1.0x (base)
- PREMIUM: 1.2x
- INSTITUTIONAL: 1.5x
- STRATEGIC: 2.0x

Example (Protocol Governance):
- Base Power: 1,000 votes
- INSTITUTIONAL multiplier: 1.5x
- Effective Power: 1,000 × 1.5 = 1,500 votes
```

## FundClass ↔ InvestorClass Compatibility Matrix

| FundClass | RiskTier | RETAIL | PREMIUM | INSTITUTIONAL | STRATEGIC |
|-----------|----------|--------|---------|---------------|-----------|
| ALPHA | Tier 1 | ❌ | ❌ | ✅ | ✅ |
| ALPHA | Tier 2 | ❌ | ❌ | ✅ | ✅ |
| ALPHA | Tier 3 | ❌ | ❌ | ✅ | ✅ |
| ALPHA | Tier 4 | ❌ | ❌ | ❌ | ✅ |
| BALANCED | Tier 1 | ✅ | ✅ | ✅ | ✅ |
| BALANCED | Tier 2 | ✅ | ✅ | ✅ | ✅ |
| BALANCED | Tier 3 | ❌ | ✅ | ✅ | ✅ |
| BALANCED | Tier 4 | ❌ | ❌ | ✅ | ✅ |
| STABLE | Tier 1 | ✅ | ✅ | ✅ | ✅ |
| STABLE | Tier 2 | ✅ | ✅ | ✅ | ✅ |
| STABLE | Tier 3 | ❌ | ✅ | ✅ | ✅ |
| STABLE | Tier 4 | ❌ | ❌ | ✅ | ✅ |
| QUANT | Tier 1 | ❌ | ❌ | ✅ | ✅ |
| QUANT | Tier 2 | ❌ | ❌ | ✅ | ✅ |
| QUANT | Tier 3 | ❌ | ❌ | ✅ | ✅ |
| QUANT | Tier 4 | ❌ | ❌ | ❌ | ✅ |
| INDEX | Tier 1 | ✅ | ✅ | ✅ | ✅ |
| INDEX | Tier 2 | ✅ | ✅ | ✅ | ✅ |
| INDEX | Tier 3 | ❌ | ✅ | ✅ | ✅ |
| INDEX | Tier 4 | ❌ | ❌ | ✅ | ✅ |

## Access Control Formula

```solidity
function canInvest(
    address investor,
    uint256 fundId
) external view returns (bool) {
    InvestorClass investorClass = investorRegistry.getClass(investor);
    FundClass fundClass = fundRegistry.getFundClass(fundId);
    RiskTier fundTier = fundRegistry.getRiskTier(fundId);
    
    // Check investor state
    if (investorStateMachine.getState(investor) != InvestorState.ACTIVE &&
        investorStateMachine.getState(investor) != InvestorState.LIMITED) {
        return false;
    }
    
    // Check compatibility
    RiskTier[] memory allowedTiers = getAccessTiers(investorClass);
    for (uint i = 0; i < allowedTiers.length; i++) {
        if (allowedTiers[i] == fundTier) {
            return true;
        }
    }
    
    return false;
}
```

---

**Related**: [InvestorRegistry](/protocol/contracts/investor/InvestorRegistry), [FundFactory](/protocol/contracts/fund/FundFactory), [Standards Overview](/protocol/standards/overview)

