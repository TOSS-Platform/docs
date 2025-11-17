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

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Create protocol proposal | Admin creates protocol-level proposal specifying voter group | Proposal created with unique ID, voter group specified, ProposalCreated event emitted |
| Specify FM voter group | Admin creates proposal with VoterGroup.FM | Only Fund Managers can vote on proposal |
| Specify Investor voter group | Admin creates proposal with VoterGroup.INVESTOR | Only Investors can vote on proposal |
| Specify Both voter groups | Admin creates proposal with VoterGroup.BOTH | Both FMs and Investors can vote on proposal |
| FMs vote on protocol proposal | Fund Managers vote with AUM-weighted power | Votes weighted by AUM, vote totals calculated correctly |
| Investors vote on protocol proposal | Investors vote with TOSS-staked power | Votes weighted by staked TOSS, vote totals calculated correctly |
| Both groups vote | FMs and Investors both vote on BOTH proposal | Votes from both groups counted, weighted totals combined |
| Proposal passes | Proposal receives sufficient support and meets quorum | Proposal transitions to SUCCEEDED state, requires Guardian review if critical |
| Guardian approves critical proposal | Guardian approves critical proposal after voting | Guardian approval recorded, proposal can be queued |
| Queue approved proposal | Approved proposal queued after Guardian approval | Proposal queued, enters timelock, state transitions to QUEUED |
| Execute queued proposal | Proposal executed after timelock expires | Proposal executed, changes applied, state transitions to EXECUTED |
| Query proposal state | Query current state of protocol proposal | Returns correct proposal state |
| Query voter group | Query voter group for specific proposal | Returns VoterGroup (FM, INVESTOR, or BOTH) |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Proposal with FM group only | Proposal created with FM voter group, no investors vote | Only FM votes counted, investor votes rejected |
| Proposal with Investor group only | Proposal created with Investor voter group, no FMs vote | Only investor votes counted, FM votes rejected |
| Proposal exactly at quorum | Proposal receives exactly quorum threshold | Proposal succeeds if quorum met and support sufficient |
| Proposal exactly at support threshold | Proposal receives exactly required support percentage | Proposal may succeed or fail depending on implementation |
| Guardian review not required | Non-critical proposal passes, no Guardian review needed | Proposal can be queued immediately after voting |
| Execute proposal immediately after timelock | Proposal executed exactly when timelock expires | Transaction succeeds, execution allowed |
| Create proposal with empty calldata | Admin creates proposal with empty calldata (if allowed) | Proposal created successfully, validation depends on implementation |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Create proposal from non-admin | Non-admin address attempts to create proposal | Transaction reverts with "Not admin" error |
| Vote from wrong group | FM attempts to vote on INVESTOR-only proposal | Transaction reverts with "Not eligible voter" error |
| Vote from wrong group (investor) | Investor attempts to vote on FM-only proposal | Transaction reverts with "Not eligible voter" error |
| Vote on non-existent proposal | Voter attempts to vote on proposal that doesn't exist | Transaction reverts with "Proposal not found" error |
| Vote after voting period | Voter attempts to vote after voting period ended | Transaction reverts with "Voting period ended" error |
| Vote without eligibility | Address without staked TOSS or AUM attempts to vote | Transaction reverts with "Not eligible voter" error |
| Queue without Guardian approval | Attempt to queue critical proposal without Guardian approval | Transaction reverts with "Guardian review pending" error |
| Execute proposal before timelock | Attempt to execute proposal before timelock expires | Transaction reverts with "Timelock not passed" error |
| Execute defeated proposal | Attempt to execute proposal that didn't pass | Transaction reverts with "Proposal not approved" error |
| Execute already executed proposal | Attempt to execute proposal that was already executed | Transaction reverts with "Already executed" error |
| Guardian veto after execution | Guardian attempts to veto already executed proposal | Transaction reverts with "Already executed" error |
| Vote twice | Voter attempts to vote twice on same proposal | Transaction reverts with "Already voted" error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized proposal creation | Attacker attempts to create proposal | Transaction reverts, only admin can create proposals |
| Prevent unauthorized voting | Attacker attempts to vote without eligibility | Transaction reverts, only eligible voters can vote |
| Prevent cross-group voting | FM attempts to vote on INVESTOR-only proposal | Transaction reverts, voter group restrictions enforced |
| Prevent Guardian review bypass | Attempt to queue critical proposal without Guardian approval | Guardian review enforced, cannot bypass for critical proposals |
| Prevent Guardian veto bypass | Attempt to execute vetoed proposal | Vetoed proposals cannot be executed, Guardian veto respected |
| Voting power calculation accuracy | Verify voting power calculated correctly per group | FM power = AUM-weighted, Investor power = TOSS-staked, calculations accurate |
| Quorum enforcement | Verify quorum requirements enforced per voter group | Proposals require quorum from specified group(s), insufficient participation rejects |
| Timelock enforcement | Verify timelock period respected | Execution only after timelock, cannot bypass delay |
| Proposal state integrity | Verify proposal state transitions cannot be manipulated | State machine enforced, only valid transitions allowed |
| Guardian approval integrity | Verify Guardian approval cannot be forged | Only Guardian can approve, approval tracked correctly |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Create proposal by admin | Admin creates protocol proposal | Transaction succeeds |
| Create proposal by non-admin | Non-admin attempts to create proposal | Transaction reverts with "Not admin" |
| Vote by eligible FM | FM votes on FM or BOTH proposal | Transaction succeeds |
| Vote by eligible investor | Investor votes on INVESTOR or BOTH proposal | Transaction succeeds |
| Vote by ineligible | Address attempts to vote without eligibility | Transaction reverts with "Not eligible voter" |
| Guardian approve | Guardian approves critical proposal | Transaction succeeds |
| Guardian approve by non-Guardian | Non-Guardian attempts to approve | Transaction reverts with "Not Guardian" |
| Guardian veto | Guardian vetoes proposal | Transaction succeeds |
| Guardian veto by non-Guardian | Non-Guardian attempts to veto | Transaction reverts with "Not Guardian" |
| Execute proposal by anyone | Any address executes approved proposal after timelock | Transaction succeeds (execution permissionless after timelock) |
| Query functions by any address | Any address queries proposals, votes, state | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Complete proposal lifecycle | Admin creates proposal, voters vote, Guardian approves, queued, executed | Complete flow succeeds, proposal changes applied |
| Multi-group voting | Both FMs and Investors vote on BOTH proposal | Votes from both groups counted, weighted totals combined correctly |
| Guardian review flow | Critical proposal passes, Guardian reviews and approves | Guardian review enforced, approval required before queuing |
| Guardian veto flow | Proposal passes, Guardian vetoes | Proposal defeated by veto, execution prevented |
| TOSS staking integration | Investor staking used for voting power calculation | Voting power reflects staked TOSS amount at snapshot |
| AUM integration | FM AUM used for voting power calculation | Voting power reflects AUM across FM's funds at snapshot |
| Snapshot integration | Voting power calculated from snapshots | Snapshots prevent manipulation, historical balances used |
| Protocol parameter updates | Approved proposal updates protocol parameters | Protocol parameters updated correctly, changes applied to relevant contracts |

