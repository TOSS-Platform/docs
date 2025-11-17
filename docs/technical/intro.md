# Technical Documentation

Welcome to the TOSS Technical Documentation. This section provides practical guides, tutorials, and procedures for developers building with, deploying, and operating the TOSS Protocol.

## Who This Is For

This documentation is designed for:

- **Smart Contract Developers**: Building or extending TOSS contracts
- **Backend Developers**: Integrating off-chain services
- **DevOps Engineers**: Deploying and managing infrastructure
- **QA Engineers**: Testing and quality assurance
- **Integration Partners**: Building applications on TOSS

## What You'll Find Here

### Getting Started

Quick setup guides to get you up and running:
- Prerequisites and tools installation
- Quick start for local development
- Environment configuration

### Development Environment

Complete setup for TOSS development:
- Local development environment
- Docker container configuration
- zkSync local node setup
- Required development tools

### Smart Contract Development

zkSync-specific contract development:
- Writing zkSync-safe contracts
- Testing with Hardhat
- Deployment scripts
- Contract verification

### Off-Chain Services

Building and running off-chain components:
- NAV Engine architecture
- Trade Router implementation
- Analytics Hub integration
- Compliance systems

### Infrastructure

Cloud infrastructure and deployment:
- AWS architecture
- ECS/Fargate deployment
- Database configuration
- Monitoring and observability

### Testing & QA

Comprehensive testing strategies:
- Unit testing
- Integration testing
- zkSync simulation tests
- Fuzzing and formal verification

### Deployment

Production deployment procedures:
- Dev/Staging/Production workflow
- CI/CD pipeline
- Rollback procedures

## Documentation Structure

```
Technical Documentation
├── Getting Started
│   ├── Prerequisites
│   ├── Quick Start
│   └── Environment Setup
│
├── Development Environment
│   ├── Local Setup
│   ├── Docker Config
│   ├── zkSync Local
│   └── Required Tools
│
├── Smart Contracts
│   ├── zkSync-Safe Contracts
│   ├── Testing
│   ├── Deployment
│   └── Verification
│
├── Off-Chain Services
│   ├── Overview
│   ├── NAV Engine
│   ├── Trade Router
│   ├── Analytics Hub
│   └── Compliance
│
├── Infrastructure
│   ├── Overview
│   ├── AWS Architecture
│   ├── ECS Deployment
│   ├── Database Config
│   └── Monitoring
│
├── Testing & QA
│   ├── Overview
│   ├── Unit Testing
│   ├── Integration Testing
│   ├── zkSync Simulation
│   └── Fuzzing
│
└── Deployment
    ├── Workflow
    ├── CI/CD Pipeline
    └── Rollback
```

## Key Concepts

### zkSync-First Development

TOSS is built natively for zkSync Era. This means:

```typescript
// zkSync-specific considerations
const considerations = {
  storage: 'Use packed storage patterns',
  gas: 'Different gas costs than Ethereum L1',
  opcodes: 'Some EVM opcodes unavailable',
  testing: 'Use zkSync local node for accurate testing'
};
```

### Hybrid Architecture

TOSS combines on-chain and off-chain components:

```
On-Chain (zkSync L2)
├── Smart Contracts
├── State Storage
└── Transaction Execution

Off-Chain (AWS)
├── NAV Calculation
├── Trade Routing
├── Analytics
└── Monitoring
```

### Development Workflow

```bash
# 1. Setup environment
yarn install
docker-compose up -d

# 2. Compile contracts
yarn hardhat compile

# 3. Run tests
yarn hardhat test
yarn test:integration
yarn test:zksync

# 4. Deploy to testnet
yarn deploy:testnet

# 5. Verify contracts
yarn verify:testnet
```

## Quick Links

### For Smart Contract Developers

- [zkSync-Safe Contracts](/docs/technical/smart-contracts/zksync-safe-contracts)
- [Testing Guide](/docs/technical/smart-contracts/testing)
- [Deployment Scripts](/docs/technical/smart-contracts/deployment)

### For Backend Developers

- [Off-Chain Services Overview](/docs/technical/offchain/overview)
- [NAV Engine](/docs/technical/offchain/nav-engine)
- [Trade Router](/docs/technical/offchain/trade-router)

### For DevOps Engineers

- [Infrastructure Overview](/docs/technical/infrastructure/overview)
- [AWS Architecture](/docs/technical/infrastructure/aws-architecture)
- [Deployment Workflow](/docs/technical/deployment/workflow)

### For QA Engineers

- [Testing Overview](/docs/technical/testing/overview)
- [Integration Testing](/docs/technical/testing/integration-testing)
- [zkSync Simulation](/docs/technical/testing/zksync-simulation)

## Development Principles

### 1. Security First

```typescript
// Always validate inputs
function validateTradeParams(params: TradeParams) {
  if (!params.amount || params.amount <= 0) {
    throw new Error('Invalid amount');
  }
  if (!isValidAddress(params.asset)) {
    throw new Error('Invalid asset address');
  }
  // ... more validations
}
```

### 2. zkSync Compatibility

```solidity
// Avoid dynamic gas refunds
// Bad:
delete balances[user];

// Good:
balances[user] = 0;
```

### 3. Test Everything

```typescript
describe('FundManagerVault', () => {
  it('should deposit correctly', async () => {
    // Test implementation
  });
  
  it('should prevent unauthorized withdrawals', async () => {
    await expect(
      vault.connect(attacker).withdraw(amount)
    ).to.be.revertedWith('Not authorized');
  });
});
```

### 4. Monitor Everything

```typescript
// Emit events for important actions
emit TradeExecuted(fundId, asset, amount, price, timestamp);
emit NAVUpdated(fundId, oldNAV, newNAV, timestamp);
emit SlashingTriggered(fundId, managerId, amount, reason);
```

## Prerequisites

Before starting development, ensure you have:

- **Node.js**: 20.x or higher
- **Yarn or pnpm**: Package manager
- **Docker**: For local services
- **Git**: Version control
- **A code editor**: VS Code recommended

Optional but recommended:
- **zkSync CLI**: For zkSync-specific operations
- **Hardhat**: Smart contract development
- **AWS CLI**: For infrastructure work
- **Terraform**: For IaC deployment

## Getting Help

### Documentation

- **Protocol Specs**: [Protocol Documentation](/docs/protocol/intro)
- **API Reference**: [API Documentation](/docs/api/overview)
- **Community**: [Discord](https://discord.gg/toss), [Forum](https://forum.toss.finance)

### Support Channels

- **Technical Issues**: GitHub Issues
- **General Questions**: Discord #dev-support
- **Security Issues**: security@toss.finance

## Contributing

We welcome contributions! See our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

**Code Standards**:
- Follow TypeScript/Solidity best practices
- Write comprehensive tests
- Document public APIs
- Pass all linters and checks

## Next Steps

Ready to start? Begin with:

1. **[Prerequisites](/docs/technical/getting-started/prerequisites)**: Install required tools
2. **[Quick Start](/docs/technical/getting-started/quick-start)**: Get running in 5 minutes
3. **[Environment Setup](/docs/technical/getting-started/environment-setup)**: Complete development setup

---

*For protocol specifications, see [Protocol Documentation](/docs/protocol/intro).*

