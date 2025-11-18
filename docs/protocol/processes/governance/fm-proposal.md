# FM-Level Proposal Process

## Overview

Fund Managers collectively govern their professional standards. Only FMs vote, weighted by AUM + reputation.

## Process

```
FM creates proposal → All FMs notified → Discussion (3 days) → Voting (7 days) → Quorum 20%, Approval 60% → Timelock 48h → Execute
```

## Example: Increase Minimum Stake

```typescript
// Senior FM proposes raising minimum stake
await fmGovernance.createProposal(
  ProposalType.FM_STAKE_REQUIREMENT,
  newMinimumStake: ethers.utils.parseEther("15000"),
  title: "Raise minimum FM stake to 15k TOSS"
);

// FMs vote (AUM-weighted)
// FM with $10M AUM, 80 reputation = 9.2M voting power
// FM with $5M AUM, 95 reputation = 4.9M voting power
```

## Voting Power

```
VP = (AUM × 0.6) + (AUM × Reputation/100 × 0.4)
```

**Larger funds have more say, but reputation matters**

---

**Related**: [FMGovernance](/protocol/contracts/governance/FMGovernance)

