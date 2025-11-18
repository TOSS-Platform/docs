# Environment Setup

## Overview

Complete guide to setting up your development environment for TOSS.

## Prerequisites

### Required Tools

- **Node.js**: v20.18.0 (LTS)
- **npm**: v10+ or **yarn**: v1.22+
- **Git**: Latest version
- **Docker**: For local development (optional)

### Verify Installation

```bash
node --version  # Should be v20.18.0
npm --version   # Should be v10+
git --version   # Latest
```

## Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/toss/protocol.git
cd protocol
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy environment template:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
RPC_URL=https://sepolia.era.zksync.network
PRIVATE_KEY=your_private_key_here
```

### 4. Run Local Development

```bash
npm run dev
```

## Development Tools

### Code Quality

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking

### Testing

```bash
npm run test        # Run all tests
npm run test:unit   # Unit tests only
npm run test:integration  # Integration tests
```

### Building

```bash
npm run build       # Build for production
npm run build:dev   # Development build
```

---

**Related**: [Prerequisites](/technical/getting-started/prerequisites), [Quick Start](/technical/getting-started/quick-start), [Technical Intro](/technical/intro)
