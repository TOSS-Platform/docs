# Smart Contracts Overview

A complete specification of all smart contracts that compose the TOSS Protocol. This section provides detailed documentation of contract responsibilities, interfaces, state variables, and inter-contract interactions.

## Contract Architecture

TOSS smart contracts are organized into six independent domains, each responsible for a specific aspect of the protocol:

1. **Core Contracts** — Token, treasury, global state
2. **Fund Layer** — Fund creation, vaults, configuration, execution
3. **Risk Layer** — RiskEngine, domains, slashing logic
4. **Investor Layer** — Investor identity, state machine, scoring
5. **Governance Layer** — Multi-domain DAO
6. **Utilities** — Oracles, analytics, gas vault, AML guards

## Design Principles

### Modularity

Each contract domain operates independently with well-defined interfaces:

```solidity
// Contracts communicate through interfaces
interface IRiskEngine {
    function validateTrade(
        uint256 fundId,
        TradeParams calldata params
    ) external returns (bool);
}

// Implementation details hidden
contract FundTradeExecutor {
    IRiskEngine public riskEngine;
    
    function executeTrade(uint256 fundId, TradeParams calldata params) external {
        require(riskEngine.validateTrade(fundId, params), "Risk check failed");
        // ... execute trade
    }
}
```

### Upgradeability

Critical contracts use the proxy pattern for upgradeability:

```solidity
// TransparentUpgradeableProxy pattern
Proxy (Storage) → Implementation (Logic)

// Upgrades controlled by DAO with timelock
DAOGovernance → Timelock (48h) → ProxyAdmin → Upgrade
```

### Access Control

Role-based access control protects sensitive functions:

```solidity
// OpenZeppelin AccessControl
bytes32 public constant FUND_MANAGER_ROLE = keccak256("FUND_MANAGER_ROLE");
bytes32 public constant RISK_VALIDATOR_ROLE = keccak256("RISK_VALIDATOR_ROLE");
bytes32 public constant DAO_ROLE = keccak256("DAO_ROLE");

modifier onlyRole(bytes32 role) {
    require(hasRole(role, msg.sender), "Unauthorized");
    _;
}
```

### Security

All contracts follow security best practices:

- **Checks-Effects-Interactions**: State changes before external calls
- **Reentrancy Guards**: Protection against reentrancy attacks
- **SafeMath**: Overflow protection (Solidity 0.8+)
- **Pull Payments**: Users withdraw rather than push
- **Circuit Breakers**: Emergency pause functionality

## Core Contracts

Essential infrastructure contracts powering the TOSS Protocol:

- **[TOSS.sol](/protocol/contracts/core/TOSS)**: ERC20 governance token with snapshot voting, permit, and controlled burn
- **[TOSSTreasury.sol](/protocol/contracts/core/TOSSTreasury)**: Protocol treasury collecting fees and funding operations
- **[RewardDistributor.sol](/protocol/contracts/core/RewardDistributor)**: Distributes staking and governance rewards
- **[BridgeGateway.sol](/protocol/contracts/core/BridgeGateway)**: L1/L2 bridge coordination for deposits and withdrawals
- **[TOSSChainState.sol](/protocol/contracts/core/TOSSChainState)**: Global protocol state and parameters

[→ View Core Contracts Details](/protocol/contracts/core/TOSS)

## Fund Layer Contracts

Fund creation, management, and trade execution contracts:

- **[FundFactory.sol](/protocol/contracts/fund/FundFactory)**: Deploys funds via minimal proxy, validates FM eligibility, locks stakes
- **[FundRegistry.sol](/protocol/contracts/fund/FundRegistry)**: Central index of all funds with filtering and metadata
- **[FundManagerVault.sol](/protocol/contracts/fund/FundManagerVault)**: Secure multi-asset custody with share accounting
- **[FundConfig.sol](/protocol/contracts/fund/FundConfig)**: Stores risk limits, fees, and operational parameters
- **[FundTradeExecutor.sol](/protocol/contracts/fund/FundTradeExecutor)**: Only contract authorized to execute trades

[→ View Fund Layer Details](/protocol/contracts/fund/FundFactory)

## Risk Layer Contracts

Risk validation, monitoring, and slashing enforcement:

