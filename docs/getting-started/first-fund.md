---
sidebar_position: 3
---

# Creating Your First Fund

Learn how to create and configure your first crypto fund in TOSS.

## Understanding Funds

A fund in TOSS is a portfolio of crypto assets managed according to a specific strategy. Each fund has:

- **Name**: A unique identifier for the fund
- **Base Currency**: The currency used for valuation (USD, EUR, BTC, ETH)
- **Strategy**: Investment approach (conservative, balanced, aggressive, or custom)
- **Holdings**: The crypto assets in the portfolio
- **Performance Metrics**: Historical data and analytics

## Step-by-Step Guide

### 1. Plan Your Fund

Before creating a fund, consider:

- **Investment Goals**: What are you trying to achieve?
- **Risk Tolerance**: How much volatility can you accept?
- **Time Horizon**: Short-term trading or long-term holding?
- **Asset Selection**: Which cryptocurrencies to include?

### 2. Choose a Strategy

TOSS offers four built-in strategies:

#### Conservative
- Low risk, stable growth
- Focus on established coins (BTC, ETH)
- Higher stablecoin allocation (30-40%)
- Best for: Capital preservation

#### Balanced
- Moderate risk and growth potential
- Mix of major and mid-cap coins
- Moderate stablecoin allocation (15-25%)
- Best for: Steady growth with manageable risk

#### Aggressive
- High risk, high potential returns
- Includes smaller-cap coins
- Low stablecoin allocation (5-10%)
- Best for: Maximum growth, high risk tolerance

#### Custom
- Define your own allocation
- Full control over asset selection
- Requires manual rebalancing
- Best for: Experienced traders

### 3. Create the Fund

#### Using CLI

```bash
toss fund:create \
  --name "Growth Portfolio" \
  --description "Long-term crypto growth fund" \
  --currency USD \
  --strategy balanced \
  --initial-deposit 10000
```

#### Using API

```javascript
const response = await fetch('http://localhost:3000/api/v1/funds', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Growth Portfolio',
    description: 'Long-term crypto growth fund',
    currency: 'USD',
    strategy: 'balanced',
    initialDeposit: 10000
  })
});

const fund = await response.json();
console.log('Fund created:', fund.id);
```

#### Using Web Interface

1. Log in to the TOSS dashboard
2. Click **Funds** in the sidebar
3. Click **Create New Fund**
4. Fill in the form:

```
Name: Growth Portfolio
Description: Long-term crypto growth fund
Base Currency: USD
Strategy: Balanced
Initial Deposit: $10,000
```

5. Click **Create Fund**

### 4. Configure Fund Settings

After creation, configure additional settings:

```bash
toss fund:configure FUND_ID \
  --rebalance-frequency weekly \
  --max-position-size 25 \
  --stop-loss 15 \
  --take-profit 50
```

Settings explained:
- `rebalance-frequency`: How often to rebalance (daily, weekly, monthly)
- `max-position-size`: Maximum allocation to a single asset (%)
- `stop-loss`: Automatic sell trigger at loss threshold (%)
- `take-profit`: Automatic sell trigger at profit threshold (%)

### 5. Add Initial Holdings

Add your first assets:

```bash
# Buy Bitcoin
toss transaction:create \
  --fund-id FUND_ID \
  --type buy \
  --asset BTC \
  --amount 0.2 \
  --price 45000

# Buy Ethereum
toss transaction:create \
  --fund-id FUND_ID \
  --type buy \
  --asset ETH \
  --amount 3 \
  --price 2500

# Deposit stablecoins
toss transaction:create \
  --fund-id FUND_ID \
  --type deposit \
  --asset USDT \
  --amount 2000
```

### 6. Verify Your Fund

Check the fund status:

```bash
toss fund:view --id FUND_ID
```

Expected output:

```
📊 Fund: Growth Portfolio
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ID: abc123...
Strategy: Balanced
Base Currency: USD

💰 Current Value: $17,500.00
📈 24h Change: +2.3%
🎯 Total Return: +75.0%

📦 Holdings:
  BTC  0.2000  $9,000.00  51.4%
  ETH  3.0000  $7,500.00  42.9%
  USDT 2000.00 $1,000.00   5.7%

⚙️ Settings:
  Rebalance: Weekly
  Max Position: 25%
  Stop Loss: 15%
  Take Profit: 50%
```

## Best Practices

### Diversification

Don't put all eggs in one basket:

```bash
# Good: Diversified portfolio
BTC: 40%
ETH: 30%
Major Alts: 20%
Stablecoins: 10%

# Risky: Over-concentrated
BTC: 95%
Stablecoins: 5%
```

### Regular Rebalancing

Maintain your target allocation:

```bash
# Set up automated rebalancing
toss fund:configure FUND_ID --rebalance-frequency weekly

# Or manual rebalancing
toss portfolio:rebalance --fund-id FUND_ID
```

### Risk Management

Always set stop-losses:

```bash
toss fund:configure FUND_ID \
  --stop-loss 15 \
  --position-limit 25
```

### Performance Monitoring

Regularly review your fund:

```bash
# Daily quick check
toss fund:view --id FUND_ID

# Weekly detailed analysis
toss analytics:summary --fund-id FUND_ID --period 7d

# Monthly report
toss report:generate --fund-id FUND_ID --type monthly
```

## Common Mistakes to Avoid

:::danger Over-Trading
Frequent buying and selling increases fees and reduces returns. Stick to your strategy.
:::

:::warning Emotional Decisions
Don't panic sell during dips or FOMO buy during pumps. Follow your plan.
:::

:::caution Ignoring Fees
Transaction fees add up. Consider them in your strategy.
:::

## Next Steps

Your fund is now set up! Continue learning:

- [Portfolio Tracking](/user-guide/portfolio-tracking)
- [Transaction Management](/user-guide/transactions)
- [Risk Management](/advanced/risk-management)
- [Analytics & Reporting](/user-guide/analytics)

## Examples

### Conservative Fund

```bash
toss fund:create \
  --name "Stable Growth" \
  --strategy conservative \
  --initial-deposit 50000

# Target allocation
toss portfolio:rebalance \
  --fund-id FUND_ID \
  --target "BTC:40,ETH:25,USDC:35"
```

### Aggressive Growth Fund

```bash
toss fund:create \
  --name "Moon Shot" \
  --strategy aggressive \
  --initial-deposit 10000

# Target allocation
toss portfolio:rebalance \
  --fund-id FUND_ID \
  --target "BTC:30,ETH:25,ALTS:40,USDC:5"
```

### DeFi Focus Fund

```bash
toss fund:create \
  --name "DeFi Portfolio" \
  --strategy custom \
  --initial-deposit 25000

# Target allocation
toss portfolio:rebalance \
  --fund-id FUND_ID \
  --target "ETH:35,AAVE:15,UNI:15,LINK:15,MKR:10,USDC:10"
```

## Getting Help

Questions about fund creation?

- [FAQ](/faq)
- [Discord Community](https://discord.gg/toss)
- [Email Support](mailto:support@toss.finance)

