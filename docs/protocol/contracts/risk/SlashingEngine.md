# SlashingEngine.sol

## Overview

Calculates and executes slashing of FM stakes when violations occur. Splits slashed tokens between burning (deflation) and NAV compensation (investor protection).

## Purpose

- Calculate slashing amount based on FaultIndex
- Execute token burns and NAV compensation
- Track slashing history
- Maintain FM ban list
- Ensure economic accountability

## State Variables

```solidity
ITOSS public tossToken;
IFundFactory public fundFactory;
ITOSSTreasury public treasury;

// ===== Slashing Configuration =====
uint256 public navCompensationRatio = 80;  // 80% to NAV, 20% burned

// ===== Slashing History =====
struct SlashingEvent {
    uint256 fundId;
    address manager;
    uint256 faultIndex;
    uint256 slashedAmount;
    uint256 burnedAmount;
    uint256 compensatedAmount;
    uint256 timestamp;
}

mapping(address => SlashingEvent[]) public fmSlashingHistory;
mapping(uint256 => SlashingEvent[]) public fundSlashingHistory;

// ===== Ban List =====
mapping(address => bool) public bannedFMs;
mapping(address => uint256) public banTimestamp;
```

## Functions

### `executeSlashing`

```solidity
function executeSlashing(
    uint256 fundId,
    uint256 faultIndex
) external onlyRiskEngine returns (uint256 slashedAmount)
```

**Purpose**: Execute slashing based on FaultIndex

**Parameters**:
- `fundId`: Fund that violated rules
- `faultIndex`: Severity score (0-100)

**Returns**: Total amount slashed

**Behavior**:
1. **Get FM Stake**:
   ```solidity
   uint256 stake = fundFactory.getFMStake(fm, fundId).amount;
   ```

2. **Calculate Slash Amount**:
   ```solidity
   uint256 slashRatio = _getSlashRatio(faultIndex);
   uint256 slashAmount = (stake * slashRatio) / 100;
   
   // Cap at total stake
   if (slashAmount > stake) slashAmount = stake;
   ```

3. **Split**: 80% NAV compensation, 20% burn
   ```solidity
   uint256 toBurn = slashAmount * 20 / 100;
   uint256 toNAV = slashAmount - toBurn;
   ```

4. **Execute**:
   ```solidity
   tossToken.burn(fm, toBurn);
   tossToken.transfer(treasury, toNAV);  // Treasury converts to USDC for NAV
   ```

5. **Check Ban Threshold**:
   ```solidity
   if (faultIndex >= 85) {
       bannedFMs[fm] = true;
       banTimestamp[fm] = block.timestamp;
   }
   ```

**Events**: `Slashed(fundId, manager, faultIndex, slashedAmount, burnedAmount, compensatedAmount)`

### `getSlashRatio`

```solidity
function getSlashRatio(
    uint256 faultIndex
) public pure returns (uint256 ratio)
```

**Purpose**: Calculate slash percentage from FaultIndex

**Formula**:
```
FI 0-30:   ratio = 0% (warning only)
FI 30-60:  ratio = 1-10% (linear interpolation)
FI 60-85:  ratio = 10-50% (linear)
FI 85-100: ratio = 50-100% (linear)
```

**Implementation**:
```solidity
if (fi < 30) return 0;
if (fi < 60) return ((fi - 30) * 10) / 30;           // 1-10%
if (fi < 85) return 10 + ((fi - 60) * 40) / 25;      // 10-50%
return 50 + ((fi - 85) * 50) / 15;                    // 50-100%
```

### `calculateSlashing`

```solidity
function calculateSlashing(
    uint256 stake,
    uint256 faultIndex,
    uint256 fundLoss
) public view returns (uint256 slashAmount)
```

**Purpose**: Calculate slash amount (without executing)

**Parameters**:
- `stake`: FM's current stake
- `faultIndex`: Violation severity
- `fundLoss`: Fund's actual loss (for capping)

**Returns**: Calculated slash amount

**Formula**:
```
baseSlash = stake × getSlashRatio(faultIndex)
lossCap = fundLoss × navCompensationRatio / tossPrice

slashAmount = min(baseSlash, lossCap, stake)
```

## DAO-Configurable Parameters

| Parameter | Initial | Governance | Range |
|-----------|---------|------------|-------|
| `navCompensationRatio` | 80% | Protocol | 50-90% |
| `minSlashingFI` | 30 | Protocol | 20-50 |
| `banThreshold` | 85 | Protocol | 75-95 |

## Security Considerations

**1. Over-Slashing**
- **Risk**: Slash more than appropriate
- **Mitigation**: Capped at stake, formula-based, audited math
- **Severity**: High → Mitigated

**2. Slashing Bypass**
- **Risk**: FM avoids slashing
- **Mitigation**: Only RiskEngine can trigger, automatic
- **Severity**: CRITICAL → Mitigated

