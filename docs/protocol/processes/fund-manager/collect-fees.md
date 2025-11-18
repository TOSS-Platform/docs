# Fee Collection Process

## Overview

FM collects management and performance fees according to fund configuration.

## Fee Types

### Management Fee

**Accrual**: Continuous (time-based)
**Collection**: Anytime, typically monthly/quarterly
**Formula**: `NAV × annualFeeRate × timePeriod / 365 days`

**Process**:
```solidity
uint256 fee = vault.collectManagementFee();
// Mints shares to FM (dilutes investors) or takes USDC
```

### Performance Fee

**Accrual**: Only above High Water Mark
**Collection**: On investor withdrawal or scheduled
**Formula**: `(Current NAV - HWM) × performanceFeeRate`

**Conditions**:
- Only if NAV > HWM
- HWM resets to new NAV after collection

**Process**:
```solidity
if (currentNAV > highWaterMark) {
    uint256 profit = currentNAV - highWaterMark;
    uint256 fee = profit * performanceFee / 10000;
    vault.collectPerformanceFee();
    highWaterMark = currentNAV;
}
```

## Gas Cost

Management fee collection: ~30,000 gas (~$0.015)
Performance fee: ~50,000 gas (~$0.025)

---

**Related**: [Fund Configuration](/protocol/contracts/fund/FundConfig)

