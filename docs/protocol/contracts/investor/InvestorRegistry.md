# InvestorRegistry.sol

## Overview

Central registry for all investors, tracking identity, class, reputation score, and investment history across funds.

## Purpose

- Maintain investor identity database
- Track investor class (Retail, Premium, Institutional, Strategic)
- Calculate and store Investor Composite Score (ICS)
- Monitor investor status and history
- Enable investor queries and filtering

## Dependencies

The contract requires the following dependencies:

- `IStaking`: For TOSS staking balance queries (for class upgrade requirements)
- `InvestorScoreCalculator`: For updating ICS scores (set via admin function)
- `InvestorStateMachine`: For updating investor states (set via admin function)

## State Variables

```solidity
struct InvestorProfile {
    address wallet;
    InvestorClass class;
    uint256 icsScore;           // Investor Composite Score (0-100)
    InvestorState state;        // ACTIVE, LIMITED, HIGH_RISK, FROZEN, BANNED
    uint256 registeredAt;
    uint256 totalInvested;      // Lifetime USD invested
    uint256 tossStaked;         // Current TOSS stake
    uint256 fundsInvested;      // Number of funds invested in
}

mapping(address => InvestorProfile) public investors;
address[] public investorList;

enum InvestorClass { RETAIL, PREMIUM, INSTITUTIONAL, STRATEGIC }
enum InvestorState { ACTIVE, LIMITED, HIGH_RISK, FROZEN, BANNED }
```

**Additional State Variables**:

```solidity
IStaking public immutable staking;                    // Staking contract for stake queries
address public scoreCalculator;                       // InvestorScoreCalculator contract
address public stateMachine;                          // InvestorStateMachine contract
address public governance;                            // For admin functions
mapping(address => bool) public authorizedVaults;    // FundManagerVault addresses
```

## Constructor

```solidity
constructor(
    address _staking,
    address _governance
)
```

**Purpose**: Initialize InvestorRegistry contract

**Parameters**:
- `_staking`: Staking contract address
- `_governance`: Governance address for admin functions

**Validation**: Both parameters must be non-zero addresses

## Functions

### `registerInvestor`

```solidity
function registerInvestor(
    address investor
) external returns (bool)
```

**Purpose**: Register new investor (auto-called on first deposit)

**Returns**: Success status

**Behavior**:
- Creates investor profile with initial values
- Assigns RETAIL class initially
- Sets state to ACTIVE
- Sets ICS score to 0 (will be calculated and updated by InvestorScoreCalculator later)
- Sets totalInvested to 0
- Sets tossStaked to 0
- Sets fundsInvested to 0
- Adds investor to investorList
- Emits `InvestorRegistered` event

**Access Control**: Public (can be called by anyone, typically by FundManagerVault on first deposit)

### `upgradeClass`

```solidity
function upgradeClass(
    address investor,
    InvestorClass newClass
) external
```

**Purpose**: Upgrade investor to higher class

**Requirements**:
- Investor must be registered
- TOSS stake meets threshold (checked via staking contract)
- ICS score meets minimum
- Investor state is not FROZEN or BANNED
- Cannot downgrade class

**Class Thresholds**:
```
RETAIL → PREMIUM: 1,000 TOSS + ICS 50
PREMIUM → INSTITUTIONAL: 10,000 TOSS + ICS 70
INSTITUTIONAL → STRATEGIC: 100,000 TOSS + ICS 85
```

**Behavior**:
- Validates upgrade path (no downgrades)
- Checks all requirements are met
- Updates class in profile
- Emits `InvestorClassUpgraded` event

**Access Control**: Public (anyone can call, but requirements must be met)

**Note**: Class upgrades can also happen automatically when ICS score or stake is updated via `updateICS` or `syncTossStaked`.

### `updateICS`

```solidity
function updateICS(
    address investor,
    uint256 newScore
) external onlyScoreCalculator
```

**Purpose**: Update Investor Composite Score

**Parameters**:
- `investor`: Investor address
- `newScore`: New ICS score (0-100)

**Access Control**: Only InvestorScoreCalculator

