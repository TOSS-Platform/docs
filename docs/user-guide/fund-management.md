---
sidebar_position: 2
---

# Fund Management

Learn how to effectively manage your crypto funds in TOSS.

## Creating Funds

Create new funds for different investment strategies:

```bash
toss fund:create --name "My Fund" --currency USD --strategy balanced
```

See [Creating Your First Fund](/getting-started/first-fund) for detailed instructions.

## Managing Funds

### View Fund Details

```bash
toss fund:view --id FUND_ID
```

### Update Fund Settings

```bash
toss fund:update FUND_ID --strategy aggressive
```

### Close Fund

```bash
toss fund:close FUND_ID --reason "End of investment period"
```

## Fund Strategies

- **Conservative**: Low risk, stable growth
- **Balanced**: Moderate risk and returns
- **Aggressive**: High risk, high potential
- **Custom**: Define your own rules

## Best Practices

- Diversify across multiple funds
- Review performance regularly
- Adjust strategies based on market conditions
- Keep detailed records

## Next Steps

- [Portfolio Tracking](/user-guide/portfolio-tracking)
- [Transactions](/user-guide/transactions)

