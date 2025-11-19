# TOSSChainState.sol

## Overview

Tracks global protocol state and parameters, serving as the single source of truth for protocol-wide configuration.

## Purpose

- Store protocol-wide parameters
- Track protocol state (active, paused, emergency)
- Provide global configuration queries
- Enable protocol-wide state transitions

## Core Responsibilities

- ✅ Maintain global protocol state
- ✅ Store protocol parameters
- ✅ Track protocol version
- ✅ Handle pause/unpause
- ✅ Emit state change events

## State Variables

```solidity
// ===== Protocol State =====
enum ProtocolState { ACTIVE, PAUSED, EMERGENCY }
ProtocolState public state;

// ===== Version Tracking =====
uint256 public protocolVersion;  // e.g., 100 = v1.0.0

// ===== Global Parameters =====
uint256 public protocolFeeRate;     // Basis points (e.g., 10 = 0.1%)
uint256 public minFMStake;          // Minimum FM stake in TOSS
uint256 public slashingBurnRatio;   // % of slash that's burned (vs NAV compensation)

// ===== Access Control =====
address public governance;  // DAO governance contract address
address public guardian;    // Emergency guardian address

// ===== Emergency Controls =====
address public emergencyAdmin;
uint256 public lastPauseTime;
uint256 public pauseCount;
```

## Functions

### Constructor

```solidity
constructor(
    address _governance,
    address _guardian,
    address _emergencyAdmin,
    uint256 _initialProtocolFeeRate,
    uint256 _initialMinFMStake,
    uint256 _initialSlashingBurnRatio
)
```

**Parameters**:
- `_governance`: DAO governance contract address
- `_guardian`: Emergency guardian address
- `_emergencyAdmin`: Emergency admin address
- `_initialProtocolFeeRate`: Initial protocol fee rate in basis points (0-100)
- `_initialMinFMStake`: Initial minimum FM stake in TOSS (with 18 decimals, 5k-100k range)
- `_initialSlashingBurnRatio`: Initial slashing burn ratio (10-30)

**Validations**:
- All addresses must not be zero address
- `_initialProtocolFeeRate` must be ≤100 (1% max)
- `_initialMinFMStake` must be between 5,000 and 100,000 TOSS (with 18 decimals)
- `_initialSlashingBurnRatio` must be between 10 and 30

**Initialization**:
1. Sets governance, guardian, and emergencyAdmin addresses
2. Sets initial protocol fee rate (validated ≤100 bps)
3. Sets initial min FM stake (validated 5k-100k TOSS)
4. Sets initial slashing burn ratio (validated 10-30%)
5. Sets protocol version to 100 (v1.0.0)
6. Sets state to ACTIVE
7. Initializes pauseCount to 0

**Post-Deployment**:
- Verify initial state is ACTIVE
- Verify all parameters are set correctly
- Update parameters via governance if needed

### `getProtocolState`

```solidity
function getProtocolState() external view returns (ProtocolState)
```

**Returns**: Current protocol state

### `pause`

```solidity
function pause() external onlyGuardianOrGovernance
```

**Purpose**: Pause protocol in emergency

**Access Control**: Guardian or Governance

**Behavior**:
- Transitions state from ACTIVE to PAUSED
- Updates `lastPauseTime` to current block timestamp
- Increments `pauseCount`
- Reverts if already PAUSED or EMERGENCY

**Events**: `ProtocolPaused(caller, timestamp)`

### `unpause`

```solidity
function unpause() external onlyGovernance
```

**Purpose**: Resume protocol operations

**Access Control**: Only governance (not guardian)

**Behavior**:
- Transitions state from PAUSED to ACTIVE
- Reverts if not in PAUSED state

**Events**: `ProtocolUnpaused(caller, timestamp)`

### `setProtocolFeeRate`

```solidity
function setProtocolFeeRate(uint256 newRate) external onlyGovernance
```

**Purpose**: Update protocol fee rate

**Parameters**:
- `newRate`: New fee in basis points

**Access Control**: Only governance

**Validations**:
- Must be ≤100 (1% max)
- Can't change more than 50% per proposal

**Events**: `ProtocolFeeRateUpdated(oldRate, newRate)`

### `setMinFMStake`

```solidity
function setMinFMStake(uint256 newStake) external onlyGovernance
```

**Purpose**: Update minimum FM stake requirement

**Parameters**:
- `newStake`: New minimum stake in TOSS (with 18 decimals)

