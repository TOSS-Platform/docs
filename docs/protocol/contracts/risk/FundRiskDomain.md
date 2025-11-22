# FundRiskDomain.sol

## Overview

Validates fund-specific risk limits including position sizes, concentration, exposure, volatility, and drawdown constraints.

## Purpose

- Enforce Position Size Limit (PSL)
- Enforce Portfolio Concentration Limit (PCL)
- Enforce Asset Exposure Limit (AEL)
- Monitor volatility and drawdown
- Validate trades against fund-specific limits

## State Variables

```solidity
IFundConfig public fundConfig;
IFundRegistry public fundRegistry;

// ===== Real-time Tracking =====
struct FundRiskState {
    uint256 currentVolatility;     // 30-day trailing
    uint256 currentDrawdown;       // From HWM
    uint256 largestPosition;       // Current largest position %
}

mapping(uint256 => FundRiskState) public fundStates;
mapping(uint256 => mapping(address => uint256)) public assetExposure; // fundId => asset => % of NAV

// ===== Access Control =====
address public governance;
mapping(address => bool) public navEngines; // Whitelisted NAV Engines
```

## Functions

### Constructor

```solidity
constructor(
    address _fundConfig,
    address _fundRegistry,
    address _governance
)
```

**Purpose**: Initialize FundRiskDomain contract

**Parameters**:
- `_fundConfig`: FundConfig contract address
- `_fundRegistry`: FundRegistry contract address
- `_governance`: Governance address

**Validation**: All parameters must be non-zero addresses

### `validate`

```solidity
function validate(
    uint256 fundId,
    IFundTradeExecutor.TradeParams calldata params
) external view returns (bool passed, uint256 faultIndex)
```

**Purpose**: Validate trade against fund risk limits

**Parameters**:
- `fundId`: Fund executing trade
- `params`: Trade parameters

**Returns**:
- `passed`: Whether trade passes all checks
- `faultIndex`: Severity of violation if any

**Checks Performed**:
1. **Asset Allowed**: Asset in whitelist (always checked)
2. **PSL Check**: Position size ≤ maxPositionSize (⚠️ Currently disabled - requires price oracle)
3. **PCL Check**: Concentration ≤ maxConcentration (⚠️ Currently disabled - requires price oracle)
4. **AEL Check**: Exposure ≤ maxAssetExposure (⚠️ Currently disabled - requires price oracle)
5. **Volatility Check**: Current vol ≤ maxVolatility (active)
6. **Drawdown Check**: Current DD ≤ maxDrawdown (active)

**Note**: PSL, PCL, and AEL checks are currently disabled because they require price oracle to convert token amounts (18 decimals) to USD values to compare with NAV (6 decimals). These checks will be enabled when price oracle is integrated.

**FI Calculation**:
```solidity
if (violation) {
    limitBreach = (actualValue - limitValue) / limitValue * 100;
    faultIndex = limitBreach * severity_weight;
}
```

### `updateFundState`

```solidity
function updateFundState(
    uint256 fundId,
    uint256 newVolatility,
    uint256 newDrawdown
) external onlyNAVEngine
```

**Purpose**: Update fund's current risk metrics

**Access Control**: Only NAV Engine (whitelisted addresses)

**Note**: NAV Engines must be whitelisted by governance using `setNAVEngine` function.

### `setNAVEngine`

```solidity
function setNAVEngine(
    address navEngine,
    bool enabled
) external onlyGovernance
```

**Purpose**: Add or remove NAV Engine from whitelist

**Access Control**: Only governance

**Parameters**:
- `navEngine`: NAV Engine address to whitelist/remove
- `enabled`: `true` to enable, `false` to disable

### `getFundRiskState`

```solidity
function getFundRiskState(
    uint256 fundId
) external view returns (
    uint256 volatility,
    uint256 drawdown,
    uint256 largestPosition
)
```

**Purpose**: Get fund's current risk state

**Returns**:
- `volatility`: Current volatility (basis points)
- `drawdown`: Current drawdown (basis points)
- `largestPosition`: Largest position percentage (basis points)

### `getPositionConcentration`

```solidity
function getPositionConcentration(
    uint256 fundId,
    address asset
) external view returns (uint256 concentration)
```

