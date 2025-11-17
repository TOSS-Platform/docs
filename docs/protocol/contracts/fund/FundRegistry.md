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

```typescript
describe("FundRegistry", () => {
  it("should register fund correctly", async () => {
    const fundId = await registry.connect(factory).registerFund(
      fundAddress,
      fm.address,
      FundClass.BALANCED,
      RiskTier.TIER_2
    );
    
    expect(fundId).to.equal(1);
    expect(await registry.addressToFundId(fundAddress)).to.equal(fundId);
  });
  
  it("should filter funds by risk tier", async () => {
    // Create multiple funds
    await createFund(FundClass.STABLE, RiskTier.TIER_1);
    await createFund(FundClass.BALANCED, RiskTier.TIER_2);
    await createFund(FundClass.ALPHA, RiskTier.TIER_1);
    
    const tier1Funds = await registry.getFundsByRiskTier(RiskTier.TIER_1);
    expect(tier1Funds.length).to.equal(2);
  });
});
```

---

**Next**: [FundManagerVault](/docs/protocol/contracts/fund/FundManagerVault)

