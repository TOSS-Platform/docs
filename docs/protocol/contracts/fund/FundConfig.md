# FundConfig.sol

## Overview

Stores and manages fund-specific risk parameters, operational settings, and fee structures. All fund behavior is governed by its configuration.

## Purpose

- Store fund risk limits (PSL, PCL, AEL, etc.)
- Manage fee structures
- Track allowed assets
- Enable fund governance parameter changes
- Validate parameter changes against protocol limits

## State Variables

```solidity
// Uses IFund.FundConfig struct (same as FundConfiguration in documentation)
mapping(uint256 => IFund.FundConfig) public configs;  // fundId => config
IFundRegistry public fundRegistry;  // For fundId validation
IDAOConfigCore public daoConfig;  // For RiskTier limits
address public governance;  // Access control
address public fundFactory;  // FundFactory can set initial config
```

**Note**: `FundConfiguration` in documentation is an alias for `IFund.FundConfig`. The contract uses `IFund.FundConfig` directly.

## Functions

### Constructor

```solidity
constructor(
    address _fundRegistry,
    address _daoConfig,
    address _governance
)
```

**Purpose**: Initialize FundConfig contract

**Parameters**:
- `_fundRegistry`: FundRegistry address (for fundId validation)
- `_daoConfig`: DAOConfigCore address (for RiskTier limits)
- `_governance`: Governance address (for access control)

### `setFundFactory`

```solidity
function setFundFactory(address _fundFactory) external onlyGovernance
```

**Purpose**: Set FundFactory address (allows FundFactory to set initial config)

**Parameters**:
- `_fundFactory`: FundFactory address

**Access Control**: Only governance

### `setInitialConfiguration`

```solidity
function setInitialConfiguration(
    uint256 fundId,
    IFund.FundConfig memory config
) external
```

**Purpose**: Set initial fund configuration (called by FundFactory)

**Parameters**:
- `fundId`: Fund ID
- `config`: Initial configuration

**Access Control**: Only FundFactory or governance

**Validations**:
- Config not already set
- Configuration within RiskTier limits
- Fee changes within allowed ranges
- Asset list valid for tier

**Events**: `ConfigurationUpdated(fundId, emptyConfig, config)`

### `setConfiguration`

```solidity
function setConfiguration(
    uint256 fundId,
    IFund.FundConfig memory newConfig
) external onlyGovernance
```

**Purpose**: Update fund configuration via governance

**Parameters**:
- `fundId`: Fund to update
- `newConfig`: New configuration

**Access Control**: Only governance

**Validations**:
- New config within RiskTier limits
- Fee changes within allowed ranges
- Asset list valid for tier

**Events**: `ConfigurationUpdated(fundId, oldConfig, newConfig)`

### `updateRiskParameter`

```solidity
function updateRiskParameter(
    uint256 fundId,
    bytes32 parameter,
    uint256 newValue
) external onlyGovernance
```

**Purpose**: Update single risk parameter

**Parameters**:
- `fundId`: Fund ID
- `parameter`: Parameter name (e.g., keccak256("maxDrawdown"))
- `newValue`: New value

**Use Case**: Quick governance changes without full config update

### Query Functions

#### `getRiskParameters`

```solidity
function getRiskParameters(
    uint256 fundId
) external view returns (
    uint256 psl,
    uint256 pcl,
    uint256 ael,
    uint256 maxDD,
    uint256 maxVol
)
```

**Purpose**: Get all risk parameters at once

#### `getFees`

```solidity
function getFees(
    uint256 fundId
) external view returns (
    uint256 managementFee,
    uint256 performanceFee,
    uint256 depositFee,
    uint256 withdrawalFee
)
```

#### `isAssetAllowed`

```solidity
function isAssetAllowed(
    uint256 fundId,
    address asset
) external view returns (bool)
```

**Purpose**: Check if asset can be traded by fund

## DAO-Configurable Parameters

### Fund-Level (via FundGovernance)

| Parameter | Range | Change Limit |
|-----------|-------|--------------|
| `managementFee` | 0-300 bps (0-3%) | 50% per proposal |
| `performanceFee` | 0-3000 bps (0-30%) | 30% per proposal |
| `maxDrawdown` | Within RiskTier | 50% per proposal |
| `maxVolatility` | Within RiskTier | 30% per proposal |
| `lockupPeriod` | 0-365 days | Can increase, limited decrease |

### Protocol-Level Limits

| Parameter | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|-----------|--------|--------|--------|--------|
| Max Management Fee | 2% | 2.5% | 3% | 3% |
| Max Performance Fee | 20% | 25% | 30% | 30% |
| Max Drawdown | 15% | 30% | 50% | 80% |

## Security Considerations

