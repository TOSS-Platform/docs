# VoterRegistry.sol

## Overview

Central registry tracking voter eligibility and voting power across all three governance levels (Fund, FM, and Protocol).

## Purpose

- Determine voter eligibility per governance level
- Calculate voting power based on context
- Provide unified voter queries
- Support multiple governance systems
- Prevent voting power manipulation through snapshot-based calculations

## Dependencies

The contract requires the following dependencies:

- `IFundRegistry`: For fund metadata, FM status, and AUM queries
- `IFundManagerVault`: For share balance queries (each fund has its own vault)
- `IStaking`: For TOSS staking balance and lock duration
- `IInvestorRegistry`: For investor class information
- `IGuardianCommittee`: For guardian membership verification
- `IFMRegistry`: For FM reputation scores

## State Variables

- `fundRegistry`: Immutable reference to FundRegistry contract
- `vault`: Immutable reference to FundManagerVault contract (for share queries)
- `staking`: Immutable reference to Staking contract
- `investorRegistry`: Immutable reference to InvestorRegistry contract
- `guardianCommittee`: Immutable reference to GuardianCommittee contract
- `fmRegistry`: Immutable reference to FMRegistry contract (for reputation scores)

## Enums

### `GovernanceLevel`

```solidity
enum GovernanceLevel {
    FUND,      // Fund-level governance
    FM,        // Fund Manager-level governance
    PROTOCOL   // Protocol-level governance
}
```

### `VoterGroup`

```solidity
enum VoterGroup {
    FM_ONLY,        // Only Fund Managers can vote
    INVESTOR_ONLY,  // Only investors (non-FMs) can vote
    BOTH,           // Both FMs and investors can vote
    GUARDIAN_ONLY   // Only guardians can vote
}
```

## Constructor

```solidity
constructor(
    address _fundRegistry,
    address _vault,
    address _staking,
    address _investorRegistry,
    address _guardianCommittee,
    address _fmRegistry
)
```

**Parameters**:
- `_fundRegistry`: FundRegistry contract address
- `_vault`: FundManagerVault contract address (for share queries)
- `_staking`: Staking contract address
- `_investorRegistry`: InvestorRegistry contract address
- `_guardianCommittee`: GuardianCommittee contract address
- `_fmRegistry`: FMRegistry contract address (for reputation scores)

**Validation**: All addresses must be non-zero, otherwise reverts with `InvalidAddress()` error.

## Custom Errors

- `InvalidAddress()`: Thrown when a zero address is provided in constructor
- `InvalidGovernanceLevel()`: Thrown when an invalid `GovernanceLevel` enum value is provided
- `InvalidVoterGroup()`: Thrown when an invalid `VoterGroup` enum value is provided
- `InvalidSnapshot()`: Thrown when an invalid snapshot ID is provided (future snapshots, etc.)

## Functions

### `isFundVoter`

```solidity
function isFundVoter(
    address voter,
    uint256 fundId
) external view returns (bool)
```

**Purpose**: Check if address can vote on fund proposals

**Logic**: 
1. Get vault address for the fund from `fundRegistry.getFundMetadata(fundId)`
2. If vault doesn't exist, return `false`
3. Check if voter has shares in the fund vault: `fundVault.getShares(voter) > 0`

**Note**: Each fund has its own vault contract, so we first get the vault address from FundRegistry, then query shares from that specific vault.

### `isFMVoter`

```solidity
function isFMVoter(address voter) external view returns (bool)
```

**Purpose**: Check if address is eligible FM voter

**Logic**: 
1. Check if address is active FM: `fundRegistry.isActiveFM(voter)`
2. If not active FM, return `false`
3. Get funds managed by FM: `fundsManaged = fundRegistry.getFundsManaged(voter)`
4. Return `true` if `fundsManaged.length > 0`, otherwise `false`

**Note**: FM must be both active AND have at least one fund to be eligible for FM-level voting.

### `isProtocolVoter`

```solidity
function isProtocolVoter(
    address voter,
    VoterGroup group
) external view returns (bool)
```

**Purpose**: Check eligibility for protocol proposals

**Logic**: Based on voter group specification:

- **FM_ONLY**: Returns `true` if `fundRegistry.isActiveFM(voter)` is `true`
- **INVESTOR_ONLY**: Returns `true` if:
  - `staking.getStake(voter) > 0` (has staked TOSS)
  - AND `!fundRegistry.isActiveFM(voter)` (is not an active FM)
- **BOTH**: Returns `true` if `staking.getStake(voter) > 0` (has staked TOSS, regardless of FM status)
- **GUARDIAN_ONLY**: Returns `true` if `guardianCommittee.isMember(voter)` is `true`

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
- `level`: `GovernanceLevel` enum (FUND, FM, or PROTOCOL)
- `contextId`: 
  - For FUND level: `fundId` (the fund ID)
  - For FM level: `0` (ignored)
  - For PROTOCOL level: `VoterGroup` enum value (FM_ONLY, INVESTOR_ONLY, BOTH, GUARDIAN_ONLY)
- `snapshot`: Snapshot ID or block number (0 for current state)

**Returns**: Voting power in that context (18 decimal precision)

**Routing**:
- **FUND level**: Calls `_getFundVotingPower(voter, contextId, snapshot)`
- **FM level**: Calls `_getFMVotingPower(voter, snapshot)`
- **PROTOCOL level**: Calls `_getProtocolVotingPower(voter, VoterGroup(contextId), snapshot)`

**Validation**:
- Invalid `GovernanceLevel` enum value → reverts with `InvalidGovernanceLevel()`
- Invalid `VoterGroup` enum value (for PROTOCOL level) → reverts with `InvalidVoterGroup()`

