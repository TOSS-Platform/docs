# Config Layer

## Overview

The Config Layer contains all DAO-adjustable parameters that tune the protocol's economic behavior within predefined safe ranges. Stored in `DAOConfigCore.sol`.

## Purpose

Configuration layer enables:
- ✅ DAO optimization of parameters
- ✅ Adaptation to market conditions
- ✅ Fine-tuning based on real data
- ✅ Recovery from suboptimal values
- ❌ Without compromising formula integrity

## DAOConfigCore.sol Structure

```solidity
contract DAOConfigCore {
    struct TokenomicsConfig {
        // === Slashing Parameters ===
        uint256 gamma;              // NAV compensation ratio
        uint256 alpha;              // Loss cap coefficient
        uint256 minSlashingFI;      // Min FI to trigger slash
        uint256 banThresholdFI;     // FI for permanent ban
        
        // === Stake Requirements ===
        uint256 fmBaseStake;        // Base FM stake
        uint256 stakePerAUMRatio;   // Additional stake per AUM
        
        // === FaultIndex Weights ===
        uint256 weightL;            // Limit breach weight
        uint256 weightB;            // Behavior anomaly weight
        uint256 weightD;            // Damage ratio weight
        uint256 weightI;            // Intent probability weight
        
        // === Fee Limits ===
        uint256 maxProtocolFee;     // Protocol fee cap
        mapping(RiskTier => uint256) maxManagementFee;   // Per tier
        mapping(RiskTier => uint256) maxPerformanceFee;  // Per tier
    }
    
    TokenomicsConfig public config;
}
```

## All Configurable Parameters

### 1. Slashing Parameters

#### gamma (γ) - NAV Compensation Ratio

```yaml
Parameter: gamma
Purpose: Determines burn vs NAV compensation split
Formula: Burn = Slash × (1-γ), NAVComp = Slash × γ

Range: 50-90% (0.5-0.9 as decimal)
Default: 80% (0.8)
Unit: Basis points (8000 = 80%)

Governance: Protocol-level
Change Limit: Max 10% per proposal
Cooldown: 90 days between changes
```

**Example Values**:
```
γ = 50%: Burn 50%, NAV Comp 50% (aggressive deflation)
γ = 80%: Burn 20%, NAV Comp 80% (default, balanced)
γ = 90%: Burn 10%, NAV Comp 90% (max investor protection)
```

**Impact**:
- **Higher γ**: More investor protection, less deflation
- **Lower γ**: More deflation, less NAV compensation
- **Tradeoff**: Investor safety vs token scarcity

#### alpha (α) - Loss Cap Coefficient

```yaml
Parameter: alpha
Purpose: Limits slashing based on actual fund loss
Formula: LossCap = α × FundLoss / TOSS_Price

Range: 0.5-2.0
Default: 1.0
Unit: Decimal (1.0 = 100%)

Governance: Protocol-level
Change Limit: Max 25% per proposal
Cooldown: 90 days
```

**Example**:
```
Fund loses $100k
TOSS price = $0.10
α = 1.0

LossCap = 1.0 × 100,000 / 0.10 = 1,000,000 TOSS

If calculated slash > 1M TOSS, cap at 1M
```

**Impact**:
- **Higher α**: More slashing possible (harsher)
- **Lower α**: Less slashing (more lenient)

#### minSlashingFI - Minimum FaultIndex for Slashing

```yaml
Parameter: minSlashingFI
Purpose: FI threshold to trigger slashing
Formula: If FI >= minSlashingFI, trigger slash

Range: 20-50
Default: 30
Unit: FaultIndex points (0-100 scale)

Governance: Protocol-level
Change Limit: Max 20% per proposal
Cooldown: 60 days
```

**Impact**:
- **Lower threshold**: More sensitive, slash earlier
- **Higher threshold**: More lenient, slash only for serious violations

#### banThresholdFI - Permanent Ban Threshold

```yaml
Parameter: banThresholdFI
Purpose: FI that results in permanent FM ban

Range: 75-95
Default: 85
Unit: FaultIndex points

Governance: Protocol-level
Change Limit: Max 10% per proposal
Cooldown: 180 days (rarely changed)
```

