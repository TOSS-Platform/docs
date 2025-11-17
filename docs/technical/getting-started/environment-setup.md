# Environment Setup

Complete guide to setting up your TOSS development environment with all required configurations.

## Project Structure

```
toss-protocol/
├── contracts/              # Smart contracts
├── scripts/                # Deployment & utility scripts
├── test/                   # Contract tests
├── offchain/              # Off-chain services
├── infrastructure/        # IaC and deployment configs
├── docs/                  # Documentation
├── .env                   # Environment variables (gitignored)
├── hardhat.config.ts      # Hardhat configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript config
```

## Initial Setup

### 1. Install Dependencies

```bash
# Install all dependencies
yarn install

# Or with npm
npm install
```

### 2. Configure Environment Variables

```bash
# Copy template
cp .env.example .env

# Edit with your values
nano .env
```

**Complete .env Configuration**:

```bash
# ===== Network Configuration =====
NETWORK=testnet
ZKSYNC_NETWORK=zkSyncSepoliaTestnet

# ===== Private Keys (NEVER commit!) =====
# Generate new keys for development:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

DEPLOYER_PRIVATE_KEY=0x...
FM_TEST_PRIVATE_KEY=0x...
INVESTOR_TEST_PRIVATE_KEY=0x...

# ===== RPC Endpoints =====
ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ZKSYNC_RPC_URL=https://sepolia.era.zksync.dev

# Get free API keys:
# Alchemy: https://www.alchemy.com
# Infura: https://www.infura.io

# ===== API Keys =====
ALCHEMY_API_KEY=your_key
INFURA_API_KEY=your_key
ETHERSCAN_API_KEY=your_key
ZKSYNC_EXPLORER_API_KEY=your_key

# ===== Database =====
DATABASE_URL=postgresql://toss:password@localhost:5432/toss_dev
REDIS_URL=redis://localhost:6379

# ===== AWS Configuration (Optional) =====
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# ===== Monitoring =====
SENTRY_DSN=
BETTERSTACK_TOKEN=

# ===== Feature Flags =====
ENABLE_TESTNET_FEATURES=true
DEBUG_MODE=true
LOG_LEVEL=debug
```

### 3. Start Docker Services

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Services running:
# - PostgreSQL (5432)
# - Redis (6379)
# - Adminer (8080) - DB admin UI
```

### 4. Initialize Database

```bash
# Run migrations
yarn db:migrate

# Seed test data (optional)
yarn db:seed

# Reset database (if needed)
yarn db:reset
```

## IDE Configuration

### VS Code

Install recommended extensions:

```json
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "JuanBlanco.solidity",
    "ms-azuretools.vscode-docker",
    "github.copilot",
    "hardhat-solidity.hardhat-solidity"
  ]
}
```

Configure settings:

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[solidity]": {
    "editor.defaultFormatter": "JuanBlanco.solidity"
  },
  "solidity.compileUsingRemoteVersion": "v0.8.24",
  "solidity.formatter": "prettier"
}
```

### Solidity Language Server

```bash
# Install globally
npm install -g @nomicfoundation/solidity-language-server
```

## Hardhat Configuration

The `hardhat.config.ts` should be configured for zkSync:

```typescript
import { HardhatUserConfig } from 'hardhat/config';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';
import '@nomiclabs/hardhat-ethers';

const config: HardhatUserConfig = {
  zksolc: {
    version: 'latest',
    settings: {},
  },
  defaultNetwork: 'zkSyncTestnet',
  networks: {
    hardhat: {
      zksync: false,
    },
    zkSyncTestnet: {
      url: 'https://sepolia.era.zksync.dev',
      ethNetwork: 'sepolia',
      zksync: true,
      verifyURL: 'https://explorer.sepolia.era.zksync.dev/contract_verification',
    },
    zkSyncMainnet: {
      url: 'https://mainnet.era.zksync.io',
      ethNetwork: 'mainnet',
      zksync: true,
      verifyURL: 'https://zksync2-mainnet-explorer.zksync.io/contract_verification',
    },
  },
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

export default config;
```

## Testing Environment

### Local Hardhat Network

```bash
# Terminal 1: Start local node
yarn hardhat node

# Terminal 2: Deploy contracts
yarn deploy:local

# Terminal 3: Run tests
yarn test
```

### zkSync Local Node (Optional)

```bash
# Install zkSync local node
yarn global add @matterlabs/local-setup

# Start zkSync local node
zksync-cli dev start

# Deploy to local zkSync
yarn deploy:zksync-local
```

## Off-Chain Services Setup

### NAV Engine

```bash
cd offchain/nav-engine

# Install dependencies
yarn install

# Configure
cp .env.example .env

# Start service
yarn dev
```

### Trade Router

```bash
cd offchain/trade-router

# Install dependencies
yarn install

# Configure
cp .env.example .env

# Start service
yarn dev
```

## Git Configuration

### Git Hooks

```bash
# Install Husky for git hooks
yarn husky install

# Pre-commit: lint and format
yarn husky add .husky/pre-commit "yarn lint-staged"

# Pre-push: run tests
yarn husky add .husky/pre-push "yarn test"
```

### Lint-Staged Configuration

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.sol": [
      "prettier --write"
    ]
  }
}
```

## Environment-Specific Configs

### Development

```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_TESTNET_FEATURES=true
```

### Staging

```bash
# .env.staging
NODE_ENV=staging
LOG_LEVEL=info
ENABLE_TESTNET_FEATURES=true
```

### Production

```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_TESTNET_FEATURES=false
```

## Verification Checklist

Run these to verify your setup:

```bash
# ✅ Dependencies installed
yarn --version
node --version

# ✅ Environment configured
cat .env | grep -v "^#" | grep -v "^$"

# ✅ Docker services running
docker-compose ps

# ✅ Contracts compile
yarn compile

# ✅ Tests pass
yarn test

# ✅ Linting passes
yarn lint

# ✅ Database accessible
yarn db:status
```

## Troubleshooting

### Docker Issues

```bash
# Reset Docker environment
docker-compose down -v
docker-compose up -d

# Check logs
docker-compose logs postgres
docker-compose logs redis
```

### Node Modules Issues

```bash
# Clear and reinstall
rm -rf node_modules
rm yarn.lock  # or package-lock.json
yarn install
```

### Compilation Errors

```bash
# Clear Hardhat cache
yarn hardhat clean

# Clear zkSync cache
rm -rf cache-zk
rm -rf artifacts-zk

# Recompile
yarn compile
```

### Network Issues

```bash
# Test RPC connectivity
curl -X POST https://sepolia.era.zksync.dev \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## Next Steps

Your environment is now configured! Continue with:

1. **[Smart Contract Development](/docs/technical/smart-contracts/zksync-safe-contracts)**: Start building
2. **[Testing Guide](/docs/technical/testing/overview)**: Write comprehensive tests
3. **[Deployment](/docs/technical/deployment/workflow)**: Deploy to testnet/mainnet

## Additional Resources

- [Hardhat Configuration](https://hardhat.org/config/)
- [zkSync Development](https://era.zksync.io/docs/dev/)
- [TypeScript Configuration](https://www.typescriptlang.org/tsconfig)

---

*Ready to build? Start with [Smart Contract Development](/docs/technical/smart-contracts/zksync-safe-contracts).*

