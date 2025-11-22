# ProtocolRiskDomain.sol

## Overview

Monitors protocol-wide risk factors including oracle health, sequencer status, and global exposure limits. This contract is used by RiskEngine to validate protocol-level health before allowing any trades.

## Purpose

- Monitor oracle feed health and confidence
- Detect zkSync sequencer issues
- Track global protocol exposure across all funds
- Detect systemic risks
- Validate protocol state (ACTIVE/PAUSED/EMERGENCY)
- Provide fault index for risk assessment

## Key Features

- **Real-time Validation**: Validates protocol health on-demand via `validate()` function
- **Multi-factor Checks**: Checks protocol state, oracle health, sequencer status, and global exposure
- **Fault Index Calculation**: Returns fault index (0-100) indicating severity of issues
- **Access Control**: Governance can update parameters, guardian can set emergency status
- **Gas Optimized**: Efficient real-time calculation of global exposure

## State Variables

```solidity
IPriceOracleRouter public oracleRouter;
TOSSChainState public chainState;
IFundRegistry public fundRegistry;

uint256 public maxOracleDeviation = 500;  // 5% max deviation (basis points)
uint256 public maxGlobalExposurePerAsset; // Maximum global exposure per asset (in USD, 18 decimals)

bool public protocolHealthy = true;
uint256 public lastHealthCheck;

mapping(address => uint256) public globalExposure;  // asset => total exposure across all funds (in USD, 18 decimals)

// Access Control
address public governance;
address public guardian;

// Sequencer status (for zkSync)
bool public sequencerOperational = true;
```

## Functions

### Constructor

```solidity
constructor(
    address _oracleRouter,
    address _chainState,
    address _fundRegistry,
    address _governance,
    address _guardian
)
```

**Purpose**: Initialize ProtocolRiskDomain contract

**Parameters**:

- `_oracleRouter`: Price oracle router contract address
- `_chainState`: TOSSChainState contract address
- `_fundRegistry`: FundRegistry contract address
- `_governance`: Governance address (for parameter updates)
- `_guardian`: Guardian address (for emergency controls)

**Validations**:

- All addresses must be non-zero
- Reverts with custom errors if any address is invalid

**Initial State**:

- `protocolHealthy = true`
- `lastHealthCheck = block.timestamp`
- `sequencerOperational = true`
- `maxOracleDeviation = 500` (5%)

### `validate`

```solidity
function validate() external view returns (bool healthy, uint256 faultIndex)
```

**Purpose**: Check protocol-level health

**Returns**:

- `healthy`: Whether protocol is healthy
- `faultIndex`: 0 if healthy, >0 if issues

**Checks** (in order of priority):

1. **Protocol State**: Check if protocol is ACTIVE (not PAUSED or EMERGENCY)
   - Fault Index: 100 if paused/emergency
2. **Oracle Health**: Check if oracles are functioning correctly
   - Fault Index: 85 if unhealthy
3. **Sequencer Status**: Check if zkSync sequencer is operational
   - Fault Index: 90 if down
4. **Global Exposure**: Check if global exposure limits are exceeded
   - Fault Index: 75+ (scales with excess) if exceeded

**Fault Index Calculation**:

- Returns the highest fault index among all checks
- If all checks pass, returns `healthy = true, faultIndex = 0`
- If any check fails, returns `healthy = false` with the highest fault index

**Note**:

- This is a view function, so it does not update `lastHealthCheck` or emit events.
- The `lastHealthCheck` timestamp is only set during contract deployment and is not updated on each validation call.
- The `globalExposure` mapping is defined but not actively used - exposure is calculated in real-time rather than cached.

### `checkOracleHealth`

```solidity
function checkOracleHealth() external view returns (bool healthy)
```

**Purpose**: Verify price oracles functioning correctly

**Returns**: `true` if healthy

**Checks**:

1. Oracle router health status
2. Oracle confidence threshold (minimum 50%)
3. Oracle price availability

**Behavior**:

1. First checks `oracleRouter.isHealthy()` if the function exists
2. If router reports unhealthy, returns `false`
3. Always checks price confidence by calling `oracleRouter.getPrice(address(0x1))`
4. Returns `false` if:
   - Router reports unhealthy, OR
   - Confidence is below 50% (MIN_CONFIDENCE), OR
   - Price fetch fails/reverts

