# FMGovernance.sol

## Overview

Governance system for Fund Managers to collectively manage their professional standards, stake requirements, and operational parameters. Voting power weighted by AUM + reputation.

## Purpose

- Enable FMs to govern their standards
- AUM-weighted voting ensures skin-in-the-game
- Reputation component rewards quality
- Professional self-governance

## Core Responsibilities

- ✅ Manage FM-specific proposal creation
- ✅ Calculate AUM-weighted voting power
- ✅ Enforce FM consensus thresholds
- ✅ Execute FM governance decisions
- ✅ Track FM governance participation

[Complete specifications in Governance Layer]

## Test Scenarios

```typescript
describe("FMGovernance", () => {
  it("should weight votes by AUM + reputation", async () => {
    // FM A: $10M AUM, 80 reputation
    // FM B: $5M AUM, 95 reputation
    
    const vpA = await fmGov.getFMVotingPower(fmA.address, snapshotId);
    const vpB = await fmGov.getFMVotingPower(fmB.address, snapshotId);
    
    // A: 10M×0.6 + 10M×0.8×0.4 = 6M + 3.2M = 9.2M
    // B: 5M×0.6 + 5M×0.95×0.4 = 3M + 1.9M = 4.9M
    
    expect(vpA).to.equal(9200000);
    expect(vpB).to.equal(4900000);
  });
  
  it("should require 60% approval for standard proposals", async () => {
    await fmGov.connect(fm1).castVote(proposalId, 1);  // For
    await fmGov.connect(fm2).castVote(proposalId, 0);  // Against
    
    // Need >60% weighted by AUM+rep
    const state = await fmGov.state(proposalId);
    expect(state).to.equal(proposal.forVotes > total * 60 / 100 ? SUCCEEDED : DEFEATED);
  });
});
```

---

[Back to Governance Contracts](/docs/protocol/contracts/governance-layer)

