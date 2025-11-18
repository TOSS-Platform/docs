# Layered System Architecture

A detailed exploration of the TOSS Protocol's five-layer architecture, explaining the responsibilities, interactions, and design principles of each layer.

## Architecture Philosophy

The TOSS layered architecture follows these principles:

1. **Separation of Concerns**: Each layer has distinct responsibilities
2. **Clean Interfaces**: Layers communicate through well-defined APIs
3. **Independent Upgradability**: Layers can evolve separately
4. **Fault Isolation**: Failures in one layer don't cascade
5. **Composability**: New modules integrate at appropriate layers

## Layer 0: Ethereum L1 (Settlement Layer)

### Purpose

Provides ultimate security and finality for the TOSS ecosystem.

### Responsibilities

- **State Root Storage**: Anchors zkSync L2 state roots
- **Proof Verification**: Validates zkSync validity proofs
- **Bridge Operations**: Manages cross-chain asset transfers
- **Finality Guarantee**: Provides Ethereum-grade security

### Key Contracts

- **L1Bridge.sol**: Deposit and withdrawal logic
- **StateRootVerifier.sol**: Proof verification
- **L1Messenger.sol**: Cross-chain message passing

### Design Characteristics

- **Minimal Logic**: Keep L1 logic simple and gas-efficient
- **Trustless Bridging**: No trusted intermediaries required
- **Emergency Controls**: Pause mechanisms for critical situations

## Layer 1: zkSync L2 (Execution Layer)

### Purpose

Provides scalable, low-cost execution environment for all TOSS operations.

### Responsibilities

- **Transaction Execution**: Processes all fund operations
- **State Management**: Maintains protocol state
- **Proof Generation**: Creates validity proofs for L1
- **Account Abstraction**: Enables smart contract wallets

### Key Components

#### Sequencer
- Orders transactions into batches
- Maintains mempool
- Enforces transaction validity

#### Prover
- Generates ZK proofs for batches
- Submits proofs to L1
- Ensures execution correctness

#### Bootloader
- Executes transaction batches
- Manages Account Abstraction flow
- Handles paymaster logic

### Design Characteristics

- **Validity Proofs**: Execution correctness guaranteed cryptographically
- **No Reorgs**: L2 blocks are final once proven
- **Fast Finality**: Minutes vs hours for optimistic rollups
- **Native AA**: Smart contract wallets built-in

## Layer 2: Core Protocol Layer (TOSS Contracts)

### Purpose

Implements all economic logic, risk management, and fund operations.

### Subsystems

#### Core System
- **TOSS Token**: ERC20 governance and utility token
- **Treasury**: Protocol fee collection and management
- **BridgeGateway**: L1/L2 bridge interaction

#### Fund System
- **FundFactory**: Deploys new fund contracts
- **FundRegistry**: Indexes all funds
- **FundManagerVault**: Holds fund assets securely
- **FundConfig**: Stores risk parameters
- **FundTradeExecutor**: Executes validated trades

#### Risk System
- **RiskEngine**: Validates all fund actions
- **ProtocolRiskDomain**: System-wide risk checks
- **FundRiskDomain**: Fund-specific limits
- **InvestorRiskDomain**: Investor behavior monitoring
- **SlashingEngine**: Calculates and executes slashing

#### Governance System
- **FundGovernance**: Fund-level proposals (FM and investors)
- **FMGovernance**: FM-level governance for professional standards
- **ProtocolGovernance**: Protocol-wide governance with flexible voter groups
- **VoterRegistry**: Tracks eligibility across all governance levels

#### Investor System
- **InvestorRegistry**: Identity and class tracking
- **InvestorStateMachine**: Lifecycle management
- **InvestorScoreCalculator**: Composite score computation

### Design Characteristics

- **Domain Isolation**: Clear boundaries between subsystems
- **Upgrade Flexibility**: Proxy patterns for upgradability
- **Access Control**: Role-based permissions
- **Event-Driven**: Comprehensive event emission for indexing

## Layer 3: Off-Chain Service Layer

### Purpose

Handles computationally intensive or real-time operations that don't require on-chain execution.

### Services

#### NAV Engine
- Calculates fund Net Asset Value every minute
- Aggregates prices from multiple sources
- Detects anomalies and deviation
- Publishes NAV hashes on-chain