**Note**:

- Uses test asset address `0x1` for confidence check. In production, this could be extended to check multiple assets.
- Currently checks oracle confidence, not price deviation between sources. The `maxOracleDeviation` parameter is stored but not actively used in validation (oracle router handles deviation internally).

### Admin Functions

#### `setMaxOracleDeviation`

```solidity
function setMaxOracleDeviation(uint256 newMaxDeviation) external onlyGovernance
```

**Purpose**: Update maximum oracle deviation threshold

**Parameters**:

- `newMaxDeviation`: New max deviation in basis points (max 1000 = 10%)

**Access Control**: Only governance

#### `setMaxGlobalExposurePerAsset`

```solidity
function setMaxGlobalExposurePerAsset(uint256 newMaxExposure) external onlyGovernance
```

**Purpose**: Set maximum global exposure per asset

**Parameters**:

- `newMaxExposure`: New max exposure in USD (18 decimals)

**Access Control**: Only governance

#### `setSequencerStatus`

```solidity
function setSequencerStatus(bool operational) external onlyGuardian
```

**Purpose**: Set sequencer operational status (for testing/emergency)

**Parameters**:

- `operational`: Whether sequencer is operational

**Access Control**: Only guardian

**Events**:

- `SequencerStatusUpdated(bool operational)`
- `SequencerDown(uint256 timestamp)` - emitted when sequencer goes down
- `SequencerUp(uint256 timestamp)` - emitted when sequencer comes back up

**Note**: In production, this should be connected to Chainlink Sequencer Uptime Feed. Currently uses a simple boolean that can be updated by guardian for testing/emergency purposes.

#### `setProtocolHealthy`

```solidity
function setProtocolHealthy(bool healthy) external onlyGuardian
```

**Purpose**: Update protocol healthy status (for emergency use)

**Parameters**:

- `healthy`: Whether protocol is healthy

**Access Control**: Only guardian

**Events**:

- `ProtocolStateChanged(bool healthy)` - emitted when status changes

## Events

```solidity
event ProtocolHealthChecked(bool healthy, uint256 faultIndex, uint256 timestamp);
event OracleDeviationDetected(address asset, uint256 deviation, uint256 threshold);
event GlobalExposureExceeded(address asset, uint256 exposure, uint256 limit);
event SequencerDown(uint256 timestamp);
event SequencerUp(uint256 timestamp);
event ProtocolStateChanged(bool healthy);
event MaxOracleDeviationUpdated(uint256 oldValue, uint256 newValue);
event MaxGlobalExposureUpdated(uint256 oldValue, uint256 newValue);
event SequencerStatusUpdated(bool operational);
```

**Note**: Most events are defined but not emitted in `validate()` because it is a view function. Events are emitted in state-changing functions like `setMaxOracleDeviation()`, `setSequencerStatus()`, etc.

## Custom Errors

```solidity
error NotGovernance();
error NotGuardian();
error InvalidOracleRouter();
error InvalidChainState();
error InvalidFundRegistry();
error InvalidGovernance();
error InvalidGuardian();
```

All errors are used for access control and constructor validation.

## Fault Index Values

The contract uses the following fault index constants:

- `FAULT_INDEX_PROTOCOL_PAUSED = 100`: Protocol is paused
- `FAULT_INDEX_PROTOCOL_EMERGENCY = 100`: Protocol is in emergency state
- `FAULT_INDEX_SEQUENCER_DOWN = 90`: Sequencer is down
- `FAULT_INDEX_ORACLE_DEVIATION = 85`: Oracle health issues
- `FAULT_INDEX_EXPOSURE_EXCEEDED = 75`: Global exposure limits exceeded

The `validate()` function returns the highest fault index among all checks.

## Global Exposure Tracking

The contract tracks global exposure across all active funds using real-time calculation:

1. **Real-time Calculation**: When `validate()` is called, the contract:

   - Gets all active funds from `FundRegistry`
   - For each fund, retrieves holdings via `IFundManagerVault.getAssets()` and `getHoldings()`
   - Calculates total exposure per asset in USD using oracle prices
   - Compares against `maxGlobalExposurePerAsset` limit

2. **Optimization**:

   - Only iterates through active funds
   - Collects unique assets first to avoid duplicate calculations
   - Skips assets with zero holdings

