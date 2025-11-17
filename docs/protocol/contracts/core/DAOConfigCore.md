# DAOConfigCore.sol

## Overview

Central configuration contract storing all DAO-adjustable parameters for the TOSS Protocol. Implements the **Config Layer** of the three-layer tokenomics architecture.

## Purpose

- Store all configurable tokenomics parameters
- Enforce parameter bounds and limits
- Track parameter change history
- Provide unified config interface
- Enable parameter governance

## Core Responsibilities

- ✅ Store tokenomics configuration (gamma, alpha, weights, etc.)
- ✅ Enforce parameter ranges (min-max bounds)
- ✅ Validate parameter changes (magnitude limits, cooldowns)
- ✅ Provide getter functions for logic layer contracts
- ✅ Track change history for auditing
- ✅ Emit events for all parameter updates

## State Variables

```solidity
// ===== Tokenomics Configuration =====
struct TokenomicsConfig {
    // Slashing Parameters
    uint256 gamma;              // NAV compensation ratio (5000-9000 = 50-90%)
    uint256 alpha;              // Loss cap coefficient (500-2000 = 0.5-2.0)
    uint256 minSlashingFI;      // Min FI to trigger slash (20-50)
    uint256 banThresholdFI;     // FI for permanent ban (75-95)
    
    // Stake Requirements
    uint256 fmBaseStake;        // Base FM stake (5k-100k TOSS wei)
    uint256 stakePerAUMRatio;   // Additional per AUM (5-20 bps)
    
    // FaultIndex Weights (must sum to 100)
    uint256 weightL;            // Limit breach (40-50%)
    uint256 weightB;            // Behavior (20-30%)
    uint256 weightD;            // Damage (15-25%)
    uint256 weightI;            // Intent (5-15%)
    
    // Fee Limits
    uint256 maxProtocolFee;     // Protocol fee cap (0-100 bps)
}

TokenomicsConfig public config;

// ===== Parameter Bounds =====
struct ParameterBounds {
    uint256 min;
    uint256 max;
    uint256 maxChangePercent;   // Max % change per proposal
    uint256 cooldownPeriod;      // Min seconds between changes
}

mapping(bytes32 => ParameterBounds) public bounds;
mapping(bytes32 => uint256) public lastChangeTime;

// ===== Fee Limits per RiskTier =====
mapping(RiskTier => uint256) public maxManagementFee;
mapping(RiskTier => uint256) public maxPerformanceFee;

// ===== Change History =====
struct ParameterChange {
    bytes32 parameter;
    uint256 oldValue;
    uint256 newValue;
    uint256 timestamp;
    uint256 proposalId;
}

ParameterChange[] public changeHistory;

// ===== Access Control =====
address public governance;
address public guardian;
```

## Functions

### Constructor

```solidity
constructor(address _governance, address _guardian)
```

**Initializes Default Config**:
```solidity
config = TokenomicsConfig({
    gamma: 8000,              // 80%
    alpha: 10000,             // 1.0
    minSlashingFI: 30,
    banThresholdFI: 85,
    fmBaseStake: 10000 ether,
    stakePerAUMRatio: 10,     // 0.1%
    weightL: 45,
    weightB: 25,
    weightD: 20,
    weightI: 10,
    maxProtocolFee: 10        // 0.1%
});

// Set bounds for each parameter
_initializeBounds();
```

### Getter Functions

#### `getGamma`

```solidity
function getGamma() external view returns (uint256)
```

**Purpose**: Get current NAV compensation ratio

**Returns**: gamma in basis points (8000 = 80%)

**Called By**: SlashingEngine

#### `getAlpha`

```solidity
function getAlpha() external view returns (uint256)
```

**Purpose**: Get loss cap coefficient

**Returns**: alpha scaled (10000 = 1.0)

#### `getMinSlashingFI`

```solidity
function getMinSlashingFI() external view returns (uint256)
```

**Purpose**: Get minimum FI to trigger slashing

**Returns**: FI threshold (30 = 0.30)

#### `getFIWeights`

