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

## Dependencies

The contract requires the following dependencies:

- `IInvestorRegistry`: Investor profile, totalInvested, fundsInvested
- `IStaking`: TOSS staked amount
- `IPenaltyEngine`: Violation history
- `IInvestorRiskDomain`: Behavior metrics (panic withdrawals, rapid cycles)
- `IFundRegistry`: Fund list and metadata
- `IFundManagerVault`: Holding period queries
- `IProtocolGovernance`: Protocol-level voting participation

## State Variables

All dependencies are immutable:

- `investorRegistry`: IInvestorRegistry
- `staking`: IStaking
- `penaltyEngine`: IPenaltyEngine
- `investorRiskDomain`: IInvestorRiskDomain
- `fundRegistry`: IFundRegistry
- `protocolGovernance`: IProtocolGovernance

## Constants

### Economic Power Thresholds

- `INVESTMENT_THRESHOLD_1`: $100,000 (6 decimals) = 25 points
- `INVESTMENT_THRESHOLD_2`: $500,000 (6 decimals) = 50 points
- `INVESTMENT_MAX`: $1,000,000+ (6 decimals) = 50 points (max)

- `STAKE_THRESHOLD_1`: 10,000 TOSS (18 decimals) = 25 points
- `STAKE_THRESHOLD_2`: 50,000 TOSS (18 decimals) = 50 points
- `STAKE_MAX`: 100,000+ TOSS (18 decimals) = 50 points (max)

### Behavior Score Penalties

- `PANIC_WITHDRAWAL_PENALTY`: 10 points per panic withdrawal
- `RAPID_CYCLE_PENALTY`: 5 points per rapid cycle
- `VIOLATION_PENALTY`: 15 points per violation

### Governance Score

- `STAKE_BONUS`: 30 points base bonus for staking
- `VOTE_BONUS`: 10 points per vote (max 70 points from voting)

### Risk Score Thresholds

- `HOLDING_PERIOD_30_DAYS`: 30 days = 15 points
- `HOLDING_PERIOD_90_DAYS`: 90 days = 30 points
- `HOLDING_PERIOD_180_DAYS`: 180+ days = 50 points

## Events

### `ICSCalculated`

```solidity
event ICSCalculated(
    address indexed investor,
    uint256 score,
    uint256 economicPower,
    uint256 behaviorScore,
    uint256 governanceScore,
    uint256 riskScore
);
```

Emitted when ICS is calculated and updated.

### `ScoreUpdated`

```solidity
event ScoreUpdated(address indexed investor, uint256 oldScore, uint256 newScore);
```

Emitted when investor score is updated in the registry.

## Custom Errors

### `InvestorNotRegistered()`

Reverted when attempting to calculate score for a non-registered investor.

### `InvalidAddress()`

Reverted when constructor receives a zero address for any dependency.

## Functions

### Constructor

```solidity
constructor(
    address _investorRegistry,
    address _staking,
    address _penaltyEngine,
    address _investorRiskDomain,
    address _fundRegistry,
    address _protocolGovernance
)
```

**Purpose**: Initialize InvestorScoreCalculator with all required dependencies

**Parameters**:

- `_investorRegistry`: InvestorRegistry contract address
- `_staking`: Staking contract address
- `_penaltyEngine`: PenaltyEngine contract address
- `_investorRiskDomain`: InvestorRiskDomain contract address
- `_fundRegistry`: FundRegistry contract address
- `_protocolGovernance`: ProtocolGovernance contract address

**Reverts**: If any address is `address(0)`

### `calculateICS`

```solidity
function calculateICS(
    address investor
) external view returns (uint256 score)
```

**Purpose**: Calculate current ICS score for an investor

**Parameters**:

- `investor`: Investor address

**Returns**: Score 0-100

**Reverts**: If investor is not registered

**Components**:

