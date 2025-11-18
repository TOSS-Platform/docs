# Immutable Layer

## Overview

The Immutable Layer consists of economic principles and formulas that **cannot be changed** by anyone, including the DAO. These provide the foundational security guarantees of the TOSS Protocol.

## Purpose

Immutability ensures:
- ✅ Core economic principles remain stable
- ✅ No governance manipulation of fundamentals
- ✅ Predictable long-term behavior
- ✅ Trust in mathematical guarantees
- ✅ Reduced attack surface

## Immutable Components

### 1. TOSS Token Contract

**Contract**: TOSS.sol (non-upgradeable)

**Immutable Properties**:
```solidity
// These CANNOT change
string public constant name = "TOSS Protocol Token";
string public constant symbol = "TOSS";
uint8 public constant decimals = 18;
uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;

// No mint function exists
// ❌ function mint() - DOES NOT EXIST
// ✓ function burn() - EXISTS (controlled burn only)
```

**Security Guarantee**:
```
Total Supply will NEVER exceed 1,000,000,000 TOSS
Total Supply will only DECREASE (via burns)
No code can create new TOSS tokens
```

**Why Non-Upgradeable?**:
- Token contracts should be immutable for trust
- No proxy pattern - direct implementation
- Even DAO cannot change supply rules
- Eliminates entire class of upgrade attacks

### 2. Mathematical Formula Structures

These formulas are **defined mathematically** and implemented in immutable code logic.

#### Burn Formula

```
Mathematical Definition (Immutable):
Burn_Amount = Slash_Total × (1 - γ)

Where:
- Slash_Total = Total amount slashed from FM
- γ (gamma) = NAV compensation ratio (configurable: Layer 2)
- Result = Amount burned (removed from supply forever)
```

**Immutable**: The structure `Burn = Slash × (1-γ)`

**Mutable (Layer 2)**: The value of γ (within 50-90% range)

#### NAV Compensation Formula

```
Mathematical Definition (Immutable):
NAV_Compensation = Slash_Total × γ

Where:
- Slash_Total = Total amount slashed
- γ (gamma) = NAV compensation ratio (configurable: Layer 2)
- Result = Amount sent to fund to compensate NAV
```

**Why This Split?**:
- Formula structure cannot change (security)
- γ can be optimized by DAO (flexibility)
- Best of both: immutability + adjustability

#### Slashing Formula Structure

```
Mathematical Definition (Immutable):
Slash = min(S_base, S_lossCap, S_total)

Where:
S_base = Stake × SlashRatio(FI)
S_lossCap = α × FundLoss / TOSS_Price
S_total = FM_Total_Stake

Components:
- SlashRatio(FI) = Function mapping FI to % (immutable logic)
- α (alpha) = Loss cap coefficient (configurable: Layer 2)
```

**Immutable**:
- The `min()` structure
- The three-component check (base, lossCap, total)
- SlashRatio function shape (linear interpolation)

**Mutable (Layer 2)**:
- α value (0.5-2.0 range)
- FI thresholds (20-50 range for minimum)

#### FaultIndex Formula Structure

```
Mathematical Definition (Immutable):
FI = wL × L + wB × B + wD × D + wI × I

Where:
L = Limit Breach Severity (0-100)
B = Behavior Anomaly Score (0-100)
D = Damage Ratio (0-100)
I = Intent Probability (0-100)
wL, wB, wD, wI = Weights (configurable: Layer 2)
```

**Immutable**:
- Linear combination structure
- Four-component model (L, B, D, I)
- 0-100 scaling for each component
- Weights sum to 100%

**Mutable (Layer 2)**:
- Individual weight values (within ranges)
- Total must always sum to 100%

### 3. Economic Principles

**Immutable Economic Laws**:

1. **Fixed Supply Law**:
   ```
   Total Supply ≤ 1,000,000,000 TOSS at all times
   Total Supply monotonically decreasing (burns only)
   ```