### State Transition Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| PENDING → ACTIVE | Proposal created, voting period starts | State transitions correctly to ACTIVE |
| ACTIVE → SUCCEEDED | Proposal receives sufficient support and meets quorum | State transitions to SUCCEEDED, Guardian review if critical |
| ACTIVE → DEFEATED | Proposal fails to meet quorum or support threshold | State transitions to DEFEATED |
| SUCCEEDED → GUARDIAN_REVIEW | Critical proposal succeeds, requires Guardian review | State transitions to GUARDIAN_REVIEW or proposal has guardianReview flag |
| GUARDIAN_REVIEW → QUEUED | Guardian approves proposal | State transitions to QUEUED, timelock starts |
| GUARDIAN_REVIEW → DEFEATED | Guardian vetoes proposal | State transitions to DEFEATED, execution prevented |
| QUEUED → EXECUTED | Proposal executed after timelock expires | State transitions to EXECUTED, changes applied |
| Non-critical SUCCEEDED → QUEUED | Non-critical proposal succeeds, no Guardian review needed | State transitions directly to QUEUED |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Proposal creation gas | Admin creates proposal | Gas usage reasonable for proposal creation |
| Vote casting gas | Voter casts vote with voting power calculation | Gas usage reasonable for vote operation |
| Guardian approval gas | Guardian approves critical proposal | Gas usage reasonable for approval operation |
| Proposal execution gas | Proposal executed after timelock | Gas usage reasonable for execution |
| Query operations gas | Multiple queries for proposals, votes, state | View functions consume no gas (read-only) |

---

[Back to Governance Contracts](/docs/protocol/contracts/governance-layer)

