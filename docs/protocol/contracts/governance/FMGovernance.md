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

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Create FM-level proposal | Active Fund Manager creates proposal for FM-level changes | Proposal created with unique ID, ProposalCreated event emitted, proposal in PENDING state |
| Calculate voting power (AUM + reputation) | Query FM voting power based on AUM and reputation | Voting power calculated as AUM × (0.6 + reputation × 0.4), formula applied correctly |
| Vote with AUM-weighted power | FM with $10M AUM and 80 reputation votes | Vote weighted correctly: 10M × (0.6 + 0.8 × 0.4) = 9.2M voting power |
| Multiple FMs vote | Multiple Fund Managers vote on proposal | All votes weighted by AUM and reputation, totals calculated correctly |
| Proposal passes with 60% approval | Proposal receives &gt; 60% weighted approval | Proposal transitions to SUCCEEDED state, meets approval threshold |
| Queue approved proposal | Approved proposal queued after voting period | Proposal queued, enters timelock, state transitions to QUEUED |
| Execute queued proposal | Proposal executed after timelock expires | Proposal executed, changes applied, state transitions to EXECUTED |
| Query FM voting power | Query specific FM's voting power at snapshot | Returns voting power calculated from AUM and reputation |
| Query proposal state | Query current state of FM proposal | Returns correct proposal state |
| Calculate weighted vote totals | Query weighted vote totals on proposal | Returns forVotes, againstVotes weighted by AUM + reputation |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| FM with minimum AUM | FM with $1 AUM votes | Voting power calculated correctly, minimum AUM handled |
| FM with maximum AUM | FM with very large AUM votes | Voting power calculated correctly, large AUM handled |
| FM with zero reputation | FM with 0 reputation votes | Voting power = AUM × 0.6, reputation component zero |
| FM with maximum reputation | FM with 100 reputation votes | Voting power = AUM × (0.6 + 1.0 × 0.4) = AUM × 1.0, full AUM weight |
| Proposal exactly at 60% | Proposal receives exactly 60% weighted approval | Proposal may succeed or fail depending on implementation (strict &gt; or &gt;=) |
| Single FM voting | Only one FM votes on proposal | Vote counted correctly, proposal state updated |
| Execute proposal immediately after timelock | Proposal executed exactly when timelock expires | Transaction succeeds, execution allowed |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Create proposal from inactive FM | Inactive FM or FM with no funds attempts to create proposal | Transaction reverts with "Not eligible FM" error |
| Vote on non-existent proposal | FM attempts to vote on proposal that doesn't exist | Transaction reverts with "Proposal not found" error |
| Vote after voting period | FM attempts to vote after voting period ended | Transaction reverts with "Voting period ended" error |
| Vote without eligibility | Non-FM or inactive FM attempts to vote | Transaction reverts with "Not eligible FM voter" error |
| Execute proposal before timelock | Attempt to execute proposal before timelock expires | Transaction reverts with "Timelock not passed" error |
| Execute defeated proposal | Attempt to execute proposal that didn't pass | Transaction reverts with "Proposal not approved" error |
| Execute already executed proposal | Attempt to execute proposal that was already executed | Transaction reverts with "Already executed" error |
| Vote twice | FM attempts to vote twice on same proposal | Transaction reverts with "Already voted" error |
| Create proposal with invalid parameters | FM creates proposal with invalid calldata | Transaction reverts with validation error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized proposal creation | Attacker attempts to create proposal | Transaction reverts, only eligible FMs can create proposals |
| Prevent unauthorized voting | Non-FM attempts to vote | Transaction reverts, only eligible FMs can vote |
| Prevent double voting | FM attempts to vote multiple times | First vote succeeds, subsequent votes revert |
| Prevent AUM manipulation | Attempt to manipulate AUM to increase voting power | AUM calculated from snapshot, cannot manipulate |
| Prevent reputation manipulation | Attempt to manipulate reputation to increase voting power | Reputation read from FMRegistry, cannot manipulate |
| Voting power calculation accuracy | Verify voting power formula applied correctly | Formula: AUM × (0.6 + reputation × 0.4), calculation accurate |
| Quorum enforcement | Verify quorum requirements enforced | Proposals require quorum to pass, insufficient participation rejects |
| Timelock enforcement | Verify timelock period respected | Execution only after timelock, cannot bypass delay |
| Weighted approval threshold | Verify 60% weighted approval required | Approval threshold enforced, proposals need &gt; 60% weighted support |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Create proposal by eligible FM | Active FM with funds creates proposal | Transaction succeeds |
| Create proposal by ineligible FM | Inactive FM or FM with no funds attempts to create | Transaction reverts with "Not eligible FM" |
| Vote by eligible FM | Active FM votes on proposal | Transaction succeeds |
| Vote by ineligible FM | Inactive FM attempts to vote | Transaction reverts with "Not eligible FM voter" |
| Execute proposal by anyone | Any address executes approved proposal after timelock | Transaction succeeds (execution permissionless after timelock) |
| Query functions by any address | Any address queries proposals, votes, voting power | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Complete proposal lifecycle | FM creates proposal, FMs vote, proposal passes, queued, executed | Complete flow succeeds, proposal changes applied |
| AUM calculation integration | AUM calculated from fund vaults, used for voting power | Voting power reflects current AUM across all FM's funds |
| Reputation integration | Reputation read from FMRegistry, used for voting power | Voting power includes reputation component, accurately calculated |
| Snapshot integration | AUM snapshot used for voting power calculation | Snapshot prevents manipulation, historical AUM used |
| Multiple FMs with different AUMs | Multiple FMs vote, each weighted by their AUM + reputation | All votes weighted correctly, totals accurate |
| Proposal affects FM-level parameters | Approved proposal updates FM-level configuration | FM-level parameters updated correctly, changes applied |

### State Transition Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| PENDING → ACTIVE | Proposal created, voting period starts | State transitions correctly to ACTIVE |
| ACTIVE → SUCCEEDED | Proposal receives &gt; 60% weighted approval and meets quorum | State transitions to SUCCEEDED |
| ACTIVE → DEFEATED | Proposal fails to meet quorum or approval threshold | State transitions to DEFEATED |
| SUCCEEDED → QUEUED | Approved proposal queued after voting | State transitions to QUEUED, timelock starts |
| QUEUED → EXECUTED | Proposal executed after timelock expires | State transitions to EXECUTED, changes applied |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Proposal creation gas | FM creates proposal | Gas usage reasonable for proposal creation |
| Vote casting gas | FM casts vote with AUM + reputation calculation | Gas usage reasonable for vote operation |
| Voting power calculation gas | Query FM voting power | Gas usage reasonable, AUM and reputation queries efficient |
| Proposal execution gas | Proposal executed after timelock | Gas usage reasonable for execution |
| Query operations gas | Multiple queries for proposals, votes, voting power | View functions consume no gas (read-only) |

---

[Back to Governance Contracts](/docs/protocol/contracts/governance-layer)