**Technology**: Node.js, PostgreSQL, EventBridge

#### Trade Router
- Routes trades to optimal venues (CEX/DEX)
- Splits large orders across venues
- Monitors slippage and liquidity
- Ensures RiskEngine validation before execution

**Technology**: Node.js, DynamoDB, Lambda

#### Analytics Hub
- Stores historical NAV, trades, and events
- Generates performance metrics
- Creates investor reports
- Powers dashboard visualizations

**Technology**: PostgreSQL, S3 Data Lake, Redshift

#### Compliance Engine
- Screens against sanctions lists
- Detects suspicious patterns
- Scores wallet behavior
- Flags high-risk activity

**Technology**: Node.js, ML Models, Graph Database

### Design Characteristics

- **High Availability**: Multi-AZ deployment
- **Scalable**: Auto-scaling based on load
- **Observable**: Comprehensive monitoring and alerting
- **Secure**: Private VPC, encrypted storage

## Layer 4: Application Layer

### Purpose

Provides user-facing interfaces for all protocol participants.

### Applications

#### Investor Dashboard
- Portfolio overview and performance
- Deposit and withdrawal flows
- Fund discovery and filtering
- Transaction history

**Technology**: Next.js, React, TailwindCSS, Web3Modal

#### Fund Manager Panel
- Fund creation and configuration
- Trade execution interface
- Risk limit monitoring
- Performance analytics

**Technology**: Next.js, React, Chart.js, Wagmi

#### Governance Portal
- Proposal creation and voting
- Parameter change proposals
- Delegation management
- Voting history

**Technology**: Next.js, React, Snapshot.js

### Design Characteristics

- **Responsive**: Mobile-first design
- **Accessible**: WCAG 2.1 AA compliance
- **Fast**: Optimized bundle size and lazy loading
- **Secure**: CSP headers, XSS protection

## Inter-Layer Communication

### L1 ↔ L2 Communication

```
Deposit: User → L1Bridge → zkSync → L2 Mint
Withdrawal: User → L2Burn → Proof → L1Bridge → Release
```

### L2 → Off-Chain Communication

```
Event: L2 Contract → Event Log → EventBridge → Service
Query: Service → zkSync RPC → L2 State
```

### Off-Chain → L2 Communication

```
Action: Service → Sign Transaction → L2 Mempool → Execution
```

### Off-Chain → Application Communication

```
API: Application → REST/GraphQL → Off-Chain Service
WebSocket: Service → Real-time Updates → Application
```

## Layer Dependencies

### Dependency Graph

```
Layer 4 (App) depends on Layer 3 (Off-Chain) and Layer 2 (Protocol)
Layer 3 (Off-Chain) depends on Layer 2 (Protocol) and Layer 1 (zkSync)
Layer 2 (Protocol) depends on Layer 1 (zkSync)
Layer 1 (zkSync) depends on Layer 0 (Ethereum L1)
```

### Failure Modes

- **L1 Failure**: Entire system pauses until L1 recovers
- **L2 Failure**: Protocol operations halt, but L1 remains secure
- **Protocol Layer Failure**: Specific subsystem affected, others continue
- **Off-Chain Failure**: Degraded UX, but protocol remains functional
- **App Layer Failure**: Users can still interact via alternative interfaces

## Scalability Strategy

### Vertical Scaling

- **L1**: Ethereum roadmap improvements (EIP-4844 blob space)
- **L2**: zkSync throughput increases
- **Protocol**: Gas optimizations, batching
- **Off-Chain**: Auto-scaling based on metrics
- **App**: CDN, edge caching, code splitting

### Horizontal Scaling

- **L2**: Future multi-chain deployment
- **Off-Chain**: Multiple service instances, load balancing
- **App**: Multiple regional deployments

## Next Steps

- **[L1-L2 Communication](/protocol/architecture/l1-l2-communication)**: Cross-layer messaging protocols
- **[Security Model](/protocol/architecture/security-model)**: Security guarantees per layer
- **[Smart Contracts](/protocol/contracts/overview)**: Contract specifications

---

*For deployment guides, see [Technical Documentation](/technical/intro).*

