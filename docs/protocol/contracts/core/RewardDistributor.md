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

```typescript
it("should distribute rewards correctly", async () => {
  await rewardDistributor.connect(governance).distributeRewards(
    [user1.address, user2.address],
    [1000, 2000]
  );
  
  expect(await rewardDistributor.pendingRewards(user1.address)).to.equal(1000);
});
```

---

**Next**: [BridgeGateway](/docs/protocol/contracts/core/BridgeGateway)
