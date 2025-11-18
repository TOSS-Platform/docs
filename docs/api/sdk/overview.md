# SDK Reference

:::info Coming Soon
The TOSS SDK is currently under development.
:::

## Planned SDK Features

```typescript
import { TOSSClient } from '@toss/sdk';

// Initialize
const client = new TOSSClient({ network: 'mainnet' });

// Query funds
const funds = await client.funds.list();

// Deposit
await client.funds.deposit(fundId, amount);

// Get NAV
const nav = await client.funds.getNAV(fundId);
```

## Installation (Coming Soon)

```bash
npm install @toss/sdk
# or
yarn add @toss/sdk
```

---

[Back to API Overview](/api/overview)