**Access Control**: Only governance

**Validations**:
- Must be between 5,000 and 100,000 TOSS

**Events**: `MinFMStakeUpdated(oldStake, newStake)`

### `setSlashingBurnRatio`

```solidity
function setSlashingBurnRatio(uint256 newRatio) external onlyGovernance
```

**Purpose**: Update slashing burn ratio

**Parameters**:
- `newRatio`: New burn ratio (10-30, representing percentage)

**Access Control**: Only governance

**Validations**:
- Must be between 10 and 30 (percentage)

**Events**: `SlashingBurnRatioUpdated(oldRatio, newRatio)`

### `setProtocolVersion`

```solidity
function setProtocolVersion(uint256 newVersion) external onlyGovernance
```

**Purpose**: Update protocol version

**Parameters**:
- `newVersion`: New protocol version (e.g., 101 = v1.0.1)

**Access Control**: Only governance

**Validations**:
- Version can only increase (no downgrades allowed)
- Must be greater than current version

**Events**: `ProtocolVersionUpdated(oldVersion, newVersion)`

### `setEmergencyAdmin`

```solidity
function setEmergencyAdmin(address newAdmin) external onlyGovernance
```

**Purpose**: Update emergency admin address

**Parameters**:
- `newAdmin`: New emergency admin address

**Access Control**: Only governance

**Validations**:
- Must not be zero address

**Events**: `EmergencyAdminUpdated(oldAdmin, newAdmin)`

**Note**: Emergency admin is reserved for future emergency functions

## DAO-Configurable Parameters

| Parameter | Range | Governance Level | Setter Function |
|-----------|-------|------------------|-----------------|
| `protocolFeeRate` | 0-100 bps | Protocol | `setProtocolFeeRate()` |
| `minFMStake` | 5k-100k TOSS | FM-level | `setMinFMStake()` |
| `slashingBurnRatio` | 10-30% | Protocol | `setSlashingBurnRatio()` |
| `protocolVersion` | Increments only | Protocol | `setProtocolVersion()` |
| `emergencyAdmin` | Any address | Protocol | `setEmergencyAdmin()` |

