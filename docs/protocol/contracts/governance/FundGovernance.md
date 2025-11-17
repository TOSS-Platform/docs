# FundGovernance.sol

## Overview

Enables fund-level governance where Fund Managers and investors propose and vote on fund-specific parameters. Voting power based on share ownership, not TOSS staking.

## Purpose

- Allow FMs to propose fund changes
- Allow investors to propose fund changes
- Execute fund governance decisions
- Track proposal history per fund
- Enforce fund-specific voting rules

## Core Responsibilities

- ✅ Validate proposer eligibility (FM or ≥1% shareholder)
- ✅ Manage proposal lifecycle (create, vote, queue, execute)
- ✅ Calculate voting power based on shares
- ✅ Enforce quorum and approval thresholds
- ✅ Execute approved changes via FundConfig

## State Variables

[Complete state variables from governance-layer.md]

## Functions

[Complete function list with full details]

For complete implementation, see [Governance Layer Overview](/docs/protocol/contracts/governance-layer).

## Test Scenarios

```typescript
describe("FundGovernance - FM Proposals", () => {
  it("should allow FM to propose fee change", async () => {
    const proposalId = await fundGov.connect(fm).createFMProposal(
      fundId,
      ProposalType.FEE_CHANGE,
      abiCoder.encode(["uint256"], [150]),  // 1.5%
      "Reduce management fee",
      "Attracting more investors..."
    );
    
    expect(proposalId).to.be.gt(0);
  });
  
  it("should allow investors to vote with share-based power", async () => {
    // Investor A: 1000 shares / 10000 total = 10%
    await fundGov.connect(investorA).castVote(proposalId, 1);  // For
    
    const proposal = await fundGov.proposals(proposalId);
    expect(proposal.forVotes).to.equal(1000);
  });
  
  it("should execute approved proposal", async () => {
    // 60% vote for
    await setupVotes(proposalId, 60, 30, 10);  // for, against, abstain
    
    await time.increase(5 * 86400);  // End voting
    await fundGov.queue(proposalId);
    await time.increase(24 * 3600);  // Timelock
    await fundGov.execute(proposalId);
    
    const newFee = await fundConfig.getFees(fundId);
    expect(newFee.managementFee).to.equal(150);
  });
});
```

---

[Back to Governance Contracts](/docs/protocol/contracts/governance-layer)