**Behavior**:
- Validates investor is registered
- Validates score is 0-100
- Updates ICS score in profile
- Automatically checks if class can be upgraded (auto-upgrade)
- Emits `ICSUpdated` event

### `updateState`

```solidity
function updateState(
    address investor,
    InvestorState newState
) external onlyStateMachine
```

**Purpose**: Update investor state

**Parameters**:
- `investor`: Investor address
- `newState`: New investor state (ACTIVE, LIMITED, HIGH_RISK, FROZEN, BANNED)

**Access Control**: Only InvestorStateMachine

**Behavior**:
- Validates investor is registered
- Updates state in profile
- Emits `InvestorStateUpdated` event

### `updateTotalInvested`

```solidity
function updateTotalInvested(
    address investor,
    uint256 amount
) external onlyAuthorizedVault
```

**Purpose**: Update total invested amount for investor (lifetime total)

**Parameters**:
- `investor`: Investor address
- `amount`: Investment amount to add

**Access Control**: Only authorized FundManagerVault

**Behavior**:
- Validates investor is registered
- Adds amount to totalInvested (lifetime cumulative)
- Emits `TotalInvestedUpdated` event

**Note**: This is cumulative - withdrawals do not reduce this value as it represents lifetime investment.

### `updateFundsInvested`

```solidity
function updateFundsInvested(
    address investor,
    uint256 fundId
) external onlyAuthorizedVault
```

**Purpose**: Update funds invested count (increments when investing in a new fund)

**Parameters**:
- `investor`: Investor address
- `fundId`: Fund ID (for tracking, currently not used to prevent double-counting)

**Access Control**: Only authorized FundManagerVault

**Behavior**:
- Validates investor is registered
- Increments fundsInvested count
- Emits `FundsInvestedUpdated` event

**Note**: This should be called when an investor invests in a new fund for the first time.

### `syncTossStaked`

```solidity
function syncTossStaked(address investor) external
```

**Purpose**: Sync TOSS staked amount from staking contract

**Parameters**:
- `investor`: Investor address

**Access Control**: Public (anyone can call)

**Behavior**:
- Validates investor is registered
- Queries staking contract for current stake
- Updates tossStaked in profile
- Automatically checks if class can be upgraded (auto-upgrade)
- Emits `TossStakedSynced` event

### Query Functions

### `getInvestorProfile`

```solidity
function getInvestorProfile(
    address investor
) external view returns (InvestorProfile memory profile)
```

**Purpose**: Get complete investor profile

**Returns**: InvestorProfile struct with all investor data

**Reverts**: If investor is not registered

### `isRegistered`

```solidity
function isRegistered(address investor) external view returns (bool)
```

**Purpose**: Check if investor is registered

**Returns**: true if registered, false otherwise

### `getICS`

```solidity
function getICS(address investor) external view returns (uint256 icsScore)
```

**Purpose**: Get Investor Composite Score

**Returns**: ICS score (0-100)

**Reverts**: If investor is not registered

### `getInvestorClass`

```solidity
function getInvestorClass(address investor) external view returns (InvestorClass class)
```

**Purpose**: Get investor class

**Returns**: InvestorClass enum (RETAIL, PREMIUM, INSTITUTIONAL, STRATEGIC)

**Reverts**: If investor is not registered

### `getInvestorState`

```solidity
function getInvestorState(address investor) external view returns (InvestorState state)
```

**Purpose**: Get investor state

**Returns**: InvestorState enum (ACTIVE, LIMITED, HIGH_RISK, FROZEN, BANNED)

**Reverts**: If investor is not registered

### `getInvestorCount`

```solidity
function getInvestorCount() external view returns (uint256 count)
```

**Purpose**: Get total number of registered investors

**Returns**: Total investor count

### Admin Functions

### `setScoreCalculator`

```solidity
function setScoreCalculator(address calculator) external onlyGovernance
```

**Purpose**: Set InvestorScoreCalculator contract address

**Access Control**: Only Governance

**Events**: `ScoreCalculatorUpdated(oldCalculator, newCalculator)`

### `setStateMachine`

```solidity
function setStateMachine(address machine) external onlyGovernance
```

**Purpose**: Set InvestorStateMachine contract address

**Access Control**: Only Governance

