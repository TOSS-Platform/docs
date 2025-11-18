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

For complete implementation, see [Governance Layer Overview](/protocol/contracts/governance-layer).

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Create FM proposal | Fund Manager creates proposal for fee change | Proposal created with unique ID, ProposalCreated event emitted, proposal in PENDING state |
| Investors vote with share power | Investor with 1000 shares votes on proposal | Vote cast successfully, voting power calculated from shares, vote weight equals share count |
| Vote for proposal | Investor votes FOR proposal | forVotes incremented, vote recorded, VoteCast event emitted |
| Vote against proposal | Investor votes AGAINST proposal | againstVotes incremented, vote recorded, VoteCast event emitted |
| Abstain from voting | Investor abstains from voting | abstainVotes incremented, vote recorded, investor participated |
| Proposal passes | Proposal receives &gt; 50% support, meets quorum | Proposal transitions to SUCCEEDED state, can be queued |
| Queue approved proposal | Approved proposal queued after voting period | Proposal queued, enters timelock period, state transitions to QUEUED |
| Execute queued proposal | Proposal executed after timelock expires | Proposal executed, changes applied, state transitions to EXECUTED |
| Query proposal state | Query current state of proposal | Returns correct proposal state (PENDING, ACTIVE, SUCCEEDED, etc.) |
| Query voting power | Query investor's voting power for fund proposal | Returns voting power based on share balance at snapshot |
| Calculate vote totals | Query total votes cast on proposal | Returns forVotes, againstVotes, abstainVotes correctly |
| Proposal with multiple voters | Multiple investors vote on proposal | All votes counted correctly, totals accurate |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Create proposal with zero shares | FM creates proposal when fund has no investors | Proposal created successfully, no voters yet |
| Vote with minimum shares | Investor with 1 share votes | Vote counted, voting power equals 1 |
| Vote with maximum shares | Investor with all shares votes | Vote counted, voting power equals total shares |
| Proposal exactly at quorum | Proposal receives exactly quorum threshold | Proposal succeeds if quorum met and support &gt; 50% |
| Proposal exactly at support threshold | Proposal receives exactly 50% support | Proposal may succeed or fail depending on implementation (strict &gt; or &gt;=) |
| Execute proposal immediately after timelock | Proposal executed exactly when timelock expires | Transaction succeeds, execution allowed |
| Create proposal at voting period boundary | Proposal created near end of voting period | Proposal transitions correctly, voting closes at boundary |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Create proposal from non-FM | Non-Fund Manager attempts to create proposal | Transaction reverts with "Not Fund Manager" error |
| Vote on non-existent proposal | Investor attempts to vote on proposal that doesn't exist | Transaction reverts with "Proposal not found" error |
| Vote after voting period | Investor attempts to vote after voting period ended | Transaction reverts with "Voting period ended" error |
| Vote without shares | Address with no shares attempts to vote | Transaction reverts with "Not eligible voter" error |
| Execute proposal before timelock | Attempt to execute proposal before timelock expires | Transaction reverts with "Timelock not passed" error |
| Execute defeated proposal | Attempt to execute proposal that didn't pass | Transaction reverts with "Proposal not approved" error |
| Execute already executed proposal | Attempt to execute proposal that was already executed | Transaction reverts with "Already executed" error |
| Queue defeated proposal | Attempt to queue proposal that didn't pass | Transaction reverts with "Proposal not approved" error |
| Vote twice | Investor attempts to vote twice on same proposal | Transaction reverts with "Already voted" error |
| Create proposal with invalid parameters | FM creates proposal with invalid calldata | Transaction reverts with validation error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized proposal creation | Attacker attempts to create proposal | Transaction reverts, only Fund Manager can create proposals |
| Prevent unauthorized voting | Attacker attempts to vote without shares | Transaction reverts, only investors with shares can vote |
| Prevent double voting | Investor attempts to vote multiple times | First vote succeeds, subsequent votes revert |
| Prevent vote manipulation | Attempt to manipulate voting power calculation | Voting power calculated from snapshot, cannot manipulate |
| Prevent early execution | Attempt to execute proposal before timelock | Timelock enforced, early execution prevented |
| Proposal state integrity | Verify proposal state transitions cannot be manipulated | State machine enforced, only valid transitions allowed |
| Voting power accuracy | Verify voting power calculated correctly from shares | Share-based calculation accurate, power equals share balance |
| Quorum enforcement | Verify quorum requirements enforced | Proposals require quorum to pass, insufficient participation rejects |
| Timelock enforcement | Verify timelock period respected | Execution only after timelock, cannot bypass delay |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Create proposal by FM | Fund Manager creates proposal | Transaction succeeds |
| Create proposal by non-FM | Non-FM attempts to create proposal | Transaction reverts with "Not Fund Manager" |
| Vote by eligible investor | Investor with shares votes | Transaction succeeds |
| Vote by non-eligible | Address without shares attempts to vote | Transaction reverts with "Not eligible voter" |
| Execute proposal by anyone | Any address executes approved proposal after timelock | Transaction succeeds (execution permissionless after timelock) |
| Query functions by any address | Any address queries proposals, votes, state | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Complete proposal lifecycle | FM creates proposal, investors vote, proposal passes, queued, executed | Complete flow succeeds, proposal changes applied to FundConfig |
| Share-based voting integration | Vault share balances used for voting power | Voting power matches share balances at snapshot |
| FundConfig update integration | Approved proposal updates fund configuration | FundConfig updated correctly, new parameters applied |
| Multiple proposals | Multiple proposals created and voted on | Each proposal tracked independently, no interference |
| Delegation integration | Investor delegates voting power to another | Delegation works correctly, delegate votes with delegated power |
| Snapshot integration | Voting power calculated from snapshot | Snapshot balances used, prevents flash loan manipulation |

### State Transition Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| PENDING → ACTIVE | Proposal created, voting period starts | State transitions correctly to ACTIVE |
| ACTIVE → SUCCEEDED | Proposal receives sufficient votes and meets quorum | State transitions to SUCCEEDED |
| ACTIVE → DEFEATED | Proposal fails to meet quorum or support threshold | State transitions to DEFEATED |
| SUCCEEDED → QUEUED | Approved proposal queued after voting | State transitions to QUEUED, timelock starts |
| QUEUED → EXECUTED | Proposal executed after timelock expires | State transitions to EXECUTED, changes applied |
| QUEUED → CANCELLED | Proposal cancelled (if supported) | State transitions to CANCELLED, execution prevented |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Proposal creation gas | FM creates proposal | Gas usage reasonable for proposal creation |
| Vote casting gas | Investor casts vote | Gas usage reasonable for vote operation |
| Proposal execution gas | Proposal executed after timelock | Gas usage reasonable for execution |
| Query operations gas | Multiple queries for proposals, votes, state | View functions consume no gas (read-only) |

---

[Back to Governance Contracts](/protocol/contracts/governance-layer)

