# FMGovernance.sol

## Overview

The `FMGovernance` contract is a crucial component of the TOSS Protocol's multi-level governance system. It enables Fund Managers (FMs) to collectively propose, vote on, and execute changes related to their professional standards, stake requirements, and operational parameters that affect the entire FM community. Voting power within `FMGovernance` is uniquely weighted by a combination of a Fund Manager's Assets Under Management (AUM) and their reputation score, ensuring that participants with significant "skin in the game" and a proven track record have a proportional influence.

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

## State Variables

```solidity
IFundRegistry public immutable fundRegistry;
IFMRegistry public immutable fmRegistry;
ISlashingEngine public immutable slashingEngine;
IFundFactory public fundFactory; // Not immutable, can be set later
IDAOConfigCore public daoConfig; // Not immutable, can be set later

uint256 public proposalCount;
mapping(uint256 => FMProposal) public fmProposals;
mapping(uint256 => mapping(address => bool)) public hasVotedFM;
```

**Note**: `fundFactory` and `daoConfig` are not immutable and can be set after deployment using `setFundFactory()` and `setDAOConfig()` functions.

## Constants

```solidity
uint256 public constant VOTING_DELAY = 3 days;        // 3 days discussion period (PROPOSAL_DISCUSSION_PERIOD)
uint256 public constant VOTING_PERIOD = 7 days;      // 7 days voting period
uint256 public constant GRACE_PERIOD = 14 days;       // 14 days grace period after timelock
uint256 public constant MIN_FM_ACTIVE_DAYS = 30 days; // Must be active for 30 days
uint256 public constant MIN_DAYS_SINCE_SLASH = 90 days; // 90 days since last slash
```

**Note**: Quorum and timelock delays are retrieved from `DAOConfigCore` via `getFMQuorum()` and `getFMTimelock()` functions, not hardcoded constants.

## Proposal Types

```solidity
enum ProposalType {
    FM_STAKE_REQUIREMENT,     // Change minimum FM stake
    FUNDCLASS_TEMPLATE,       // Modify FundClass definition
    RISKTIER_DEFINITION,      // Update RiskTier parameters
    CERTIFICATION_STANDARD,   // FM certification requirements
    DISPUTE_PROCEDURE,        // FM-to-FM dispute resolution
    FEE_GUIDELINES,           // Recommended fee ranges
    REPORTING_STANDARD        // Reporting requirements
}
```

## Constructor

```solidity
constructor(
    address _fundRegistry,
    address _fmRegistry,
    address _slashingEngine
)
```

**Parameters**:
- `_fundRegistry`: FundRegistry contract address
- `_fmRegistry`: FMRegistry contract address
- `_slashingEngine`: SlashingEngine contract address

**Note**: `fundFactory` and `daoConfig` must be set after deployment using `setFundFactory()` and `setDAOConfig()` functions.

## Setup Functions

### `setFundFactory`

```solidity
function setFundFactory(address _fundFactory) external
```

**Purpose**: Set FundFactory address (can be set later)

**Access Control**: Can be set once, or only by governance if already set

### `setDAOConfig`

```solidity
function setDAOConfig(address _daoConfig) external
```

**Purpose**: Set DAOConfigCore address (can be set later)

**Access Control**: Can be set once, or only by governance if already set

## Functions

### Proposal Creation

#### `createProposal`

```solidity
function createProposal(
    ProposalType proposalType,
    bytes calldata proposalData,
    string calldata title,
    string calldata description
) external onlyActiveFM returns (uint256 proposalId)
```

**Purpose**: Create FM-level proposal

**Requirements**:
- FM must be active (`fundRegistry.isActiveFM`)
- FM must have at least one active fund
- FM must be active for at least 30 days
- FM must not have been slashed in last 90 days

**Returns**: Proposal ID

### Voting

#### `castVote`

```solidity
function castVote(uint256 proposalId, uint8 support) external onlyActiveFM
```

**Purpose**: Cast vote on FM proposal

**Parameters**:
- `proposalId`: Proposal ID
- `support`: 0=against, 1=for, 2=abstain