```solidity
uint256 economicPower = _calculateEconomicPower(investor);      // 0-100
uint256 behaviorScore = _calculateBehaviorScore(investor);       // 0-100
uint256 governanceScore = _calculateGovernanceScore(investor);   // 0-100
uint256 riskScore = _calculateRiskScore(investor);               // 0-100

score = (economicPower * 35 + behaviorScore * 30 + governanceScore * 20 + riskScore * 15) / 100;
```

### `updateInvestorScore`

```solidity
function updateInvestorScore(
    address investor
) external returns (uint256 newScore)
```

**Purpose**: Calculate and update investor score in InvestorRegistry

**Parameters**:

- `investor`: Investor address

**Returns**: Updated ICS score (0-100)

**Reverts**: If investor is not registered

**Events Emitted**:

- `ICSCalculated`: With all component scores
- `ScoreUpdated`: With old and new scores

**Note**: This contract must be set as `scoreCalculator` in InvestorRegistry to call `updateICS`.

## Component Calculations

### Economic Power (P) - 35% Weight

Calculates economic power based on investment and stake:

**Investment Component (0-50 points)**:

- $0 = 0 points
- $0 - $100k = Linear interpolation (0-25 points)
- $100k - $500k = Linear interpolation (25-50 points)
- $500k+ = 50 points (max)

**Stake Component (0-50 points)**:

- 0 TOSS = 0 points
- 0 - 10k TOSS = Linear interpolation (0-25 points)
- 10k - 50k TOSS = Linear interpolation (25-50 points)
- 50k+ TOSS = 50 points (max)

**Total**: Investment + Stake (max 100 points)

### Behavior Stability (S) - 30% Weight

Calculates behavior score based on penalties:

**Base Score**: 100 points

**Penalties**:

- Panic withdrawals: -10 points each
- Rapid cycles: -5 points each
- Violations: -15 points each (from PenaltyEngine)

**Final Score**: `max(0, 100 - totalPenalties)`

**Data Sources**:

- `InvestorRiskDomain.getInvestorBehavior()`: Panic withdrawals and rapid cycles per fund
- `PenaltyEngine.getPenaltyHistory()`: Violation count

### Governance Participation (G) - 20% Weight

Calculates governance participation score:

**Stake Bonus**: +30 points if investor has any TOSS staked

**Vote Bonus**: +10 points per protocol-level vote (max 70 points)

- 0 votes = 0 points
- 1-7 votes = voteCount × 10 points
- 7+ votes = 70 points (max)

**Total**: Stake bonus + Vote bonus (max 100 points)

**Data Sources**:

- `Staking.getStakedAmount()`: Stake amount
- `ProtocolGovernance.getInvestorVoteCount()`: Vote count

### Risk Metrics (R) - 15% Weight

Calculates risk score based on diversification and holding period:

**Diversification Component (0-50 points)**:

- 0 funds = 0 points
- 1 fund = 10 points
- 2-3 funds = 30 points
- 4+ funds = 50 points

**Holding Period Component (0-50 points)**:

- < 30 days = 0 points
- 30-90 days = 15 points
- 90-180 days = 30 points
- 180+ days = 50 points

**Total**: Diversification + Holding Period (max 100 points)

**Data Sources**:

- `InvestorRegistry.getInvestorProfile().fundsInvested`: Number of funds invested
- `FundManagerVault.holdsSharesFor()`: Holding period per fund

## Helper Functions

### `_getInvestorFunds`

```solidity
function _getInvestorFunds(address investor) internal view returns (uint256[] memory fundIds)
```

**Purpose**: Get list of active funds where investor has shares

**Returns**: Array of fund IDs

**Logic**:

1. Get all active funds from FundRegistry
2. For each fund, check if investor has shares > 0
3. Return array of fund IDs where investor has shares

### `_calculateAverageHoldingPeriod`

```solidity
function _calculateAverageHoldingPeriod(
    address investor,
    uint256[] memory fundIds
) internal view returns (uint256 averageHoldingPeriod)
```