### 2. Stake Requirements

#### fmBaseStake - Base FM Stake

```yaml
Parameter: fmBaseStake
Purpose: Minimum TOSS stake to create fund

Range: 5,000-100,000 TOSS
Default: 10,000 TOSS
Unit: TOSS tokens (18 decimals)

Governance: FM-Level (FMs vote)
Change Limit: Max 20% per proposal
Cooldown: 30 days
```

**Current**: 10,000 TOSS (~$1,000 at $0.10/TOSS)

**Rationale**:
- High enough to deter bad actors
- Low enough for talented new FMs
- Scales with AUM (via stakePerAUMRatio)

#### stakePerAUMRatio - Additional Stake per AUM

```yaml
Parameter: stakePerAUMRatio
Purpose: Additional stake required per $ of AUM

Range: 5-20 basis points (0.05%-0.2%)
Default: 10 basis points (0.1%)
Unit: Basis points

Governance: FM-Level
Change Limit: Max 50% per proposal
Cooldown: 30 days
```

**Example**:
```
$1M fund, ratio = 10 bps
Additional stake = $1,000,000 × 0.001 = 1,000 TOSS
Total required = 10,000 (base) + 1,000 = 11,000 TOSS
```

### 3. FaultIndex Weights

#### weightL - Limit Breach Weight

```yaml
Parameter: weightL
Purpose: Weight for limit violations in FI calculation

Range: 40-50%
Default: 45%
Unit: Percentage (4500 = 45%)

Governance: Protocol-level
Constraint: wL + wB + wD + wI must = 100%
```

**Impact**: Higher weight = limit breaches penalized more severely

#### weightB - Behavior Anomaly Weight

```yaml
Range: 20-30%
Default: 25%
```

**Impact**: Higher weight = unusual behavior flagged more

#### weightD - Damage Ratio Weight

```yaml
Range: 15-25%
Default: 20%
```

**Impact**: Higher weight = actual losses matter more

#### weightI - Intent Probability Weight

```yaml
Range: 5-15%
Default: 10%
```

**Impact**: Higher weight = malicious intent punished more

**Constraint**: Sum must equal 100%
```
weightL + weightB + weightD + weightI = 100%
```

### 4. Fee Limits

#### maxProtocolFee

```yaml
Parameter: maxProtocolFee
Purpose: Maximum protocol fee rate

Range: 0-100 basis points (0-1%)
Default: 10 basis points (0.1%)

Governance: Protocol-level (Investor vote)
Change Limit: Max 25% per proposal
Cooldown: 90 days
```

#### maxManagementFee (per RiskTier)

```yaml
Tier 1: 0-200 bps (0-2%)
Tier 2: 0-250 bps (0-2.5%)
Tier 3: 0-300 bps (0-3%)
Tier 4: 0-300 bps (0-3%)

Governance: FM-Level
```

#### maxPerformanceFee (per RiskTier)

```yaml
Tier 1: 0-2000 bps (0-20%)
Tier 2: 0-2500 bps (0-25%)
Tier 3: 0-3000 bps (0-30%)
Tier 4: 0-3000 bps (0-30%)

Governance: FM-Level
```

## Parameter Access Pattern

### Reading Parameters

```solidity
// In SlashingEngine.sol
contract SlashingEngine {
    IDAOConfigCore public daoConfig;
    
    function calculateSlashing(...) public view returns (uint256) {
        // Read current config values
        uint256 gamma = daoConfig.getGamma();
        uint256 alpha = daoConfig.getAlpha();
        uint256 minFI = daoConfig.getMinSlashingFI();
        
        // Use in immutable formula
        if (FI < minFI) return 0;
        uint256 slash = _calculateWithParams(gamma, alpha, ...);
        return slash;
    }
}
```

### Changing Parameters

```solidity
// Via ProtocolGovernance
await protocolGovernance.createProposal(
    ProposalType.TOKENOMICS_PARAMETER,
    VoterGroup.BOTH,  // Everyone votes on tokenomics
    [daoConfigCore.address],
    [0],
    [daoConfigCore.interface.encodeFunctionData("setGamma", [8500])],  // 85%
    "Increase NAV compensation to 85%"
);
```