3. **Note**: If `maxGlobalExposurePerAsset` is 0, the global exposure check is skipped.

4. **Gas Optimization**:
   - Limits asset collection to 100 unique assets maximum
   - Skips funds with zero address vaults
   - Skips assets with zero holdings
   - Skips assets where price fetch fails

## Internal Functions

### `_checkGlobalExposure`

```solidity
function _checkGlobalExposure() internal view returns (uint256 faultIndex)
```

**Purpose**: Check global exposure limits across all active funds

**Returns**: Fault index if exposure exceeded, 0 otherwise

**Process**:

1. Returns 0 if `maxGlobalExposurePerAsset` is 0 (no limit set)
2. Gets all active funds from `FundRegistry`
3. Collects unique assets across all funds (max 100 assets)
4. For each asset, calculates total exposure using `_calculateTotalExposureForAsset()`
5. Compares total exposure against `maxGlobalExposurePerAsset`
6. If exceeded, calculates fault index based on excess percentage

**Fault Index Calculation**:

- Base: `FAULT_INDEX_EXPOSURE_EXCEEDED` (75)
- Additional: Based on excess percentage (capped at +20 points)
- Maximum: 100

### `_calculateTotalExposureForAsset`

```solidity
function _calculateTotalExposureForAsset(
    address asset,
    uint256[] memory activeFundIds
) internal view returns (uint256 totalExposure)
```

**Purpose**: Calculate total exposure for a specific asset across all active funds

**Parameters**:

- `asset`: Asset address to calculate exposure for
- `activeFundIds`: Array of active fund IDs

**Returns**: Total exposure in USD (18 decimals)

**Process**:

1. Iterates through all active funds
2. For each fund, gets holdings via `IFundManagerVault.getHoldings(asset)`
3. Gets asset price via `oracleRouter.getPrice(asset)`
4. Converts holdings to USD: `(holdings * price) / 1e8`
5. Sums all fund exposures for the asset

**Note**: Skips funds with zero address vaults or if price fetch fails.

## Implementation Notes

### Current Implementation Details

1. **Oracle Health Check**:

   - Currently checks oracle confidence (minimum 50%) and router health status
   - Does not directly check price deviation between sources (handled by oracle router internally)
   - `maxOracleDeviation` parameter is stored but not actively used in validation logic

2. **Global Exposure Tracking**:

   - Uses real-time calculation instead of cached values
   - `globalExposure` mapping is defined but not actively populated
   - Calculates exposure on-demand when `validate()` is called

3. **Health Check Timestamp**:

   - `lastHealthCheck` is set during deployment but not updated on each validation
   - This is intentional since `validate()` is a view function

4. **Event Emission**:
   - Most events are defined but not emitted in `validate()` (view function limitation)
   - Events are emitted in state-changing admin functions

## Test Scenarios

### Happy Path Tests

| Test Name                | Scenario                                             | Expected Result                                                                                         |
| ------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Validate protocol health | ProtocolRiskDomain validates overall protocol health | Protocol health assessed, healthy status returned, faultIndex calculated                                |
| Check oracle health      | Validate oracle router health and confidence         | Oracle confidence checked (min 50%), oracle health status verified, healthy if confidence sufficient    |
| Check protocol state     | Validate protocol is in healthy operational state    | Protocol state checked, healthy if ACTIVE, unhealthy if PAUSED or EMERGENCY                             |
| Check sequencer status   | Validate zkSync sequencer is operational             | Sequencer status checked, healthy if operational, unhealthy if down                                     |
| Check global exposure    | Validate global exposure limits not exceeded         | Global exposure calculated across all active funds, compared against max limit, healthy if within limit |
| Query protocol health    | Query current protocol health status                 | Returns healthy (bool) and faultIndex, protocol health assessed                                         |

### Edge Cases

