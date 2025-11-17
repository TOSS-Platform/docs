# Quick Start

Get up and running with TOSS development in minutes.

## 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/toss/protocol.git
cd protocol

# Or if you have SSH keys configured
git clone git@github.com:toss/protocol.git
cd protocol
```

## 2. Install Dependencies

```bash
# Install all project dependencies
yarn install

# This will install:
# - Hardhat and plugins
# - zkSync dependencies
# - TypeScript and linters
# - Testing frameworks
```

## 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env  # or use your preferred editor
```

**Minimum required `.env` values**:
```bash
# For local development
NETWORK=localhost
DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# For testnet deployment
ZKSYNC_RPC_URL=https://sepolia.era.zksync.dev
```

## 4. Start Local Services

```bash
# Start Docker services (PostgreSQL, Redis, etc.)
docker-compose up -d

# Verify services are running
docker-compose ps
```

## 5. Compile Contracts

```bash
# Compile all smart contracts
yarn compile

# You should see output like:
# Compiled 45 Solidity files successfully
```

## 6. Run Tests

```bash
# Run all tests
yarn test

# Run specific test file
yarn test test/RiskEngine.test.ts

# Run with coverage
yarn test:coverage
```

## 7. Deploy to Local Network (Optional)

```bash
# Start Hardhat local node
yarn hardhat node

# In another terminal, deploy contracts
yarn deploy:local

# You should see contract addresses printed
```

## 8. Deploy to zkSync Testnet

```bash
# Make sure you have testnet ETH
# Get from: https://portal.zksync.io/faucet

# Deploy to zkSync Sepolia
yarn deploy:testnet

# Save the deployed contract addresses
```

## Quick Test Script

Run this to verify everything works:

```typescript
// scripts/quick-test.ts
import { ethers } from 'hardhat';

async function main() {
  console.log('Testing TOSS Protocol...');
  
  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log('Deployer:', deployer.address);
  
  // Get TOSS token
  const TOSS = await ethers.getContract('TOSS');
  console.log('TOSS Token:', TOSS.address);
  
  // Check balance
  const balance = await TOSS.balanceOf(deployer.address);
  console.log('Balance:', ethers.utils.formatEther(balance), 'TOSS');
  
  console.log('✅ Quick test passed!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Run it:
```bash
npx hardhat run scripts/quick-test.ts --network testnet
```

## Directory Structure

```
protocol/
├── contracts/          # Solidity smart contracts
│   ├── core/
│   ├── fund/
│   ├── risk/
│   └── governance/
├── scripts/            # Deployment scripts
├── test/               # Test files
├── offchain/          # Off-chain services
│   ├── nav-engine/
│   ├── trade-router/
│   └── analytics/
├── infrastructure/    # Terraform configs
└── docs/              # Documentation
```

## Common Commands

```bash
# Compile contracts
yarn compile

# Run tests
yarn test
yarn test:integration
yarn test:zksync

# Deploy
yarn deploy:local
yarn deploy:testnet
yarn deploy:mainnet

# Verify contracts
yarn verify:testnet

# Linting
yarn lint
yarn lint:fix

# Format code
yarn format

# Type check
yarn typecheck
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/my-feature
```

### 2. Make Changes

```bash
# Edit contracts or code
nano contracts/MyContract.sol

# Compile
yarn compile

# Test
yarn test
```

### 3. Commit Changes

```bash
git add .
git commit -m "feat: add new feature"
```

### 4. Push and Create PR

```bash
git push origin feature/my-feature

# Create Pull Request on GitHub
```

## Troubleshooting

### Compilation Errors

```bash
# Clear cache and recompile
yarn hardhat clean
yarn compile
```

### Test Failures

```bash
# Run specific test with debugging
DEBUG=* yarn test test/MyContract.test.ts
```

### Docker Issues

```bash
# Restart Docker services
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Network Issues

```bash
# Check network connectivity
curl https://sepolia.era.zksync.dev

# Test RPC endpoint
curl -X POST https://sepolia.era.zksync.dev \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## Next Steps

Now that you have the basics running:

1. **[Environment Setup](/docs/technical/getting-started/environment-setup)**: Complete development environment configuration
2. **[Smart Contract Development](/docs/technical/smart-contracts/zksync-safe-contracts)**: Start building contracts
3. **[Testing Guide](/docs/technical/testing/overview)**: Learn comprehensive testing strategies

## Useful Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [zkSync Era Documentation](https://era.zksync.io/docs)
- [Ethers.js Documentation](https://docs.ethers.org)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Getting Help

- **Discord**: [discord.gg/toss](https://discord.gg/toss) - #dev-support
- **GitHub Issues**: [github.com/toss/protocol/issues](https://github.com/toss/protocol/issues)
- **Forum**: [forum.toss.finance](https://forum.toss.finance)

---

*Continue to [Environment Setup](/docs/technical/getting-started/environment-setup) for detailed configuration.*

