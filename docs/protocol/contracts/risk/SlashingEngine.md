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

```typescript
describe("SlashingEngine", () => {
  it("should calculate correct slash ratio", async () => {
    expect(await slashing.getSlashRatio(10)).to.equal(0);   // Warning only
    expect(await slashing.getSlashRatio(45)).to.equal(5);   // 5%
    expect(await slashing.getSlashRatio(70)).to.equal(26);  // 26%
    expect(await slashing.getSlashRatio(90)).to.equal(83);  // 83%
  });
  
  it("should slash and split correctly", async () => {
    const stake = ethers.utils.parseEther("10000");
    const fi = 50;  // Should slash ~7%
    
    await slashing.connect(riskEngine).executeSlashing(fundId, fi);
    
    const slashedAmount = stake.mul(7).div(100);  // 700 TOSS
    const burned = slashedAmount.mul(20).div(100);  // 140 TOSS burned
    const toNAV = slashedAmount.sub(burned);  // 560 TOSS to NAV
    
    // Verify burn
    expect(await toss.totalSupply()).to.equal(initialSupply.sub(burned));
    
    // Verify NAV compensation
    expect(await toss.balanceOf(treasury.address)).to.equal(toNAV);
  });
  
  it("should ban FM for critical violations", async () => {
    await slashing.connect(riskEngine).executeSlashing(fundId, 90);  // FI 90
    
    const fm = await fundRegistry.getFundManager(fundId);
    expect(await slashing.bannedFMs(fm)).to.be.true;
  });
});
```

---

**Next**: [PenaltyEngine](/docs/protocol/contracts/risk/PenaltyEngine)

