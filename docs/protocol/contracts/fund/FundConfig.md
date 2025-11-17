# FundConfig.sol

## Overview

Stores and manages fund-specific risk parameters, operational settings, and fee structures. All fund behavior is governed by its configuration.

## Purpose

- Store fund risk limits (PSL, PCL, AEL, etc.)
- Manage fee structures
- Track allowed assets
- Enable fund governance parameter changes
- Validate parameter changes against protocol limits

## State Variables

```solidity
struct FundConfiguration {
    // ===== Risk Limits =====
    uint256 maxPositionSize;      // PSL: max % of NAV in single position
    uint256 maxConcentration;     // PCL: max % of NAV in single asset
    uint256 maxAssetExposure;     // AEL: max exposure per asset class
    uint256 maxDrawdown;          // Maximum drawdown from HWM (%)
    uint256 maxVolatility;        // Maximum annualized volatility (%)
    uint256 maxLeverage;          // Maximum leverage ratio
    
    // ===== Trading Rules =====
    uint256 maxDailyTrades;       // Trade frequency limit
    uint256 maxSlippage;          // Maximum acceptable slippage (basis points)
    uint256 minTradeSize;         // Minimum trade size (prevents dust)
    address[] allowedAssets;      // Whitelist of tradeable assets
    
    // ===== Fees =====
    uint256 managementFee;        // Annual management fee (basis points)
    uint256 performanceFee;       // Performance fee above HWM (basis points)
    uint256 depositFee;           // One-time deposit fee (basis points)
    uint256 withdrawalFee;        // Withdrawal fee (basis points)
    
    // ===== Operational =====
    uint256 minInvestment;        // Minimum deposit amount
    uint256 lockupPeriod;         // Time before withdrawal allowed
    FundClass fundClass;
    RiskTier riskTier;
    
    // ===== Metadata =====
    string strategyDescription;
    bool kycRequired;
    uint256 maxInvestors;         // 0 = unlimited
}

mapping(uint256 => FundConfiguration) public configs;  // fundId => config
```

## Functions

### `setConfiguration`

```solidity
function setConfiguration(
    uint256 fundId,
    FundConfiguration memory newConfig
) external onlyFundGovernance
```

**Purpose**: Update fund configuration via governance

**Parameters**:
- `fundId`: Fund to update
- `newConfig`: New configuration

**Access Control**: Only FundGovernance (after proposal passes)

**Validations**:
- New config within RiskTier limits
- Fee changes within allowed ranges
- Asset list valid for tier

**Events**: `ConfigurationUpdated(fundId, oldConfig, newConfig)`

### `updateRiskParameter`

```solidity
function updateRiskParameter(
    uint256 fundId,
    bytes32 parameter,
    uint256 newValue
) external onlyFundGovernance
```

**Purpose**: Update single risk parameter

**Parameters**:
- `fundId`: Fund ID
- `parameter`: Parameter name (e.g., keccak256("maxDrawdown"))
- `newValue`: New value

**Use Case**: Quick governance changes without full config update

### Query Functions

#### `getRiskParameters`

```solidity
function getRiskParameters(
    uint256 fundId
) external view returns (
    uint256 psl,
    uint256 pcl,
    uint256 ael,
    uint256 maxDD,
    uint256 maxVol
)
```

**Purpose**: Get all risk parameters at once

#### `getFees`

```solidity
function getFees(
    uint256 fundId
) external view returns (
    uint256 managementFee,
    uint256 performanceFee,
    uint256 depositFee,
    uint256 withdrawalFee
)
```

#### `isAssetAllowed`

```solidity
function isAssetAllowed(
    uint256 fundId,
    address asset
) external view returns (bool)
```

**Purpose**: Check if asset can be traded by fund

## DAO-Configurable Parameters

### Fund-Level (via FundGovernance)

| Parameter | Range | Change Limit |
|-----------|-------|--------------|
| `managementFee` | 0-300 bps (0-3%) | 50% per proposal |
| `performanceFee` | 0-3000 bps (0-30%) | 30% per proposal |
| `maxDrawdown` | Within RiskTier | 50% per proposal |
| `maxVolatility` | Within RiskTier | 30% per proposal |
| `lockupPeriod` | 0-365 days | Can increase, limited decrease |

### Protocol-Level Limits

| Parameter | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|-----------|--------|--------|--------|--------|
| Max Management Fee | 2% | 2.5% | 3% | 3% |
| Max Performance Fee | 20% | 25% | 30% | 30% |
| Max Drawdown | 15% | 30% | 50% | 80% |

## Security Considerations

**1. Parameter Manipulation**
- **Risk**: FM sets extreme parameters to game system
- **Mitigation**: RiskTier bounds, governance approval required, change limits
- **Severity**: Medium → Mitigated

**2. Asset List Abuse**
- **Risk**: Add illiquid/manipulatable assets
- **Mitigation**: Assets must be in tier's allowed list, governance votes
- **Severity**: High → Mitigated

## Test Scenarios

```typescript
describe("FundConfig", () => {
  it("should enforce RiskTier limits", async () => {
    const config = { ...baseConfig, maxDrawdown: 60 };  // 60% DD
    
    await expect(
      fundConfig.setConfiguration(tier1FundId, config)
    ).to.be.revertedWith("Exceeds Tier 1 max drawdown (15%)");
  });
  
  it("should allow governance to update fees", async () => {
    await fundGovernance.proposeAndPass(
      fundId,
      ProposalType.FEE_CHANGE,
      { managementFee: 150 }  // 1.5%
    );
    
    const fees = await fundConfig.getFees(fundId);
    expect(fees.managementFee).to.equal(150);
  });
});
```

---

**Next**: [FundTradeExecutor](/docs/protocol/contracts/fund/FundTradeExecutor)