**Note**: All parameter changes require governance approval and emit events for transparency.

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Query protocol state | Query current protocol state | Returns current state (ACTIVE, PAUSED, EMERGENCY) |
| Pause protocol (guardian) | Guardian pauses protocol in emergency | State transitions to PAUSED, lastPauseTime updated, pauseCount incremented, Paused event emitted |
| Unpause protocol | Governance unpauses protocol | State transitions to ACTIVE, Unpaused event emitted |
| Set protocol fee rate | Governance updates protocol fee rate within limits | Fee rate updated, ProtocolFeeRateUpdated event emitted |
| Query protocol version | Query current protocol version | Returns current version number |
| Query protocol fee rate | Query current protocol fee rate | Returns current fee rate in basis points |
| Set min FM stake | Governance updates minimum FM stake within range | Min FM stake updated, MinFMStakeUpdated event emitted |
| Set slashing burn ratio | Governance updates slashing burn ratio within range | Slashing burn ratio updated, SlashingBurnRatioUpdated event emitted |
| Set protocol version | Governance increments protocol version | Protocol version updated, ProtocolVersionUpdated event emitted |
| Set emergency admin | Governance updates emergency admin address | Emergency admin updated, EmergencyAdminUpdated event emitted |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Pause already paused | Guardian attempts to pause when already paused | Transaction may succeed (idempotent) or revert depending on implementation |
| Unpause when active | Governance attempts to unpause when already active | Transaction may succeed (idempotent) or revert |
| Set fee rate to zero | Governance sets protocol fee rate to 0 | Transaction succeeds, fee rate set to 0 |
| Set fee rate to maximum | Governance sets protocol fee rate to maximum allowed | Transaction succeeds, fee rate set to max (100 bps) |
| Query state at deployment | Query protocol state immediately after deployment | Returns ACTIVE state |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Pause from non-guardian | Non-guardian address attempts to pause protocol | Transaction reverts with "Not guardian or governance" error |
| Unpause from non-governance | Non-governance address attempts to unpause | Transaction reverts with "Not governance" error |
| Set fee rate from non-governance | Non-governance address attempts to update fee rate | Transaction reverts with "Not governance" error |
| Set fee rate exceeds maximum | Governance attempts to set fee rate above 100 bps | Transaction reverts with "Fee rate exceeds maximum" error |
| Set fee rate change too large | Governance attempts to change fee rate by more than 50% | Transaction reverts with "Fee change too large" error |
| Pause when in emergency state | Attempt to pause when already in EMERGENCY state | Transaction may succeed or revert (depends on state machine logic) |
| Set min FM stake too low | Governance attempts to set min FM stake below 5,000 TOSS | Transaction reverts with "Invalid min FM stake" error |
| Set min FM stake too high | Governance attempts to set min FM stake above 100,000 TOSS | Transaction reverts with "Invalid min FM stake" error |
| Set slashing burn ratio too low | Governance attempts to set ratio below 10% | Transaction reverts with "Invalid slashing burn ratio" error |
| Set slashing burn ratio too high | Governance attempts to set ratio above 30% | Transaction reverts with "Invalid slashing burn ratio" error |
| Set protocol version decrease | Governance attempts to set version lower than current | Transaction reverts with "Version must increase" error |
| Set emergency admin to zero | Governance attempts to set emergency admin to zero address | Transaction reverts with "Invalid emergency admin" error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized pause | Attacker attempts to pause protocol | Transaction reverts, only guardian or governance can pause |
| Prevent unauthorized unpause | Attacker attempts to unpause protocol | Transaction reverts, only governance can unpause |
| Prevent fee rate manipulation | Verify fee rate cannot be set to extreme values | Bounds enforced, fee rate remains within safe limits |
| Pause count tracking | Multiple pauses tracked correctly | Pause count increments correctly, cannot be manipulated |
| State transition validation | Verify only valid state transitions allowed | Invalid transitions revert (e.g., EMERGENCY cannot directly go to ACTIVE) |
| Guardian cannot unpause | Verify guardian can pause but cannot unpause | Guardian pause succeeds, guardian unpause reverts |
| Fee rate change limits | Verify fee rate cannot change more than 50% per proposal | Change limit enforced, prevents sudden extreme changes |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Pause by guardian | Guardian pauses protocol | Transaction succeeds |
| Pause by governance | Governance pauses protocol | Transaction succeeds |
| Pause by non-authorized | Non-authorized address attempts to pause | Transaction reverts with "Not guardian or governance" |
| Unpause by governance | Governance unpauses protocol | Transaction succeeds |
| Unpause by non-governance | Non-governance attempts to unpause | Transaction reverts with "Not governance" |
| Set fee rate by governance | Governance updates fee rate | Transaction succeeds |
| Set fee rate by non-governance | Non-governance attempts to update fee rate | Transaction reverts with "Not governance" |
| Set min FM stake by governance | Governance updates min FM stake | Transaction succeeds |
| Set min FM stake by non-governance | Non-governance attempts to update min FM stake | Transaction reverts with "Not governance" |
| Set slashing burn ratio by governance | Governance updates slashing burn ratio | Transaction succeeds |
| Set slashing burn ratio by non-governance | Non-governance attempts to update ratio | Transaction reverts with "Not governance" |
| Set protocol version by governance | Governance increments protocol version | Transaction succeeds |
| Set protocol version by non-governance | Non-governance attempts to update version | Transaction reverts with "Not governance" |
| Set emergency admin by governance | Governance updates emergency admin | Transaction succeeds |
| Set emergency admin by non-governance | Non-governance attempts to update emergency admin | Transaction reverts with "Not governance" |
| Query functions by any address | Any address queries state, version, fee rate | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Protocol pause affects operations | Protocol paused, other contracts check state before operations | Other contracts respect paused state, operations blocked |
| Fee rate used by contracts | Protocol fee rate queried by other contracts for fee calculations | Fee calculations use current fee rate from ChainState |
| State monitoring | Off-chain systems monitor protocol state changes via events | Events captured correctly, monitoring systems updated |
| Emergency procedures | Protocol enters emergency state, emergency procedures activated | Emergency state properly communicated, procedures execute correctly |
| Version tracking | Protocol version updated on upgrades | Version increments correctly, tracking maintained |

