# ProtocolRiskDomain.sol

## Overview

Monitors protocol-wide risk factors including oracle health, sequencer status, and global exposure limits.

## Purpose

- Monitor oracle feed health
- Detect zkSync sequencer issues
- Track global protocol exposure
- Detect systemic risks
- Trigger protocol-wide circuit breakers

## State Variables

```solidity
IPriceOracleRouter public oracleRouter;
uint256 public maxOracleDeviation = 500;  // 5% max deviation

bool public protocolHealthy = true;
uint256 public lastHealthCheck;

mapping(address => uint256) public globalExposure;  // asset => total exposure across all funds
uint256 public maxGlobalExposurePerAsset;
```

## Functions

### `validate`

```solidity
function validate() external view returns (bool healthy, uint256 faultIndex)
```

**Purpose**: Check protocol-level health

**Returns**:
- `healthy`: Whether protocol is healthy
- `faultIndex`: 0 if healthy, >0 if issues

**Checks**:
1. Oracle deviation within tolerance
2. Sequencer operational
3. Global exposure not exceeded
4. No emergency conditions

### `checkOracleHealth`

```solidity
function checkOracleHealth() external view returns (bool)
```

**Purpose**: Verify price oracles functioning correctly

**Returns**: `true` if healthy

## Test Scenarios

```typescript
it("should detect oracle deviation", async () => {
  await oracleRouter.setPriceDeviation(600);  // 6% > 5% max
  
  const { healthy, faultIndex } = await protocolDomain.validate();
  expect(healthy).to.be.false;
  expect(faultIndex).to.be.gt(50);  // High FI for oracle issues
});
```

---

**Next**: [FundRiskDomain](/docs/protocol/contracts/risk/FundRiskDomain)

