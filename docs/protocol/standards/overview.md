# Fund Standards & Compliance Overview

Formal specification of rules, standards, and compliance requirements that every TOSS-managed fund must adhere to, ensuring consistent behavior, investor protection, and operational quality.

## Purpose of Fund Standards

### Why Standards Matter

1. **Investor Protection**: Clear expectations for risk and behavior
2. **Comparability**: Standardized metrics enable fund comparison
3. **Quality Assurance**: Minimum operational standards
4. **Regulatory Preparedness**: Framework adaptable to regulation
5. **Market Integrity**: Prevents race-to-bottom behavior

### Standards Enforcement

```
Fund Creation → Standards Assignment → Continuous Monitoring → Violation Handling

Enforcement Mechanisms:
├─ Pre-deployment validation
├─ Real-time RiskEngine checks
├─ Periodic compliance reviews
└─ Slashing for violations
```

## Fund Classification System

### FundClass Types

Each fund belongs to one `FundClass` defining its investment strategy and operational structure:

| FundClass | Description | Target Investor | Typical Assets |
|-----------|-------------|-----------------|----------------|
| **Alpha Fund** | High-risk, high-reward strategies | Risk-tolerant, experienced | Altcoins, leverage, derivatives |
| **Balanced Fund** | Moderate risk, diversified | Retail to institutional | BTC, ETH, stablecoins, top-20 |
| **Stable Fund** | Low-risk, capital preservation | Conservative, institutions | Stablecoins, BTC, ETH only |
| **Quant Fund** | Algorithmic, rule-based trading | Algo traders, institutions | Various, model-dependent |
| **Index Fund** | Passive, predefined basket | All investor types | Fixed basket, minimal rebalancing |

### FundClass Parameters

```solidity
struct FundClassTemplate {
    string name;                      // "Alpha Fund"
    string description;               // Strategy description
    
    // Risk Defaults
    uint256 baseMaxLeverage;          // Default max leverage
    uint256 baseMaxVolatility;        // Default volatility cap
    uint256 baseMaxDrawdown;          // Default drawdown limit
    
    // Operational Defaults
    uint256 minManagementFee;         // Min fee (protects quality)
    uint256 maxManagementFee;         // Max fee (protects investors)
    uint256 minPerformanceFee;        // Min performance fee
    uint256 maxPerformanceFee;        // Max performance fee
    
    // Trading Rules
    uint256 minLockupPeriod;          // Min investor lockup
    uint256 maxDailyTrades;           // Trade frequency limit
    bool requiresKYC;                 // KYC mandatory for this class?
}
```

## Risk Tier System

Each fund is assigned a `RiskTier` independent of its `FundClass`:

### Tier Definitions

```yaml
Tier 1 - Low Risk:
  Max Volatility: 20% annualized
  Max Drawdown: 15%
  Max Leverage: 1.5x
  Allowed Assets: Top 10 by market cap + stablecoins
  Investor Classes: All
  FM Minimum Stake: 10,000 TOSS

Tier 2 - Medium Risk:
  Max Volatility: 40% annualized
  Max Drawdown: 30%
  Max Leverage: 2.5x
  Allowed Assets: Top 50 by market cap
  Investor Classes: Premium+
  FM Minimum Stake: 25,000 TOSS

Tier 3 - High Risk:
  Max Volatility: 80% annualized
  Max Drawdown: 50%
  Max Leverage: 5x
  Allowed Assets: Top 200 by market cap
  Investor Classes: Institutional+
  FM Minimum Stake: 50,000 TOSS

Tier 4 - Extreme Risk:
  Max Volatility: Unlimited
  Max Drawdown: 80%
  Max Leverage: 10x
  Allowed Assets: Any (with liquidity threshold)
  Investor Classes: Strategic only
  FM Minimum Stake: 100,000 TOSS
```

### Risk Tier Assignment

```solidity
function assignRiskTier(uint256 fundId) internal view returns (RiskTier) {
    FundConfig memory config = fundConfigs[fundId];
    
    // Calculate risk score based on parameters
    uint256 riskScore = 
        config.maxLeverage * 20 +
        config.maxVolatility / 2 +
        config.maxDrawdown * 2;
    
    if (riskScore < 50) return RiskTier.Tier1;
    if (riskScore < 100) return RiskTier.Tier2;
    if (riskScore < 200) return RiskTier.Tier3;
    return RiskTier.Tier4;
}
```

## Core Compliance Requirements

### 1. Mandatory FM Stake

```
Minimum Stake = BaseStake(tier) + (AUM × StakeRatio)

Example (Tier 2 fund with $2M AUM):
BaseStake = 25,000 TOSS
StakeRatio = 0.001 (0.1%)
Required = 25,000 + (2,000,000 × 0.001) = 27,000 TOSS
```

**Purpose**: Skin-in-the-game ensures FM accountability

### 2. Allowed Asset Lists

Each tier specifies which assets can be traded:

```typescript
const tier1AllowedAssets = [
  'BTC', 'ETH', 'USDC', 'USDT', 'DAI',  // Top 5
  'BNB', 'SOL', 'ADA', 'AVAX', 'DOT'    // Top 10
];

const tier2AllowedAssets = [
  ...tier1AllowedAssets,
  'MATIC', 'UNI', 'LINK', 'ATOM', 'LTC',  // 11-50
  // ... (top 50 by market cap)
];

// Dynamic: Updated monthly by DAO based on market cap + liquidity
```

**Validation**:
```solidity
function validateAsset(uint256 fundId, address asset) external view returns (bool) {
    RiskTier tier = fundTiers[fundId];
    address[] memory allowed = allowedAssetsByTier[tier];
    
    for (uint i = 0; i < allowed.length; i++) {
        if (allowed[i] == asset) return true;
    }
    return false;
}
```

### 3. Risk Boundaries

All funds must respect their risk limits:

```solidity
struct FundRiskLimits {
    uint256 PSL;   // Position Size Limit (% of NAV)
    uint256 PCL;   // Portfolio Concentration Limit (% of NAV)
    uint256 AEL;   // Asset Exposure Limit (% per asset class)
    
    uint256 maxVolatility;     // Annualized volatility cap
    uint256 maxDrawdown;       // Max drawdown from HWM
    uint256 maxLeverage;       // Leverage ratio cap
    uint256 maxSlippage;       // Max acceptable slippage
    
    uint256 maxDailyTrades;    // Frequency limit
    uint256 minTradeSize;      // Prevents dust trades
    uint256 maxTradeSize;      // Single trade size cap
}
```

**Continuous Monitoring**:
```
Every trade → RiskEngine checks all limits
Periodic review → Recalculate risk metrics
Violation detected → Trigger slashing process
```

## Operational Standards

### 1. NAV Reporting

```yaml
Requirements:
  Frequency: Hourly minimum
  Method: Off-chain calculation, on-chain hash commit
  Validation: Daily snapshot verification
  Deviation Threshold: >3% triggers alert

NAV Calculation:
  NAV = Σ(asset_balance[i] × price[i]) - liabilities
  Price Sources: Multi-oracle weighted average
  Timestamp: Block timestamp at calculation
```

### 2. Exposure Reporting

```typescript
interface FundExposure {
  timestamp: number;
  totalNAV: BigNumber;
  positions: {
    asset: string;
    balance: BigNumber;
    value: BigNumber;  // in USDC
    percentage: number;  // % of NAV
  }[];
  leverage: number;
  volatility: number;  // 30-day trailing
  drawdown: number;    // from HWM
}

// Must update: After each trade + daily snapshot
```

### 3. Performance Reporting

```yaml
Monthly Report:
  - Total Return (%)
  - Sharpe Ratio
  - Maximum Drawdown
  - Volatility (annualized)
  - Number of trades
  - Fee breakdown
  - Benchmark comparison

Quarterly Report:
  - Detailed performance attribution
  - Risk-adjusted metrics
  - Top holdings
  - Trade analysis
  - Compliance summary
```

## FM Eligibility & Certification

### Eligibility Requirements

```typescript
interface FMEligibility {
  // Identity
  walletAddress: string;
  kycStatus: boolean;  // Optional, jurisdiction-dependent
  
  // Experience
  tradingHistory: number;  // Months of verifiable history
  aum Managed: BigNumber;  // Historical AUM managed
  
  // Reputation
  fmScore: number;  // 0-100, composite score
  pastSlashing: number;  // Number of past violations
  
  // Financial
  tossStaked: BigNumber;  // Current TOSS stake
  minStakeMet: boolean;  // Meets tier requirement
}
```

### FM Score (FMS) Calculation

```
FMS = 0.40 × Skill + 0.30 × History + 0.20 × RiskBehavior + 0.10 × Governance

Skill:
├─ Sharpe Ratio of past funds
├─ Risk-adjusted returns
└─ Consistent performance

History:
├─ Years of experience
├─ Total AUM managed
└─ Number of successful funds

RiskBehavior:
├─ Compliance record
├─ Slashing history (negative)
└─ RiskEngine rejection rate (negative)

Governance:
├─ Proposal participation
├─ Voting history
└─ Community reputation
```

### FM Certification Levels

| Level | FMS Required | Max Fund Tier | Max AUM |
|-------|--------------|---------------|---------|
| **Novice** | 0-30 | Tier 1 | $500K |
| **Standard** | 30-50 | Tier 2 | $5M |
| **Advanced** | 50-70 | Tier 3 | $50M |
| **Expert** | 70-85 | Tier 4 | $500M |
| **Master** | 85-100 | All | Unlimited |

## Fund Lifecycle Standards

### 1. Creation Phase

```
Requirements:
├─ FM meets eligibility criteria
├─ FM stake deposited
├─ FundClass and RiskTier assigned
├─ Risk parameters set and validated
├─ Allowed assets verified
└─ Initial audit completed

Timeline: 1-3 days
```

### 2. Active Phase