**Validation in DAOConfigCore**:
```solidity
function setGamma(uint256 newGamma) external onlyGovernance {
    require(newGamma >= 5000 && newGamma <= 9000, "Out of range");  // 50-90%
    
    uint256 oldGamma = config.gamma;
    uint256 maxChange = oldGamma * 10 / 100;  // Max 10% change
    require(abs(int(newGamma) - int(oldGamma)) <= maxChange, "Change too large");
    
    require(block.timestamp >= lastGammaChange + 90 days, "Cooldown not passed");
    
    config.gamma = newGamma;
    lastGammaChange = block.timestamp;
    
    emit GammaUpdated(oldGamma, newGamma);
}
```

## Parameter Change Examples

### Example 1: Adjust NAV Compensation

**Scenario**: Data shows 80% NAV compensation sufficient, could increase deflation

**Current**: γ = 80%  
**Proposed**: γ = 75%

**Effect**:
- Burn increases: 20% → 25%
- NAV comp decreases: 80% → 75%
- More deflationary pressure
- Slightly less investor protection

**Governance Process**:
1. Admin proposes via ProtocolGovernance
2. Both FMs and Investors vote (14 days)
3. Guardian reviews (24h)
4. Timelock (72h - critical parameter)
5. Execute

**Vote Outcome**: If >66% approve, executes

### Example 2: Increase FM Base Stake

**Scenario**: Too many low-quality FMs, raise quality bar

**Current**: 10,000 TOSS  
**Proposed**: 15,000 TOSS

**Effect**:
- Higher barrier to entry
- Better FM quality
- More security budget
- May reduce FM count

**Governance Process**:
1. FM proposes via FMGovernance
2. Only FMs vote (AUM-weighted, 7 days)
3. Timelock (48h)
4. Execute

**Transition**: 90-day grace period for existing FMs

### Example 3: Adjust FI Weights

**Scenario**: Behavioral issues more critical than thought

**Current**: wL=45%, wB=25%, wD=20%, wI=10%  
**Proposed**: wL=45%, wB=30%, wD=20%, wI=5%

**Effect**:
- Behavior anomalies weighted more heavily
- Intent weighted less
- May catch suspicious patterns earlier

**Constraint**: Must sum to 100%

## Parameter Bounds Enforcement

```solidity
contract DAOConfigCore {
    struct ParameterBounds {
        uint256 min;
        uint256 max;
        uint256 maxChangePercent;  // Max % change per proposal
        uint256 cooldownPeriod;     // Min time between changes
    }
    
    mapping(bytes32 => ParameterBounds) public bounds;
    
    constructor() {
        // Set bounds for gamma
        bounds[keccak256("gamma")] = ParameterBounds({
            min: 5000,      // 50%
            max: 9000,      // 90%
            maxChangePercent: 10,  // 10% max change
            cooldownPeriod: 90 days
        });
        
        // ... set bounds for all parameters
    }
    
    modifier withinBounds(bytes32 paramName, uint256 newValue) {
        ParameterBounds memory bound = bounds[paramName];
        require(newValue >= bound.min && newValue <= bound.max, "Out of range");
        _;
    }
}
```

## Default Configuration

**Initial deployment values**:

```typescript
const defaultConfig = {
  // Slashing
  gamma: 8000,           // 80%
  alpha: 10000,          // 1.0
  minSlashingFI: 30,
  banThresholdFI: 85,
  
  // Stakes
  fmBaseStake: ethers.utils.parseEther("10000"),
  stakePerAUMRatio: 10,  // 0.1%
  
  // FI Weights
  weightL: 45,
  weightB: 25,
  weightD: 20,
  weightI: 10,
  
  // Fees
  maxProtocolFee: 10,    // 0.1%
  maxManagementFeeTier1: 200,  // 2%
  maxPerformanceFeeTier1: 2000, // 20%
};
```

## Parameter History Tracking

