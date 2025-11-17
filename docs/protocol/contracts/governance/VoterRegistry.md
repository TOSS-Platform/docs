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

---

**Governance Contracts Complete!** [Investor Layer →](/docs/protocol/contracts/investor/InvestorRegistry)

