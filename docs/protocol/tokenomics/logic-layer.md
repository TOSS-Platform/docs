# Logic Layer

## Overview

The Logic Layer implements immutable formulas using configurable parameters from the Config Layer. Contracts read current config values and apply them to fixed formula structures.

## Purpose

Logic Layer provides:
- ✅ Immutable formula implementation
- ✅ Dynamic parameter reading from config
- ✅ Separation of logic and data
- ✅ Secure integration pattern
- ✅ Testable and verifiable behavior

## Architecture Pattern

```
Immutable Formula (Layer 1) + Config Parameters (Layer 2) = Execution Result (Layer 3)
```

### Pattern: Read-Apply-Return

```solidity
contract LogicContract {
    IDAOConfigCore public immutable daoConfig;
    
    // Immutable formula implementation
    function calculate(...) public view returns (uint256) {
        // Step 1: Read config (mutable parameters)
        uint256 param1 = daoConfig.getParameter1();
        uint256 param2 = daoConfig.getParameter2();
        
        // Step 2: Apply immutable formula
        uint256 result = _applyFormula(input, param1, param2);
        
        // Step 3: Return result
        return result;
    }
    
    // Formula logic is immutable (pure function)
    function _applyFormula(uint256 input, uint256 p1, uint256 p2) 
        internal 
        pure 
        returns (uint256) 
    {
        // Immutable mathematical operations
        return (input * p1) / p2;
    }
}
```

## Implementation Examples

### 1. SlashingEngine Integration

```solidity
contract SlashingEngine {
    IDAOConfigCore public immutable daoConfig;
    ITOSS public immutable tossToken;
    
    /**
     * @notice Calculate slashing amount
     * @dev Reads gamma, alpha from config
     */
    function calculateSlashing(
        uint256 stake,
        uint256 faultIndex,
        uint256 fundLoss
    ) public view returns (uint256 slashAmount) {
        // Read Config Layer (Layer 2)
        uint256 gamma = daoConfig.getGamma();
        uint256 alpha = daoConfig.getAlpha();
        uint256 minFI = daoConfig.getMinSlashingFI();
        
        // Check threshold (config)
        if (faultIndex < minFI) return 0;
        
        // Apply Immutable Formula (Layer 1)
        uint256 slashRatio = _getSlashRatio(faultIndex);  // Immutable
        uint256 baseSlash = stake * slashRatio / 100;
        
        // Loss cap using alpha (config)
        uint256 tossPrice = _getTOSSPrice();
        uint256 lossCap = (alpha * fundLoss) / tossPrice;
        
        // Immutable min() logic
        slashAmount = _min3(baseSlash, lossCap, stake);
        
        return slashAmount;
    }
    
    /**
     * @notice Get slash ratio from FI
     * @dev Immutable interpolation logic
     */
    function _getSlashRatio(uint256 fi) internal pure returns (uint256) {
        // Immutable piecewise linear function
        if (fi < 30) return 0;
        if (fi < 60) return ((fi - 30) * 10) / 30;       // 1-10%
        if (fi < 85) return 10 + ((fi - 60) * 40) / 25;  // 10-50%
        return 50 + ((fi - 85) * 50) / 15;                // 50-100%
        
        // Structure immutable, only minFI from config
    }
    
    /**
     * @notice Execute slashing with burn/compensation split
     * @dev Uses gamma from config
     */
    function executeSlashing(uint256 fundId, uint256 FI) 
        external 
        onlyRiskEngine 
        returns (uint256 slashed) 
    {
        // Calculate slash
        slashed = calculateSlashing(stake, FI, fundLoss);
        
        // Read gamma from config
        uint256 gamma = daoConfig.getGamma();
        
        // Apply immutable split formula
        uint256 toBurn = slashed * (10000 - gamma) / 10000;
        uint256 toNAV = slashed - toBurn;
        
        // Execute
        tossToken.burn(fm, toBurn);            // Layer 1 (immutable)
        tossToken.transfer(treasury, toNAV);   // Layer 1 (immutable)
        
        emit Slashed(fundId, slashed, toBurn, toNAV);
        return slashed;
    }
}
```

### 2. RiskEngine Integration