```solidity
struct ParameterChange {
    bytes32 parameter;
    uint256 oldValue;
    uint256 newValue;
    uint256 timestamp;
    uint256 proposalId;
    address executor;
}

ParameterChange[] public changeHistory;

event ParameterUpdated(
    bytes32 indexed parameter,
    uint256 oldValue,
    uint256 newValue,
    uint256 proposalId
);
```

**Query History**:
```solidity
function getParameterHistory(bytes32 parameter) 
    external 
    view 
    returns (ParameterChange[] memory);
```

**Use Case**: Analyze impact of parameter changes over time

## Who Can Change What

| Parameter | Governance Level | Voter Group |
|-----------|------------------|-------------|
| gamma (γ) | Protocol | BOTH (FMs + Investors) |
| alpha (α) | Protocol | FM_ONLY |
| minSlashingFI | Protocol | FM_ONLY |
| banThresholdFI | Protocol | BOTH |
| fmBaseStake | FM-Level | FMs only (AUM-weighted) |
| stakePerAUMRatio | FM-Level | FMs only |
| FI Weights | Protocol | BOTH |
| Fee Limits | Protocol/FM | Depends on scope |

## Parameter Change Process

Detailed in [Protocol Proposal Process](/docs/protocol/processes/governance/protocol-proposal).

**Summary**:
1. **Proposal**: Admin or FM creates proposal
2. **Discussion**: 7-day community discussion
3. **Voting**: 14-day voting period
4. **Guardian Review**: 24-hour window
5. **Timelock**: 48-72 hours
6. **Execution**: Parameter updated within bounds
7. **Verification**: Confirm change applied correctly

## Security Safeguards

### 1. Range Enforcement

```solidity
function setGamma(uint256 newGamma) external onlyGovernance {
    require(newGamma >= 5000 && newGamma <= 9000, "Out of range");
    // Can never set gamma to 0% or 100%
    // Bounded: 50-90%
}
```

**Prevents**: Extreme values that break economics

### 2. Change Magnitude Limits

```solidity
uint256 maxChange = currentValue * maxChangePercent / 100;
require(abs(newValue - currentValue) <= maxChange, "Change too large");
```

**Prevents**: Sudden dramatic shifts

### 3. Cooldown Periods

```solidity
require(block.timestamp >= lastChange + cooldownPeriod, "Cooldown active");
```

**Prevents**: Rapid repeated changes, governance attacks

### 4. Weight Sum Validation

```solidity
function setFIWeights(uint256 wL, uint256 wB, uint256 wD, uint256 wI) 
    external 
    onlyGovernance 
{
    require(wL + wB + wD + wI == 100, "Weights must sum to 100");
    // Ensures FI calculation remains valid
}
```

**Prevents**: Invalid FI calculations

## Simulation & Impact Analysis

Before proposing parameter changes, simulate impact:

```typescript
// Simulation tool
async function simulateParameterChange(param, newValue) {
  // Historical data
  const violations = await getHistoricalViolations();
  
  // Recalculate with new parameter
  for (const violation of violations) {
    const oldSlash = calculateSlashing(violation, currentConfig);
    const newSlash = calculateSlashing(violation, {...currentConfig, [param]: newValue});
    
    console.log(`Violation ${violation.id}:`);
    console.log(`  Old slash: ${oldSlash}`);
    console.log(`  New slash: ${newSlash}`);
    console.log(`  Difference: ${newSlash - oldSlash}`);
  }
  
  // Aggregate impact
  return {
    totalSlashingChange,
    affectedFMsCount,
    investorImpact,
    deflationImpact,
  };
}
```

**Best Practice**: Always simulate before proposing

## Related Documentation

- **[Immutable Layer](/docs/protocol/tokenomics/immutable-layer)**: Fixed formulas
- **[Logic Layer](/docs/protocol/tokenomics/logic-layer)**: Implementation patterns
- **[DAOConfigCore Contract](/docs/protocol/contracts/core/DAOConfigCore)**: Contract specification
- **[Protocol Governance](/docs/protocol/governance/dao-structure)**: How to change parameters

---

**Back**: [Tokenomics Overview](/docs/protocol/tokenomics/overview)

**Next**: [Logic Layer](/docs/protocol/tokenomics/logic-layer)