**Purpose**: Calculate average holding period across all funds

**Parameters**:

- `investor`: Investor address
- `fundIds`: Array of fund IDs

**Returns**: Average holding period in seconds

**Logic**:

1. Sum holding periods from all funds where investor has shares
2. Divide by number of valid funds
3. Return average

## Access Control

- `calculateICS`: Public (anyone can call, view function)
- `updateInvestorScore`: Public (anyone can call, but must be set as `scoreCalculator` in InvestorRegistry to update)

## Integration

### InvestorRegistry Integration

The contract must be set as `scoreCalculator` in InvestorRegistry to call `updateICS`:

```solidity
investorRegistry.setScoreCalculator(scoreCalculatorAddress);
```

### Dependency Contracts

All dependencies are immutable and set at deployment:

- Cannot be changed after deployment
- All addresses validated in constructor (non-zero)

## Test Scenarios

### Happy Path Tests

| Test Name                         | Scenario                                                                       | Expected Result                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Calculate ICS score               | InvestorScoreCalculator calculates Investor Credibility Score                  | ICS calculated using formula with all components (stake, investment, participation, violations), score returned (0-100) |
| Calculate ICS with high metrics   | Investor with high TOSS stake, large investments, active voting, no violations | ICS calculated correctly, high score (e.g., 70-100)                                                                     |
| Calculate ICS with medium metrics | Investor with moderate stake, medium investments, some voting, few violations  | ICS calculated correctly, medium score (e.g., 40-70)                                                                    |
| Calculate ICS with low metrics    | Investor with low stake, small investments, no voting, some violations         | ICS calculated correctly, low score (e.g., 0-40)                                                                        |
| Update investor score             | Score calculated and updated in InvestorRegistry                               | Score updated correctly, ICSCalculated and ScoreUpdated events emitted                                                  |
| Query investor score              | Query current ICS score for investor                                           | Returns current ICS score (0-100)                                                                                       |
| Calculate all score components    | Calculate individual components contributing to ICS                            | All components calculated correctly, contribution tracked                                                               |

### Edge Cases

| Test Name                                  | Scenario                                      | Expected Result                                                                       |
| ------------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| Calculate ICS with zero stake              | Investor has no TOSS staked                   | ICS calculated with zero stake component, score reflects other factors                |
| Calculate ICS with maximum stake           | Investor has very large TOSS stake            | ICS calculated correctly, stake component at maximum contribution (50 points)         |
| Calculate ICS with zero investment         | Investor has never invested                   | ICS calculated with zero investment component, score reflects stake and participation |
| Calculate ICS with maximum investment      | Investor has invested maximum amount          | ICS calculated correctly, investment component at maximum (50 points)                 |
| Calculate ICS with zero violations         | Investor has perfect compliance record        | ICS includes no penalties, behavior score at maximum (100 points)                     |
| Calculate ICS with many violations         | Investor has multiple violations              | ICS penalized by violations, score reduced appropriately                              |
| Calculate ICS with perfect participation   | Investor participates in all governance votes | ICS includes participation bonus, score maximized (100 points from governance)        |
| Calculate ICS with no participation        | Investor never votes on proposals             | ICS calculated with zero participation component, no bonus                            |
| Calculate ICS with maximum diversification | Investor invested in 4+ funds                 | Diversification component at maximum (50 points)                                      |
| Calculate ICS with long holding period     | Investor holds shares for 180+ days           | Holding period component at maximum (50 points)                                       |

### Failure Cases

| Test Name                                 | Scenario                                               | Expected Result                                                                |
| ----------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Calculate ICS for non-registered investor | Attempt to calculate score for address not registered  | Transaction reverts with `InvestorNotRegistered()` error                       |
| Calculate ICS with invalid parameters     | Attempt to calculate with invalid investor address     | Transaction reverts with validation error                                      |
| Update score from non-authorized          | Non-authorized address attempts to update score        | Transaction reverts if contract not set as scoreCalculator in InvestorRegistry |
| Constructor with zero address             | Attempt to deploy with zero address for any dependency | Transaction reverts with `InvalidAddress()` error                              |

