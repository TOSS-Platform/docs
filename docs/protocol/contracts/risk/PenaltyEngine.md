# PenaltyEngine.sol

## Overview

Applies non-slashing penalties for minor violations, operational failures, and behavioral issues. Softer enforcement mechanism than slashing.

## Purpose

- Apply temporary trading restrictions
- Implement reputation penalties  
- Enforce compliance timeouts
- Issue warnings before slashing
- Track penalty history

## Functions

### `applyPenalty`

```solidity
function applyPenalty(
    address target,
    PenaltyType penaltyType,
    uint256 duration
) external onlyRiskEngine
```

**Purpose**: Apply penalty to FM or Investor

**Parameters**:
- `target`: FM or Investor address
- `penaltyType`: Type of penalty (TEMP_FREEZE, RATE_LIMIT, FEE_INCREASE)
- `duration`: How long penalty lasts

**Penalty Types**:
- `TEMP_FREEZE`: Cannot trade for duration
- `RATE_LIMIT`: Reduced trade frequency
- `FEE_INCREASE`: Higher fees for period
- `REPUTATION_REDUCTION`: Lower reputation score

## Test Scenarios

```typescript
it("should apply temporary freeze", async () => {
  await penaltyEngine.applyPenalty(fm.address, PenaltyType.TEMP_FREEZE, 86400);  // 24h
  
  await expect(
    vault.connect(fm).executeTrade(...)
  ).to.be.revertedWith("FM temporarily frozen");
});
```

---

**Next**: [IntentDetection](/docs/protocol/contracts/risk/IntentDetection)

