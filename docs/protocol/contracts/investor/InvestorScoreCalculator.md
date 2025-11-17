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

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Calculate ICS score | InvestorScoreCalculator calculates Investor Credibility Score | ICS calculated using formula with all components (stake, investment, participation, violations), score returned (0-100) |
| Calculate ICS with high metrics | Investor with high TOSS stake, large investments, active voting, no violations | ICS calculated correctly, high score (e.g., 70-100) |
| Calculate ICS with medium metrics | Investor with moderate stake, medium investments, some voting, few violations | ICS calculated correctly, medium score (e.g., 40-70) |
| Calculate ICS with low metrics | Investor with low stake, small investments, no voting, some violations | ICS calculated correctly, low score (e.g., 0-40) |
| Update investor score | Score calculated and updated in InvestorRegistry | Score updated correctly, InvestorScoreUpdated event emitted |
| Query investor score | Query current ICS score for investor | Returns current ICS score (0-100) |
| Calculate all score components | Calculate individual components contributing to ICS | All components calculated correctly, contribution tracked |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Calculate ICS with zero stake | Investor has no TOSS staked | ICS calculated with zero stake component, score reflects other factors |
| Calculate ICS with maximum stake | Investor has very large TOSS stake | ICS calculated correctly, stake component at maximum contribution |
| Calculate ICS with zero investment | Investor has never invested | ICS calculated with zero investment component, score reflects stake and participation |
| Calculate ICS with maximum investment | Investor has invested maximum amount | ICS calculated correctly, investment component at maximum |
| Calculate ICS with zero violations | Investor has perfect compliance record | ICS includes violation bonus, maximum score possible |
| Calculate ICS with many violations | Investor has multiple violations | ICS penalized by violations, score reduced appropriately |
| Calculate ICS with perfect participation | Investor participates in all governance votes | ICS includes participation bonus, score maximized |
| Calculate ICS with no participation | Investor never votes on proposals | ICS calculated with zero participation component, no bonus |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Calculate ICS for non-registered investor | Attempt to calculate score for address not registered | Transaction reverts with "Investor not registered" error |
| Calculate ICS with invalid parameters | Attempt to calculate with invalid investor address | Transaction reverts with validation error |
| Update score from non-authorized | Non-authorized address attempts to update score | Transaction reverts with "Not authorized" error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent score manipulation | Attempt to manipulate ICS calculation | Score calculation deterministic, based on on-chain data, cannot manipulate |
| Score component integrity | Verify score components cannot be manipulated | Components read from source contracts (staking, vaults, governance), cannot manipulate |
| Score formula integrity | Verify score formula cannot be modified | Formula immutable, weights fixed, calculation accurate |
| Stake component accuracy | Verify TOSS stake contribution calculated correctly | Stake read from staking contract, contribution accurate |
| Investment component accuracy | Verify investment contribution calculated correctly | Investments read from vaults, contribution accurate |
| Participation component accuracy | Verify governance participation contribution calculated correctly | Participation read from governance contracts, contribution accurate |
| Violation component accuracy | Verify violations penalize score correctly | Violations read from penalty engine, penalty applied correctly |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Calculate score by any address | Any address calculates ICS for investor | Transaction succeeds, calculation is public |
| Update score by authorized contract | Authorized contract updates score in registry | Transaction succeeds |
| Update score by non-authorized | Non-authorized attempts to update score | Transaction reverts with "Not authorized" |
| Query functions by any address | Any address queries ICS scores | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Staking integration | ICS calculated using TOSS staked amount | Stake read correctly, contribution calculated accurately |
| Vault investment integration | ICS calculated using total investments across funds | Investments aggregated correctly, contribution calculated accurately |
| Governance participation integration | ICS calculated using voting participation rate | Participation tracked correctly, contribution calculated accurately |
| Penalty engine integration | ICS calculated using violation history | Violations read correctly, penalty applied accurately |
| InvestorRegistry integration | Score calculated and updated in registry | Score update succeeds, registry reflects new score |
| Class upgrade integration | Score used for class upgrade eligibility | Class upgrade checked correctly, requirements validated |
| Score recalculation | Score recalculated periodically or on-demand | Score updated correctly, reflects current investor metrics |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| ICS calculation gas | Calculate ICS score for investor | Gas usage reasonable for calculation operation |
| Score update gas | Update score in InvestorRegistry | Gas usage reasonable for update operation |
| Query operations gas | Multiple queries for ICS scores | View functions consume no gas (read-only) |
| Batch calculation gas | Calculate scores for multiple investors | Batch calculation efficient, gas usage reasonable |

---

**Next**: [InvestorStateMachine](/docs/protocol/contracts/investor/InvestorStateMachine)

