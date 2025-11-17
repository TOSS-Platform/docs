# FundRegistry.sol

## Overview

Central registry and index for all funds in the TOSS Protocol, enabling discovery, filtering, and metadata management.

## Purpose

- Maintain canonical list of all funds
- Enable fund discovery and filtering
- Track fund metadata and status
- Provide fund statistics
- Support investor queries

## State Variables

```solidity
// ===== Fund Storage =====
struct FundMetadata {
    address fundAddress;
    address manager;
    FundClass fundClass;
    RiskTier riskTier;
    uint256 createdAt;
    FundStatus status;
    uint256 currentNAV;
    uint256 investorCount;
}

mapping(uint256 => FundMetadata) public funds;  // fundId => metadata
uint256 public fundCount;

// ===== Indexes =====
mapping(address => uint256[]) public fundsByManager;  // fm => fundIds
mapping(FundClass => uint256[]) public fundsByClass;
mapping(RiskTier => uint256[]) public fundsByTier;
mapping(FundStatus => uint256[]) public fundsByStatus;

// ===== Reverse Lookups =====
mapping(address => uint256) public addressToFundId;  // address => fundId

enum FundStatus { ACTIVE, PAUSED, CLOSED, LIQUIDATING }
```

## Functions

### `registerFund`

```solidity
function registerFund(
    address fundAddress,
    address manager,
    FundClass fundClass,
    RiskTier riskTier
) external onlyFundFactory returns (uint256 fundId)
```

**Purpose**: Register new fund in the registry

**Parameters**:
- `fundAddress`: Deployed fund contract
- `manager`: FM address
- `fundClass`: Fund classification
- `riskTier`: Risk tier assignment

**Returns**: Unique fund ID

**Access Control**: Only FundFactory

**Events**: `FundRegistered(fundId, fundAddress, manager, fundClass, riskTier)`

### `updateFundNAV`

```solidity
function updateFundNAV(
    uint256 fundId,
    uint256 newNAV
) external onlyNAVEngine
```

**Purpose**: Update fund's current NAV

**Parameters**:
- `fundId`: Fund identifier
- `newNAV`: New Net Asset Value

**Access Control**: Only NAV Engine

### Query Functions

#### `getFundsByRiskTier`

```solidity
function getFundsByRiskTier(
    RiskTier tier
) external view returns (uint256[] memory)
```

**Purpose**: Get all funds in specific risk tier

**Returns**: Array of fund IDs

#### `getFundsByClass`

```solidity
function getFundsByClass(
    FundClass class
) external view returns (uint256[] memory)
```

#### `getFundsByPerformance`

```solidity
function getFundsByPerformance(
    uint256 minReturn,
    uint256 period
) external view returns (uint256[] memory)
```

**Purpose**: Filter funds by minimum return over period

**Parameters**:
- `minReturn`: Minimum return (basis points)
- `period`: Time period (seconds)

**Returns**: Fund IDs meeting criteria

#### `searchFunds`

```solidity
function searchFunds(
    FundClass class,
    RiskTier tier,
    uint256 minNAV,
    uint256 maxNAV,
    FundStatus status
) external view returns (uint256[] memory)
```

**Purpose**: Multi-criteria fund search

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Register fund correctly | FundFactory registers new fund with manager, class, and tier | Fund ID assigned, fund address registered, metadata stored, FundRegistered event emitted |
| Map address to fund ID | After registration, verify fund address maps to fund ID | addressToFundId mapping created correctly, reverse lookup works |
| Query fund metadata | Query fund metadata by fund ID | Returns FundMetadata struct with all fund information |
| Get funds by risk tier | Query all funds in specific risk tier | Returns array of fund IDs in that tier |
| Get funds by class | Query all funds of specific fund class | Returns array of fund IDs in that class |
| Get funds by status | Query all funds with specific status (ACTIVE, PAUSED, CLOSED) | Returns array of fund IDs with that status |
| Get funds by manager | Query all funds managed by specific FM | Returns array of fund IDs for that manager |
| Search funds by criteria | Multi-criteria search: class, tier, NAV range, status | Returns fund IDs matching all criteria |
| Get funds by performance | Query funds with minimum return over period | Returns fund IDs meeting performance criteria |
| Update fund NAV | NAV Engine updates fund's current NAV | NAV updated in metadata, NAVUpdated event emitted |
| Update fund status | Fund status changes (e.g., ACTIVE to CLOSED) | Status updated in metadata, event emitted |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Register first fund | First fund registered in empty registry | Fund ID is 1, fundCount increments to 1 |
| Register multiple funds | Multiple funds registered sequentially | Each gets unique fund ID, all tracked correctly |
| Query empty tier | Query funds in risk tier with no funds | Returns empty array |
| Query empty class | Query funds in class with no funds | Returns empty array |
| Search with no matches | Search with criteria that match no funds | Returns empty array |
| Update NAV to zero | NAV Engine updates fund NAV to 0 | NAV updated to 0, metadata reflects zero NAV |
| Update NAV to very large value | NAV Engine updates fund NAV to maximum | NAV updated correctly, no overflow issues |
| Register fund with all tiers | Fund registered in each risk tier | All tiers populated, queries return correct funds |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Register fund from non-Factory | Non-Factory address attempts to register fund | Transaction reverts with "Only Factory" error |
| Register duplicate fund address | Factory attempts to register same fund address twice | Transaction reverts with "Fund already registered" error |
| Update NAV from non-NAV Engine | Non-NAV Engine attempts to update NAV | Transaction reverts with "Only NAV Engine" error |
| Query non-existent fund | Query metadata for fund ID that doesn't exist | Returns empty metadata or reverts |
| Search with invalid criteria | Search with invalid NAV range (min &gt; max) | Transaction reverts with validation error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized registration | Attacker attempts to register fund directly | Transaction reverts, only Factory can register |
| Prevent unauthorized NAV updates | Attacker attempts to update NAV maliciously | Transaction reverts, only NAV Engine can update |
| Address mapping integrity | Verify address to fund ID mapping cannot be manipulated | Mapping set only during registration, immutable afterwards |
| Fund isolation | Verify fund metadata isolated from other funds | Each fund tracked independently, no cross-fund data access |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Register fund by Factory | FundFactory registers fund | Transaction succeeds |
| Register fund by non-Factory | Non-Factory attempts to register | Transaction reverts with "Only Factory" |
| Update NAV by NAV Engine | NAV Engine updates NAV | Transaction succeeds |
| Update NAV by non-NAV Engine | Non-NAV Engine attempts to update | Transaction reverts with "Only NAV Engine" |
| Query functions by any address | Any address queries funds, metadata, searches | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| FundFactory registration flow | FundFactory creates fund, registers in registry | Fund registered correctly, all metadata stored |
| NAV Engine update flow | NAV Engine calculates NAV, updates registry | NAV updated in registry, metadata reflects new value |
| Multiple funds registration | Multiple funds registered, all tracked correctly | Each fund independent, queries return correct results |
| Search and filter integration | Front-end queries registry for fund discovery | Search and filter functions work correctly, return accurate results |
| Status updates on fund closure | Fund closes, status updated in registry | Status changed to CLOSED, queries reflect new status |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Fund registration gas | Factory registers fund | Gas usage reasonable for registration operation |
| NAV update gas | NAV Engine updates fund NAV | Gas usage reasonable for NAV update |
| Query operations gas | Multiple queries for funds, metadata, searches | View functions consume no gas (read-only) |
| Search with many funds | Search through registry with 100+ funds | Query remains efficient, gas usage reasonable |

---

**Next**: [FundManagerVault](/docs/protocol/contracts/fund/FundManagerVault)