- **[RiskEngine.sol](/protocol/contracts/risk/RiskEngine)**: Central validator coordinating all risk domains
- **[ProtocolRiskDomain.sol](/protocol/contracts/risk/ProtocolRiskDomain)**: Protocol-wide risk monitoring (oracle, sequencer)
- **[FundRiskDomain.sol](/protocol/contracts/risk/FundRiskDomain)**: Fund-specific limits (PSL, PCL, AEL, volatility, drawdown)
- **[InvestorRiskDomain.sol](/protocol/contracts/risk/InvestorRiskDomain)**: Investor behavior monitoring and anomaly detection
- **[SlashingEngine.sol](/protocol/contracts/risk/SlashingEngine)**: Calculates and executes slashing with burn/compensation split
- **[PenaltyEngine.sol](/protocol/contracts/risk/PenaltyEngine)**: Non-slashing penalties (freezes, restrictions, warnings)
- **[IntentDetection.sol](/protocol/contracts/risk/IntentDetection)**: Detects malicious intent through pattern analysis
- **[RiskMathLib.sol](/protocol/contracts/risk/RiskMathLib)**: Mathematical library for risk calculations

[→ View Risk Layer Details](/protocol/contracts/risk/RiskEngine)

## Governance Layer Contracts

DAO governance implementation:

### DAOGovernance.sol

Main voting and proposal contract.

**Features:**
- Proposal creation
- Voting (for/against/abstain)
- Quorum checking
- Timelock execution
- Delegation support

### Governance Configuration Contracts

Level-specific governance implementations:

- **FundGovernance.sol**: Fund-level proposal and voting system
- **FMGovernance.sol**: FM-level governance for professional standards
- **ProtocolGovernance.sol**: Protocol-wide governance with admin-specified voter groups
- **VoterRegistry.sol**: Tracks voter eligibility across all levels

## Investor Layer Contracts

Investor identity, scoring, lifecycle, and reward management:

- **[InvestorRegistry.sol](/protocol/contracts/investor/InvestorRegistry)**: Central registry tracking investor identity, class, and ICS score
- **[InvestorScoreCalculator.sol](/protocol/contracts/investor/InvestorScoreCalculator)**: Calculates ICS (Investor Composite Score) from multiple factors
- **[InvestorStateMachine.sol](/protocol/contracts/investor/InvestorStateMachine)**: Manages state transitions (ACTIVE → LIMITED → HIGH_RISK → FROZEN → BANNED)
- **[InvestorPenaltyEngine.sol](/protocol/contracts/investor/InvestorPenaltyEngine)**: Applies penalties for investor violations
- **[InvestorRewardEngine.sol](/protocol/contracts/investor/InvestorRewardEngine)**: Rewards good investor behavior and governance participation

[→ View Investor Layer Details](/protocol/contracts/investor/InvestorRegistry)

## Utility Contracts

Supporting infrastructure for oracles, analytics, compliance, and gas management:

- **[PriceOracleRouter.sol](/protocol/contracts/utilities/PriceOracleRouter)**: Multi-source price aggregation with deviation detection and circuit breakers
- **[AnalyticsHub.sol](/protocol/contracts/utilities/AnalyticsHub)**: On-chain historical data storage for NAV, trades, and events
- **[AMLGuard.sol](/protocol/contracts/utilities/AMLGuard)**: Compliance screening against sanctions lists and risk scoring
- **[GasVault.sol](/protocol/contracts/utilities/GasVault)**: Manages Paymaster gas reserves for sponsored transactions

[→ View Utilities Details](/protocol/contracts/utilities/PriceOracleRouter)

## Contract Deployment

### Deployment Order

```
1. Core Contracts (TOSS, Treasury, BridgeGateway)
2. Utility Contracts (Oracles, AnalyticsHub, AMLGuard, GasVault)
3. Investor Layer (Registry, StateMachine, ScoreCalculator)
4. Risk Layer (RiskEngine, Domains, SlashingEngine)
5. Fund Layer (Registry, Factory, Implementations)
6. Governance Layer (DAO, Config contracts)
```

### Post-Deployment Configuration

1. Set up access controls
2. Configure cross-contract references
3. Initialize parameters
4. Transfer ownership to DAO
5. Verify all contracts on block explorer

## Contract Addresses

*Addresses will be populated after deployment*

### Testnet (zkSync Sepolia)

- TOSS Token: `[TBD]`
- FundFactory: `[TBD]`
- RiskEngine: `[TBD]`
- DAOGovernance: `[TBD]`

### Mainnet (zkSync Era)

- TOSS Token: `[TBD]`
- FundFactory: `[TBD]`
- RiskEngine: `[TBD]`
- DAOGovernance: `[TBD]`

## Next Steps

- **[Core Contracts](/protocol/contracts/core/TOSS)**: Detailed specifications
- **[Fund Layer](/protocol/contracts/fund/FundFactory)**: Fund system deep dive
- **[Risk Layer](/protocol/contracts/risk/RiskEngine)**: Risk engine documentation
- **[Governance Layer](/protocol/contracts/governance-layer)**: DAO contracts

---

*For contract development guides, see [Technical Documentation](/technical/intro).*

