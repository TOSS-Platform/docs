# InvestorRegistry.sol

## Overview

Central registry for all investors, tracking identity, class, reputation score, and investment history across funds.

## Purpose

- Maintain investor identity database
- Track investor class (Retail, Premium, Institutional, Strategic)
- Calculate and store Investor Composite Score (ICS)
- Monitor investor status and history
- Enable investor queries and filtering

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
- Creates investor profile
- Assigns RETAIL class initially
- Sets state to ACTIVE
- Calculates initial ICS

### `upgradeClass`

```solidity
function upgradeClass(
    address investor,
    InvestorClass newClass
) external
```

**Purpose**: Upgrade investor to higher class

**Requirements**:
- TOSS stake meets threshold
- ICS score meets minimum
- No violations

**Class Thresholds**:
```
RETAIL → PREMIUM: 1,000 TOSS + ICS 50
PREMIUM → INSTITUTIONAL: 10,000 TOSS + ICS 70
INSTITUTIONAL → STRATEGIC: 100,000 TOSS + ICS 85
```

### `updateICS`

```solidity
function updateICS(
    address investor,
    uint256 newScore
) external onlyScoreCalculator
```

**Purpose**: Update Investor Composite Score

**Access Control**: Only InvestorScoreCalculator

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Register investor on first deposit | New investor deposits to fund for first time | Investor registered automatically, class set to RETAIL, state set to ACTIVE, InvestorRegistered event emitted |
| Query investor profile | Query investor profile by address | Returns investor profile with class, state, score, registration date |
| Upgrade investor class | Investor meets requirements, class upgraded to PREMIUM or WHALE | Class updated, InvestorClassUpgraded event emitted, new class benefits apply |
| Query investor class | Query current investor class | Returns InvestorClass enum (RETAIL, PREMIUM, WHALE) |
| Query investor state | Query current investor state | Returns InvestorState enum (ACTIVE, LIMITED, SUSPENDED, BANNED) |
| Multiple investors registration | Multiple new investors deposit to funds | All investors registered correctly, each tracked independently |
| Update investor score | Investor score updated by InvestorScoreCalculator | Score updated in profile, score change tracked |
| Query investor count | Query total number of registered investors | Returns count of all registered investors |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Register investor with minimum deposit | Investor deposits minimum allowed amount | Investor registered successfully, class set to RETAIL |
| Register investor with maximum deposit | Investor deposits very large amount | Investor registered successfully, class may upgrade if requirements met |
| Upgrade to PREMIUM class | Investor meets PREMIUM requirements (ICS ≥50, stake ≥1k TOSS) | Class upgraded to PREMIUM, benefits unlocked |
| Upgrade to WHALE class | Investor meets WHALE requirements (ICS ≥80, stake ≥10k TOSS) | Class upgraded to WHALE, maximum benefits unlocked |
| Query non-registered investor | Query profile for address that hasn't deposited | Returns default profile or reverts depending on implementation |
| Investor with zero score | Investor has ICS score of 0 | Score tracked correctly, cannot upgrade class |
| Investor with maximum score | Investor has ICS score of 100 | Maximum score tracked, all class upgrades possible |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Upgrade class from non-authorized | Non-authorized address attempts to upgrade investor class | Transaction reverts with "Not authorized" error |
| Upgrade class without meeting requirements | Attempt to upgrade class when requirements not met | Transaction reverts with "Requirements not met" error |
| Upgrade class for non-registered investor | Attempt to upgrade class for address not registered | Transaction reverts with "Investor not registered" error |
| Upgrade to invalid class | Attempt to upgrade to invalid investor class | Transaction reverts with validation error |
| Register investor with invalid parameters | Attempt to register with invalid deposit parameters | Transaction reverts with validation error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized class upgrades | Attacker attempts to upgrade investor class | Transaction reverts, only authorized contracts can upgrade |
| Registration integrity | Verify investor registration cannot be manipulated | Registration automatic on deposit, cannot manipulate |
| Class upgrade requirements enforcement | Verify class upgrades require meeting all criteria | All requirements checked, cannot upgrade without meeting criteria |
| Profile data integrity | Verify investor profile data cannot be manipulated | Profile data immutable except through authorized updates, cannot manipulate |
| Score update authorization | Verify only InvestorScoreCalculator can update scores | Score updates restricted, only authorized contract can update |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Register investor automatically | Fund vault deposits trigger automatic registration | Registration succeeds, investor profile created |
| Upgrade class by authorized contract | Authorized contract (e.g., InvestorScoreCalculator) upgrades class | Transaction succeeds |
| Upgrade class by non-authorized | Non-authorized attempts to upgrade class | Transaction reverts with "Not authorized" |
| Update score by InvestorScoreCalculator | InvestorScoreCalculator updates investor score | Transaction succeeds |
| Update score by non-authorized | Non-authorized attempts to update score | Transaction reverts with "Not authorized" |
| Query functions by any address | Any address queries investor profiles, class, state | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Fund vault deposit registration | Investor deposits to fund, automatically registered | Registration triggered correctly, investor profile created |
| Score calculator integration | InvestorScoreCalculator calculates score, registry updates | Score updated in registry, class upgrade checked |
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

