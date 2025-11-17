# Voting Process

## Overview

How voting works at each governance level with different power calculations.

## Fund-Level Voting

**Power**: Share ownership %
**Who**: Only investors in that fund
**Formula**: `VP = yourShares / totalShares`

```solidity
await fundGovernance.castVote(proposalId, 1);  // 1 = for
```

## FM-Level Voting

**Power**: AUM + Reputation weighted
**Who**: Only Fund Managers
**Formula**: `VP = (AUM × 0.6) + (AUM × Rep/100 × 0.4)`

## Protocol-Level Voting

**Power**: TOSS staked + bonuses
**Who**: Specified by admin (FM/Investor/Both)
**Formula**: `VP = TOSS × (1+LockBonus) × RoleMultiplier`

## Voting Options

- **0**: Against
- **1**: For
- **2**: Abstain (counts for quorum)

---

**Related**: [Voting Mechanism](/docs/protocol/governance/voting-mechanism)