**Events**: `StateMachineUpdated(oldMachine, newMachine)`

### `authorizeVault`

```solidity
function authorizeVault(address vault, bool authorized) external onlyGovernance
```

**Purpose**: Authorize or revoke FundManagerVault for investment tracking

**Parameters**:
- `vault`: Vault contract address
- `authorized`: true to authorize, false to revoke

**Access Control**: Only Governance

**Events**: `VaultAuthorized(vault, authorized)`

## Events

- `InvestorRegistered(address indexed investor, uint256 indexed registeredAt)`
- `InvestorClassUpgraded(address indexed investor, InvestorClass indexed oldClass, InvestorClass indexed newClass)`
- `ICSUpdated(address indexed investor, uint256 indexed oldScore, uint256 indexed newScore)`
- `InvestorStateUpdated(address indexed investor, InvestorState indexed oldState, InvestorState indexed newState)`
- `TotalInvestedUpdated(address indexed investor, uint256 indexed newTotal)`
- `FundsInvestedUpdated(address indexed investor, uint256 indexed newFundsInvested)`
- `TossStakedSynced(address indexed investor, uint256 indexed newStake)`
- `ScoreCalculatorUpdated(address indexed oldCalculator, address indexed newCalculator)`
- `StateMachineUpdated(address indexed oldMachine, address indexed newMachine)`
- `VaultAuthorized(address indexed vault, bool authorized)`

## Custom Errors

- `InvestorNotRegistered()`: Investor is not registered
- `InvestorAlreadyRegistered()`: Investor is already registered
- `InvalidClassUpgrade()`: Invalid class upgrade attempt (downgrade or same class)
- `RequirementsNotMet()`: Class upgrade requirements not met
- `InvalidScore()`: ICS score out of valid range (0-100)
- `InvalidStateTransition()`: Invalid state transition
- `OnlyScoreCalculator()`: Caller is not InvestorScoreCalculator
- `OnlyStateMachine()`: Caller is not InvestorStateMachine
- `OnlyAuthorizedVault()`: Caller is not authorized vault
- `OnlyGovernance()`: Caller is not governance
- `InvalidAddress()`: Invalid address (zero address)
- `InvalidGovernance()`: Invalid governance address

## Auto-Upgrade Feature

The contract automatically upgrades investor class when:
- ICS score is updated via `updateICS` (if stake requirements are met)
- TOSS stake is synced via `syncTossStaked` (if ICS requirements are met)

