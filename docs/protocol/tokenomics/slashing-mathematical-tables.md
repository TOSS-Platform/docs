# Slashing Mathematical Tables (Volume 3)

## Overview

Comprehensive mathematical models, formulas, and calculation tables for the TOSS Protocol slashing mechanism. This document provides detailed mathematical foundations for FaultIndex calculation, slashing amount computation, NAV compensation, and token burning.

## FaultIndex (FI) Calculation Model

### Core FI Formula

```
FI = wL × L + wB × B + wD × D + wI × I

Where:
- FI: FaultIndex (0-100)
- wL: Weight for Limit Breach (0.45)
- wB: Weight for Behavior Anomaly (0.25)
- wD: Weight for Damage Ratio (0.20)
- wI: Weight for Intent Probability (0.10)
- L: Limit Breach Severity (0-100)
- B: Behavior Anomaly Score (0-100)
- D: Damage Ratio (0-100)
- I: Intent Probability (0-100)
```

### Component Calculations

#### 1. Limit Breach Severity (L)

```
L = Σ(Limit_Violation[i] × Severity_Weight[i])

Where:
- Limit_Violation[i]: Individual limit violation (0 or 1)
- Severity_Weight[i]: Weight for violation type i

Limit Types & Weights:
- Position Size Limit (PSL) breach: 30 points
- Portfolio Concentration Limit (PCL) breach: 25 points
- Asset Exposure Limit (AEL) breach: 20 points
- Volatility limit breach: 15 points
- Drawdown limit breach: 10 points

Maximum L = 100 (if all limits breached)
```

**Calculation Example**:
```
Violations:
- PSL breach (25% position when limit is 20%): 30 points
- Volatility breach (90% when limit is 80%): 15 points

L = 30 + 15 = 45 points
```

#### 2. Behavior Anomaly Score (B)

```
B = max(Pattern_Anomaly, Timing_Anomaly, Velocity_Anomaly)

Where:
- Pattern_Anomaly: Unusual trading patterns (0-100)
- Timing_Anomaly: Suspicious timing behavior (0-100)
- Velocity_Anomaly: Abnormal trade velocity (0-100)

Pattern_Anomaly Calculation:
Pattern_Anomaly = Σ(Pattern_Match_Score[i]) / Pattern_Count

Known Patterns:
- Wash trading: 80 points
- Pump & dump: 75 points
- Front-running: 70 points
- Circular trading: 65 points
```

**Calculation Example**:
```
Detected Patterns:
- Wash trading detected: 80 points
- Circular trading detected: 65 points
- Timing anomaly (after hours): 60 points
- Velocity anomaly (100 trades/hour): 70 points

B = max(80, 65, 60, 70) = 80 points
```

#### 3. Damage Ratio (D)

```
D = min(100, (Actual_Loss / Maximum_Acceptable_Loss) × 100)

Where:
- Actual_Loss: Actual loss from violation (USD)
- Maximum_Acceptable_Loss: Maximum acceptable loss based on risk limits (USD)

Maximum_Acceptable_Loss Calculation:
Max_Loss = NAV × Max_Drawdown_Limit × Risk_Tier_Multiplier

Risk_Tier_Multiplier:
- Tier 1: 1.0
- Tier 2: 1.2
- Tier 3: 1.5
- Tier 4: 2.0
```

**Calculation Example**:
```
Fund Details:
- NAV: $1,000,000
- Risk Tier: Tier 2
- Max Drawdown Limit: 30%
- Actual Loss: $180,000

Maximum_Acceptable_Loss = $1,000,000 × 0.30 × 1.2 = $360,000
D = min(100, ($180,000 / $360,000) × 100) = min(100, 50) = 50 points
```

#### 4. Intent Probability (I)

```
I = 0.4 × Pattern_Match + 0.3 × Timing_Anomaly + 0.2 × Amount_Anomaly + 0.1 × Velocity_Anomaly

Where:
- Pattern_Match: Match with known attack patterns (0-100)
- Timing_Anomaly: Unusual timing patterns (0-100)
- Amount_Anomaly: Unusual amount patterns (0-100)
- Velocity_Anomaly: Unusual velocity patterns (0-100)
```

**Calculation Example**:
```
Detected Anomalies:
- Pattern Match (pump & dump): 75 points
- Timing Anomaly (off-hours): 60 points
- Amount Anomaly (unusual sizes): 50 points
- Velocity Anomaly (spike): 70 points

I = 0.4 × 75 + 0.3 × 60 + 0.2 × 50 + 0.1 × 70
  = 30 + 18 + 10 + 7
  = 65 points
```

