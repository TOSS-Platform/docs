# InvestorRewardEngine.sol

## Overview

Rewards good investor behavior including governance participation, long-term holding, and positive community contributions.

## Purpose

- Distribute investor rewards
- Incentivize good behavior
- Provide fee discounts
- Enable reputation building

## Functions

### `claimRewards`

```solidity
function claimRewards() external returns (uint256 amount)
```

**Purpose**: Claim accumulated rewards

**Returns**: TOSS amount claimed

**Calculation**:
- Governance voting rewards
- Long-term holding bonuses
- High ICS score bonuses

---

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Claim investor rewards | Investor claims accumulated rewards | Rewards transferred to investor, pendingRewards reset, claimedRewards incremented, RewardsClaimed event emitted |
| Calculate governance voting rewards | Investor participated in governance voting, receives rewards | Voting rewards calculated correctly, rewards accumulated |
| Calculate long-term holding bonus | Investor held fund shares for extended period | Long-term holding bonus calculated correctly, rewards increased |
| Calculate ICS score bonus | Investor with high ICS score receives bonus rewards | Score-based bonus calculated correctly, higher scores receive more rewards |
| Distribute rewards to investor | Rewards distributed to investor account | Rewards credited to investor, pendingRewards updated |
| Query pending rewards | Query investor's pending rewards amount | Returns current pending rewards, amount accurate |
| Query claimed rewards | Query total rewards claimed by investor | Returns lifetime claimed rewards, amount accurate |
| Calculate rewards for multiple sources | Investor receives rewards from voting, holding, and score | All rewards calculated and combined correctly, total rewards accurate |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Claim zero rewards | Investor attempts to claim when pendingRewards is zero | Transaction succeeds, no tokens transferred, claimedRewards unchanged |
| Claim maximum rewards | Investor claims very large accumulated rewards | Rewards transferred correctly, large amounts handled |
| Calculate rewards for zero stake | Investor with no TOSS staked receives rewards | Rewards calculated from other sources (voting, holding), stake component zero |
| Calculate rewards for maximum stake | Investor with maximum TOSS staked receives rewards | Rewards calculated correctly, stake component at maximum contribution |
| Calculate rewards with zero participation | Investor with no governance participation | Rewards calculated without voting component, other components included |
| Calculate rewards with perfect participation | Investor participates in all governance votes | Maximum voting rewards, participation bonus maximized |
| Calculate rewards for new investor | New investor with minimal activity receives rewards | Minimum rewards calculated, rewards start accumulating |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Claim rewards for non-registered investor | Non-registered address attempts to claim rewards | Transaction reverts with "Investor not registered" error |
| Claim rewards exceeding pending | Investor attempts to claim more than pending rewards | Transaction reverts with "Insufficient pending rewards" error |
| Calculate rewards with invalid parameters | Attempt to calculate rewards with invalid investor address | Transaction reverts with validation error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent reward manipulation | Attempt to manipulate reward calculations | Reward calculations deterministic, based on on-chain data, cannot manipulate |
| Reward calculation accuracy | Verify rewards calculated correctly from all sources | All reward sources aggregated correctly, calculations accurate |
| Prevent double claiming | Investor attempts to claim same rewards twice | First claim succeeds, second claim reverts (rewards already claimed) |
| Reward distribution integrity | Verify rewards distributed correctly to investors | Rewards transferred accurately, accounting remains correct |
| ICS score integration | Verify ICS score used correctly for bonus calculation | Score read from InvestorRegistry, bonus calculated accurately |
| Governance participation integration | Verify voting participation tracked correctly | Participation read from governance contracts, rewards calculated accurately |
| Holding period accuracy | Verify holding periods calculated correctly | Holding periods tracked from deposit dates, long-term bonuses accurate |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Claim rewards by investor | Investor claims their rewards | Transaction succeeds |
| Claim rewards by non-investor | Non-investor attempts to claim rewards | Transaction reverts with "Investor not registered" |
| Distribute rewards by authorized | Authorized contract distributes rewards | Transaction succeeds |
| Distribute rewards by non-authorized | Non-authorized attempts to distribute rewards | Transaction reverts with "Not authorized" |
| Query functions by any address | Any address queries pending rewards, claimed rewards | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Governance voting rewards | Investor votes on proposals, receives voting rewards | Voting participation tracked, rewards calculated correctly |
| Long-term holding rewards | Investor holds shares for extended period, receives holding bonus | Holding period tracked, bonus calculated correctly |
| ICS score rewards | Investor with high ICS receives score-based bonus | Score read from registry, bonus calculated correctly |
| Reward distribution flow | Rewards accumulated from multiple sources, investor claims | All rewards combined correctly, total rewards transferred accurately |
| InvestorRegistry integration | Investor class used for reward calculation | Higher classes receive better rewards, class benefits apply |
| TOSS staking integration | TOSS staked amount used for reward calculation | Stake component included, rewards reflect staking level |
| Multiple reward sources | Investor receives rewards from voting, holding, score, staking | All sources aggregated correctly, total rewards accurate |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Reward calculation gas | Calculate rewards for investor with all sources | Gas usage reasonable for calculation operation |
| Claim rewards gas | Investor claims pending rewards | Gas usage reasonable for claim operation |
| Reward distribution gas | Authorized contract distributes rewards | Gas usage reasonable for distribution operation |
| Query operations gas | Multiple queries for pending rewards, claimed rewards | View functions consume no gas (read-only) |

---

**Investor Layer Complete!** [Utility Contracts →](/docs/protocol/contracts/utilities/PriceOracleRouter)

