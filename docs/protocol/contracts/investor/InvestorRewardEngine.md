# InvestorRewardEngine.sol

## Overview

Rewards good investor behavior including governance participation, long-term holding, and positive community contributions. Calculates and distributes TOSS token rewards based on multiple factors including governance voting participation, ICS score, long-term holding, and TOSS staking.

## Purpose

- Distribute investor rewards
- Incentivize good behavior
- Reward governance participation
- Encourage long-term holding
- Promote high ICS scores
- Incentivize TOSS staking

## Dependencies

- **InvestorRegistry**: Provides ICS score, investor class, registration status, and funds invested count
- **TOSS Token**: ERC20 token used for reward distribution
- **Staking**: Provides staked TOSS amount for staking bonus calculation
- **ProtocolGovernance**: Tracks protocol-level voting participation for governance rewards

## Constants

- `BASIS_POINTS = 10000`: Basis points for percentage calculations
- `MAX_ICS_SCORE = 100`: Maximum ICS score
- `VOTING_REWARD_PER_VOTE = 100 * 1e18`: 100 TOSS per governance vote
- `MAX_VOTING_REWARDS = 700 * 1e18`: Maximum 700 TOSS from voting (7 votes * 100)
- `MAX_ICS_BONUS = 500 * 1e18`: Maximum 500 TOSS for perfect ICS score (100)
- `STAKING_REWARD_RATE = 1e15`: 0.001 TOSS per staked TOSS (per calculation)
- `HOLDING_BONUS_BASE = 50 * 1e18`: Base holding bonus of 50 TOSS
- `HOLDING_PERIOD_30_DAYS = 30 days`: Minimum holding period threshold
- `HOLDING_PERIOD_90_DAYS = 90 days`: Medium holding period threshold
- `HOLDING_PERIOD_180_DAYS = 180 days`: Long holding period threshold

## State Variables

```solidity
IInvestorRegistry public immutable investorRegistry;
IERC20 public immutable tossToken;
IStaking public immutable staking;
IProtocolGovernance public immutable protocolGovernance;

mapping(address => uint256) public pendingRewards;
mapping(address => uint256) public claimedRewards;
mapping(address => uint256) public lastRewardCalculation;

uint256 public totalDistributed;
uint256 public totalClaimed;

mapping(address => bool) public authorizedDistributors;
```

## Constructor

```solidity
constructor(
    address _investorRegistry,
    address _tossToken,
    address _staking,
    address _protocolGovernance
)
```

**Purpose**: Initialize InvestorRewardEngine

**Parameters**:
- `_investorRegistry`: InvestorRegistry contract address
- `_tossToken`: TOSS token contract address
- `_staking`: Staking contract address
- `_protocolGovernance`: ProtocolGovernance contract address

**Requirements**:
- All addresses must be non-zero

**Errors**:
- `InvalidAddress()`: If any address is zero

## Functions

### `claimRewards`

```solidity
function claimRewards() external returns (uint256 amount)
```

**Purpose**: Claim accumulated rewards

**Access Control**: Public (any registered investor)

**Returns**: Amount of TOSS tokens claimed

**Behavior**:
1. Validates investor is registered
2. If pendingRewards is zero, calculates current rewards
3. Validates contract has sufficient balance
4. Transfers TOSS tokens to investor
5. Resets pendingRewards to 0
6. Increments claimedRewards
7. Updates totalClaimed
8. Emits RewardsClaimed event

**Events**: `RewardsClaimed(investor, amount, timestamp)`

**Errors**:
- `InvestorNotRegistered()`: If investor is not registered
- `NoPendingRewards()`: If no pending rewards to claim
- `InsufficientBalance()`: If contract balance is insufficient

### `distributeRewards`

```solidity
function distributeRewards(address investor, uint256 amount) external
```

**Purpose**: Distribute rewards to an investor

**Access Control**: Only authorized distributors

**Parameters**:
- `investor`: Investor address
- `amount`: Amount of TOSS tokens to distribute

**Behavior**:
1. Validates investor is registered
2. Validates amount is non-zero
3. Adds amount to pendingRewards
4. Updates totalDistributed
5. Emits RewardsDistributed event

**Events**: `RewardsDistributed(investor, amount, timestamp)`

**Errors**:
- `NotAuthorizedDistributor()`: If caller is not authorized
- `InvalidAddress()`: If investor address is zero
- `InvalidAmount()`: If amount is zero
- `InvestorNotRegistered()`: If investor is not registered

### `calculateRewards`

```solidity
function calculateRewards(address investor) external view returns (uint256 totalRewards)
```

**Purpose**: Calculate total rewards for an investor from all sources

**Access Control**: Public view

**Parameters**:
- `investor`: Investor address

**Returns**: Total calculated rewards in TOSS tokens

**Calculation Components**:
1. **Governance Voting Rewards**: `voteCount * 100 TOSS` (capped at 700 TOSS)
2. **Long-term Holding Bonus**: Base bonus with multiplier based on fundsInvested
3. **ICS Score Bonus**: `(icsScore / 100) * 500 TOSS`
4. **Staking Bonus**: `stakedAmount * 0.001 TOSS`