```solidity
function getFIWeights() external view returns (
    uint256 weightL,
    uint256 weightB,
    uint256 weightD,
    uint256 weightI
)
```

**Purpose**: Get all FaultIndex weights

**Returns**: Four weights (must sum to 100)

#### `getFMStakeRequirements`

```solidity
function getFMStakeRequirements() external view returns (
    uint256 baseStake,
    uint256 ratioInBPS
)
```

**Purpose**: Get FM staking requirements

**Returns**: Base amount and per-AUM ratio

### Setter Functions (Governance Only)

#### `setGamma`

```solidity
function setGamma(uint256 newGamma) 
    external 
    onlyGovernance 
    withinBounds("gamma", newGamma)
```

**Purpose**: Update NAV compensation ratio

**Parameters**:
- `newGamma`: New gamma value (basis points)

**Validations**:
```solidity
require(newGamma >= 5000 && newGamma <= 9000, "Out of range");
require(_changeWithinLimit("gamma", newGamma), "Change too large");
require(_cooldownPassed("gamma"), "Cooldown active");
```

**Events**: `GammaUpdated(oldGamma, newGamma, proposalId)`

#### `setFIWeights`

```solidity
function setFIWeights(
    uint256 newWeightL,
    uint256 newWeightB,
    uint256 newWeightD,
    uint256 newWeightI
) external onlyGovernance
```

**Purpose**: Update FaultIndex weights

**Validation**:
```solidity
require(newWeightL + newWeightB + newWeightD + newWeightI == 100, "Must sum to 100");
require(_eachWeightInBounds(...), "Weight out of range");
```

**Events**: `FIWeightsUpdated(oldWeights, newWeights, proposalId)`

### Batch Update

#### `updateMultipleParameters`

```solidity
function updateMultipleParameters(
    bytes32[] calldata parameters,
    uint256[] calldata newValues,
    uint256 proposalId
) external onlyGovernance
```

**Purpose**: Update multiple parameters atomically

**Use Case**: Coordinated parameter changes

**Validation**: Each parameter validated independently

### View/Query Functions

#### `getParameterHistory`

```solidity
function getParameterHistory(bytes32 parameter) 
    external 
    view 
    returns (ParameterChange[] memory)
```

**Purpose**: Get all historical changes for parameter

**Returns**: Array of changes with timestamps and proposal IDs

#### `getBounds`

```solidity
function getBounds(bytes32 parameter) 
    external 
    view 
    returns (ParameterBounds memory)
```

**Purpose**: Get min, max, change limits for parameter

#### `canChangeParameter`

```solidity
function canChangeParameter(
    bytes32 parameter,
    uint256 newValue
) external view returns (bool can, string memory reason)
```

**Purpose**: Check if parameter change would be valid

**Returns**:
- `can`: Whether change allowed
- `reason`: Why not, if rejected

**Checks**:
- Within min-max bounds?
- Change magnitude acceptable?
- Cooldown period passed?

## DAO-Configurable Parameters Summary