```
Continuous Monitoring:
├─ Every trade validated by RiskEngine
├─ Hourly NAV calculation
├─ Daily exposure check
├─ Monthly performance review
├─ Quarterly compliance audit

Alerts:
├─ Approaching risk limits (warning)
├─ Limit breach (slashing consideration)
├─ Unusual behavior detected
└─ Oracle price deviation
```

### 3. Prudent Mode

Triggered when:
- Volatility exceeds 150% of limit
- Oracle anomaly detected
- FM suspicious behavior flagged
- Investor panic withdrawals

```solidity
contract FundManagerVault {
    enum FundMode { ACTIVE, PRUDENT, PAUSED }
    
    function enterPrudentMode() external onlyRiskEngine {
        mode = FundMode.PRUDENT;
        
        // Restrictions in prudent mode
        restrictions[fundId] = Restrictions({
            onlyReducingTrades: true,  // Can only reduce positions
            maxSingleTrade: NAV / 100, // 1% of NAV max
            mustApprove: true,         // DAO must approve trades
            noNewInvestors: true       // Block new deposits
        });
    }
}
```

### 4. Closure Phase

```
Fund Closure Triggers:
├─ FM voluntarily closes
├─ FM banned due to violation
├─ Fund fails to meet minimum AUM
├─ DAO forces closure (extreme cases)

Closure Process:
1. Announce closure (7-day notice)
2. Stop accepting new investors
3. Liquidate all positions (orderly)
4. Calculate final NAV
5. Return funds to investors (pro-rata)
6. Release FM stake (minus slashing)
7. Archive fund data
```

## Compliance Violations & Enforcement

### Violation Categories

```yaml
Operational Violations:
  - Late NAV reporting
  - Missing exposure data
  - Incomplete performance reports
  Severity: Low
  Penalty: Warning → Fine → Temporary suspension

Risk Violations:
  - PSL/PCL/AEL breach
  - Volatility or drawdown excess
  - Unauthorized asset trades
  Severity: Medium to High
  Penalty: Slashing (1-50% stake)

Behavior Violations:
  - Suspicious trading patterns
  - Coordinated manipulation
  - Front-running investors
  Severity: High
  Penalty: Slashing (20-100% stake) + Ban

Severe Misconduct:
  - Fraud
  - Theft
  - Market manipulation
  Severity: Critical
  Penalty: 100% slashing + Permanent ban + Legal action
```

### Enforcement Process

```
1. Detection:
   ├─ Automated: RiskEngine flags violation
   └─ Manual: Community or auditor reports

2. Assessment:
   ├─ Calculate FaultIndex
   └─ Determine severity

3. Action:
   ├─ Warning (FI < 0.1)
   ├─ Slashing (FI 0.1-1.0)
   └─ Ban (FI > 0.85 or repeated violations)

4. Appeal:
   ├─ FM can challenge within 7 days
   ├─ DAO reviews evidence
   └─ Final decision via governance vote
```

## Legal & Regulatory Considerations

### Jurisdictional Compliance

```typescript
interface ComplianceFramework {
  region: 'US' | 'EU' | 'UK' | 'ASIA' | 'OTHER';
  kycRequired: boolean;
  amlChecks: boolean;
  accreditedInvestorOnly: boolean;
  maxInvestorCount: number | null;
  reportingRequirements: string[];
}

// Example: US-compliant fund
const usCompliance: ComplianceFramework = {
  region: 'US',
  kycRequired: true,
  amlChecks: true,
  accreditedInvestorOnly: true,  // SEC requirement
  maxInvestorCount: 99,  // 3(c)(1) exemption
  reportingRequirements: ['Form D', 'K-1 annual']
};
```

### Considered Frameworks

- **MiCA (EU)**: Markets in Crypto-Assets Regulation
- **SEC & CFTC (US)**: Securities and derivatives compliance
- **MAS (Singapore)**: Payment Services Act
- **FCA (UK)**: Financial Conduct Authority rules

**Important**: TOSS provides infrastructure only. Fund Managers are responsible for their jurisdictional compliance.

## Standards Roadmap

### Phase 1: Foundation Standards (Current)

- [x] FundClass taxonomy
- [x] RiskTier system
- [x] Core compliance requirements
- [ ] FM certification program

### Phase 2: Advanced Standards (Q3 2025)

- [ ] Strategy-specific sub-classes
- [ ] Dynamic risk tier adjustments
- [ ] Institutional compliance templates
- [ ] Multi-jurisdiction support

### Phase 3: Ecosystem Standards (2026+)

- [ ] Cross-protocol fund standards
- [ ] Synthetic fund products
- [ ] Insurance integration requirements
- [ ] Derivatives and leverage standards

## Next Steps

- **[Fund Classes](/protocol/standards/fund-classes)**: Detailed FundClass specifications
- **[Risk Tiers](/protocol/standards/risk-tiers)**: Complete tier definitions
- **[Compliance](/protocol/standards/compliance)**: Compliance procedures
- **[FM Eligibility](/protocol/standards/fm-eligibility)**: Certification process

---

*For practical fund creation guide, see [Technical Documentation - Smart Contracts](/technical/smart-contracts/deployment).*