**Voting Power**: Calculated as `VP = (AUM × 0.6) + (AUM × Reputation/100 × 0.4)`

**Note**: Abstain votes (support == 2) are recorded but not counted in approval calculations. Only `forVotes` and `againstVotes` are used for approval threshold checks.

### State Management

#### `state`

```solidity
function state(uint256 proposalId) public view returns (ProposalState)
```

**Purpose**: Get current proposal state

**State Transitions**:
- PENDING → ACTIVE (voting starts)
- ACTIVE → SUCCEEDED/DEFEATED (voting ends)
- SUCCEEDED → QUEUED (queue called)
- QUEUED → EXECUTED/EXPIRED (execute or expire)

### Execution

#### `queue`

```solidity
function queue(uint256 proposalId) external
```

**Purpose**: Queue approved proposal for execution

**Requirements**:
- Proposal state must be SUCCEEDED
- Sets ETA based on proposal type timelock delay

#### `execute`

```solidity
function execute(uint256 proposalId) external
```

**Purpose**: Execute queued proposal after timelock

**Requirements**:
- Proposal state must be QUEUED
- Timelock must have passed
- Must be within grace period

#### `cancel`

```solidity
function cancel(uint256 proposalId) external
```

**Purpose**: Cancel proposal (proposer or governance only)

**Access Control**: Only proposer or governance can cancel

**Requirements**:
- Proposal must not be executed
- Only proposer or governance can cancel

### View Functions

#### `getProposal`

```solidity
function getProposal(uint256 proposalId) external view returns (FMProposal memory proposal)
```

**Purpose**: Get proposal details

**Returns**: Complete FMProposal struct

#### `getVotingPower`

```solidity
function getVotingPower(address fm, uint256 proposalId) external view returns (uint256 votingPower)
```

**Purpose**: Get FM's voting power on a proposal

**Returns**: Voting power (AUM + reputation weighted)

#### `hasVotedOnProposal`

```solidity
function hasVotedOnProposal(address fm, uint256 proposalId) external view returns (bool)
```

**Purpose**: Check if FM has voted on a proposal

**Returns**: `true` if voted, `false` otherwise

## Voting Power Calculation

**Formula**: `VP = (AUM × 0.6) + (AUM × Reputation/100 × 0.4)`

**Components**:
- AUM: Total Assets Under Management from `fundRegistry.getTotalAUMAt(fm, snapshot)`
- Reputation: Score from `fmRegistry.getScore(fm)` (0-100)

**Examples**:
- FM with $10M AUM, 80 reputation: `10M × (0.6 + 0.8 × 0.4) = 9.2M voting power`
- FM with $5M AUM, 0 reputation: `5M × 0.6 = 3M voting power`
- FM with $20M AUM, 100 reputation: `20M × (0.6 + 1.0 × 0.4) = 20M voting power`

## Quorum and Approval Requirements

**Quorum**: Hardcoded values based on proposal type
- `FM_STAKE_REQUIREMENT`: 30%
- `FUNDCLASS_TEMPLATE`: 25%
- `RISKTIER_DEFINITION`: 30%
- Default: 25%

**Approval**: 60% weighted approval required for all proposal types

**Note**: Quorum and approval thresholds are currently hardcoded in the contract. Future versions may retrieve these from `DAOConfigCore` for governance-controlled updates.

## Timelock Delays

**Delays**: Hardcoded values based on proposal type
- `FM_STAKE_REQUIREMENT`: 7 days
- `FUNDCLASS_TEMPLATE`: 5 days
- `RISKTIER_DEFINITION`: 5 days
- Default: 3 days

**Note**: Timelock delays are currently hardcoded in the contract. Future versions may retrieve these from `DAOConfigCore` for governance-controlled updates.

## Proposal Eligibility

FM must meet all criteria to create proposals:
1. Active FM (`fundRegistry.isActiveFM`)
2. At least one active fund (`fundRegistry.getFundsManaged(fm).length > 0`)
3. Active for 30+ days (`block.timestamp >= fundRegistry.fmActiveSince(fm) + MIN_FM_ACTIVE_DAYS`)
4. No slash in last 90 days (`slashingEngine.daysSinceLastSlash(fm) >= MIN_DAYS_SINCE_SLASH`)