```solidity
contract RiskEngine {
    IDAOConfigCore public immutable daoConfig;
    
    /**
     * @notice Calculate FaultIndex
     * @dev Reads weights from config
     */
    function calculateFaultIndex(
        uint256 limitBreach,      // L: 0-100
        uint256 behaviorAnomaly,  // B: 0-100
        uint256 damageRatio,      // D: 0-100
        uint256 intentProb        // I: 0-100
    ) public view returns (uint256 faultIndex) {
        // Read Config Layer (Layer 2)
        uint256 wL = daoConfig.getWeightL();
        uint256 wB = daoConfig.getWeightB();
        uint256 wD = daoConfig.getWeightD();
        uint256 wI = daoConfig.getWeightI();
        
        // Apply Immutable Formula (Layer 1)
        // FI = wL×L + wB×B + wD×D + wI×I
        faultIndex = (
            limitBreach * wL +
            behaviorAnomaly * wB +
            damageRatio * wD +
            intentProb * wI
        ) / 100;
        
        return faultIndex;
    }
    
    /**
     * @notice Validate trade
     * @dev Uses configured thresholds
     */
    function validateTrade(uint256 fundId, TradeParams calldata params) 
        external 
        returns (bool approved, uint256 fi) 
    {
        // Calculate FI (reads config weights)
        fi = _calculateFIForTrade(fundId, params);
        
        // Read thresholds from config
        uint256 warnThreshold = daoConfig.getWarningThreshold();      // e.g., 10
        uint256 slashThreshold = daoConfig.getMinSlashingFI();        // e.g., 30
        
        // Immutable decision logic
        if (fi < warnThreshold) {
            return (true, fi);  // Approve, no warning
        }
        else if (fi < slashThreshold) {
            emit RiskWarning(fundId, fi);
            return (true, fi);  // Approve with warning
        }
        else {
            slashingEngine.executeSlashing(fundId, fi);
            return (false, fi);  // Reject + slash
        }
    }
}
```

### 3. FundFactory Integration

```solidity
contract FundFactory {
    IDAOConfigCore public immutable daoConfig;
    
    /**
     * @notice Get required stake for fund
     * @dev Reads base stake and ratio from config
     */
    function getRequiredStake(uint256 projectedAUM) 
        public 
        view 
        returns (uint256) 
    {
        // Read Config Layer (Layer 2)
        uint256 baseStake = daoConfig.getFMBaseStake();
        uint256 ratioInBPS = daoConfig.getStakePerAUMRatio();
        
        // Apply Immutable Formula (Layer 1)
        // RequiredStake = Base + (AUM × Ratio)
        uint256 additionalStake = (projectedAUM * ratioInBPS) / 10000;
        uint256 totalRequired = baseStake + additionalStake;
        
        return totalRequired;
    }
    
    /**
     * @notice Create fund
     * @dev Validates stake using current config
     */
    function createFund(FundConfig memory config, uint256 stakeAmount) 
        external 
        returns (address fundAddress, uint256 fundId) 
    {
        // Calculate required stake (reads config)
        uint256 required = getRequiredStake(config.projectedAUM);
        
        // Immutable validation
        require(stakeAmount >= required, "Insufficient stake");
        
        // ... rest of fund creation
    }
}
```

## Benefits of This Pattern

### For Security

**Immutable Formula Protection**:
```solidity
// Formula cannot be changed
function _applyFormula() internal pure {
    // Pure function = no state, no config reads
    // Completely deterministic
    // Audit once, trust forever
}
```

**Config Reading**:
```solidity
// Config can be updated, but formula unchanged
uint256 param = daoConfig.getParam();  // May change over time
result = _applyFormula(input, param);  // Formula never changes
```

**Result**: Security + Flexibility

### For Auditability

**Clear Separation**:
```
Audit Immutable Layer:
- Verify formula logic correct
- Check for vulnerabilities
- ONE-TIME AUDIT

Audit Config Layer:
- Verify parameter bounds
- Check governance controls
- RE-AUDIT on parameter logic changes only

Audit Logic Layer:
- Verify config reading secure
- Check integration patterns
- RE-AUDIT on contract upgrades only
```

**Efficiency**: Most code needs one-time audit

### For Testing

**Test Formula Logic**:
```typescript
// Test with different config values
it("should calculate slashing correctly with gamma=80%", async () => {
  await daoConfig.setGamma(8000);
  const slash = await slashingEngine.calculateSlashing(10000, 50, 5000);
  expect(slash).to.equal(expectedValue);
});

it("should calculate slashing correctly with gamma=75%", async () => {
  await daoConfig.setGamma(7500);
  const slash = await slashingEngine.calculateSlashing(10000, 50, 5000);
  expect(slash).to.equal(differentExpectedValue);
});

// Formula logic tested once, config variations tested separately
```

## Integration Contract Pattern

### Standard Pattern

Every logic layer contract follows this pattern:

```solidity
contract LogicLayerContract {
    // Immutable reference to config
    IDAOConfigCore public immutable daoConfig;
    
    constructor(address _daoConfig) {
        daoConfig = IDAOConfigCore(_daoConfig);
    }
    
    // Public function reads config + applies formula
    function publicOperation(...) external returns (...) {
        uint256 configParam = daoConfig.getParameter();
        return _applyImmutableLogic(..., configParam);
    }
    
    // Private/Internal: Pure immutable logic
    function _applyImmutableLogic(..., uint256 param) 
        internal 
        pure 
        returns (...) 
    {
        // No state reads, no external calls
        // Pure mathematical operations
        // Completely deterministic
    }
}
```

### Anti-Pattern (Don't Do This)

```solidity
// ❌ BAD: Hardcoded parameters
contract BadContract {
    uint256 constant GAMMA = 8000;  // Cannot change without redeployment
    
    function calculate() public view returns (uint256) {
        return value * GAMMA / 10000;
    }
}

// ❌ BAD: Formula in config
contract BadConfig {
    function calculateSlashing() external view returns (uint256) {
        // Formula logic in config = can be manipulated
        return stake * ratio;  // DAO could change this to anything
    }
}
```

**Why Bad?**:
- First example: No flexibility
- Second example: No security (DAO can manipulate formula)

**Correct Way** (Layer separation):
```solidity
// ✓ GOOD: Formula immutable, parameters configurable
contract GoodContract {
    IDAOConfigCore public immutable daoConfig;
    
    function calculate() public view returns (uint256) {
        uint256 gamma = daoConfig.getGamma();  // Configurable
        return _formula(value, gamma);          // Immutable
    }
    
    function _formula(uint256 v, uint256 g) internal pure returns (uint256) {
        return v * g / 10000;  // Formula structure cannot change
    }
}
```

## Config Reading Performance

### Gas Optimization

```solidity
// Cache config reads when possible
function batchOperation(uint256[] calldata items) external {
    // Read once (SLOAD = expensive)
    uint256 gamma = daoConfig.getGamma();
    uint256 alpha = daoConfig.getAlpha();
    
    // Use many times (memory = cheap)
    for (uint i = 0; i < items.length; i++) {
        results[i] = _calculate(items[i], gamma, alpha);
    }
}
```

**Gas Savings**: 2,100 gas per cached read (vs re-reading each time)

### View Function Optimization

```solidity
// For view functions, no caching needed (no gas cost)
function calculateView(...) public view returns (...) {
    uint256 param = daoConfig.getParam();  // Free in view
    return _formula(..., param);
}
```

## Example: Complete Slashing Flow

```solidity
// 1. RiskEngine detects violation
uint256 fi = riskEngine.calculateFaultIndex(L, B, D, I);
// Uses config weights (Layer 2) in immutable formula (Layer 1)

// 2. Check if slashing needed
uint256 minFI = daoConfig.getMinSlashingFI();  // Layer 2
if (fi >= minFI) {  // Layer 1 logic
    // 3. Calculate slash
    uint256 slash = slashingEngine.calculateSlashing(stake, fi, loss);
    // Reads gamma, alpha from config (Layer 2)
    // Applies immutable formula (Layer 1)
    
    // 4. Execute split
    uint256 gamma = daoConfig.getGamma();  // Layer 2
    uint256 burn = slash * (10000 - gamma) / 10000;  // Layer 1 formula
    uint256 navComp = slash - burn;  // Layer 1 formula
    
    // 5. Burn and compensate
    tossToken.burn(fm, burn);  // Layer 1 (immutable token)
    tossToken.transfer(treasury, navComp);  // Layer 1
}
```

**Layers Working Together**:
- Config provides `gamma`, `alpha`, `minFI` (adjustable)
- Formulas provide structure and logic (fixed)
- Result: Secure + flexible execution

## Config Update Impact

### When Config Changes

```
Old Config: gamma = 80%
New Config: gamma = 85%

Impact on SlashingEngine:
- Next slashing uses 85% (automatic)
- Old slashings unaffected (already executed)
- No code changes needed
- No redeployment needed
- Immediate effect on next slash
```

**Example Timeline**:
```
Day 1: gamma = 80%, FM slashed → 20% burn, 80% NAV
Day 30: DAO proposes gamma = 85%
Day 50: Proposal passes, gamma now 85%
Day 51: FM slashed → 15% burn, 85% NAV (new config used)
```

**Smooth Transition**: No disruption, immediate application

