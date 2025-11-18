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

See [Config Layer Documentation](/protocol/tokenomics/config-layer) for complete list with ranges.

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

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Initialize with default config | Contract deployed with default parameter values | All parameters set to defaults (gamma=8000, alpha=10000, minSlashingFI=30, etc.) |
| Get parameter value | Query current value of gamma parameter | Returns current gamma value (8000 = 80%) |
| Get FI weights | Query all FaultIndex weights | Returns weightL, weightB, weightD, weightI (must sum to 100) |
| Get FM stake requirements | Query FM staking parameters | Returns baseStake and stakePerAUMRatio |
| Set gamma within bounds | Governance updates gamma within allowed range (5000-9000) | Gamma updated, GammaUpdated event emitted, change history recorded |
| Set FI weights correctly | Governance updates FI weights that sum to 100 | Weights updated, FIWeightsUpdated event emitted |
| Update multiple parameters | Governance updates multiple parameters atomically | All parameters updated in single transaction, events emitted for each |
| Get parameter bounds | Query min, max, change limits for a parameter | Returns ParameterBounds struct with all bounds |
| Get parameter history | Query historical changes for gamma parameter | Returns array of ParameterChange with timestamps and proposal IDs |
| Check parameter change validity | Check if parameter change would be valid | Returns can (bool) and reason (string) explaining why change allowed/rejected |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Set parameter to minimum bound | Governance sets gamma to minimum allowed value (5000) | Transaction succeeds, parameter set to minimum |
| Set parameter to maximum bound | Governance sets gamma to maximum allowed value (9000) | Transaction succeeds, parameter set to maximum |
| Set FI weights to extreme values | Governance sets FI weights at allowed bounds (weightL=40-50, etc.) | Transaction succeeds if within bounds and sum equals 100 |
| Change parameter exactly at limit | Governance changes parameter by exactly max allowed change (10%) | Transaction succeeds, change at boundary accepted |
| Update parameter after cooldown | Governance updates parameter exactly when cooldown expires | Transaction succeeds, cooldown period respected |
| Query parameter that doesn't exist | Query bounds or history for non-existent parameter | Returns default bounds or empty history |
| Set same parameter value | Governance sets parameter to its current value | Transaction may succeed (no-op) or revert depending on implementation |
| Update multiple parameters with one invalid | Governance attempts batch update with one invalid parameter | Entire batch reverts, no parameters updated (atomic operation) |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Set parameter below minimum | Governance attempts to set gamma below 5000 (e.g., 4000) | Transaction reverts with "Out of range" error |
| Set parameter above maximum | Governance attempts to set gamma above 9000 (e.g., 9500) | Transaction reverts with "Out of range" error |
| Set parameter from non-governance | Non-governance address attempts to set gamma | Transaction reverts with "Not governance" error |
| Change parameter too large | Governance attempts to change gamma by more than 10% (max change limit) | Transaction reverts with "Change too large" error |
| Change parameter during cooldown | Governance attempts to change parameter before cooldown period expires | Transaction reverts with "Cooldown active" error |
| Set FI weights not summing to 100 | Governance sets weights that sum to 105 | Transaction reverts with "Must sum to 100" error |
| Set FI weights below minimum | Governance sets weightL below 40% (allowed minimum) | Transaction reverts with "Weight out of range" error |
| Set FI weights above maximum | Governance sets weightL above 50% (allowed maximum) | Transaction reverts with "Weight out of range" error |
| Update parameter with invalid proposal ID | Governance updates parameter with proposal ID 0 or invalid | Transaction may revert or proceed (depends on proposal validation) |
| Batch update with mismatched arrays | Governance attempts batch update with mismatched parameter/value arrays | Transaction reverts with "Array length mismatch" error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized parameter changes | Attacker attempts to change gamma | Transaction reverts, only governance can change parameters |
| Enforce parameter bounds | Attacker gains governance control, attempts to set extreme gamma | Even with governance, bounds enforced, extreme values rejected |
| Prevent cooldown bypass | Multiple proposals attempt to change parameter rapidly | Cooldown prevents rapid changes, must wait full period |
| Enforce change magnitude limits | Governance attempts sudden extreme parameter shift | Change limits prevent sudden shifts, protects against manipulation |
| FI weights sum validation | Attempt to set weights that don't sum to 100 | Atomic check prevents invalid weights, must sum exactly to 100 |
| Parameter history immutability | Verify parameter history cannot be modified | History array append-only, past changes cannot be altered |
| Bounds immutability | Verify parameter bounds cannot be changed after initialization | Bounds set in constructor or immutable, cannot be modified |
| Change history tracking accuracy | Multiple parameter changes tracked correctly | Each change recorded with timestamp and proposal ID, history accurate |
| Proposal ID validation | Verify proposal IDs linked to valid governance proposals | Proposal ID validation ensures changes tied to legitimate proposals |
| Batch update atomicity | Batch update with one invalid parameter reverts all | All or nothing: either all parameters updated or none |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Set parameter by governance | Governance sets gamma | Transaction succeeds |
| Set parameter by non-governance | Non-governance attempts to set gamma | Transaction reverts with "Not governance" |
| Get parameters by any address | Any address queries parameter values | Queries succeed, read-only functions are public |
| Get bounds by any address | Any address queries parameter bounds | Queries succeed, bounds are publicly readable |
| Get history by any address | Any address queries parameter history | Queries succeed, history is publicly accessible |
| Update multiple parameters by governance | Governance performs batch update | Transaction succeeds |
| Update multiple parameters by non-governance | Non-governance attempts batch update | Transaction reverts with "Not governance" |
| Guardian freeze parameters | Guardian freezes parameter changes (if supported) | Parameter updates blocked, governance cannot change |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| SlashingEngine reads gamma | SlashingEngine queries gamma for slashing calculation | Gamma value read correctly, slashing calculations use correct value |
| RiskEngine reads FI weights | RiskEngine queries FI weights for FaultIndex calculation | Weights read correctly, FI calculation uses correct weights |
| FundFactory reads stake requirements | FundFactory queries FM stake requirements | Stake requirements read correctly, fund creation uses correct values |
| Multiple contracts read config | Multiple contracts simultaneously query different parameters | All queries succeed, read operations don't interfere |
| Parameter change affects contracts | Governance changes gamma, SlashingEngine uses new value | Contracts read updated value, calculations use new parameter |
| Proposal integration | Governance proposal passes, config updated via proposal ID | Proposal ID linked correctly, change tracked with proposal |
| Timelock integration | Parameter change proposal, timelock delay, then execution | Timelock enforced, execution only after delay |
| History tracking for audits | Off-chain systems query parameter history for auditing | History provides complete audit trail of all parameter changes |

