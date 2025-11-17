# InvestorPenaltyEngine.sol

## Overview

Applies penalties to investors for violations, including withdrawal delays, fee increases, and temporary restrictions.

## Purpose

- Apply investor penalties
- Track penalty history
- Enforce compliance
- Gradual escalation

## Functions

### `applyPenalty`

```solidity
function applyPenalty(
    address investor,
    PenaltyType pType,
    uint256 severity
) external onlyInvestorRiskDomain
```

**Penalty Types**:
- Withdrawal delay extension
- Fee multiplier increase  
- Reduced investment limits
- Temporary freeze

---

**Next**: [InvestorRewardEngine](/docs/protocol/contracts/investor/InvestorRewardEngine)