## Voting Power Calculation Details

### Fund-Level Voting Power

**Formula**: `(voterShares * 1e18) / totalShares`

**Calculation**:
1. Get vault address for the fund from `fundRegistry.getFundMetadata(fundId)`
2. If `snapshot == 0`:
   - `voterShares = fundVault.getShares(voter)`
   - `totalShares = fundVault.totalShares()`
3. If `snapshot > 0`:
   - `voterShares = fundVault.balanceOfAt(voter, fundId, snapshot)`
   - `totalShares = fundVault.totalSharesAt(fundId, snapshot)`
4. If `voterShares == 0` or `totalShares == 0`, return `0`
5. Return `(voterShares * 1e18) / totalShares` (percentage with 18 decimals)

**Returns**: Voting power as percentage (18 decimals, e.g., `1e18` = 100%)

### FM-Level Voting Power

**Formula**: `(AUM * 60 / 100) + (AUM * reputation * 40 / 10000)`

**Calculation**:
1. Get total AUM managed at snapshot: `totalAUM = fundRegistry.getTotalAUMAt(voter, snapshot)`
2. If `totalAUM == 0`, return `0`
3. Get reputation score (0-100): `reputation = fmRegistry.getScore(voter)`
4. Calculate AUM component: `aumComponent = (totalAUM * 60) / 100` (60% weight)
5. Calculate reputation component: `repComponent = (totalAUM * reputation * 40) / 10000` (40% weight)
6. Return `aumComponent + repComponent`

**Returns**: Voting power in AUM units (same precision as AUM, typically 6 decimals for USD)

### Protocol-Level Voting Power

**Formula**: `TOSS_Staked × (1 + LockBonus) × RoleMultiplier`

**Calculation**:
1. Get staked TOSS at snapshot:
   - If `snapshot == 0`: `stakedTOSS = staking.getStake(voter)`
   - If `snapshot > 0`: `stakedTOSS = staking.balanceOfAt(voter, snapshot)`
2. If `stakedTOSS == 0`, return `0`
3. Get lock bonus: `lockBonus = _getLockBonus(voter)` (0-2.0x as 18 decimals)
4. Get role multiplier: `roleMultiplier = _getRoleMultiplier(voter, group)` (18 decimals)
5. Calculate: `votingPower = (stakedTOSS * (1e18 + lockBonus) * roleMultiplier) / (1e18 * 1e18)`

**Returns**: Voting power in TOSS units (18 decimals)

#### Lock Bonus Calculation

**Formula**: Based on lock duration remaining

**Lock Bonus Table**:
| Lock Duration | Bonus | Multiplier | Value (18 decimals) |
|---------------|-------|------------|---------------------|
| None or expired | 0% | 1.0x | `0` |
| < 90 days | 0% | 1.0x | `0` |
| 90-180 days | 50% | 1.5x | `5 * 1e17` (0.5x) |
| 180-365 days | 100% | 2.0x | `1 * 1e18` (1.0x) |
| 365-730 days | 150% | 2.5x | `15 * 1e17` (1.5x) |
| 730+ days | 200% | 3.0x | `2 * 1e18` (2.0x) |

**Calculation**:
1. Get lock end time: `lockEndTime = staking.lockEnd(voter)`
2. If `lockEndTime == 0` or `lockEndTime <= block.timestamp`, return `0`
3. Calculate remaining duration: `lockDuration = lockEndTime - block.timestamp`
4. Apply bonus based on duration ranges above

#### Role Multiplier Calculation

**Formula**: Based on `VoterGroup` and investor class

**Role Multiplier Table**:
| VoterGroup | Condition | Multiplier | Value (18 decimals) |
|------------|-----------|------------|----------------------|
| FM_ONLY | Always | 1.5x | `15 * 1e17` |
| INVESTOR_ONLY | Strategic | 2.0x | `20 * 1e17` |
| INVESTOR_ONLY | Institutional | 1.5x | `15 * 1e17` |
| INVESTOR_ONLY | Premium | 1.2x | `12 * 1e17` |
| INVESTOR_ONLY | Retail | 1.0x | `10 * 1e17` |
| BOTH | Is FM | 1.5x | `15 * 1e17` |
| BOTH | Strategic (not FM) | 2.0x | `20 * 1e17` |
| BOTH | Institutional (not FM) | 1.3x | `13 * 1e17` |
| BOTH | Others (not FM) | 1.0x | `10 * 1e17` |
| GUARDIAN_ONLY | Always | 1.0x | `10 * 1e17` |

**Calculation**:
1. For `FM_ONLY`: Return `15 * 1e17` (1.5x)
2. For `INVESTOR_ONLY`: Get investor class from `investorRegistry.getInvestorClass(voter)` and return multiplier based on class
3. For `BOTH`: 
   - If `fundRegistry.isActiveFM(voter)`, return `15 * 1e17` (1.5x)
   - Otherwise, get investor class and return multiplier (Strategic: 2.0x, Institutional: 1.3x, others: 1.0x)
4. For `GUARDIAN_ONLY`: Return `10 * 1e17` (1.0x)

## Snapshot Handling

All voting power calculations support snapshot-based queries to prevent manipulation:

- **Current State**: Pass `snapshot = 0` to get current voting power
- **Historical State**: Pass `snapshot > 0` to get voting power at a specific snapshot/block
- **Snapshot Sources**:
  - Fund-level: Uses `fundVault.balanceOfAt()` and `fundVault.totalSharesAt()`
  - FM-level: Uses `fundRegistry.getTotalAUMAt()`
  - Protocol-level: Uses `staking.balanceOfAt()`

**Security**: Snapshots prevent flash loan attacks and ensure voting power is calculated from historical state at proposal creation time.

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

