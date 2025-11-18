# API Reference Overview

Welcome to the TOSS API Reference. This section will contain comprehensive documentation for all TOSS Protocol APIs, SDKs, and integration points.

:::info Coming Soon
The TOSS API is currently under development. This section will be populated with complete API documentation upon release.
:::

## Planned API Categories

### REST API

**Purpose**: HTTP-based API for querying protocol data and submitting operations

**Endpoints** (Planned):
```
GET    /api/v1/funds                    # List all funds
GET    /api/v1/funds/:id                # Get fund details
GET    /api/v1/funds/:id/nav            # Get fund NAV history
GET    /api/v1/funds/:id/performance    # Get fund performance metrics
POST   /api/v1/funds/:id/deposit        # Deposit to fund
POST   /api/v1/funds/:id/withdraw       # Withdraw from fund
```

[Learn More →](/api/rest/introduction)

### Smart Contract ABIs

**Purpose**: Application Binary Interfaces for direct contract interaction

**Contracts** (Planned):
- TOSS Token
- FundFactory
- FundManagerVault
- RiskEngine
- DAOGovernance

[Learn More →](/api/abis/overview)

### SDK Reference

**Purpose**: JavaScript/TypeScript SDK for easy integration

**Features** (Planned):
```typescript
import { TOSSClient } from '@toss/sdk';

const client = new TOSSClient({ network: 'mainnet' });

// Query funds
const funds = await client.funds.list();

// Deposit to fund
await client.funds.deposit(fundId, amount);
```

[Learn More →](/api/sdk/overview)

### WebSocket Events

**Purpose**: Real-time event streaming for live updates

**Events** (Planned):
```typescript
// Subscribe to fund updates
client.on('nav-updated', (fundId, newNAV) => {
  console.log(`Fund ${fundId} NAV: ${newNAV}`);
});

// Subscribe to trades
client.on('trade-executed', (fundId, trade) => {
  console.log(`Trade executed:`, trade);
});
```

[Learn More →](/api/websocket/overview)

## Quick Start (Coming Soon)

```typescript
// Install SDK
npm install @toss/sdk

// Initialize client
import { TOSSClient } from '@toss/sdk';

const client = new TOSSClient({
  network: 'testnet',
  privateKey: process.env.PRIVATE_KEY,
});

// Get fund data
const fund = await client.funds.get(fundId);
console.log('Fund NAV:', fund.nav);
console.log('Performance:', fund.performance);
```

## Authentication (Planned)

```typescript
// Wallet-based authentication
const client = new TOSSClient({
  signer: wallet,  // ethers.js wallet
});

// API key authentication (for read-only)
const client = new TOSSClient({
  apiKey: process.env.TOSS_API_KEY,
});
```

## Rate Limits (Planned)

```
Tier          Requests/min    WebSocket Connections
──────────────────────────────────────────────────────
Free          60              1
Developer     600             5
Professional  6000            50
Enterprise    Custom          Custom
```

## Developer Resources

### Documentation Status

| Section | Status | ETA |
|---------|--------|-----|
| REST API | Coming Soon | Q2 2025 |
| Smart Contract ABIs | In Progress | Q1 2025 |
| SDK Reference | Coming Soon | Q2 2025 |
| WebSocket Events | Planned | Q3 2025 |

### Support

While API documentation is being developed, you can:

- **Protocol Specs**: [Protocol Documentation](/protocol/intro)
- **Technical Guide**: [Technical Documentation](/technical/intro)
- **Discord**: [discord.gg/toss](https://discord.gg/toss) #api-dev
- **GitHub**: [github.com/toss/sdk](https://github.com/toss/sdk)

## Newsletter

Subscribe to get notified when the API launches:

[Subscribe to API Updates →](https://toss.finance/api-newsletter)

---

*This API reference will be continuously updated as features become available.*
