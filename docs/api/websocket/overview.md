# WebSocket Events

:::info Coming Soon
Real-time event streaming will be available in a future release.
:::

## Planned Events

```typescript
// NAV updates
client.on('nav-updated', (fundId, newNAV) => {});

// Trades
client.on('trade-executed', (fundId, trade) => {});

// Governance
client.on('proposal-created', (proposal) => {});
```

---

[Back to API Overview](/api/overview)