## Test Scenarios

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Calculate slash ratio for low FI | Calculate slash ratio for FI below slashing threshold | Returns 0, warning only, no slashing |
| Calculate slash ratio for medium FI | Calculate slash ratio for FI in slashing range (30-85) | Returns percentage based on FI (e.g., FI=50 → ~7% slash) |
| Calculate slash ratio for high FI | Calculate slash ratio for FI near ban threshold | Returns high percentage (e.g., FI=90 → ~83% slash) |
| Execute slashing with split | RiskEngine triggers slashing, stake split between burn and NAV compensation | Stake slashed, portion burned, portion sent to NAV compensation, slash amounts calculated using gamma |
| Burn slashed tokens | Slashed portion burned from FM stake | TOSS burned, total supply decreases, Transfer event to zero address emitted |
| Compensate NAV | Slashed portion sent to NAV compensation | TOSS transferred to treasury or fund vault, NAV compensation updated |
| Ban FM for critical violation | FM with FI above ban threshold (e.g., FI=90) gets slashed | FM banned permanently, bannedFMs mapping updated, FM banned event emitted |
| Read gamma from config | SlashingEngine reads gamma from DAOConfigCore | Gamma value read correctly, used for burn/compensation split |
| Read minSlashingFI from config | SlashingEngine reads minimum FI threshold | Minimum FI threshold read correctly, used for slashing trigger |
| Query slash ratio | Query slash ratio for specific FaultIndex | Returns correct slash percentage based on FI |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Slash ratio at minimum FI | Calculate slash ratio for FI exactly at minimum slashing threshold (e.g., 30) | Returns minimum slash percentage (e.g., 2-5%) |
| Slash ratio at ban threshold | Calculate slash ratio for FI exactly at ban threshold (e.g., 85) | Returns very high slash percentage (e.g., 80%+) |
| Slash ratio below threshold | Calculate slash ratio for FI below minimum (e.g., 10) | Returns 0, no slashing |
| Slash zero stake | Attempt to slash FM with zero stake | Transaction succeeds but no effect, no burn or compensation |
| Slash entire stake | Slash amount equals full stake (FI very high) | Entire stake burned and compensated, FM stake becomes zero |
| Split at gamma boundary | Slash split exactly at gamma ratio (e.g., 80% compensation, 20% burn) | Split calculated correctly, burn and compensation amounts accurate |
| Multiple slashing events | FM receives multiple slashing events over time | Each slashing tracked independently, stake reduced cumulatively |
| Slash after previous slash | FM receives second slashing after first | Second slash calculated on remaining stake, total reduction tracked |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Execute slashing from non-RiskEngine | Non-RiskEngine address attempts to execute slashing | Transaction reverts with "Only RiskEngine" error |
| Execute slashing for non-existent fund | Attempt to slash stake for fund that doesn't exist | Transaction reverts with "Fund not found" error |
| Execute slashing with invalid FI | Attempt to execute slashing with FI below minimum threshold | Transaction reverts with "FI below threshold" error or handled gracefully |
| Execute slashing when FM already banned | Attempt to slash already banned FM | Transaction may succeed (additional slash) or revert depending on implementation |
| Execute slashing with zero stake | Attempt to slash FM with no stake remaining | Transaction succeeds but no effect, or reverts with "No stake to slash" |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent unauthorized slashing | Attacker attempts to execute slashing directly | Transaction reverts, only RiskEngine can trigger slashing |
| Prevent slash manipulation | Attempt to manipulate slash ratio calculation | Formula deterministic, FI from RiskEngine, cannot manipulate |
| Prevent burn bypass | Attempt to bypass token burn during slashing | Burn enforced, portion always burned based on gamma |
| Prevent compensation manipulation | Attempt to manipulate NAV compensation amount | Compensation calculated deterministically, cannot manipulate |
| Ban enforcement | Verify FM banned correctly for critical violations | Ban threshold enforced, FM banned when FI exceeds threshold |
| Stake reduction accuracy | Verify stake reduced correctly after slashing | Stake reduced by exact slash amount, accounting accurate |
| Gamma integrity | Verify gamma used correctly for split calculation | Gamma read from DAOConfigCore, split calculated correctly |
| Slash amount limits | Verify slash amount cannot exceed stake | Slash amount capped at stake amount, no underflow issues |
| Multiple fund isolation | Verify slashing isolated per fund | Each fund's stake slashed independently, no cross-fund effects |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Execute slashing by RiskEngine | RiskEngine executes slashing | Transaction succeeds |
| Execute slashing by non-RiskEngine | Non-RiskEngine attempts to execute slashing | Transaction reverts with "Only RiskEngine" |
| Query functions by any address | Any address queries slash ratio, banned FMs | Queries succeed, read-only functions are public |
| Query banned FM status | Query if FM is banned | Returns true if banned, false otherwise |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| RiskEngine triggers slashing | RiskEngine detects high FI, triggers slashing | Slashing executed correctly, stake reduced, burn and compensation handled |
| TOSS token burn integration | SlashingEngine burns TOSS from FM stake | TOSS burned correctly, total supply decreases, burn event emitted |
| Treasury NAV compensation | Slashed portion sent to treasury for NAV compensation | TOSS transferred to treasury, compensation tracked |
| FundFactory stake reduction | SlashingEngine reduces stake in FundFactory | Stake reduced in FundFactory, FM stake updated correctly |
| DAOConfigCore parameter reading | SlashingEngine reads gamma and thresholds from DAOConfigCore | Parameters read correctly, slashing calculations use current values |
| Multiple slashing events | FM receives multiple slashing events, stake reduced cumulatively | Each slashing tracked independently, total reduction accurate |
| Ban integration with FundFactory | FM banned, cannot create new funds | FundFactory checks ban status, banned FMs rejected |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Slash execution gas | RiskEngine executes slashing | Gas usage reasonable for slashing operation |
| Slash ratio calculation gas | Calculate slash ratio for FI | Gas usage reasonable for calculation |
| Burn operation gas | TOSS burned during slashing | Gas usage reasonable for burn operation |
| Query operations gas | Multiple queries for slash ratio, banned status | View functions consume no gas (read-only) |

---

**Next**: [PenaltyEngine](/docs/protocol/contracts/risk/PenaltyEngine)