### State Transition Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| ACTIVE → PAUSED | Guardian or governance pauses active protocol | State transitions correctly to PAUSED |
| PAUSED → ACTIVE | Governance unpauses paused protocol | State transitions correctly to ACTIVE |
| ACTIVE → EMERGENCY | Protocol enters emergency state | State transitions correctly to EMERGENCY |
| EMERGENCY → PAUSED | Emergency state transitions to paused | Transition may be allowed or blocked (depends on implementation) |
| EMERGENCY → ACTIVE | Attempt to go directly from emergency to active | Transaction reverts, must go through paused state first |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Pause operation gas | Guardian pauses protocol | Gas usage reasonable for state change |
| Unpause operation gas | Governance unpauses protocol | Gas usage reasonable for state change |
| Fee rate update gas | Governance updates fee rate | Gas usage reasonable for parameter update |
| Query operations gas | Multiple queries for state, version, fee rate | View functions consume no gas (read-only) |

## Events

```solidity
// State Management
event ProtocolPaused(address indexed caller, uint256 timestamp);
event ProtocolUnpaused(address indexed caller, uint256 timestamp);

// Parameter Updates
event ProtocolFeeRateUpdated(uint256 oldRate, uint256 newRate);
event MinFMStakeUpdated(uint256 oldStake, uint256 newStake);
event SlashingBurnRatioUpdated(uint256 oldRatio, uint256 newRatio);
event ProtocolVersionUpdated(uint256 oldVersion, uint256 newVersion);
event EmergencyAdminUpdated(address indexed oldAdmin, address indexed newAdmin);
```

## Access Control

### Roles

| Role | Addresses | Permissions |
|------|-----------|-------------|
| **Governance** | DAO | Pause, unpause, set all parameters |
| **Guardian** | Emergency guardian | Pause only (emergency response) |
| **Emergency Admin** | Emergency admin | Reserved for future emergency functions |

### Modifiers

```solidity
modifier onlyGovernance() {
    require(msg.sender == governance, "TOSSChainState: Not governance");
    _;
}

modifier onlyGuardianOrGovernance() {
    require(
        msg.sender == guardian || msg.sender == governance,
        "TOSSChainState: Not guardian or governance"
    );
    _;
}
```

### Permission Matrix

| Function | Anyone | Governance | Guardian |
|----------|---------|------------|----------|
| `getProtocolState` | ✅ | ✅ | ✅ |
| `pause` | ❌ | ✅ | ✅ |
| `unpause` | ❌ | ✅ | ❌ |
| `setProtocolFeeRate` | ❌ | ✅ | ❌ |
| `setMinFMStake` | ❌ | ✅ | ❌ |
| `setSlashingBurnRatio` | ❌ | ✅ | ❌ |
| `setProtocolVersion` | ❌ | ✅ | ❌ |
| `setEmergencyAdmin` | ❌ | ✅ | ❌ |

## Security Considerations

### Attack Vectors

#### 1. Unauthorized State Changes

**Risk**: Attacker pauses protocol or changes parameters

**Mitigation**:
- ✅ Only governance and guardian can pause
- ✅ Only governance can unpause
- ✅ Only governance can change parameters
- ✅ Guardian cannot unpause (governance must review)

**Severity**: Low (access control enforced)

#### 2. Parameter Manipulation

**Risk**: Governance sets extreme parameter values

**Mitigation**:
- ✅ Fee rate limited to 100 bps (1% max)
- ✅ Fee rate change limited to 50% per update
- ✅ Min FM stake limited to 5k-100k TOSS range
- ✅ Slashing burn ratio limited to 10-30% range
- ✅ Protocol version can only increase

**Severity**: Low (bounds enforced)

#### 3. State Machine Bypass

**Risk**: Invalid state transitions

**Mitigation**:
- ✅ Pause only allowed from ACTIVE state
- ✅ Unpause only allowed from PAUSED state
- ✅ State transitions validated

**Severity**: Low (state machine enforced)

### Audit Focus Areas

1. **State Machine**: Verify only valid state transitions allowed
2. **Access Controls**: Verify governance and guardian roles enforced
3. **Parameter Bounds**: Verify all parameter limits enforced
4. **Fee Rate Change Limit**: Verify 50% change limit calculation
5. **Version Increment**: Verify version can only increase

## Integration Points

### Incoming Interactions

| Contract | Function Called | Purpose |
|----------|----------------|---------|
| FundFactory | `getProtocolState()` | Check if protocol is paused before fund creation |
| FundFactory | `minFMStake()` | Validate FM stake meets minimum requirement |
| RiskEngine | `getProtocolState()` | Check if protocol is paused before trade validation |
| SlashingEngine | `slashingBurnRatio()` | Get burn ratio for slashing calculations |
| Treasury | `protocolFeeRate()` | Calculate protocol fees |
| Governance | `getProtocolState()` | Check protocol state for proposals |
| Governance | `pause()` / `unpause()` | Pause/unpause protocol via governance |