**1. Parameter Manipulation**
- **Risk**: FM sets extreme parameters to game system
- **Mitigation**: RiskTier bounds, governance approval required, change limits
- **Severity**: Medium → Mitigated

**2. Asset List Abuse**
- **Risk**: Add illiquid/manipulatable assets
- **Mitigation**: Assets must be in tier's allowed list, governance votes
- **Severity**: High → Mitigated

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Set fund configuration | Fund Governance sets new configuration after proposal passes | Configuration updated, ConfigurationUpdated event emitted, all parameters set correctly |
| Update single risk parameter | Fund Governance updates specific risk parameter (e.g., maxDrawdown) | Parameter updated, event emitted, other parameters unchanged |
| Query risk parameters | Query all risk parameters for fund | Returns PSL, PCL, AEL, maxDrawdown, maxVolatility values |
| Query fees | Query all fees for fund | Returns managementFee, performanceFee, depositFee, withdrawalFee |
| Check asset allowed | Query if specific asset is allowed for fund | Returns bool indicating if asset can be traded |
| Get configuration | Query complete fund configuration | Returns FundConfiguration struct with all parameters |
| Update fees via governance | Governance proposal passes, fees updated | Fees updated correctly, change tracked with proposal ID |
| Update risk limits within tier | Governance updates risk limits within RiskTier bounds | Limits updated successfully, validated against tier constraints |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Set config at tier minimum | Governance sets risk parameters at tier minimum values | Transaction succeeds, parameters set to minimum allowed |
| Set config at tier maximum | Governance sets risk parameters at tier maximum values | Transaction succeeds, parameters set to maximum allowed |
| Update to same value | Governance attempts to update parameter to its current value | Transaction may succeed (no-op) or revert depending on implementation |
| Query non-existent fund | Query configuration for fund that doesn't exist | Returns default configuration or reverts |
| Add new asset to allowed list | Governance adds new asset within tier constraints | Asset added to allowedAssets array, fund can trade asset |
| Remove asset from allowed list | Governance removes asset from allowed list | Asset removed, fund cannot trade asset anymore |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Set config exceeding tier limits | Governance attempts to set maxDrawdown above tier maximum | Transaction reverts with "Exceeds Tier X max drawdown" error |
| Set config from non-governance | Non-governance address attempts to set configuration | Transaction reverts with "Only Fund Governance" error |
| Set fees exceeding protocol limits | Governance attempts to set fees above protocol maximum | Transaction reverts with "Fee exceeds maximum" error |
| Set invalid risk parameters | Governance attempts to set invalid parameter combinations | Transaction reverts with validation error |
| Update parameter with invalid proposal | Attempt to update config without valid governance proposal | Transaction reverts with "Invalid proposal" error |
| Add disallowed asset | Governance attempts to add asset not allowed for fund's tier | Transaction reverts with "Asset not allowed for tier" error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized config changes | Attacker attempts to modify fund configuration | Transaction reverts, only Fund Governance can update |
| Enforce tier constraints | Attempt to set parameters outside tier limits | Tier limits enforced, invalid parameters rejected |
| Parameter validation | Verify all parameters validated before update | All parameters checked against protocol and tier limits |
| Asset list validation | Verify assets validated against tier allowed list | Only tier-allowed assets can be added, validation enforced |
| Fee limit enforcement | Verify fees cannot exceed protocol maximums | Fee limits enforced per tier, excess fees rejected |
| Configuration immutability after set | Verify configuration cannot be arbitrarily changed | Configuration changes only via governance, no direct modifications |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Set configuration by Fund Governance | Fund Governance sets configuration | Transaction succeeds |
| Set configuration by non-governance | Non-governance attempts to set configuration | Transaction reverts with "Only Fund Governance" |
| Update parameter by Fund Governance | Fund Governance updates single parameter | Transaction succeeds |
| Query functions by any address | Any address queries configuration, fees, risk parameters | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Governance proposal flow | Fund proposal created, voted on, executed, config updated | Complete flow succeeds, configuration reflects proposal outcome |
| RiskEngine uses config | RiskEngine queries fund config for trade validation | Config values read correctly, validation uses correct limits |
| FundTradeExecutor uses config | TradeExecutor checks asset allowed status before execution | Asset validation works correctly, trades validated against config |
| Multi-parameter update | Governance updates multiple parameters in single proposal | All parameters updated atomically, configuration consistent |
| Tier-based limits | Fund config respects tier constraints, updates validated | Tier limits enforced, updates within tier succeed |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Configuration update gas | Fund Governance updates configuration | Gas usage reasonable for configuration update |
| Parameter update gas | Fund Governance updates single parameter | Gas usage reasonable for parameter update |
| Query operations gas | Multiple queries for config, fees, risk parameters | View functions consume no gas (read-only) |

---

**Next**: [FundTradeExecutor](/protocol/contracts/fund/FundTradeExecutor)

