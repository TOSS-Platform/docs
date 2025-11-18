# Protocol Documentation

Welcome to the TOSS Protocol documentation. This section provides comprehensive technical specifications for the TOSS smart contract protocol, covering all aspects of the decentralized fund management system.

## What is TOSS?

TOSS is a **next-generation decentralized fund platform** designed to rebuild the asset management industry using blockchain transparency, automated risk controls, and zero-knowledge scalability. The protocol enables anyone to become a fund manager or invest in professionally managed crypto funds with full transparency and automatic risk enforcement.

**In Simple Terms**: TOSS is like a transparent, trustless hedge fund where all operations are verified on-chain, risk is automatically enforced, and both fund managers and investors benefit from economic alignment through staking mechanisms.

## Mission

**To democratize professional fund management by eliminating trust dependencies and barriers to entry while ensuring complete transparency, algorithmic risk enforcement, and economic accountability.**

Our mission is to rebuild the asset management industry from the ground up, making it:
- **Transparent**: All trades, positions, and performance are verifiable on-chain
- **Trustless**: Cryptographic and economic security replace trust-based relationships
- **Accessible**: Anyone can become a fund manager or investor with minimal barriers
- **Accountable**: Automatic enforcement of rules through economic incentives
- **Efficient**: Ultra-low costs enable real-time validation and operations

## Vision

**To become the global standard for decentralized fund management, connecting $100B+ in capital with professional fund managers in a trustless, transparent, and efficient protocol.**

We envision a future where:

- **10,000+ Fund Managers** operate transparent funds on TOSS
- **$100B+ in Assets Under Management** across diverse strategies and risk profiles
- **Millions of Investors** access professional management previously unavailable to them
- **Zero Trust Required**: All operations cryptographically verified and economically secured
- **Global Infrastructure**: TOSS provides protocol infrastructure globally—compliance responsibility remains with Fund Managers per their jurisdiction

## What We're Changing

TOSS is designed to solve fundamental problems plaguing both traditional finance and crypto markets:

### 1. Transparency & Trust Issues

**The Problem**:
- Traditional funds operate as "black boxes" with no real-time visibility
- Investors cannot verify if fund managers follow stated strategies
- Hidden fees, concealed trades, and NAV manipulation go undetected
- $1.2T lost to fraud and mismanagement globally since 2000

**TOSS Solution**:
- **100% On-Chain Transparency**: Every trade, position, NAV change, and fee is publicly verifiable
- **Cryptographic Proofs**: No trust required—everything is mathematically verifiable
- **Real-Time Monitoring**: Investors can see all operations as they happen
- **Automatic Auditing**: On-chain data enables continuous verification

### 2. Barriers to Entry

**The Problem**:
- Fund managers need $5-10M+ AUM to be viable
- Regulatory licensing costs $500K-$2M+
- Investors require $100K-$1M minimums for quality funds
- Accredited investor requirements exclude 98% of population

**TOSS Solution**:
- **Permissionless Infrastructure**: TOSS provides technical infrastructure—anyone can become a fund manager by staking TOSS tokens
- **Low Minimums**: Funds can launch with minimal capital requirements (technology-wise)
- **On-Chain Credentials**: On-chain reputation and credentials complement traditional regulatory frameworks
- **Jurisdiction-Dependent Compliance**: Fund Managers are responsible for regulatory compliance in their respective jurisdictions (MiCA, SEC, MAS, FCA, etc.)
- **Universal Technical Access**: Investors can participate with any amount technically (subject to fund rules and local regulations)

### 3. Risk Management Failures

**The Problem**:
- Manual risk limits are easily bypassed
- No real-time position monitoring
- Human error in risk calculations
- $100B+ in preventable losses from Luna/FTX-style collapses

**TOSS Solution**:
- **Autonomous RiskEngine**: Every trade validated against mathematical boundaries
- **Real-Time Validation**: Trades cannot execute if they violate risk parameters
- **Automatic Circuit Breakers**: Protocol pauses operations when thresholds are exceeded
- **Economic Enforcement**: Violations trigger automatic slashing, ensuring accountability

### 4. Settlement & Liquidity Friction

**The Problem**:
- T+2 or T+3 settlement in traditional finance
- Weeks for hedge fund subscriptions/redemptions
- Quarterly lockups and 30-90 day notice periods

**TOSS Solution**:
- **Instant Settlement**: zkSync L2 enables real-time transactions
- **On-Demand Liquidity**: Investors can deposit/withdraw with minimal delays
- **Flexible Terms**: Fund managers set rules, but protocol enables efficient execution

### 5. Lack of Accountability

**The Problem**:
- Fund managers face no immediate consequences for violations
- Fraud only discovered after significant losses
- No economic alignment between managers and investors

**TOSS Solution**:
- **Economic Security**: Fund managers stake TOSS tokens as collateral
- **Automatic Slashing**: Violations trigger immediate stake burning
- **Alignment Through Staking**: Managers' economic interest aligned with investors
- **Reputation System**: On-chain track record attracts or repels investors

## Core Innovations

The protocol enables:

- **Permissionless Fund Creation**: TOSS provides infrastructure—anyone can become a Fund Manager backed by on-chain credentials and mandatory stake. Fund Managers are responsible for regulatory compliance in their jurisdiction.
- **Transparent Fund Management**: All trades, risk parameters, NAV changes, and fund performance are publicly verifiable on-chain in real-time
- **Autonomous Risk Validation**: Every action is governed by an autonomous RiskEngine that enforces mathematical risk boundaries before execution
- **Accountability Through Staking**: Fund Managers stake TOSS tokens as collateral—violations trigger automatic slashing and burning, ensuring economic alignment
- **Slashing-Backed NAV Recovery**: When a Fund Manager causes damage, part of their slashed TOSS stake is automatically routed to the fund to partially restore NAV, while the rest is burned, enforcing both compensation and long-term deflation
- **zkSync Integration**: Ultra-low fees (under $0.10 per transaction), high throughput, and native Account Abstraction enable efficient operations at scale
- **Multi-Domain Governance**: Protocol / FM / Investor domain governance ensures context-appropriate decision-making with proportional voting power, plus fund-level governance for individual fund parameters

## TOSS Token Economics

The TOSS token is the economic backbone of the protocol, designed with immutable supply guarantees and deflationary mechanics:

### Fixed Supply & No Minting

- **Immutable Supply**: TOSS has a fixed total supply with **no minting function**—the supply can only decrease, never increase
- **Maximum Transparency**: This immutable property provides investor confidence that token economics cannot be manipulated by protocol governance
- **Hard Cap**: Total supply is permanently capped at deployment, ensuring long-term value preservation

### Deflationary Model

- **Deflation via Slashing & Burn**: TOSS is a **fixed-supply, deflationary token** where all token burns come exclusively from slashing events
- **Automatic Burning**: When Fund Managers violate risk parameters, their staked TOSS tokens are automatically slashed and permanently burned
- **Supply Reduction**: Every slashing event reduces the total supply, creating natural deflationary pressure as the protocol scales

### Token Utility

TOSS serves multiple critical roles across the protocol:

- **Fund Manager Collateral**: FM stake requirement—Fund Managers must stake TOSS tokens as collateral to operate funds, ensuring economic alignment with investors
- **Governance Voting Power**: Protocol governance—TOSS stakers gain voting power proportional to their stake for protocol-level proposals
- **Investor Class Staking**: Investor tier system—Investors can stake TOSS to upgrade their investor class (RETAIL → PREMIUM → WHALE) and unlock enhanced benefits
- **zkSync Paymaster Fuel**: Gas sponsorship—TOSS tokens fund zkSync Paymaster contracts, enabling gasless transactions for users and reducing friction

**Economic Alignment**: All token utility creates positive feedback loops where protocol growth and responsible behavior are economically incentivized, while violations are automatically penalized through token burning.

## Why TOSS Matters

### For Investors

- **Complete Transparency**: Verify all operations yourself—no blind trust required
- **Access to Professional Management**: Invest in strategies previously unavailable without $100K+ minimums
- **Real-Time Monitoring**: Track your investments with on-chain data
- **Economic Protection**: Fund managers stake tokens—if they misbehave, you're compensated from slashed stake
- **Technical Accessibility**: Participate from anywhere technically—compliance requirements vary by jurisdiction

### For Fund Managers

- **Low Technical Barriers**: Launch a fund with minimal capital (technology-wise)—just stake TOSS tokens. Regulatory compliance remains the Fund Manager's responsibility per their jurisdiction
- **Build On-Chain Reputation**: Transparent track record attracts investors organically
- **Efficient Operations**: Ultra-low fees enable frequent trading and real-time risk validation
- **Session Keys**: Trade securely without exposing main wallet
- **Performance Fees**: Earn typical performance fees (configurable) of profits above high water mark

### For the Ecosystem

- **Professional Infrastructure**: Brings TradFi-grade management to crypto in a trustless way
- **Capital Efficiency**: Connects $500B+ in crypto capital with 10,000+ talented managers
- **Institutional Adoption**: Provides infrastructure needed for institutional crypto allocations
- **Risk Reduction**: Algorithmic enforcement prevents the next Luna/FTX-style collapse

## Protocol Architecture Overview

The TOSS protocol is built on zkSync Era L2, leveraging:

- **Ethereum L1** for final settlement and security
- **zkSync L2** for execution, validity proofs, and low-cost operations
- **Smart Contract Layer** for all economic logic and fund operations
- **Off-Chain Services** for NAV calculation and analytics
- **Protocol / FM / Investor Domain Governance** for decentralized parameter management, plus fund-level governance for individual fund parameters

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
Protocol / FM / Investor domain governance system with fund-level governance for individual fund parameters—each with context-specific voters and execution mechanisms.

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

1. Begin with **[Architecture Overview](/protocol/architecture/overview)** to understand the system design
2. Review **[Smart Contracts](/protocol/contracts/overview)** for contract specifications
3. Study **[Tokenomics & Risk Engine](/protocol/tokenomics/overview)** for economic models
4. Explore **[zkSync Integration](/protocol/zksync/overview)** for L2-specific details

:::info Developer Implementation Guide
For practical development guides, deployment procedures, and testing frameworks, see the **[Technical Documentation](/technical/intro)**.
:::

## Legal & Regulatory Disclaimer

:::important Compliance Responsibility

**TOSS provides protocol infrastructure only.** Fund Managers operating on TOSS are solely responsible for:

- Regulatory compliance in their respective jurisdictions (MiCA, SEC, MAS, FCA, etc.)
- Obtaining required licenses and registrations where applicable
- KYC/AML procedures per local requirements
- Investor accreditation requirements
- Tax reporting and compliance obligations

The TOSS protocol itself is a technical infrastructure layer—regulatory compliance remains jurisdiction-dependent and is the responsibility of each Fund Manager.

For detailed compliance considerations, see [Fund Standards & Compliance](/protocol/standards/overview).

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

Ready to dive in? Start with the [Architecture Overview](/protocol/architecture/overview) →

