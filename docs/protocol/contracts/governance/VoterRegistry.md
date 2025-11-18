# VoterRegistry.sol

## Overview

Central registry tracking voter eligibility and voting power across all three governance levels.

## Purpose

- Determine voter eligibility per governance level
- Calculate voting power based on context
- Provide unified voter queries
- Support multiple governance systems

## Functions

### `isFundVoter`

```solidity
function isFundVoter(
    address voter,
    uint256 fundId
) external view returns (bool)
```

**Purpose**: Check if address can vote on fund proposals

**Logic**: `vault.balanceOf(voter, fundId) > 0`

### `isFMVoter`

```solidity
function isFMVoter(address voter) external view returns (bool)
```

**Purpose**: Check if address is eligible FM voter

**Logic**: Active FM with ≥1 fund

### `isProtocolVoter`

```solidity
function isProtocolVoter(
    address voter,
    VoterGroup group
) external view returns (bool)
```

**Purpose**: Check eligibility for protocol proposals

**Logic**: Based on voter group specification

### `getVotingPower`

```solidity
function getVotingPower(
    address voter,
    GovernanceLevel level,
    uint256 contextId,
    uint256 snapshot
) external view returns (uint256)
```

**Purpose**: Get voting power for any governance context

**Parameters**:
- `voter`: Address to query
- `level`: FUND, FM, or PROTOCOL
- `contextId`: fundId for fund-level, 0 for others
- `snapshot`: Block number for historical query

**Returns**: Voting power in that context

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Check fund voter eligibility | Query if address is eligible to vote on fund proposals | Returns true if address has shares in fund, false otherwise |
| Check FM voter eligibility | Query if address is eligible FM voter | Returns true if address is active FM with ≥1 fund, false otherwise |
| Check protocol voter eligibility (FM) | Query if FM is eligible for protocol proposals with FM group | Returns true if FM meets eligibility criteria, false otherwise |
| Check protocol voter eligibility (Investor) | Query if investor is eligible for protocol proposals with Investor group | Returns true if investor has staked TOSS, false otherwise |
| Get fund voting power | Query voting power for fund-level proposal | Returns voting power based on share balance at snapshot |
| Get FM voting power | Query FM voting power for FM-level proposal | Returns voting power based on AUM and reputation at snapshot |
| Get protocol voting power (FM) | Query FM voting power for protocol proposal | Returns AUM-weighted voting power if FM group |
| Get protocol voting power (Investor) | Query investor voting power for protocol proposal | Returns TOSS-staked voting power if Investor group |
| Get voting power at snapshot | Query historical voting power using snapshot | Returns voting power at specific block/snapshot, prevents manipulation |
| Query multiple voters | Query eligibility for multiple addresses | All queries succeed, results accurate for each voter |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Query voter with zero shares | Check fund voter eligibility for address with 0 shares | Returns false, no voting power |
| Query voter with minimum shares | Check fund voter eligibility for address with 1 share | Returns true, voting power equals 1 |
| Query voter with maximum shares | Check fund voter eligibility for address with all shares | Returns true, voting power equals total shares |
| Query FM with zero AUM | Check FM voter eligibility for FM with $0 AUM | Returns false or true depending on implementation (minimum AUM requirement) |
| Query FM with single fund | Check FM voter eligibility for FM with exactly 1 fund | Returns true, meets minimum requirement |
| Query investor with zero stake | Check protocol voter eligibility for investor with 0 staked TOSS | Returns false, no voting power |
| Query voter for non-existent fund | Check fund voter eligibility for fund that doesn't exist | Returns false or reverts depending on implementation |
| Query voting power at future snapshot | Query voting power for snapshot that hasn't been created | Returns 0 or reverts depending on implementation |
| Query voting power at genesis | Query voting power at block 0 or before any activity | Returns 0, no voting power before activity |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Query with invalid governance level | Query voting power with invalid GovernanceLevel enum | Transaction reverts with validation error |
| Query with invalid context ID | Query fund voting power with invalid fundId | Transaction reverts with "Fund not found" error or returns 0 |
| Query with invalid snapshot | Query voting power with snapshot ID that doesn't exist | Returns 0 or reverts depending on implementation |
| Query protocol voter with invalid group | Query protocol voter eligibility with invalid VoterGroup | Transaction reverts with validation error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent voting power manipulation | Attempt to manipulate voting power calculation | Voting power calculated from snapshots, cannot manipulate |
| Prevent eligibility manipulation | Attempt to manipulate voter eligibility | Eligibility checked from source contracts, cannot manipulate |
| Snapshot-based voting power | Verify voting power uses snapshots to prevent flash loans | Snapshot balances used, flash loans cannot affect historical snapshots |
| Cross-fund isolation | Verify voting power calculated per fund correctly | Fund voting power isolated, cross-fund manipulation prevented |
| AUM calculation integrity | Verify AUM used for FM voting power cannot be manipulated | AUM calculated from vault holdings, manipulation prevented |
| Stake calculation integrity | Verify TOSS stake used for investor voting power cannot be manipulated | Stake read from staking contract, manipulation prevented |
| Reputation integrity | Verify reputation used for FM voting power cannot be manipulated | Reputation read from FMRegistry, manipulation prevented |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Query functions by any address | Any address queries eligibility and voting power | Queries succeed, read-only functions are public |
| No write functions | Verify contract has no write functions (if read-only registry) | Contract is view-only, no state modifications possible |
| Governance contract access | Governance contracts query voter registry | Queries succeed, registry provides voter information to governance |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| FundGovernance integration | FundGovernance queries VoterRegistry for fund voter eligibility | Eligibility checked correctly, voting power calculated accurately |
| FMGovernance integration | FMGovernance queries VoterRegistry for FM voter eligibility | Eligibility checked correctly, AUM + reputation power calculated |
| ProtocolGovernance integration | ProtocolGovernance queries VoterRegistry for protocol voter eligibility | Eligibility checked correctly, voter group restrictions enforced |
| Vault share integration | Fund voting power calculated from vault share balances | Share balances read correctly, voting power accurate |
| FMRegistry integration | FM eligibility and reputation read from FMRegistry | FM status and reputation read correctly, eligibility accurate |
| Staking contract integration | Investor voting power calculated from staked TOSS | Staked amounts read correctly, voting power accurate |
| Snapshot integration | Voting power calculated from governance snapshots | Snapshot balances used, historical voting power accurate |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Eligibility query gas | Query voter eligibility | Gas usage reasonable, efficient eligibility checks |
| Voting power query gas | Query voting power with calculations | Gas usage reasonable, calculations efficient |
| Batch query gas | Query eligibility for multiple voters | Batch queries efficient, gas usage reasonable |
| Snapshot query gas | Query voting power at snapshot | Gas usage reasonable for snapshot lookups |
| Query operations gas | Multiple queries for eligibility and voting power | View functions consume no gas (read-only) |

---

**Governance Contracts Complete!** [Investor Layer →](/protocol/contracts/investor/InvestorRegistry)

