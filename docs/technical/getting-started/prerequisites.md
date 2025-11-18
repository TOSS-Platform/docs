# Prerequisites

Before you start developing with TOSS, ensure your development environment has all required tools and dependencies installed.

## System Requirements

### Operating System

- **Linux** (Ubuntu 20.04+ recommended)
- **macOS** (12.0+ recommended)
- **Windows** (WSL2 required for full compatibility)

### Hardware

- **CPU**: 4+ cores recommended
- **RAM**: 16GB minimum, 32GB recommended
- **Storage**: 50GB free space minimum
- **Network**: Stable internet connection

## Required Software

### Node.js & Package Managers

```bash
# Node.js 20.x LTS
node --version  # Should be v20.x.x

# Install Node.js (if not installed)
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node@20

# Verify installation
node --version
npm --version

# Install Yarn (recommended)
npm install -g yarn
yarn --version

# Or use pnpm
npm install -g pnpm
pnpm --version
```

### Git

```bash
# Check if Git is installed
git --version

# Install Git
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install git

# macOS
brew install git

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Docker & Docker Compose

```bash
# Check Docker installation
docker --version
docker-compose --version

# Install Docker
# Ubuntu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# macOS
# Download Docker Desktop from https://www.docker.com/products/docker-desktop

# Verify installation
docker run hello-world
```

## Development Tools

### Hardhat

```bash
# Install Hardhat globally (optional)
yarn global add hardhat

# Or install per project
yarn add --dev hardhat
```

### zkSync CLI

```bash
# Install zkSync CLI
yarn global add zksync-cli

# Verify
zksync-cli --version
```

### Code Editor

**VS Code** (recommended) with extensions:

```bash
# Install VS Code
# Ubuntu
sudo snap install code --classic

# macOS
brew install --cask visual-studio-code

# Recommended extensions:
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension JuanBlanco.solidity
code --install-extension ms-azuretools.vscode-docker
code --install-extension github.copilot
```

## Optional Tools

### AWS CLI

```bash
# Install AWS CLI v2
# Ubuntu/Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# macOS
brew install awscli

# Verify
aws --version

# Configure (if you have AWS credentials)
aws configure
```

### Terraform

```bash
# Install Terraform
# Ubuntu
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# macOS
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Verify
terraform --version
```

### PostgreSQL Client

```bash
# Install psql
# Ubuntu
sudo apt-get install postgresql-client

# macOS
brew install postgresql

# Verify
psql --version
```

## Development Dependencies

### Python (for some scripts)

```bash
# Check Python version
python3 --version

# Install Python 3.10+
# Ubuntu
sudo apt-get install python3.10 python3-pip

# macOS
brew install python@3.10

# Install pipenv
pip3 install pipenv
```

### Rust (for some ZK tooling)

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verify
rustc --version
cargo --version
```

## zkSync Testnet Setup

### Get Testnet Tokens

```bash
# zkSync Sepolia Testnet Faucet
# Visit: https://portal.zksync.io/faucet

# Or use CLI
zksync-cli bridge deposit
```

### Add zkSync Network to MetaMask

```json
{
  "Network Name": "zkSync Era Sepolia",
  "RPC URL": "https://sepolia.era.zksync.dev",
  "Chain ID": "300",
  "Currency Symbol": "ETH",
  "Block Explorer": "https://sepolia.explorer.zksync.io"
}
```

## Environment Variables

Create a `.env` file template:

```bash
# .env.example
# Copy this to .env and fill in values

# Network Configuration
NETWORK=testnet
ZKSYNC_NETWORK=zkSyncSepoliaTestnet

# Private Keys (NEVER commit these!)
DEPLOYER_PRIVATE_KEY=
FM_TEST_PRIVATE_KEY=
INVESTOR_TEST_PRIVATE_KEY=

# RPC URLs
ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ZKSYNC_RPC_URL=https://sepolia.era.zksync.dev

# API Keys
ALCHEMY_API_KEY=
INFURA_API_KEY=
ETHERSCAN_API_KEY=
ZKSYNC_EXPLORER_API_KEY=

# Off-Chain Services
DATABASE_URL=postgresql://localhost:5432/toss_dev
REDIS_URL=redis://localhost:6379
AWS_REGION=us-east-1

# Monitoring
SENTRY_DSN=
BETTERSTACK_TOKEN=

# Feature Flags
ENABLE_TESTNET_FEATURES=true
DEBUG_MODE=true
```

## Verification Checklist

Run these commands to verify your setup:

```bash
# Node.js & Package Manager
node --version
yarn --version

# Git
git --version

# Docker
docker --version
docker-compose --version
docker ps

# Hardhat
npx hardhat --version

# zkSync CLI
zksync-cli --version

# AWS CLI (optional)
aws --version

# Terraform (optional)
terraform --version

# PostgreSQL Client (optional)
psql --version
```

## Troubleshooting

### Node.js Version Issues

```bash
# Use nvm to manage Node versions
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node 20
nvm install 20
nvm use 20
nvm alias default 20
```

### Docker Permission Issues (Linux)

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again, or:
newgrp docker
```

### macOS ARM (M1/M2) Specific

```bash
# Some packages may need Rosetta
softwareupdate --install-rosetta

# Use arch flag if needed
arch -x86_64 brew install some-package
```

### WSL2 (Windows)

```bash
# Enable WSL2
wsl --install

# Install Ubuntu
wsl --install -d Ubuntu-22.04

# All commands should run in WSL terminal
```

## Next Steps

Once all prerequisites are installed and verified:

1. **[Quick Start](/technical/getting-started/quick-start)**: Get the project running
2. **[Environment Setup](/technical/getting-started/environment-setup)**: Configure your development environment

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs)
- [Docker Documentation](https://docs.docker.com)
- [zkSync Documentation](https://era.zksync.io/docs)
- [Hardhat Documentation](https://hardhat.org/docs)

---

*Need help? Join our [Discord](https://discord.gg/toss) #dev-support channel.*