**Purpose**: Get position concentration for a specific asset

**Returns**:
- `concentration`: Concentration in basis points

### `getAssetExposure`

```solidity
function getAssetExposure(
    uint256 fundId,
    address asset
) external view returns (uint256 exposure)
```

**Purpose**: Get asset exposure for a specific asset

**Returns**:
- `exposure`: Exposure in basis points

**Note**: Currently, exposure is calculated the same as concentration. In the future, this could be asset class based.

## Events

```solidity
event FundStateUpdated(uint256 indexed fundId, uint256 volatility, uint256 drawdown);
event TradeValidated(uint256 indexed fundId, bool passed, uint256 faultIndex);
event PositionSizeViolation(uint256 indexed fundId, uint256 actual, uint256 limit);
event ConcentrationViolation(uint256 indexed fundId, address asset, uint256 actual, uint256 limit);
event ExposureViolation(uint256 indexed fundId, address asset, uint256 actual, uint256 limit);
event VolatilityViolation(uint256 indexed fundId, uint256 actual, uint256 limit);
event DrawdownViolation(uint256 indexed fundId, uint256 actual, uint256 limit);
event AssetNotAllowed(uint256 indexed fundId, address asset);
event NAVEngineUpdated(address indexed navEngine, bool enabled);
```

## Custom Errors

```solidity
error InvalidFundConfig();
error InvalidFundRegistry();
error InvalidNAVEngine();
error NotNAVEngine();
error NotGovernance();
error FundNotFound();
error InvalidVolatility();
error InvalidDrawdown();
error InvalidGovernance();
```

## Constants