### Complete FI Calculation Example

```
Given:
- L = 45 (PSL + Volatility breaches)
- B = 80 (Wash trading detected)
- D = 50 (50% of max acceptable loss)
- I = 65 (Intent detected)

Weights:
- wL = 0.45
- wB = 0.25
- wD = 0.20
- wI = 0.10

Calculation:
FI = 0.45 × 45 + 0.25 × 80 + 0.20 × 50 + 0.10 × 65
   = 20.25 + 20.00 + 10.00 + 6.50
   = 56.75

Rounded: FI = 57 (moderate violation)
```

## FI to Slash Ratio Conversion

### Slash Ratio Formula

```
Slash_Ratio = f(FI)

Where:
f(FI) = {
    0%                      if FI < 30
    1% + (FI - 30) × 9/30   if 30 ≤ FI < 60  (1-10% linear)
    10% + (FI - 60) × 40/25 if 60 ≤ FI < 85  (10-50% linear)
    50% + (FI - 85) × 50/15 if 85 ≤ FI ≤ 100 (50-100% linear)
}
```

### Detailed Slash Ratio Table

| FI Range | Slash Ratio Range | Formula | Example FI | Example Ratio |
|----------|-------------------|---------|------------|---------------|
| 0-29 | 0% | 0% | 25 | 0% |
| 30-59 | 1-10% | 1% + (FI - 30) × 0.3% | 30 | 1% |
| | | | 40 | 4% |
| | | | 50 | 7% |
| | | | 59 | 9.7% |
| 60-84 | 10-50% | 10% + (FI - 60) × 1.6% | 60 | 10% |
| | | | 70 | 26% |
| | | | 80 | 42% |
| | | | 84 | 48.4% |
| 85-100 | 50-100% | 50% + (FI - 85) × 3.33% | 85 | 50% |
| | | | 90 | 66.7% |
| | | | 95 | 83.3% |
| | | | 100 | 100% |

### Slash Ratio Calculation Examples

#### Example 1: Moderate Violation (FI = 45)

```
FI = 45
Range: 30-59 (linear 1-10%)

Slash_Ratio = 1% + (45 - 30) × 9/30
            = 1% + 15 × 0.3%
            = 1% + 4.5%
            = 5.5%
```

#### Example 2: Major Violation (FI = 75)

```
FI = 75
Range: 60-85 (linear 10-50%)

Slash_Ratio = 10% + (75 - 60) × 40/25
            = 10% + 15 × 1.6%
            = 10% + 24%
            = 34%
```

#### Example 3: Critical Violation (FI = 92)

```
FI = 92
Range: 85-100 (linear 50-100%)

Slash_Ratio = 50% + (92 - 85) × 50/15
            = 50% + 7 × 3.33%
            = 50% + 23.33%
            = 73.33%
```

## Slashing Amount Calculation

### Base Slashing Formula

```
Slash_Amount = min(S_base, S_lossCap, S_total)

Where:
- S_base = Stake × Slash_Ratio(FI)
- S_lossCap = α × Fund_Loss / TOSS_Price
- S_total = FM_Total_Stake

α (alpha): Loss cap coefficient (DAO-configurable, default 1.0)
```

### Component Calculations

#### 1. Base Slash (S_base)

```
S_base = FM_Stake × Slash_Ratio

Where:
- FM_Stake: Fund Manager's stake for this fund (TOSS)
- Slash_Ratio: Percentage from FI (0-100%)
```

**Example**:
```
FM Stake: 10,000 TOSS
FI: 50
Slash_Ratio: 7%

S_base = 10,000 × 0.07 = 700 TOSS
```

#### 2. Loss Cap (S_lossCap)

```
S_lossCap = (α × Fund_Loss) / TOSS_Price

Where:
- α: Loss cap coefficient (default 1.0, range 0.5-2.0)
- Fund_Loss: Actual loss from violation (USD)
- TOSS_Price: Current TOSS price (USD, 6 decimals)
```

**Example**:
```
Fund Loss: $50,000
α: 1.0
TOSS Price: $2.00

S_lossCap = (1.0 × $50,000) / $2.00 = 25,000 TOSS
```

#### 3. Total Stake (S_total)

```
S_total = FM_Total_Stake

Where:
- FM_Total_Stake: Total TOSS staked by FM across all funds (TOSS)
```

**Example**:
```
FM has stakes in 3 funds:
- Fund A: 10,000 TOSS
- Fund B: 5,000 TOSS
- Fund C: 8,000 TOSS

S_total = 10,000 + 5,000 + 8,000 = 23,000 TOSS
```

