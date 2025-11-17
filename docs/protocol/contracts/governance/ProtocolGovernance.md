# ProtocolGovernance.sol

## Overview

Protocol-wide governance where Admin proposes changes and specifies which group votes (FMs only, Investors only, or Both). Most secure governance layer with Guardian oversight.

## Purpose

- Handle critical protocol changes
- Flexible voter group specification
- Guardian committee oversight
- Maximum security with timelocks
- Transparent protocol evolution

## Core Responsibilities

- ✅ Admin-created proposals
- ✅ Flexible voter group specification
- ✅ Guardian review window (24h)
- ✅ Long timelocks for security (48-72h)
- ✅ Execute protocol-wide changes

[Complete specifications in Governance Layer]

## Test Scenarios

```typescript
describe("ProtocolGovernance", () => {
  it("should allow admin to specify voter group", async () => {
    const proposalId = await protocolGov.connect(admin).createProposal(
      ProposalType.ORACLE_CONFIG,
      VoterGroup.BOTH,  // Admin specifies both FMs and Investors vote
      [oracleRouter.address],
      [0],
      [calldata],
      "Add Pyth oracle",
      "Description..."
    );
    
    const proposal = await protocolGov.proposals(proposalId);
    expect(proposal.voterGroup).to.equal(VoterGroup.BOTH);
  });
  
  it("should enforce Guardian review for critical changes", async () => {
    // Proposal passed voting
    await setupPassedProposal(proposalId);
    
    // Try to queue immediately - should fail
    await expect(
      protocolGov.queue(proposalId)
    ).to.be.revertedWith("Guardian review pending");
    
    // Guardian approves
    await protocolGov.connect(guardian).guardianApprove(proposalId);
    
    // Now can queue
    await protocolGov.queue(proposalId);
  });
  
  it("should allow Guardian veto", async () => {
    await setupPassedProposal(proposalId);
    
    await protocolGov.connect(guardian).guardianVeto(
      proposalId,
      "Security concern discovered"
    );
    
    expect(await protocolGov.state(proposalId)).to.equal(ProposalState.DEFEATED);
  });
});
```

---

[Back to Governance Contracts](/docs/protocol/contracts/governance-layer)

