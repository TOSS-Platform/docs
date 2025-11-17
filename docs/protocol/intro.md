# Protocol Documentation

Welcome to the TOSS Protocol documentation. This section provides comprehensive technical specifications for the TOSS smart contract protocol, covering all aspects of the decentralized fund management system.

## What is TOSS?

TOSS is a next-generation decentralized fund platform designed to rebuild the asset management industry using blockchain transparency, automated risk controls, and zero-knowledge scalability. The protocol enables:

- **Permissionless Fund Creation**: Anyone can become a Fund Manager backed by on-chain credentials and mandatory stake
- **Transparent Fund Management**: All trades, risk parameters, NAV changes, and fund performance are publicly verifiable on-chain
- **Autonomous Risk Validation**: Every action is governed by an autonomous RiskEngine that enforces mathematical risk boundaries
- **Accountability Through Staking**: Fund Managers stake TOSS tokens—violations trigger automatic slashing and burning
- **zkSync Integration**: Ultra-low fees, speed, and native Account Abstraction enable efficient operations
- **Multi-Level Governance**: Three-level governance system (Fund, FM, Protocol) ensures context-appropriate decision-making

## Protocol Architecture Overview

The TOSS protocol is built on zkSync Era L2, leveraging:

- **Ethereum L1** for final settlement and security
- **zkSync L2** for execution, validity proofs, and low-cost operations
- **Smart Contract Layer** for all economic logic and fund operations
- **Off-Chain Services** for NAV calculation and analytics
- **Multi-Domain Governance** for decentralized parameter management

## Documentation Structure

This protocol documentation is organized into the following sections:

### Architecture
Complete system architecture covering layered design, L1-L2 communication, security model, and scalability characteristics.

### Smart Contracts
Detailed specifications for all smart contracts including Core, Fund, Risk, Governance, Investor, and Utility layers.

### Tokenomics & Risk Engine
Mathematical definitions of TOSS tokenomics, deflationary model, slashing mechanisms, FaultIndex computation, and NAV recovery.

### zkSync Integration
Technical specifications for zkSync integration including Account Abstraction, Paymaster design, L1-L2 bridging, and gas optimizations.

### Governance
Multi-level governance system with fund-level, FM-level, and protocol-level proposals, each with context-specific voters and execution mechanisms.

### Security
Comprehensive security model covering threat analysis, smart contract security, economic security, and operational safeguards.

### Fund Standards
Fund classification system, risk tier specifications, compliance requirements, and Fund Manager eligibility criteria.

## Target Audience

This documentation is designed for:

- **Technical Architects**: Understanding system design and integration points
- **Smart Contract Auditors**: Reviewing security and correctness
- **Protocol Researchers**: Analyzing economic models and game theory
- **Integration Partners**: Building on top of TOSS protocol

## Getting Started

1. Begin with **[Architecture Overview](/docs/protocol/architecture/overview)** to understand the system design
2. Review **[Smart Contracts](/docs/protocol/contracts/overview)** for contract specifications
3. Study **[Tokenomics & Risk Engine](/docs/protocol/tokenomics/overview)** for economic models
4. Explore **[zkSync Integration](/docs/protocol/zksync/overview)** for L2-specific details

:::info Developer Implementation Guide
For practical development guides, deployment procedures, and testing frameworks, see the **[Technical Documentation](/docs/technical/intro)**.
:::

## Protocol Status

Current Version: **v1.0.0-beta**  
Network: **zkSync Era Testnet**  
Audit Status: **In Progress**

## Contributing

The TOSS protocol is being developed openly. For technical discussions and protocol improvements:

- GitHub: [github.com/toss/protocol](https://github.com/toss/protocol)
- Discord: [discord.gg/toss](https://discord.gg/toss)
- Forum: [forum.toss.finance](https://forum.toss.finance)

---

Ready to dive in? Start with the [Architecture Overview](/docs/protocol/architecture/overview) →