### Complete Slashing Amount Example

```
Scenario:
- FM Stake (Fund A): 10,000 TOSS
- FI: 50
- Fund Loss: $50,000
- TOSS Price: $2.00
- α: 1.0
- FM Total Stake: 23,000 TOSS

Step 1: Calculate Slash_Ratio
Slash_Ratio = 7% (from FI = 50)

Step 2: Calculate S_base
S_base = 10,000 × 0.07 = 700 TOSS

Step 3: Calculate S_lossCap
S_lossCap = (1.0 × $50,000) / $2.00 = 25,000 TOSS

Step 4: Get S_total
S_total = 23,000 TOSS

Step 5: Calculate Slash_Amount
Slash_Amount = min(700, 25,000, 23,000) = 700 TOSS

Result: 700 TOSS will be slashed
```

### Edge Cases

#### Case 1: Loss Cap Limits Slashing

```
Scenario:
- FM Stake: 1,000 TOSS
- FI: 90
- Slash_Ratio: 83.3%
- Fund Loss: $500
- TOSS Price: $2.00
- α: 1.0

S_base = 1,000 × 0.833 = 833 TOSS
S_lossCap = (1.0 × $500) / $2.00 = 250 TOSS
S_total = 1,000 TOSS

Slash_Amount = min(833, 250, 1,000) = 250 TOSS

Result: Slashing capped at 250 TOSS (loss cap limit)
```

#### Case 2: Total Stake Limits Slashing

```
Scenario:
- FM Stake (Fund A): 50,000 TOSS
- FI: 95
- Slash_Ratio: 83.3%
- Fund Loss: $200,000
- TOSS Price: $2.00
- FM Total Stake: 30,000 TOSS (reduced from previous slashings)

S_base = 50,000 × 0.833 = 41,650 TOSS
S_lossCap = (1.0 × $200,000) / $2.00 = 100,000 TOSS
S_total = 30,000 TOSS

Slash_Amount = min(41,650, 100,000, 30,000) = 30,000 TOSS

Result: Slashing capped at 30,000 TOSS (total stake limit)
```

## Slashing Distribution (Burn vs NAV Compensation)

### Distribution Formula

```
Total_Slashed = Burn_Amount + NAV_Compensation_Amount

Where:
- Burn_Amount = Slash_Amount × (1 - γ)
- NAV_Compensation_Amount = Slash_Amount × γ
- γ (gamma): NAV compensation ratio (default 0.80 = 80%)

Default Split:
- 20% burned (deflation)
- 80% to NAV compensation (investor protection)
```

### Distribution Table

| γ (Gamma) | Burn % | NAV Compensation % | Use Case |
|-----------|--------|-------------------|----------|
| 0.50 | 50% | 50% | Balanced approach |
| 0.60 | 40% | 60% | More investor protection |
| 0.70 | 30% | 70% | Heavy investor focus |
| 0.80 (default) | 20% | 80% | Standard (investor protection priority) |
| 0.90 | 10% | 90% | Maximum investor protection |

### Distribution Examples

#### Example 1: Standard Distribution (γ = 0.80)

```
Slash_Amount: 700 TOSS
γ: 0.80

Burn_Amount = 700 × (1 - 0.80) = 700 × 0.20 = 140 TOSS
NAV_Compensation = 700 × 0.80 = 560 TOSS

Total: 140 + 560 = 700 TOSS ✓
```

#### Example 2: High NAV Compensation (γ = 0.90)

```
Slash_Amount: 5,000 TOSS
γ: 0.90

Burn_Amount = 5,000 × (1 - 0.90) = 5,000 × 0.10 = 500 TOSS
NAV_Compensation = 5,000 × 0.90 = 4,500 TOSS

Total: 500 + 4,500 = 5,000 TOSS ✓
```

## NAV Compensation Calculation

### NAV Compensation Formula

```
NAV_Compensation_USD = (Slash_Amount × γ × TOSS_Price) / 1e18

Where:
- Slash_Amount: Amount slashed (TOSS, 18 decimals)
- γ: NAV compensation ratio (0.80 default)
- TOSS_Price: Current TOSS price (USD, 6 decimals)

After conversion:
NAV_Compensation_USD is converted to USDC and added to fund vault
```

### NAV Recovery Example

