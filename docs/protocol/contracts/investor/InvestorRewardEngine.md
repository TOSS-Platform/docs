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

**Investor Layer Complete!** [Utility Contracts →](/docs/protocol/contracts/utilities/PriceOracleRouter)