**Formula**:
```
totalRewards = governanceRewards + holdingBonus + icsBonus + stakingBonus
```

**Returns**: 0 if investor is not registered

### Query Functions

#### `getPendingRewards`

```solidity
function getPendingRewards(address investor) external view returns (uint256)
```

**Purpose**: Get pending rewards for an investor

**Returns**: Amount of pending rewards

#### `getClaimedRewards`

```solidity
function getClaimedRewards(address investor) external view returns (uint256)
```

**Purpose**: Get total claimed rewards for an investor

**Returns**: Lifetime claimed rewards

#### `getTotalDistributed`

```solidity
function getTotalDistributed() external view returns (uint256)
```

**Purpose**: Get total amount of rewards distributed

**Returns**: Total distributed rewards

#### `getTotalClaimed`

```solidity
function getTotalClaimed() external view returns (uint256)
```

**Purpose**: Get total amount of rewards claimed

**Returns**: Total claimed rewards

### Administrative Functions

#### `setAuthorizedDistributor`

```solidity
function setAuthorizedDistributor(address distributor, bool authorized) external
```

**Purpose**: Set authorized distributor

**Parameters**:
- `distributor`: Address to authorize/unauthorize
- `authorized`: Whether to authorize or unauthorize

**Access Control**: Public (should be restricted to governance in production)

**Errors**:
- `InvalidAddress()`: If distributor address is zero

## Reward Calculation Details

### Governance Voting Rewards

**Formula**: `voteCount * VOTING_REWARD_PER_VOTE`

**Capping**: Maximum 700 TOSS (7 votes * 100 TOSS)

**Example**:
- 0 votes = 0 TOSS
- 3 votes = 300 TOSS
- 7 votes = 700 TOSS
- 10 votes = 700 TOSS (capped)

### Long-term Holding Bonus

**Formula**: `HOLDING_BONUS_BASE * multiplier`

**Multiplier Based on fundsInvested**:
- 0 funds = 0 TOSS
- 1 fund = 50 TOSS (1x multiplier)
- 2-3 funds = 75 TOSS (1.5x multiplier)
- 4+ funds = 100 TOSS (2x multiplier)

**Example**:
- 1 fund invested = 50 TOSS
- 3 funds invested = 75 TOSS
- 5 funds invested = 100 TOSS

### ICS Score Bonus

**Formula**: `(icsScore / MAX_ICS_SCORE) * MAX_ICS_BONUS`

**Example**:
- ICS 0 = 0 TOSS
- ICS 50 = 250 TOSS (50% of 500)
- ICS 80 = 400 TOSS (80% of 500)
- ICS 100 = 500 TOSS (100% of 500)

### Staking Bonus

**Formula**: `stakedAmount * STAKING_REWARD_RATE / 1e18`

**Example**:
- 0 TOSS staked = 0 TOSS bonus
- 1,000 TOSS staked = 1 TOSS bonus
- 10,000 TOSS staked = 10 TOSS bonus
- 100,000 TOSS staked = 100 TOSS bonus

### Complete Example

Investor with:
- 5 governance votes
- ICS score 80
- 3 funds invested
- 10,000 TOSS staked

**Calculation**:
- Voting: 5 * 100 = 500 TOSS
- Holding: 50 * 1.5 = 75 TOSS
- ICS: (80 / 100) * 500 = 400 TOSS
- Staking: 10,000 * 0.001 = 10 TOSS
- **Total: 985 TOSS**

## Events

```solidity
event RewardsClaimed(
    address indexed investor,
    uint256 amount,
    uint256 timestamp
);

event RewardsDistributed(
    address indexed investor,
    uint256 amount,
    uint256 timestamp
);

event RewardCalculated(
    address indexed investor,
    uint256 governanceRewards,
    uint256 holdingBonus,
    uint256 icsBonus,
    uint256 stakingBonus,
    uint256 totalRewards
);
```

## Custom Errors

```solidity
error InvestorNotRegistered();
error NotAuthorizedDistributor();
error NoPendingRewards();
error InsufficientBalance();
error InvalidAddress();
error InvalidAmount();
```

## Access Control

### Modifiers

- `onlyAuthorizedDistributor()`: Only authorized contracts can distribute rewards

### Roles

- **Investors**: Can claim their own rewards
- **Authorized Distributors**: Can distribute rewards to investors
- **Anyone**: Can query reward information (view functions)

## Reward Distribution Flow

1. **Reward Calculation**: Rewards are calculated on-demand when `claimRewards()` is called
2. **Reward Distribution**: Authorized distributors can call `distributeRewards()` to add rewards to pending balance
3. **Reward Claiming**: Investors call `claimRewards()` to transfer pending rewards to their wallet
4. **Tracking**: All rewards are tracked in `pendingRewards`, `claimedRewards`, `totalDistributed`, and `totalClaimed`

## Integration Points

- **InvestorRegistry**: ICS score, funds invested count, registration status
- **ProtocolGovernance**: Voting participation count
- **Staking**: Staked TOSS amount
- **TOSS Token**: Reward token transfer

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

**Investor Layer Complete!** [Utility Contracts →](/protocol/contracts/utilities/PriceOracleRouter)