All parameters in this contract ARE configurable (that's the point!).

See [Config Layer Documentation](/docs/protocol/tokenomics/config-layer) for complete list with ranges.

## Deployment

### Deploy Order

```
1. Deploy ProtocolGovernance
2. Deploy Guardian multisig
3. Deploy DAOConfigCore (with governance + guardian)
4. Deploy logic contracts (SlashingEngine, RiskEngine, etc.) pointing to config
5. Transfer governance to DAO
```

### Constructor Arguments

```typescript
const args = {
  governance: protocolGovernance.address,
  guardian: guardianMultisig.address
};

const config = await ethers.deployContract("DAOConfigCore", [
  args.governance,
  args.guardian
]);
```

### Post-Deployment Verification

```typescript
// Verify default values
assert(await config.getGamma() === 8000);  // 80%
assert(await config.getMinSlashingFI() === 30);

// Verify bounds
const gammaBounds = await config.getBounds(ethers.utils.id("gamma"));
assert(gammaBounds.min === 5000);
assert(gammaBounds.max === 9000);
```

## Access Control

### Roles

| Role | Permissions |
|------|-------------|
| **Governance** | Update any parameter (within bounds) |
| **Guardian** | Emergency parameter freeze (pause changes) |
| **Anyone** | Read all parameters (public getters) |

### Modifiers

```solidity
modifier onlyGovernance() {
    require(msg.sender == governance, "Not governance");
    _;
}

modifier withinBounds(bytes32 parameter, uint256 newValue) {
    ParameterBounds memory bound = bounds[parameter];
    require(newValue >= bound.min && newValue <= bound.max, "Out of range");
    
    uint256 currentValue = _getCurrentValue(parameter);
    uint256 maxChange = currentValue * bound.maxChangePercent / 100;
    require(abs(int(newValue) - int(currentValue)) <= maxChange, "Change too large");
    
    require(block.timestamp >= lastChangeTime[parameter] + bound.cooldownPeriod, "Cooldown");
    _;
}
```

## Security Considerations

### Attack Vector 1: Parameter Manipulation

**Risk**: Malicious DAO sets extreme parameters

**Mitigation**:
- Bounds enforced in contract code
- Even malicious DAO cannot exceed bounds
- Change limits prevent sudden shifts
- Cooldowns prevent rapid manipulation

**Example**:
```solidity
// Attacker tries gamma = 0% (all burn, no NAV comp)
await config.setGamma(0);
// Reverts: "Out of range" (min = 50%)

// Attacker tries gamma = 100% (all NAV comp, no burn)
await config.setGamma(10000);
// Reverts: "Out of range" (max = 90%)
```

**Severity**: Low (impossible due to bounds)

### Attack Vector 2: Cooldown Bypass

**Risk**: Rapidly change parameters multiple times

**Mitigation**:
```solidity
require(block.timestamp >= lastChangeTime[param] + cooldown);
// Must wait full cooldown period
// Cannot bypass with new proposal
```

**Severity**: Low (enforced on-chain)

### Attack Vector 3: Weight Sum Manipulation

**Risk**: Set FI weights that don't sum to 100%

**Mitigation**:
```solidity
function setFIWeights(...) external {
    require(wL + wB + wD + wI == 100, "Must sum to 100");
    // Atomic check, cannot violate
}
```

**Severity**: Impossible (checked before state change)

## Events

```solidity
event GammaUpdated(uint256 oldValue, uint256 newValue, uint256 proposalId);
event AlphaUpdated(uint256 oldValue, uint256 newValue, uint256 proposalId);
event MinSlashingFIUpdated(uint256 oldValue, uint256 newValue, uint256 proposalId);
event BanThresholdUpdated(uint256 oldValue, uint256 newValue, uint256 proposalId);
event FMBaseStakeUpdated(uint256 oldValue, uint256 newValue, uint256 proposalId);
event StakeRatioUpdated(uint256 oldValue, uint256 newValue, uint256 proposalId);
event FIWeightsUpdated(uint256[4] oldWeights, uint256[4] newWeights, uint256 proposalId);
event MaxProtocolFeeUpdated(uint256 oldValue, uint256 newValue, uint256 proposalId);

event ParameterChangeProposed(bytes32 indexed parameter, uint256 newValue, uint256 proposalId);
event ParameterChangeCanceled(bytes32 indexed parameter, uint256 proposalId);
```

## Integration Points

**Read By (Logic Layer)**:
- SlashingEngine → gamma, alpha, minSlashingFI, banThresholdFI
- RiskEngine → weightL, weightB, weightD, weightI, minSlashingFI
- FundFactory → fmBaseStake, stakePerAUMRatio
- TOSSTreasury → maxProtocolFee
- FundConfig → maxManagementFee, maxPerformanceFee

**Written By**:
- ProtocolGovernance → All protocol-level parameters
- FMGovernance → FM-level parameters (stakes)

## Test Scenarios

```typescript
describe("DAOConfigCore", () => {
  it("should initialize with default config", async () => {
    expect(await config.getGamma()).to.equal(8000);  // 80%
    expect(await config.getMinSlashingFI()).to.equal(30);
  });
  
  it("should enforce parameter bounds", async () => {
    await expect(
      config.connect(governance).setGamma(4000)  // Below 50% min
    ).to.be.revertedWith("Out of range");
    
    await expect(
      config.connect(governance).setGamma(9500)  // Above 90% max
    ).to.be.revertedWith("Out of range");
  });
  
  it("should enforce change magnitude limits", async () => {
    await config.connect(governance).setGamma(8000);  // Set to 80%
    
    // Try to change by 20% (max is 10%)
    await expect(
      config.connect(governance).setGamma(6400)  // 64%, -20%
    ).to.be.revertedWith("Change too large");
    
    // 5% change should work
    await config.connect(governance).setGamma(7600);  // 76%, -5%
    expect(await config.getGamma()).to.equal(7600);
  });
  
  it("should enforce cooldown periods", async () => {
    await config.connect(governance).setGamma(8000);
    
    // Try to change again immediately
    await expect(
      config.connect(governance).setGamma(8100)
    ).to.be.revertedWith("Cooldown active");
    
    // Fast forward 90 days
    await time.increase(90 * 86400);
    
    // Now should work
    await config.connect(governance).setGamma(8100);
  });
  
  it("should enforce FI weights sum to 100", async () => {
    await expect(
      config.connect(governance).setFIWeights(40, 30, 20, 15)  // Sums to 105
    ).to.be.revertedWith("Must sum to 100");
    
    // Correct sum
    await config.connect(governance).setFIWeights(45, 30, 20, 5);  // Sums to 100
  });
  
  it("should track parameter history", async () => {
    await config.connect(governance).setGamma(8000);
    await time.increase(90 * 86400);
    await config.connect(governance).setGamma(8500);
    
    const history = await config.getParameterHistory(ethers.utils.id("gamma"));
    expect(history.length).to.equal(2);
    expect(history[0].newValue).to.equal(8000);
    expect(history[1].newValue).to.equal(8500);
  });
});
```

## Upgrade Strategy

**Upgradeable via TransparentProxy** ✅

**Why Upgradeable?**:
- May need to add new parameters
- Fix validation bugs
- Extend functionality

**Upgrade Safety**:
- Requires DAO proposal + 72h timelock
- Guardian can veto
- Storage layout carefully managed
- Must maintain parameter values across upgrade

## Example Usage

### From SlashingEngine

```solidity
contract SlashingEngine {
    IDAOConfigCore public immutable daoConfig;
    
    function executeSlashing(uint256 fundId, uint256 FI) external {
        // Read current config
        uint256 gamma = daoConfig.getGamma();
        
        // Calculate slash
        uint256 slash = calculateSlashing(stake, FI, loss);
        
        // Split using gamma
        uint256 burn = slash * (10000 - gamma) / 10000;
        uint256 navComp = slash - burn;
        
        // Execute
        _burnAndCompensate(burn, navComp);
    }
}
```

### From RiskEngine

```solidity
contract RiskEngine {
    IDAOConfigCore public immutable daoConfig;
    
    function calculateFaultIndex(uint256 L, uint256 B, uint256 D, uint256 I) 
        public 
        view 
        returns (uint256) 
    {
        // Read weights from config
        (uint256 wL, uint256 wB, uint256 wD, uint256 wI) = daoConfig.getFIWeights();
        
        // Apply formula
        return (L * wL + B * wB + D * wD + I * wI) / 100;
    }
}
```

## Related Documentation

- **[Immutable Layer](/docs/protocol/tokenomics/immutable-layer)**: What cannot change
- **[Config Layer](/docs/protocol/tokenomics/config-layer)**: Parameter details
- **[Logic Layer](/docs/protocol/tokenomics/logic-layer)**: How contracts use config
- **[Protocol Governance](/docs/protocol/governance/protocol-proposal)**: How to change parameters

---

**Back**: [Core Contracts](/docs/protocol/contracts/overview)