Auto-upgrade checks happen after each update and upgrade to the highest eligible class based on current thresholds. This ensures investors are automatically promoted when they meet requirements without requiring manual intervention.

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Register investor on first deposit | New investor deposits to fund for first time | Investor registered automatically, class set to RETAIL, state set to ACTIVE, InvestorRegistered event emitted |
| Query investor profile | Query investor profile by address | Returns investor profile with class, state, score, registration date |
| Upgrade investor class | Investor meets requirements, class upgraded to PREMIUM, INSTITUTIONAL, or STRATEGIC | Class updated, InvestorClassUpgraded event emitted, new class benefits apply |
| Query investor class | Query current investor class | Returns InvestorClass enum (RETAIL, PREMIUM, INSTITUTIONAL, STRATEGIC) |
| Query investor state | Query current investor state | Returns InvestorState enum (ACTIVE, LIMITED, HIGH_RISK, FROZEN, BANNED) |
| Multiple investors registration | Multiple new investors deposit to funds | All investors registered correctly, each tracked independently |
| Update investor score | Investor score updated by InvestorScoreCalculator | Score updated in profile, score change tracked |
| Query investor count | Query total number of registered investors | Returns count of all registered investors |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Register investor with minimum deposit | Investor deposits minimum allowed amount | Investor registered successfully, class set to RETAIL |
| Register investor with maximum deposit | Investor deposits very large amount | Investor registered successfully, class may upgrade if requirements met |
| Upgrade to PREMIUM class | Investor meets PREMIUM requirements (ICS ≥50, stake ≥1k TOSS) | Class upgraded to PREMIUM, benefits unlocked |
| Upgrade to INSTITUTIONAL class | Investor meets INSTITUTIONAL requirements (ICS ≥70, stake ≥10k TOSS) | Class upgraded to INSTITUTIONAL, benefits unlocked |
| Upgrade to STRATEGIC class | Investor meets STRATEGIC requirements (ICS ≥85, stake ≥100k TOSS) | Class upgraded to STRATEGIC, maximum benefits unlocked |
| Query non-registered investor | Query profile for address that hasn't deposited | Transaction reverts with "InvestorNotRegistered" error |
| Investor with zero score | Investor has ICS score of 0 | Score tracked correctly, cannot upgrade class |
| Investor with maximum score | Investor has ICS score of 100 | Maximum score tracked, all class upgrades possible |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Upgrade class without meeting state requirements | Attempt to upgrade when investor is FROZEN or BANNED | Transaction reverts with "Requirements not met" error |
| Upgrade class with invalid path | Attempt to downgrade class | Transaction reverts with "InvalidClassUpgrade" error |
| Upgrade class without meeting requirements | Attempt to upgrade class when requirements not met | Transaction reverts with "Requirements not met" error |
| Upgrade class for non-registered investor | Attempt to upgrade class for address not registered | Transaction reverts with "Investor not registered" error |
| Upgrade to invalid class | Attempt to upgrade to invalid investor class | Transaction reverts with validation error |
| Register investor with invalid parameters | Attempt to register with invalid deposit parameters | Transaction reverts with validation error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized class upgrades | Attacker attempts to upgrade investor class without meeting requirements | Transaction reverts with "RequirementsNotMet" error |
| Registration integrity | Verify investor registration cannot be manipulated | Registration automatic on deposit, cannot manipulate |
| Class upgrade requirements enforcement | Verify class upgrades require meeting all criteria | All requirements checked, cannot upgrade without meeting criteria |
| Profile data integrity | Verify investor profile data cannot be manipulated | Profile data immutable except through authorized updates, cannot manipulate |
| Score update authorization | Verify only InvestorScoreCalculator can update scores | Score updates restricted, only authorized contract can update |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Register investor automatically | Fund vault deposits trigger automatic registration | Registration succeeds, investor profile created |
| Upgrade class by anyone | Anyone can call upgradeClass if requirements are met | Transaction succeeds (public function, requirements enforced) |
| Upgrade class without requirements | Attempt to upgrade without meeting requirements | Transaction reverts with "RequirementsNotMet" |
| Update score by InvestorScoreCalculator | InvestorScoreCalculator updates investor score | Transaction succeeds |
| Update score by non-authorized | Non-authorized attempts to update score | Transaction reverts with "Not authorized" |
| Query functions by any address | Any address queries investor profiles, class, state | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Fund vault deposit registration | Investor deposits to fund, automatically registered | Registration triggered correctly, investor profile created |
| Fund vault investment tracking | Vault reports deposit via updateTotalInvested | Total invested amount updated, lifetime total tracked |
| Fund vault funds count tracking | Vault reports new fund investment via updateFundsInvested | Funds invested count incremented |
| Score calculator integration | InvestorScoreCalculator calculates score, registry updates | Score updated in registry, auto-upgrade checked |
| Staking integration | Investor stakes TOSS, syncTossStaked called | Stake synced from staking contract, auto-upgrade checked |
| Class upgrade flow | Investor meets requirements, class upgraded automatically | Complete flow succeeds, investor receives new class benefits |
| State machine integration | InvestorStateMachine updates state, registry reflects change | State updated correctly, profile reflects new state |
| Multiple fund deposits | Investor deposits to multiple funds, profile shared | Profile shared across funds, class and state consistent |
| Investor rewards integration | InvestorRewardEngine uses investor class for reward calculation | Rewards calculated based on class, higher classes receive better rewards |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Investor registration gas | Investor registered on first deposit | Gas usage reasonable for registration operation |
| Class upgrade gas | Investor class upgraded | Gas usage reasonable for class upgrade |
| Score update gas | Investor score updated | Gas usage reasonable for score update |
| Query operations gas | Multiple queries for investor profiles, class, state | View functions consume no gas (read-only) |

---

**Next**: [InvestorScoreCalculator](/protocol/contracts/investor/InvestorScoreCalculator)