2. **Burn-Only Deflation**:
   ```
   All deflation comes from slashing
   No transaction tax burns
   No arbitrary burns
   Burns are deterministic (based on violations)
   ```

3. **Slashing Triggers Economic Security**:
   ```
   FM Stake required to operate
   Violations trigger automatic slashing
   Slashing splits: burn + NAV compensation
   No manual intervention possible
   ```

4. **NAV Compensation Principle**:
   ```
   Investors harmed by FM violation receive compensation
   Compensation comes from slashed FM stake
   Automatic, no voting required
   ```

## Security Guarantees from Immutability

### Guarantee 1: Supply Bounded

```
Mathematical Proof:
- Initial Supply = 1,000,000,000 TOSS
- Only operation reducing supply: burn()
- burn() is one-way (no mint)
- Therefore: Supply(t) ≤ Supply(0) for all t

Conclusion: Supply can never exceed 1B, only decrease
```

**Implication**: No inflation risk, deflationary over time

### Guarantee 2: Slashing is Deterministic

```
Given:
- FM Stake = S
- FaultIndex = FI
- Fund Loss = L

Then:
- Slash amount is uniquely determined by formula
- No discretion in calculation
- No governance manipulation possible
- Result is verifiable by anyone
```

**Implication**: Predictable consequences, no arbitrary punishment

### Guarantee 3: NAV Compensation Automatic

```
Given:
- Slash occurs
- γ is set (e.g., 80%)

Then:
- NAV_Comp = Slash × 80% (automatic)
- Goes directly to fund vault
- No DAO vote needed
- Immediate compensation
```

**Implication**: Investor protection is guaranteed, not discretionary

### Guarantee 4: Formulas Cannot Be Bypassed

```
Architecture:
- SlashingEngine implements immutable formula
- All slash calculations go through SlashingEngine
- No alternative slashing mechanism exists
- Contract cannot be upgraded

Result: Formula enforcement guaranteed
```

**Implication**: Economic security model is trustless

## What Cannot Change (Ever)

### Token Properties

❌ Cannot increase total supply (no mint function)
❌ Cannot change decimals (constant)
❌ Cannot change symbol/name (constant)  
❌ Cannot make token upgradeable (no proxy)
❌ Cannot bypass burn mechanism

### Formula Structures

❌ Cannot change FI = wL×L + wB×B + wD×D + wI×I structure
❌ Cannot change Burn = Slash × (1-γ) structure
❌ Cannot add new FI components beyond L, B, D, I
❌ Cannot remove existing FI components
❌ Cannot change min() logic in slashing

### Economic Principles

❌ Cannot remove slashing requirement
❌ Cannot remove FM staking requirement
❌ Cannot bypass RiskEngine validation
❌ Cannot change "burn on slash" principle
❌ Cannot remove NAV compensation

## Code Immutability

### TOSS.sol - No Proxy Pattern

```solidity
// Direct implementation (NOT behind proxy)
contract TOSS is ERC20, ERC20Snapshot, ERC20Permit {
    // No upgrade logic
    // No delegatecall
    // No implementation swapping
    
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;
    
    constructor(address initialHolder) {
        _mint(initialHolder, TOTAL_SUPPLY);
        // Supply now fixed forever
    }
    
    // ❌ No mint function
    // ✓ Burn function exists (authorized only)
}
```

### Formula Logic - Immutable Functions

```solidity
// In SlashingEngine.sol - cannot be upgraded
function _getSlashRatio(uint256 faultIndex) 
    internal 
    pure  // PURE = no state reads, deterministic
    returns (uint256 ratio) 
{
    // This logic is IMMUTABLE
    if (faultIndex < minSlashingFI) return 0;
    
    // Linear interpolation (immutable structure)
    if (faultIndex < 60) {
        return ((faultIndex - minSlashingFI) * 10) / (60 - minSlashingFI);
    }
    // ... rest of immutable interpolation logic
}

// Only reads config for minSlashingFI value
// Formula structure unchangeable
```

