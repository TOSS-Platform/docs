# Class Upgrade Process

## Overview

Investor upgrades from lower to higher class by staking TOSS and meeting ICS requirements.

## Requirements

| From | To | TOSS Required | ICS Required |
|------|-----|---------------|--------------|
| RETAIL | PREMIUM | 1,000 | 50 |
| PREMIUM | INSTITUTIONAL | 10,000 | 70 |
| INSTITUTIONAL | STRATEGIC | 100,000 | 85 |

## Process

```solidity
// 1. Stake TOSS
await staking.stake(amount);

// 2. Request upgrade
await investorRegistry.upgradeClass(InvestorClass.PREMIUM);
```

**Validation**:
- TOSS staked ≥ requirement
- ICS score ≥ threshold
- No violations

**Benefits**:
- Access to higher risk tier funds
- Fee discounts (10-25%)
- Increased voting power

---

**Related**: [ICS Calculation](/protocol/contracts/investor/InvestorScoreCalculator)

