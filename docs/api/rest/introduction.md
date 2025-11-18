# REST API Introduction

:::info Coming Soon
The TOSS REST API is currently under development. Documentation will be available upon release.
:::

## Overview

The TOSS REST API will provide HTTP-based access to protocol data and operations.

## Planned Features

- Query fund data and performance
- Submit deposits and withdrawals
- Access historical data
- Manage investor profiles
- Query governance proposals

## Base URL (Planned)

```
Production:  https://api.toss.finance/v1
Testnet:     https://api-testnet.toss.finance/v1
```

## Authentication (Planned)

```bash
# API Key
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.toss.finance/v1/funds

# Wallet Signature
curl -H "X-Wallet-Address: 0x..." \
     -H "X-Signature: 0x..." \
  https://api.toss.finance/v1/funds/123/deposit
```

## Example Endpoints (Planned)

```
GET    /funds
GET    /funds/:id
GET    /funds/:id/nav
GET    /funds/:id/trades
POST   /funds/:id/deposit
POST   /funds/:id/withdraw
GET    /investors/:address
GET    /governance/proposals
```

Stay tuned for full API documentation!

---

[Back to API Overview](/api/overview)

