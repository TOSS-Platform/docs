# InvestorStateMachine.sol

## Overview

Manages investor lifecycle states based on behavior, violations, and risk metrics. Enables automatic restrictions for problematic investors.

## Purpose

- Manage investor state transitions
- Apply restrictions based on state
- Protect protocol from bad actors
- Enable recovery for good behavior

## States

```
ACTIVE → Normal operations
LIMITED → Reduced limits, warnings issued
HIGH_RISK → Enhanced monitoring, restricted access
FROZEN → Investigation required, no operations
BANNED → Permanent exclusion
```

## Functions

### `transition`

```solidity
function transition(
    address investor,
    InvestorState newState,
    string calldata reason
) external onlyInvestorRiskDomain
```

**Purpose**: Transition investor to new state

**Parameters**:
- `investor`: Address to transition
- `newState`: Target state
- `reason`: Reason for transition

**Access Control**: Only InvestorRiskDomain

## Test Scenarios

```typescript
it("should transition investor state based on behavior", async () => {
  // Bad behavior detected
  await investorRiskDomain.detectViolation(investor.address);
  
  const state = await stateMachine.getState(investor.address);
  expect(state).to.equal(InvestorState.LIMITED);
});
```

---

**Next**: [InvestorPenaltyEngine](/docs/protocol/contracts/investor/InvestorPenaltyEngine)