| Test Name                         | Scenario                                             | Expected Result                                                                                                        |
| --------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Oracle confidence at threshold    | Oracle confidence exactly at minimum threshold (50%) | Protocol healthy, confidence meets minimum requirement                                                                 |
| Oracle confidence below threshold | Oracle confidence below minimum (50%)                | Protocol unhealthy, faultIndex = 85, oracle health check fails                                                         |
| Multiple oracle issues            | Multiple oracle sources have low confidence          | Worst confidence used, faultIndex reflects oracle health issue                                                         |
| Protocol state at boundary        | Protocol in transitional state                       | State checked correctly, health reflects current state (ACTIVE/PAUSED/EMERGENCY)                                       |
| Global exposure at limit          | Global exposure exactly at maximum limit             | Protocol healthy, exposure within limit                                                                                |
| Global exposure above limit       | Global exposure exceeds maximum limit                | Protocol unhealthy, faultIndex = 75+ (scales with excess), GlobalExposureExceeded event would be emitted (if not view) |

### Failure Cases

| Test Name                           | Scenario                                                   | Expected Result                                                                            |
| ----------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Validate with invalid oracle router | Oracle router address invalid or non-functional            | Constructor reverts with InvalidOracleRouter error                                         |
| Validate during protocol pause      | Attempt to validate when protocol paused                   | Returns unhealthy status (healthy = false), faultIndex = 100 (FAULT_INDEX_PROTOCOL_PAUSED) |
| Validate with missing oracles       | Oracle router getPrice() reverts or returns low confidence | Returns unhealthy status, faultIndex = 85 (FAULT_INDEX_ORACLE_DEVIATION)                   |
| Validate with sequencer down        | Sequencer status set to false                              | Returns unhealthy status, faultIndex = 90 (FAULT_INDEX_SEQUENCER_DOWN)                     |
| Validate with exposure exceeded     | Global exposure exceeds maxGlobalExposurePerAsset          | Returns unhealthy status, faultIndex = 75+ (scales with excess percentage)                 |

### Security Tests

| Test Name                             | Scenario                                                    | Expected Result                                                                                |
| ------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Prevent oracle manipulation           | Attempt to manipulate oracle prices to affect validation    | Oracle prices read from trusted oracles, cannot manipulate                                     |
| Protocol state integrity              | Verify protocol state cannot be manipulated                 | State read from ChainState contract (immutable reference), cannot manipulate                   |
| Global exposure calculation integrity | Verify global exposure calculations cannot be manipulated   | Exposure calculated from on-chain fund holdings and oracle prices, cannot manipulate           |
| FaultIndex calculation accuracy       | Verify faultIndex calculated correctly from protocol issues | FaultIndex reflects actual protocol issues, highest fault index returned, calculation accurate |
| Oracle confidence manipulation        | Attempt to manipulate oracle confidence scores              | Confidence read from trusted oracle router, cannot manipulate                                  |
| Sequencer status manipulation         | Attempt to manipulate sequencer status                      | Only guardian can update sequencer status, protected by access control                         |

### Access Control Tests

| Test Name                      | Scenario                                        | Expected Result                                 |
| ------------------------------ | ----------------------------------------------- | ----------------------------------------------- |
| Validate by any address        | Any address validates protocol health           | Transaction succeeds, validation is public      |
| Query functions by any address | Any address queries protocol health, faultIndex | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name                    | Scenario                                                           | Expected Result                                                                |
| ---------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| RiskEngine integration       | RiskEngine queries ProtocolRiskDomain for protocol health          | Health status returned correctly, used in trade validation                     |
| Oracle router integration    | ProtocolRiskDomain queries PriceOracleRouter for prices and health | Oracle prices and confidence read correctly, health status verified            |
| ChainState integration       | ProtocolRiskDomain checks protocol state from ChainState           | Protocol state read correctly, health reflects state (ACTIVE/PAUSED/EMERGENCY) |
| FundRegistry integration     | ProtocolRiskDomain queries FundRegistry for active funds           | Active funds retrieved correctly, used for global exposure calculation         |
| FundManagerVault integration | ProtocolRiskDomain queries vault holdings for exposure calculation | Holdings retrieved correctly, exposure calculated accurately                   |

### Gas Optimization Tests

| Test Name                  | Scenario                                         | Expected Result                               |
| -------------------------- | ------------------------------------------------ | --------------------------------------------- |
| Protocol validation gas    | Validate protocol health with all checks         | Gas usage reasonable for validation operation |
| Oracle deviation check gas | Check oracle price deviations                    | Gas usage reasonable for oracle checks        |
| Query operations gas       | Multiple queries for protocol health, faultIndex | View functions consume no gas (read-only)     |

---

**Next**: [FundRiskDomain](/protocol/contracts/risk/FundRiskDomain)