## Testing Strategy

### Test Layers Separately

**Test Layer 1 (Formulas)**:
```typescript
describe("Immutable Formulas", () => {
  it("should calculate burn correctly with any gamma", () => {
    expect(_calculateBurn(1000, 8000)).to.equal(200);  // 20%
    expect(_calculateBurn(1000, 7500)).to.equal(250);  // 25%
    expect(_calculateBurn(1000, 9000)).to.equal(100);  // 10%
    // Formula works with any valid gamma
  });
});
```

**Test Layer 2 (Config)**:
```typescript
describe("Config Layer", () => {
  it("should enforce gamma bounds", async () => {
    await expect(
      daoConfig.setGamma(4000)  // 40% < 50% min
    ).to.be.revertedWith("Out of range");
  });
  
  it("should enforce change limits", async () => {
    await daoConfig.setGamma(8000);  // Current: 80%
    
    await expect(
      daoConfig.setGamma(7000)  // 70%, change > 10%
    ).to.be.revertedWith("Change too large");
  });
});
```

**Test Layer 3 (Integration)**:
```typescript
describe("Logic Layer Integration", () => {
  it("should use current config value", async () => {
    await daoConfig.setGamma(8000);
    const slash = await slashingEngine.calculateSlashing(10000, 50, 5000);
    const burn = slash * 2000 / 10000;  // 20%
    
    // Change config
    await daoConfig.setGamma(8500);
    const slash2 = await slashingEngine.calculateSlashing(10000, 50, 5000);
    const burn2 = slash2 * 1500 / 10000;  // 15%
    
    expect(burn2).to.be.lt(burn);  // Less burn with higher gamma
  });
});
```

## Upgrade Considerations

### Config Contract is Upgradeable

```solidity
// DAOConfigCore behind TransparentProxy
Proxy → DAOConfigCore_v1

// Can upgrade to v2 if needed
Proxy → DAOConfigCore_v2

// But storage layout must be compatible
```

**Why Upgradeable?**:
- May need to add new parameters
- Fix bugs in validation logic
- Extend functionality

**Risk Mitigation**:
- Upgrade requires DAO vote + timelock
- Guardian can veto
- Storage layout strictly managed
- Extensive testing before upgrade

### Logic Contracts: Case-by-Case

**SlashingEngine**: Non-upgradeable (formula immutability critical)
**RiskEngine**: Upgradeable (may need new risk checks)
**FundFactory**: Non-upgradeable (deployment logic should be stable)

**Decision Criteria**:
```
Upgradeable if:
- May need feature additions
- Complex logic that might need fixes
- Non-critical for security

Non-upgradeable if:
- Core economic formulas
- Critical security component
- Simplicity preferred
```

## Security Benefits

### Attack Resistance

**Scenario**: Attacker captures DAO governance

**What attacker can do**:
- Change gamma from 80% to 50-90% (bounded)
- Adjust weights within ranges
- Modify stake requirements within limits

**What attacker CANNOT do**:
- Change formula structures (immutable code)
- Set gamma to 0% or 100% (bounds enforced)
- Bypass slashing (formula enforced)
- Mint TOSS (no mint function)
- Change FI components (L,B,D,I hardcoded)

**Damage Limited**: Even malicious DAO limited to parameter ranges

### Verification

Anyone can verify system integrity:

```typescript
// 1. Verify formulas immutable
const slashingCode = await ethers.provider.getCode(slashingEngine.address);
// Review source code: formulas are pure functions

// 2. Verify config bounds
const gammaBounds = await daoConfig.bounds(keccak256("gamma"));
assert(gammaBounds.min === 5000);  // 50%
assert(gammaBounds.max === 9000);  // 90%

// 3. Verify current values
const gamma = await daoConfig.getGamma();
assert(gamma >= 5000 && gamma <= 9000);  // Within bounds

// 4. Verify config changes logged
const history = await daoConfig.getParameterHistory("gamma");
// All changes visible, traceable
```

## Related Documentation

- **[Immutable Layer](/protocol/tokenomics/immutable-layer)**: Fixed formulas
- **[Config Layer](/protocol/tokenomics/config-layer)**: Adjustable parameters
- **[SlashingEngine](/protocol/contracts/risk/SlashingEngine)**: Slashing implementation
- **[RiskEngine](/protocol/contracts/risk/RiskEngine)**: Risk validation
- **[DAOConfigCore](/protocol/contracts/core/DAOConfigCore)**: Config contract

---

**Back**: [Tokenomics Overview](/protocol/tokenomics/overview)