### State Transition Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Parameter change state | Parameter value changes from old to new | Value updated correctly, history recorded, event emitted |
| Cooldown state tracking | Parameter changed, cooldown active, then expires | Cooldown tracked correctly, changes blocked then allowed |
| Multiple parameter changes | Sequential parameter changes with cooldowns | Each change tracked independently, cooldowns respected |
| Batch parameter update | Multiple parameters updated atomically | All parameters updated simultaneously, single transaction |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Single parameter update gas | Governance updates single parameter | Gas usage reasonable for parameter update |
| Batch parameter update gas | Governance updates 5 parameters via batch vs individual | Batch update uses less gas than 5 separate transactions |
| Query operations gas | Multiple queries for parameters, bounds, history | View functions consume no gas (read-only) |
| Get parameter gas | Contracts frequently query parameter values | Gas-efficient reads, parameters cached or optimized |

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

- **[Immutable Layer](/protocol/tokenomics/immutable-layer)**: What cannot change
- **[Config Layer](/protocol/tokenomics/config-layer)**: Parameter details
- **[Logic Layer](/protocol/tokenomics/logic-layer)**: How contracts use config
- **[Protocol Governance](/protocol/governance/proposal-lifecycle)**: How to change parameters

---

**Back**: [Core Contracts](/protocol/contracts/overview)

