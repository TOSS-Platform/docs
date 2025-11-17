---
sidebar_position: 1
---

# Installation

Get TOSS up and running on your system in minutes.

## Prerequisites

Before installing TOSS, ensure you have:

- **Node.js**: Version 18.x or higher
- **npm** or **yarn**: Latest stable version
- **Database**: PostgreSQL 14+ or MongoDB 6+
- **Operating System**: Linux, macOS, or Windows (WSL recommended)

## Installation Methods

### Option 1: NPM Package (Recommended)

Install TOSS globally using npm:

```bash
npm install -g @toss/cli
```

Or using yarn:

```bash
yarn global add @toss/cli
```

Verify the installation:

```bash
toss --version
```

### Option 2: Docker

Run TOSS using Docker:

```bash
docker pull toss/toss:latest
docker run -d -p 3000:3000 toss/toss:latest
```

Or use Docker Compose:

```bash
# Download docker-compose.yml
curl -O https://raw.githubusercontent.com/toss/toss/main/docker-compose.yml

# Start services
docker-compose up -d
```

### Option 3: From Source

Clone and build from source:

```bash
# Clone repository
git clone https://github.com/toss/toss.git
cd toss

# Install dependencies
npm install

# Build
npm run build

# Start
npm start
```

## Configuration

### Environment Variables

Create a `.env` file in your TOSS directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/toss
# or for MongoDB
# DATABASE_URL=mongodb://localhost:27017/toss

# API Keys
TOSS_API_KEY=your-secret-api-key
JWT_SECRET=your-jwt-secret

# Blockchain RPC URLs
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR-KEY
BTC_RPC_URL=https://btc-mainnet.example.com

# Optional: MCP Integration
MCP_ENABLED=true
MCP_PORT=3001
```

### Database Setup

Initialize the database:

```bash
toss db:init
```

Run migrations:

```bash
toss db:migrate
```

### First-time Setup

Run the setup wizard:

```bash
toss setup
```

This will guide you through:

1. Creating an admin account
2. Configuring blockchain connections
3. Setting up API keys
4. Enabling optional features

## Verify Installation

Check that everything is working:

```bash
# Check system status
toss status

# Run health check
toss health

# Test database connection
toss db:ping
```

Expected output:

```
✓ TOSS Core: Running
✓ Database: Connected
✓ API Server: Listening on port 3000
✓ MCP Server: Listening on port 3001
```

## Update TOSS

Keep TOSS up to date:

```bash
# Using npm
npm update -g @toss/cli

# Using Docker
docker pull toss/toss:latest
docker-compose restart
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, change it in `.env`:

```bash
PORT=3001
```

### Database Connection Issues

Verify your database is running:

```bash
# PostgreSQL
psql -h localhost -U postgres -c "SELECT 1"

# MongoDB
mongosh --eval "db.runCommand({ ping: 1 })"
```

### Permission Errors

On Linux/macOS, you may need sudo:

```bash
sudo npm install -g @toss/cli
```

Or configure npm to use a different prefix:

```bash
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

## Platform-Specific Notes

### Windows (WSL)

We recommend using Windows Subsystem for Linux:

```bash
# Enable WSL2
wsl --install

# Install Ubuntu
wsl --install -d Ubuntu

# Then follow Linux instructions
```

### macOS

Install Homebrew first, then:

```bash
brew install node postgresql
npm install -g @toss/cli
```

### Linux

For Ubuntu/Debian:

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install TOSS
sudo npm install -g @toss/cli
```

## Next Steps

Now that TOSS is installed, you're ready to:

- [Create your first fund](/docs/getting-started/first-fund)
- [Explore the API](/docs/api/overview)
- [Set up MCP integration](/docs/mcp/setup)

## Getting Help

If you encounter issues:

- Check our [Troubleshooting Guide](/docs/troubleshooting)
- Join our [Discord Community](https://discord.gg/toss)
- Email support: support@toss.finance

