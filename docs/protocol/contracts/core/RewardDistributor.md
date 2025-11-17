# RewardDistributor.sol

## Overview

Distributes staking rewards and governance incentives to TOSS holders, Fund Managers, and active governance participants.

## Purpose

- Distribute staking rewards proportionally
- Incentivize governance participation
- Reward high-performing investors
- Automate reward calculations

## Core Responsibilities

- ✅ Calculate reward shares per stakeholder
- ✅ Distribute TOSS rewards from protocol fees
- ✅ Track reward history
- ✅ Handle reward claims
- ✅ Governance participation bonuses

## State Variables

```solidity
ITOSS public tossToken;
IStaking public staking;
IGovernance public governance;

mapping(address => uint256) public pendingRewards;
mapping(address => uint256) public claimedRewards;
uint256 public totalDistributed;

uint256 public rewardRate;  // Rewards per second per TOSS staked
uint256 public lastUpdateTime;
```

## Functions

### `distributeRewards`

```solidity
function distributeRewards(
    address[] calldata recipients,
    uint256[] calldata amounts
) external onlyGovernance
```

**Purpose**: Distribute rewards to multiple recipients

**Parameters**:
- `recipients`: Array of addresses
- `amounts`: Corresponding reward amounts

**Access Control**: Only governance

**Events**: `RewardsDistributed(recipients, amounts, timestamp)`

### `claimRewards`

```solidity
function claimRewards() external returns (uint256 amount)
```

**Purpose**: Claim pending rewards

**Returns**: Amount claimed

**Behavior**:
- Calculates pending rewards
- Transfers TOSS to caller
- Updates claimed tracking

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Distribute rewards | Governance distributes rewards to multiple recipients | Rewards distributed, pendingRewards updated for each recipient, RewardsDistributed event emitted |
| Claim pending rewards | User claims their pending rewards | Rewards transferred to user, pendingRewards reset, claimedRewards incremented |
| Calculate staking rewards | System calculates rewards based on staked amount and reward rate | Rewards calculated correctly using formula: stakedAmount × rewardRate × timePeriod |
| Distribute to single recipient | Governance distributes rewards to single recipient | Single recipient receives rewards, tracking updated correctly |
| Batch reward distribution | Governance distributes different amounts to multiple recipients in one transaction | All recipients receive correct amounts, batch operation atomic |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Distribute zero rewards | Governance attempts to distribute 0 rewards | Transaction succeeds (zero is valid), no state change except event emission |
| Claim zero pending rewards | User attempts to claim when pendingRewards is zero | Transaction succeeds, no tokens transferred, claimedRewards unchanged |
| Distribute to empty recipient list | Governance attempts to distribute with empty recipient array | Transaction reverts with validation error |
| Mismatched array lengths | Governance attempts to distribute with mismatched recipient and amount arrays | Transaction reverts with "Array length mismatch" error |
| Distribute max uint256 rewards | Governance distributes maximum possible reward amount | Transaction succeeds, rewards distributed correctly |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Distribute from non-governance | Non-governance address attempts to distribute rewards | Transaction reverts with "Not governance" error |
| Distribute exceeding available balance | Governance attempts to distribute more rewards than contract holds | Transaction reverts with "Insufficient balance" error |
| Claim rewards exceeding pending | User attempts to claim more than their pending rewards | Transaction reverts with "Insufficient pending rewards" error |
| Distribute to zero address | Governance attempts to distribute rewards to address(0) | Transaction reverts with zero address validation error |
| Duplicate recipients in batch | Governance attempts to distribute to same recipient multiple times in batch | Transaction reverts or handles correctly (depends on implementation) |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized distribution | Attacker attempts to distribute rewards | Transaction reverts, only governance can distribute |
| Reward calculation accuracy | Verify reward calculations cannot be manipulated | Rewards calculated using deterministic formula, no manipulation possible |
| Double claim prevention | User attempts to claim rewards twice | First claim succeeds, second claim reverts (pendingRewards already claimed) |
| Reentrancy protection | Malicious contract attempts reentrancy during claim | Reentrancy guard prevents recursive calls, funds secure |
| Reward source validation | Verify rewards can only come from authorized sources | Only governance or approved sources can deposit rewards |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Distribute by governance | Governance distributes rewards | Transaction succeeds |
| Distribute by non-governance | Non-governance attempts to distribute | Transaction reverts with "Not governance" |
| Claim by any user | Any user claims their pending rewards | Transaction succeeds if pendingRewards &gt; 0 |
| Query by any address | Any address queries pendingRewards or claimedRewards | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Staking integration | User stakes TOSS, rewards calculated based on stake | Reward rate applied correctly to staked amount |
| Governance reward distribution | Governance receives protocol fees, distributes as rewards | Fee flow to reward distributor, distribution to stakers |
| Multiple reward distributions | Multiple reward distributions over time | Each distribution tracked correctly, users can claim all |
| Reward claiming integration | User claims rewards, receives TOSS tokens | Tokens transferred correctly, balance updated |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Batch distribution gas | Governance distributes to 10 recipients via batch vs individual | Batch uses less gas than individual distributions |
| Claim rewards gas | User claims pending rewards | Gas usage reasonable for claim operation |
| Query operations gas | Multiple queries for pendingRewards, claimedRewards | View functions consume no gas (read-only) |

---

**Next**: [BridgeGateway](/docs/protocol/contracts/core/BridgeGateway)