```solidity
uint256 private constant BASIS_POINTS = 10000;
uint256 private constant FAULT_INDEX_ASSET_NOT_ALLOWED = 100;
uint256 private constant FAULT_INDEX_PSL_WEIGHT = 1;
uint256 private constant FAULT_INDEX_PCL_WEIGHT = 1;
uint256 private constant FAULT_INDEX_AEL_WEIGHT = 1;
uint256 private constant FAULT_INDEX_VOLATILITY_WEIGHT = 2;
uint256 private constant FAULT_INDEX_DRAWDOWN_WEIGHT = 3;
```

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Validate trade within all limits | Trade meets all active risk limits (volatility, drawdown, asset allowed) | Trade validated successfully, passed=true, low faultIndex |
| Validate trade within PSL | FundRiskDomain validates trade within Position Size Limit | ⚠️ Currently disabled - requires price oracle |
| Validate trade within PCL | FundRiskDomain validates trade within Position Concentration Limit | ⚠️ Currently disabled - requires price oracle |
| Validate trade within AEL | FundRiskDomain validates trade within Asset Exposure Limit | ⚠️ Currently disabled - requires price oracle |
| Query fund risk parameters | Query all risk limits for fund | Returns PSL, PCL, AEL, maxDrawdown, maxVolatility values |
| Calculate position concentration | Calculate current concentration for specific asset | Concentration calculated correctly, compared against PCL |
| Calculate asset exposure | Calculate exposure for asset class | Exposure calculated correctly, compared against AEL |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Trade exactly at PSL | Trade size exactly equals Position Size Limit | ⚠️ Currently disabled - requires price oracle |
| Trade exactly at PCL | Trade creates concentration exactly at Position Concentration Limit | ⚠️ Currently disabled - requires price oracle |
| Trade exactly at AEL | Trade creates exposure exactly at Asset Exposure Limit | ⚠️ Currently disabled - requires price oracle |
| Trade with zero NAV | Attempt to validate trade when fund NAV is zero | Transaction succeeds (checks skipped when NAV is zero) |
| Trade with minimum size | Trade size at minimum trade size limit | Trade approved at minimum boundary |
| Trade with maximum size | Trade size at maximum allowed (PSL limit) | ⚠️ Currently disabled - requires price oracle |
| Multiple trades same asset | Multiple trades in same asset, cumulative concentration | ⚠️ Currently disabled - requires price oracle |
| Volatility exactly at limit | Fund volatility exactly equals maxVolatility | Trade may be approved or rejected depending on implementation (strict &lt; or &lt;=) |
| Drawdown exactly at limit | Fund drawdown exactly equals maxDrawdown | Trade may be approved or rejected depending on implementation |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Reject trade exceeding PSL | Trade size exceeds Position Size Limit | ⚠️ Currently disabled - requires price oracle |
| Reject trade exceeding PCL | Trade creates concentration above Position Concentration Limit | ⚠️ Currently disabled - requires price oracle |
| Reject trade exceeding AEL | Trade creates exposure above Asset Exposure Limit | ⚠️ Currently disabled - requires price oracle |
| Reject trade exceeding drawdown | Fund drawdown exceeds maximum | Trade rejected, passed=false, high faultIndex, drawdown violation detected |
| Reject trade exceeding volatility | Fund volatility exceeds maximum | Trade rejected, passed=false, high faultIndex, volatility violation detected |
| Validate trade for non-existent fund | Attempt to validate trade for fund that doesn't exist | Transaction reverts with "FundNotFound" error |
| Validate trade with invalid parameters | Attempt to validate trade with invalid parameters | Transaction reverts with validation error |
| Validate trade with disallowed asset | Attempt to validate trade for asset not in allowed list | Trade rejected, passed=false, faultIndex=100 (FAULT_INDEX_ASSET_NOT_ALLOWED) |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent limit bypass | Attempt to bypass risk limits through multiple small trades | Cumulative limits checked, cannot bypass via splitting trades |
| Limit manipulation prevention | Attempt to manipulate risk limit calculations | Limits read from FundConfig, cannot manipulate in calculation |
| NAV manipulation prevention | Attempt to manipulate NAV to affect position size calculations | NAV read from vault, cannot manipulate |
| Concentration calculation accuracy | Verify concentration calculated correctly | Concentration calculated from holdings, calculation accurate |
| Exposure calculation accuracy | Verify exposure calculated correctly per asset class | Exposure calculated from portfolio, calculation accurate |
| Risk parameter integrity | Verify risk parameters cannot be manipulated | Parameters read from FundConfig, cannot manipulate |
| FaultIndex calculation accuracy | Verify faultIndex reflects actual limit breaches | FaultIndex calculated correctly, reflects severity of breaches |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Validate trade by any address | Any address validates trade | Transaction succeeds, validation is public |
| Query functions by any address | Any address queries risk parameters, concentrations | Queries succeed, read-only functions are public |
| Update fund state by NAV Engine | NAV Engine updates fund volatility and drawdown | Transaction succeeds, fund state updated |
| Update fund state by non-NAV Engine | Non-whitelisted address attempts to update fund state | Transaction reverts with "NotNAVEngine" error |
| Set NAV Engine by governance | Governance whitelists NAV Engine | Transaction succeeds, NAV Engine whitelisted |
| Set NAV Engine by non-governance | Non-governance address attempts to set NAV Engine | Transaction reverts with "NotGovernance" error |
| Set NAV Engine with zero address | Governance attempts to set zero address as NAV Engine | Transaction reverts with "InvalidNAVEngine" error |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| RiskEngine integration | RiskEngine queries FundRiskDomain for fund risk validation | Fund risk assessed correctly, faultIndex returned |
| FundConfig integration | FundRiskDomain reads risk limits from FundConfig | Limits read correctly, validation uses current fund limits |
| FundManagerVault integration | FundRiskDomain reads holdings and NAV from vault | Holdings and NAV read correctly, calculations accurate |
| Multiple limit checks | FundRiskDomain checks all active limits (volatility, drawdown, asset allowed) | All active limits checked, worst violation used for faultIndex |
| Cumulative concentration tracking | Multiple trades in same asset, cumulative concentration tracked | ⚠️ Currently disabled - requires price oracle |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Trade validation gas | FundRiskDomain validates trade with all limit checks | Gas usage reasonable for validation operation |
| Concentration calculation gas | Calculate position concentration | Gas usage reasonable for calculation |
| Exposure calculation gas | Calculate asset exposure | Gas usage reasonable for calculation |
| Query operations gas | Multiple queries for risk parameters, concentrations | View functions consume no gas (read-only) |

---

**Next**: [InvestorRiskDomain](/protocol/contracts/risk/InvestorRiskDomain)

