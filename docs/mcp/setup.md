---
sidebar_position: 3
---

# MCP Setup Guide

Enable and configure the MCP server in TOSS.

## Prerequisites

Before setting up MCP, ensure you have:

- TOSS installed and running (see [Installation Guide](/getting-started/installation))
- Node.js 18+ installed
- A MCP-compatible AI assistant (recommended: Claude Desktop)

## Step 1: Enable MCP Server

### Using CLI

Enable the MCP server:

```bash
toss mcp:enable
```

This command will:
- Start the MCP server (default port: 3001)
- Generate initial configuration
- Create default permissions

### Manual Configuration

Alternatively, edit your `.env` file:

```bash
# Enable MCP
MCP_ENABLED=true

# MCP Server Port
MCP_PORT=3001

# MCP Transport (http or stdio)
MCP_TRANSPORT=http

# MCP Base URL
MCP_BASE_URL=http://localhost:3001
```

Then restart TOSS:

```bash
toss restart
```

## Step 2: Verify MCP Server

Check that the MCP server is running:

```bash
toss mcp:status
```

Expected output:

```
✓ MCP Server: Running
  Port: 3001
  Transport: HTTP
  Tools: 20 available
  Resources: 15 available
  Active Tokens: 0
```

Test the server:

```bash
curl http://localhost:3001/mcp/v1/tools/list
```

## Step 3: Create Access Token

Create a token for your AI assistant:

```bash
toss mcp:token:create \
  --name "Claude Desktop" \
  --permissions read,write \
  --description "My primary AI assistant"
```

Output:

```
✓ Token created successfully

Token: mcp_7h9j2k4l5m6n8p9q0r1s2t3u4v5w6x7y
Name: Claude Desktop
Permissions: read, write
Created: 2024-01-01T10:00:00Z

⚠️  Save this token securely. It won't be shown again!
```

:::warning Save Your Token
The token is only shown once. Save it in a secure location (password manager, environment variable).
:::

### Token Permissions

Choose appropriate permissions:

#### Read-Only (Safe for experimentation)

```bash
toss mcp:token:create --name "AI Analyst" --permissions read
```

Can:
- View funds
- Read transactions
- Check portfolio
- Generate reports

Cannot:
- Create funds
- Execute trades
- Modify settings

#### Read-Write (Standard use)

```bash
toss mcp:token:create --name "AI Manager" --permissions read,write
```

Can:
- Everything in read-only
- Create funds
- Execute trades
- Rebalance portfolios

Cannot:
- Delete funds
- Modify system settings

#### Admin (Full control)

```bash
toss mcp:token:create --name "AI Admin" --permissions read,write,admin
```

Can do everything, including:
- Close funds
- Modify system settings
- Manage other tokens

:::danger Use Admin Carefully
Admin tokens have full control. Only create them when absolutely necessary.
:::

## Step 4: Configure Transport

TOSS MCP supports two transport methods:

### HTTP Transport (Recommended)

Best for network-based AI assistants:

```bash
# .env
MCP_TRANSPORT=http
MCP_PORT=3001
MCP_HOST=0.0.0.0  # Listen on all interfaces
```

### Stdio Transport

Best for local AI assistants (like Claude Desktop):

```bash
# .env
MCP_TRANSPORT=stdio
```

Configure stdio in your AI assistant:

```json
{
  "mcpServers": {
    "toss": {
      "command": "toss",
      "args": ["mcp:serve"],
      "env": {
        "TOSS_CONFIG": "/path/to/toss/config"
      }
    }
  }
}
```

## Step 5: Test Connection

### Using MCP Inspector

Install MCP Inspector:

```bash
npx @modelcontextprotocol/inspector
```

Connect to TOSS:

```
Server URL: http://localhost:3001
Token: mcp_your_token_here
```

Try listing tools:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

### Using curl

Test basic connectivity:

```bash
# List tools
curl -X POST http://localhost:3001/mcp/v1/tools/list \
  -H "Authorization: Bearer mcp_your_token" \
  -H "Content-Type: application/json"

# Call a tool
curl -X POST http://localhost:3001/mcp/v1/tools/call \
  -H "Authorization: Bearer mcp_your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "list_funds",
      "arguments": {}
    },
    "id": 2
  }'
```

## Step 6: Security Configuration

### Enable HTTPS

For production, use HTTPS:

```bash
# .env
MCP_PROTOCOL=https
MCP_SSL_CERT=/path/to/cert.pem
MCP_SSL_KEY=/path/to/key.pem
```

### Configure CORS

Allow specific origins:

```bash
# .env
MCP_CORS_ORIGINS=https://claude.ai,https://yourdomain.com
```

### Rate Limiting

Prevent abuse:

```bash
# .env
MCP_RATE_LIMIT_ENABLED=true
MCP_RATE_LIMIT_REQUESTS=100  # per minute
MCP_RATE_LIMIT_WINDOW=60000  # milliseconds
```

### IP Whitelisting

Restrict access to specific IPs:

```bash
# .env
MCP_IP_WHITELIST=127.0.0.1,192.168.1.100
```

## Step 7: Configure Logging

Enable detailed logging for debugging:

```bash
# .env
MCP_LOG_LEVEL=debug
MCP_LOG_FILE=/var/log/toss/mcp.log
MCP_LOG_REQUESTS=true
MCP_LOG_RESPONSES=true
```

View logs:

```bash
# Real-time logs
toss mcp:logs --follow

# Filter by level
toss mcp:logs --level error

# Filter by token
toss mcp:logs --token mcp_abc123...
```

## Advanced Configuration

### Custom Tool Permissions

Limit tokens to specific tools:

```bash
toss mcp:token:create \
  --name "Fund Creator" \
  --permissions read,write \
  --tools create_fund,get_fund,list_funds
```

### Fund-Specific Access

Restrict token to specific funds:

```bash
toss mcp:token:create \
  --name "Growth Fund AI" \
  --permissions read,write \
  --funds fund-id-1,fund-id-2
```

### Spending Limits

Set maximum transaction sizes:

```bash
toss mcp:token:update mcp_abc123... \
  --max-transaction-size 10000 \
  --max-daily-volume 50000
```

### Expiration

Create temporary tokens:

```bash
toss mcp:token:create \
  --name "Temporary Access" \
  --permissions read \
  --expires-in 7d  # 7 days
```

## Token Management

### List Tokens

```bash
toss mcp:token:list
```

### View Token Details

```bash
toss mcp:token:view mcp_abc123...
```

### Update Token

```bash
toss mcp:token:update mcp_abc123... \
  --permissions read \
  --description "Read-only access"
```

### Revoke Token

```bash
toss mcp:token:revoke mcp_abc123...
```

### Rotate Token

```bash
toss mcp:token:rotate mcp_abc123...
```

## Troubleshooting

### MCP Server Won't Start

Check port availability:

```bash
lsof -i :3001
```

Try different port:

```bash
toss mcp:enable --port 3002
```

### Connection Refused

Check firewall:

```bash
# Linux
sudo ufw allow 3001

# macOS
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add toss
```

### Authentication Failed

Verify token:

```bash
toss mcp:token:verify mcp_abc123...
```

Check token hasn't expired:

```bash
toss mcp:token:view mcp_abc123...
```

### Tools Not Available

Refresh tool registry:

```bash
toss mcp:refresh
```

Verify TOSS is running:

```bash
toss status
```

## Next Steps

MCP server is now configured! Continue with:

1. [Connect Your AI Assistant](/mcp/ai-integration)
2. [Explore Available Tools](/mcp/tools/overview)
3. [Try Example Prompts](/mcp/examples/ai-prompts)
4. [Security Best Practices](/mcp/advanced/security)

## Configuration Reference

Complete `.env` reference for MCP:

```bash
# Basic Settings
MCP_ENABLED=true
MCP_PORT=3001
MCP_TRANSPORT=http
MCP_PROTOCOL=https

# Security
MCP_SSL_CERT=/path/to/cert.pem
MCP_SSL_KEY=/path/to/key.pem
MCP_CORS_ORIGINS=*
MCP_IP_WHITELIST=

# Rate Limiting
MCP_RATE_LIMIT_ENABLED=true
MCP_RATE_LIMIT_REQUESTS=100
MCP_RATE_LIMIT_WINDOW=60000

# Logging
MCP_LOG_LEVEL=info
MCP_LOG_FILE=/var/log/toss/mcp.log
MCP_LOG_REQUESTS=false
MCP_LOG_RESPONSES=false

# Timeouts
MCP_REQUEST_TIMEOUT=30000
MCP_TOOL_TIMEOUT=60000
```