### Security Tests

| Test Name                        | Scenario                                                          | Expected Result                                                                        |
| -------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Prevent score manipulation       | Attempt to manipulate ICS calculation                             | Score calculation deterministic, based on on-chain data, cannot manipulate             |
| Score component integrity        | Verify score components cannot be manipulated                     | Components read from source contracts (staking, vaults, governance), cannot manipulate |
| Score formula integrity          | Verify score formula cannot be modified                           | Formula immutable, weights fixed, calculation accurate                                 |
| Stake component accuracy         | Verify TOSS stake contribution calculated correctly               | Stake read from staking contract, contribution accurate                                |
| Investment component accuracy    | Verify investment contribution calculated correctly               | Investments read from InvestorRegistry, contribution accurate                          |
| Participation component accuracy | Verify governance participation contribution calculated correctly | Participation read from governance contracts, contribution accurate                    |
| Violation component accuracy     | Verify violations penalize score correctly                        | Violations read from penalty engine, penalty applied correctly                         |
| Immutable dependencies           | Verify dependencies cannot be changed                             | All dependencies immutable, cannot be modified after deployment                        |

### Access Control Tests

| Test Name                           | Scenario                                      | Expected Result                                            |
| ----------------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| Calculate score by any address      | Any address calculates ICS for investor       | Transaction succeeds, calculation is public                |
| Update score by authorized contract | Authorized contract updates score in registry | Transaction succeeds if contract is set as scoreCalculator |
| Update score by non-authorized      | Non-authorized attempts to update score       | Transaction reverts if contract not set as scoreCalculator |
| Query functions by any address      | Any address queries ICS scores                | Queries succeed, read-only functions are public            |

### Integration Tests

| Test Name                            | Scenario                                             | Expected Result                                                                 |
| ------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| Staking integration                  | ICS calculated using TOSS staked amount              | Stake read correctly, contribution calculated accurately                        |
| InvestorRegistry integration         | ICS calculated using totalInvested and fundsInvested | Investments read correctly, contribution calculated accurately                  |
| Governance participation integration | ICS calculated using voting participation rate       | Participation tracked correctly, contribution calculated accurately             |
| Penalty engine integration           | ICS calculated using violation history               | Violations read correctly, penalty applied accurately                           |
| InvestorRiskDomain integration       | ICS calculated using behavior metrics                | Panic withdrawals and rapid cycles read correctly, penalties applied accurately |
| FundRegistry integration             | ICS calculated using fund metadata                   | Fund data read correctly, diversification calculated accurately                 |
| FundManagerVault integration         | ICS calculated using holding periods                 | Holding periods read correctly, risk score calculated accurately                |
| Score update integration             | Score calculated and updated in registry             | Score update succeeds, registry reflects new score                              |
| Class upgrade integration            | Score used for class upgrade eligibility             | Class upgrade checked correctly, requirements validated                         |
| Score recalculation                  | Score recalculated periodically or on-demand         | Score updated correctly, reflects current investor metrics                      |

### Gas Optimization Tests

| Test Name             | Scenario                                | Expected Result                                   |
| --------------------- | --------------------------------------- | ------------------------------------------------- |
| ICS calculation gas   | Calculate ICS score for investor        | Gas usage reasonable for calculation operation    |
| Score update gas      | Update score in InvestorRegistry        | Gas usage reasonable for update operation         |
| Query operations gas  | Multiple queries for ICS scores         | View functions consume no gas (read-only)         |
| Batch calculation gas | Calculate scores for multiple investors | Batch calculation efficient, gas usage reasonable |

---

**Next**: [InvestorStateMachine](/protocol/contracts/investor/InvestorStateMachine)
