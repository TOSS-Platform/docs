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

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Validate protocol health | ProtocolRiskDomain validates overall protocol health | Protocol health assessed, healthy status returned, faultIndex calculated |
| Check oracle price deviation | Validate oracle prices within acceptable deviation limits | Oracle prices validated, deviation checked against max threshold, healthy if within limit |
| Check protocol state | Validate protocol is in healthy operational state | Protocol state checked, healthy if ACTIVE, unhealthy if PAUSED or EMERGENCY |
| Check liquidity conditions | Validate sufficient protocol liquidity | Liquidity checked, healthy if sufficient, unhealthy if insufficient |
| Query protocol health | Query current protocol health status | Returns healthy (bool) and faultIndex, protocol health assessed |
| Detect oracle deviation | Oracle price deviates beyond maximum threshold | Protocol unhealthy, high faultIndex, OracleDeviation event emitted |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Oracle deviation at threshold | Oracle price deviates exactly at maximum threshold | Protocol may be healthy or unhealthy depending on implementation (strict &gt; or &gt;=) |
| Oracle deviation below threshold | Oracle price deviates below maximum threshold | Protocol healthy, low faultIndex, no oracle issues detected |
| Multiple oracle deviations | Multiple oracles show price deviations | Worst deviation used, faultIndex reflects highest deviation |
| Protocol state at boundary | Protocol in transitional state | State checked correctly, health reflects current state |
| Liquidity at minimum | Protocol liquidity exactly at minimum threshold | Protocol may be healthy or unhealthy depending on implementation |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Validate with invalid oracle | Oracle address invalid or non-functional | Transaction reverts with oracle error or returns unhealthy status |
| Validate during protocol pause | Attempt to validate when protocol paused | Returns unhealthy status, faultIndex reflects paused state |
| Validate with missing oracles | Required oracles not available | Returns unhealthy status, faultIndex reflects missing oracle issue |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent oracle manipulation | Attempt to manipulate oracle prices to affect validation | Oracle prices read from trusted oracles, cannot manipulate |
| Protocol state integrity | Verify protocol state cannot be manipulated | State read from ChainState contract, cannot manipulate |
| Liquidity calculation integrity | Verify liquidity calculations cannot be manipulated | Liquidity calculated from on-chain data, cannot manipulate |
| FaultIndex calculation accuracy | Verify faultIndex calculated correctly from protocol issues | FaultIndex reflects actual protocol issues, calculation accurate |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Validate by any address | Any address validates protocol health | Transaction succeeds, validation is public |
| Query functions by any address | Any address queries protocol health, faultIndex | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| RiskEngine integration | RiskEngine queries ProtocolRiskDomain for protocol health | Health status returned correctly, used in trade validation |
| Oracle router integration | ProtocolRiskDomain queries PriceOracleRouter for prices | Oracle prices read correctly, deviation calculated accurately |
| ChainState integration | ProtocolRiskDomain checks protocol state from ChainState | Protocol state read correctly, health reflects state |
| Liquidity monitoring integration | ProtocolRiskDomain checks protocol liquidity | Liquidity assessed correctly, health reflects liquidity status |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Protocol validation gas | Validate protocol health with all checks | Gas usage reasonable for validation operation |
| Oracle deviation check gas | Check oracle price deviations | Gas usage reasonable for oracle checks |
| Query operations gas | Multiple queries for protocol health, faultIndex | View functions consume no gas (read-only) |

---

**Next**: [FundRiskDomain](/docs/protocol/contracts/risk/FundRiskDomain)