```
Scenario:
- Fund NAV before violation: $1,000,000
- Violation caused loss: $50,000
- NAV after loss: $950,000
- Slash_Amount: 700 TOSS
- γ: 0.80
- TOSS_Price: $2.00

Step 1: Calculate NAV Compensation
NAV_Compensation_TOSS = 700 × 0.80 = 560 TOSS
NAV_Compensation_USD = 560 × $2.00 = $1,120

Step 2: Recover NAV
NAV_recovered = $950,000 + $1,120 = $951,120

Step 3: Calculate Recovery %
Recovery % = ($1,120 / $50,000) × 100 = 2.24%

Note: NAV compensation partially recovers loss (not 100% recovery)
```

## Cumulative Slashing Table

### Multiple Slashing Events

When a Fund Manager receives multiple slashing events:

```
Total_Slashed = Σ(Slash_Amount[i])

Where:
- Slash_Amount[i]: Slashing amount for event i
- Slashing events are independent
- Each event reduces available stake
```

### Cumulative Slashing Example

```
Initial Stake: 20,000 TOSS

Event 1 (Day 1):
- FI: 45
- Slash_Amount: 1,000 TOSS
- Remaining Stake: 19,000 TOSS

Event 2 (Day 5):
- FI: 60
- Slash_Amount: 2,500 TOSS (based on 19,000 remaining)
- Remaining Stake: 16,500 TOSS

Event 3 (Day 10):
- FI: 85
- Slash_Amount: 8,250 TOSS (50% of 16,500)
- Remaining Stake: 8,250 TOSS

Total Slashed: 1,000 + 2,500 + 8,250 = 11,750 TOSS
Total Burned: 11,750 × 0.20 = 2,350 TOSS
Total to NAV: 11,750 × 0.80 = 9,400 TOSS
```

## Ban Threshold Calculation

### FM Ban Rules

```
Ban_Trigger = (FI ≥ Ban_Threshold) OR (Cumulative_Violations ≥ Ban_Limit)

Where:
- Ban_Threshold: Default 85 (DAO-configurable, range 75-95)
- Ban_Limit: Default 3 critical violations (FI ≥ 85) in 30 days
```

### Ban Calculation Table

| FI | Slash % | Ban? | Notes |
|----|---------|------|-------|
| 0-29 | 0% | No | Warning only |
| 30-59 | 1-10% | No | Moderate violation |
| 60-84 | 10-50% | No | Major violation |
| 85-89 | 50-83% | Yes | Critical violation, auto-ban |
| 90-94 | 83-97% | Yes | Severe violation, auto-ban |
| 95-100 | 97-100% | Yes | Extreme violation, auto-ban |

### Cumulative Ban Example

```
Day 1: FI = 85 → Ban? Yes (auto-ban on first FI ≥ 85)
Day 5: FI = 90 → Ban? Already banned
Day 10: FI = 88 → Ban? Already banned

Result: FM banned permanently from Day 1
```

## Gas Cost Calculations

### Slashing Gas Cost

```
Slashing_Gas = Base_Gas + Burn_Gas + Transfer_Gas + Event_Gas

Where:
- Base_Gas: ~50,000 (calculation, validation)
- Burn_Gas: ~30,000 (token burn)
- Transfer_Gas: ~50,000 (transfer to treasury)
- Event_Gas: ~10,000 (event emission)

Total: ~140,000 gas per slashing event
Cost: ~140,000 × $0.000000025 = ~$0.0035 per slashing
```

## Mathematical Proofs

### Proof 1: Slash Amount Boundedness

```
Claim: Slash_Amount ≤ FM_Stake

Proof:
Slash_Amount = min(S_base, S_lossCap, S_total)

S_base = Stake × Slash_Ratio
Since Slash_Ratio ≤ 1.0 (100%):
S_base ≤ Stake

Also: S_total = Total_Stake ≥ Stake

Therefore:
Slash_Amount = min(S_base, S_lossCap, S_total) ≤ min(Stake, ...) ≤ Stake

QED: Slash_Amount cannot exceed FM_Stake
```

### Proof 2: NAV Compensation Conservation

```
Claim: Burn_Amount + NAV_Compensation = Slash_Amount

Proof:
Burn_Amount = Slash_Amount × (1 - γ)
NAV_Compensation = Slash_Amount × γ

Sum:
Burn_Amount + NAV_Compensation = Slash_Amount × (1 - γ) + Slash_Amount × γ
                                = Slash_Amount × (1 - γ + γ)
                                = Slash_Amount × 1
                                = Slash_Amount

QED: Total slashed equals burn plus compensation (conservation)
```

---

**Related**: [SlashingEngine](/protocol/contracts/risk/SlashingEngine), [RiskEngine](/protocol/contracts/risk/RiskEngine), [Tokenomics Overview](/protocol/tokenomics/overview)