## Custom Errors

```solidity
error NotActiveFM();
error NotEligibleToPropose();
error InvalidProposalData();
error VotingNotStarted();
error VotingEnded();
error ProposalNotActive();
error AlreadyVoted();
error NoVotingPower();
error InvalidSupport();
error ProposalNotFound();
error ProposalNotSucceeded();
error ProposalNotQueued();
error TimelockNotPassed();
error ProposalExpired();
error NotProposer();
error InvalidAddress();
error NotGovernance();
```

## Events

```solidity
event FMProposalCreated(
    uint256 indexed proposalId,
    address indexed proposer,
    ProposalType proposalType,
    string title
);

event FMVoteCast(
    uint256 indexed proposalId,
    address indexed voter,
    uint8 support,              // 0=against, 1=for, 2=abstain
    uint256 votingPower         // AUM + reputation weighted
);

event FMProposalQueued(
    uint256 indexed proposalId,
    uint256 eta
);

event FMProposalExecuted(
    uint256 indexed proposalId,
    address indexed executor
);

event FMProposalCanceled(
    uint256 indexed proposalId,
    address indexed canceler
);
```

## Internal Functions

### `_canFMPropose`

```solidity
function _canFMPropose(address fm) internal view returns (bool)
```

**Purpose**: Validate FM eligibility to propose

**Checks**:
- FM must be active
- FM must have at least one fund
- FM must be active for 30+ days
- FM must not have been slashed in last 90 days

### `_getFMVotingPower`

```solidity
function _getFMVotingPower(address fm, uint256 snapshot) internal view returns (uint256)
```

**Purpose**: Calculate FM voting power based on AUM and reputation at snapshot

**Formula**: `VP = (AUM × 0.6) + (AUM × Reputation/100 × 0.4)`

### `_getTotalFMVotingPower`

```solidity
function _getTotalFMVotingPower(uint256 snapshot) internal view returns (uint256)
```

**Purpose**: Get total FM voting power at a given snapshot

**Returns**: Sum of all active FMs' voting power at snapshot

### `_getRequiredQuorum`

```solidity
function _getRequiredQuorum(ProposalType proposalType) internal pure returns (uint256)
```

**Purpose**: Get required quorum for proposal type

**Returns**: Hardcoded quorum percentage based on proposal type (25-30%)

### `_getRequiredApproval`

```solidity
function _getRequiredApproval(ProposalType proposalType) internal pure returns (uint256)
```

**Purpose**: Get required approval threshold for proposal type

**Returns**: Hardcoded approval percentage (60% for all types)

### `_getTimelockDelay`

```solidity
function _getTimelockDelay(ProposalType proposalType) internal pure returns (uint256)
```

**Purpose**: Get timelock delay for proposal type

**Returns**: Hardcoded timelock delay based on proposal type (3-7 days)

### `_validateFMProposalData`

```solidity
function _validateFMProposalData(ProposalType proposalType, bytes calldata proposalData) internal pure
```

**Purpose**: Validate proposal data structure based on type

**Validations**:
- Proposal data must not be empty
- Data length must match expected structure for proposal type

### `_executeProposal`

```solidity
function _executeProposal(FMProposal storage proposal) internal
```

**Purpose**: Execute proposal based on type

**Implementation**:
- `FM_STAKE_REQUIREMENT`: Updates minimum FM stake via `fundFactory.setMinimumFMStake()`
- `FUNDCLASS_TEMPLATE`: Placeholder - not implemented yet (reverts with `InvalidProposalData`)
- `RISKTIER_DEFINITION`: Placeholder - not implemented yet (reverts with `InvalidProposalData`)
- Other proposal types: Placeholder implementations (to be completed)

[Complete specifications in Governance Layer](/protocol/contracts/governance-layer)

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

[Back to Governance Contracts](/protocol/contracts/governance-layer)

