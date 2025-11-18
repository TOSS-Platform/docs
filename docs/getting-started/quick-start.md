---
sidebar_position: 2
---

# Quick Start

Get up and running with TOSS in 5 minutes.

## Step 1: Start TOSS

Start the TOSS server:

```bash
toss start
```

Or if using Docker:

```bash
docker-compose up -d
```

Open your browser and navigate to:

```
http://localhost:3000
```

## Step 2: Create an Account

On first launch, you'll be prompted to create an admin account:

```bash
toss user:create --admin
```

Follow the prompts to set:
- Email address
- Password
- Display name

## Step 3: Login

Login to access the dashboard:

```bash
toss login
```

Or use the web interface at `http://localhost:3000`

## Step 4: Create Your First Fund

### Using CLI

```bash
toss fund:create \
  --name "My Bitcoin Fund" \
  --currency BTC \
  --strategy balanced \
  --initial-deposit 1.0
```

### Using API

```bash
curl -X POST http://localhost:3000/api/v1/funds \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Bitcoin Fund",
    "currency": "BTC",
    "strategy": "balanced",
    "initialDeposit": 1.0
  }'
```

### Using Web Interface

1. Navigate to **Funds** > **Create New**
2. Enter fund details:
   - **Name**: My Bitcoin Fund
   - **Currency**: BTC
   - **Strategy**: Balanced
   - **Initial Deposit**: 1.0 BTC
3. Click **Create Fund**

## Step 5: Make Your First Transaction

Add some assets to your fund:

```bash
toss transaction:create \
  --fund-id YOUR_FUND_ID \
  --type buy \
  --asset ETH \
  --amount 10 \
  --price 2500
```

This creates a transaction to buy 10 ETH at $2,500 each.

## Step 6: View Your Portfolio

Check your portfolio status:

```bash
toss portfolio:view --fund-id YOUR_FUND_ID
```

Expected output:

```
📊 Portfolio Overview
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fund: My Bitcoin Fund
Total Value: $75,000.00
24h Change: +2.5%

Holdings:
  BTC: 1.0000 ($45,000.00) - 60%
  ETH: 10.0000 ($25,000.00) - 33%
  USD: $5,000.00 - 7%
```

## Step 7: Enable MCP (Optional)

Enable AI assistant integration:

```bash
toss mcp:enable
```

Test with Claude or another MCP-compatible AI:

```
User: Show me my Bitcoin fund performance

AI: Let me check your Bitcoin fund performance...

📊 My Bitcoin Fund Performance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current Value: $75,000.00
Initial Investment: $50,000.00
Total Return: +50.00%
30-day Return: +5.2%
```

## What's Next?

Now that you have TOSS running, explore these features:

### Learn More

- [Fund Management Guide](/user-guide/fund-management)
- [Portfolio Tracking](/user-guide/portfolio-tracking)
- [Transaction Management](/user-guide/transactions)
- [API Documentation](/api/overview)

### Advanced Features

- [Risk Management](/advanced/risk-management)
- [Custom Strategies](/advanced/custom-strategies)
- [Multi-signature Setup](/advanced/multi-sig)
- [Integrations](/advanced/integrations)

### AI Integration

- [MCP Protocol Overview](/mcp/protocol-overview)
- [AI Integration Guide](/mcp/ai-integration)
- [Example Prompts](/mcp/examples/ai-prompts)

## Common Tasks

### Check Fund Status

```bash
toss fund:list
toss fund:view --id FUND_ID
```

### View Transactions

```bash
toss transaction:list --fund-id FUND_ID
```

### Generate Report

```bash
toss report:generate --fund-id FUND_ID --type monthly
```

### Rebalance Portfolio

```bash
toss portfolio:rebalance --fund-id FUND_ID --target "BTC:50,ETH:30,USD:20"
```

## Tips & Best Practices

:::tip Secure Your API Keys
Always store your API keys in environment variables or a secure vault, never in code.
:::

:::caution Transaction Confirmations
Wait for blockchain confirmations before considering transactions as final.
:::

:::info Backup Your Data
Regularly backup your database and configuration files.
:::

## Getting Help

Need assistance?

- 📚 [User Guide](/user-guide/overview)
- 💬 [Discord Community](https://discord.gg/toss)
- 📧 [Email Support](mailto:support@toss.finance)
- 🐛 [Report Issues](https://github.com/toss/toss/issues)