### Outgoing Interactions

TOSSChainState.sol does not call external contracts (pure state management).

## Deployment

### Deployment Order

1. **First**: Deploy TOSSChainState.sol (required by other contracts)
2. Deploy other core contracts (TOSS, Treasury, etc.)
3. Other contracts reference TOSSChainState for state and parameters

### Constructor Arguments

```typescript
const deployArgs = {
  governance: daoGovernanceAddress,
  guardian: emergencyGuardianAddress,
  emergencyAdmin: emergencyAdminAddress,
  initialProtocolFeeRate: 10,  // 0.1% in basis points
  initialMinFMStake: ethers.parseEther("10000"),  // 10,000 TOSS
  initialSlashingBurnRatio: 20  // 20%
};

const TOSSChainState = await ethers.deployContract("TOSSChainState", [
  deployArgs.governance,
  deployArgs.guardian,
  deployArgs.emergencyAdmin,
  deployArgs.initialProtocolFeeRate,
  deployArgs.initialMinFMStake,
  deployArgs.initialSlashingBurnRatio
]);
```

### Post-Deployment Setup

```solidity
// 1. Verify initial state
await chainState.getProtocolState(); // Should return ACTIVE (0)

// 2. Verify initial parameters
await chainState.protocolFeeRate(); // Should return initial value
await chainState.minFMStake(); // Should return initial value
await chainState.slashingBurnRatio(); // Should return initial value

// 3. Update parameters if needed (via governance)
await chainState.setProtocolFeeRate(newRate);
await chainState.setMinFMStake(newStake);
await chainState.setSlashingBurnRatio(newRatio);
```

### Verification

```bash
# Verify on block explorer
npx hardhat verify --network zkSyncMainnet \
  CONTRACT_ADDRESS \
  "GOVERNANCE_ADDRESS" \
  "GUARDIAN_ADDRESS" \
  "EMERGENCY_ADMIN_ADDRESS" \
  INITIAL_FEE_RATE \
  INITIAL_MIN_FM_STAKE \
  INITIAL_SLASHING_BURN_RATIO
```

## Example Usage

### Checking Protocol State

```typescript
// Check if protocol is active before operations
const state = await chainState.getProtocolState();
if (state === 0) { // ACTIVE
  // Proceed with operations
} else {
  // Protocol is paused, block operations
}
```

### Pausing Protocol in Emergency

```typescript
// Guardian pauses protocol
await chainState.connect(guardian).pause();

// Verify state changed
const newState = await chainState.getProtocolState();
// newState === 1 (PAUSED)
```

### Updating Protocol Parameters

```typescript
// Governance updates fee rate (within 50% limit)
const currentRate = await chainState.protocolFeeRate();
const newRate = currentRate + (currentRate * 50 / 100); // Max 50% increase
await chainState.connect(governance).setProtocolFeeRate(newRate);

// Update min FM stake
await chainState.connect(governance).setMinFMStake(ethers.parseEther("20000"));

// Update slashing burn ratio
await chainState.connect(governance).setSlashingBurnRatio(25);

// Increment protocol version
await chainState.connect(governance).setProtocolVersion(101);
```

## Related Contracts

- **[TOSS.sol](/protocol/contracts/core/TOSS)**: Token contract (may check protocol state)
- **[FundFactory.sol](/protocol/contracts/fund/FundFactory)**: Uses minFMStake and protocol state
- **[RiskEngine.sol](/protocol/contracts/risk/RiskEngine)**: Uses protocol state and slashingBurnRatio
- **[TOSSTreasury.sol](/protocol/contracts/core/TOSSTreasury)**: Uses protocolFeeRate
- **[ProtocolGovernance.sol](/protocol/contracts/governance/ProtocolGovernance)**: Uses protocol state for proposals

## References

- **State Machine Pattern**: OpenZeppelin Pausable
- **Access Control**: Simple address-based modifiers
- **zkSync Considerations**: [zkSync State Management](https://era.zksync.io/dev/building-on-zksync/contracts/differences-with-ethereum.html)

---

**Core Contracts Complete** | [Fund Layer →](/protocol/contracts/fund/FundFactory)