## Verification

### How to Verify Immutability

**1. TOSS Token**:
```bash
# Check if proxy
cast implementation <TOSS_ADDRESS>
# Should return: 0x0 (not a proxy)

# Check for mint function
cast sig "mint(address,uint256)"
# Should not exist in ABI

# Verify supply
cast call <TOSS_ADDRESS> "totalSupply()"
# Should always be ≤ 1,000,000,000 * 10^18
```

**2. SlashingEngine**:
```bash
# Check if upgradeable
cast implementation <SLASHING_ENGINE_ADDRESS>
# If returns address: upgradeable (concerning)
# If returns 0x0: not a proxy (good)

# Better: Check in contract code
# Look for: "initialize" function = upgradeable
# Look for: "constructor" only = immutable
```

**3. Formula Verification**:
```solidity
// Anyone can verify formula by reading source code
// Formulas are in public view/pure functions
// No external dependencies for core logic
```

## Audit Requirements

**Immutable Layer Audit Focus**:

1. **TOSS.sol**:
   - Confirm no mint function
   - Confirm no upgrade mechanism
   - Verify burn authorization logic
   - Check snapshot implementation

2. **Formula Logic**:
   - Verify mathematical correctness
   - Confirm no hidden state changes
   - Check all functions are pure/view where expected
   - Validate no external calls in formula logic

3. **Deployment**:
   - Confirm deployed without proxy
   - Verify constructor arguments correct
   - Check initial supply minted correctly

## Long-Term Implications

### 10-Year Horizon

```
Immutable guarantees in 2035:
✓ Total supply still ≤ 1B TOSS
✓ Slashing still burns 20% (if γ=80%)
✓ FI still calculated from L,B,D,I
✓ Formulas unchanged
✓ No inflation ever possible

Mutable (DAO-optimized):
⚙️ γ may be 75% or 85% (optimized)
⚙️ Stake requirements adjusted for market
⚙️ FI weights fine-tuned based on data
⚙️ Fee limits adapted to competition
```

**Stability**: Core principles remain, details optimize

### Worst-Case Scenario

**Even if**:
- DAO completely captured by attacker
- All governance compromised
- Malicious proposals passed

**Attacker CANNOT**:
- Mint new TOSS tokens
- Change supply cap
- Modify core formula structures
- Bypass slashing mechanism
- Remove burn requirement

**Attacker CAN** (but bounded):
- Change γ from 80% to 50-90% range
- Adjust weights within predefined ranges
- Modify stake requirements within bounds

**Result**: Damage limited even in worst case

## Comparison: Upgradeable vs Immutable

| Aspect | Upgradeable Tokenomics | TOSS Immutable Layer |
|--------|----------------------|---------------------|
| Supply | Can change | Fixed 1B forever |
| Formulas | Can be replaced | Immutable code |
| Attack Surface | High (upgrade mechanism) | Low (no upgrades) |
| Trust Model | Trust DAO/Admin | Trust math |
| Long-term Certainty | Low | High |
| Flexibility | Maximum | Balanced (via Config Layer) |
| Audit Complexity | High (must audit upgrades) | Low (audit once) |

**TOSS Choice**: Immutable where it matters, configurable where it helps

## Related Documentation

- **[Config Layer](/protocol/tokenomics/config-layer)**: Adjustable parameters
- **[Logic Layer](/protocol/tokenomics/logic-layer)**: Implementation contracts
- **[TOSS Token Contract](/protocol/contracts/core/TOSS)**: Token implementation
- **[Security Model](/protocol/security/overview)**: Overall security architecture

---

**Back**: [Tokenomics Overview](/protocol/tokenomics/overview)

**Next**: [Config Layer](/protocol/tokenomics/config-layer)

