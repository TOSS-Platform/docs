# MCP Security Best Practices

## Overview

Security guidelines for using TOSS MCP integration safely and protecting your funds.

## Authentication

### Token Management

- **Use Read-Only Tokens**: For query operations, use read-only tokens
- **Limit Write Permissions**: Only grant write permissions when necessary
- **Rotate Tokens Regularly**: Change tokens every 90 days
- **Never Share Tokens**: Keep tokens secure, never commit to repositories

### Token Scopes

```
Read-Only Token:
- Can query fund data
- Can view portfolio
- Cannot execute trades
- Cannot modify settings

Write Token:
- Can execute trades
- Can create proposals
- Can modify fund settings
- Use with caution
```

## Connection Security

### Use HTTPS/WSS

Always use encrypted connections:

```
✅ Correct: https://mcp.toss.fi
✅ Correct: wss://mcp.toss.fi
❌ Wrong: http://mcp.toss.fi
❌ Wrong: ws://mcp.toss.fi
```

### Verify SSL Certificates

Ensure SSL certificates are valid and trusted.

## AI Assistant Safety

### Verify Before Execute

AI assistants should always:
- Show you what they plan to do
- Wait for confirmation on write operations
- Warn about risks before execution

### Set Spending Limits

Configure maximum amounts for AI-executed operations:

```
Max Trade Amount: $10,000
Max Withdrawal: $5,000
Require Confirmation: Always
```

## Access Control

### Principle of Least Privilege

Grant only minimum necessary permissions:

```
❌ Don't: Grant full admin access to AI assistant
✅ Do: Grant specific tool permissions for specific tasks
```

### Monitor Activity

Regularly review:
- AI-executed operations
- Token usage logs
- Unusual activity patterns

## Best Practices

### 1. Use Session Keys

For trading operations, use session keys instead of main wallet:

```
Main Wallet: Long-term storage
Session Key: Trading operations (time-limited)
```

### 2. Implement Rate Limiting

Limit request frequency to prevent abuse:

```
Max Requests: 100/minute
Cooldown Period: 1 second between requests
```

### 3. Audit Logging

Enable complete audit logging:

```
Log all operations
Log all queries
Log all errors
Retain logs for 90 days
```

### 4. Regular Reviews

- Review AI operations weekly
- Check token permissions monthly
- Update security settings quarterly

## Incident Response

### If Token Compromised

1. Revoke token immediately
2. Review all operations since compromise
3. Rotate all tokens
4. Report to security team

### If Unauthorized Operation Detected

1. Pause all AI operations
2. Review operation logs
3. Revert if possible
4. Strengthen security measures

## Security Checklist

- [ ] Using HTTPS/WSS for all connections
- [ ] Read-only tokens for queries
- [ ] Write tokens only when necessary
- [ ] Spending limits configured
- [ ] Confirmation required for writes
- [ ] Audit logging enabled
- [ ] Regular security reviews scheduled

---

**Related**: [MCP Setup](/mcp/setup), [AI Integration](/mcp/ai-integration), [Protocol Security](/protocol/security/overview)

