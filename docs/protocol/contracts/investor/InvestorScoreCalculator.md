# InvestorScoreCalculator.sol

## Overview

Calculates the Investor Composite Score (ICS) - a metric combining economic power, behavior stability, governance participation, and risk metrics.

## Purpose

- Calculate ICS score (0-100)
- Weight multiple factors
- Enable class upgrades
- Provide investor rankings

## ICS Formula

```
ICS = 0.35×P + 0.30×S + 0.20×G + 0.15×R

Where:
P = Economic Power (capital invested + TOSS staked)
S = Behavior Stability (consistency, no panic selling)
G = Governance Participation (voting, proposals)
R = Risk Metrics (diversification, holding period)
```

## Functions

### `calculateICS`

```solidity
function calculateICS(
    address investor
) external view returns (uint256 score)
```

**Purpose**: Calculate current ICS

**Returns**: Score 0-100

**Components**:
```solidity
uint256 economicPower = _calculateEconomicPower(investor);      // 0-100
uint256 behaviorScore = _calculateBehaviorScore(investor);       // 0-100
uint256 governanceScore = _calculateGovernanceScore(investor);   // 0-100
uint256 riskScore = _calculateRiskScore(investor);               // 0-100

score = (economicPower * 35 + behaviorScore * 30 + governanceScore * 20 + riskScore * 15) / 100;
```

## Test Scenarios

```typescript
it("should calculate ICS correctly", async () => {
  // Setup investor with known metrics
  const investor = {
    tossStaked: 10000,
    totalInvested: 100000,
    votingParticipation: 80,
    noViolations: true,
  };
  
  const ics = await scoreCalc.calculateICS(investor.address);
  expect(ics).to.be.within(70, 85);  // Expected range
});
```

---

**Next**: [InvestorStateMachine](/docs/protocol/contracts/investor/InvestorStateMachine)

