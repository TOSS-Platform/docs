# Cursor IDE Setup with TOSS MCP

Step-by-step guide to add TOSS MCP to Cursor IDE.

## Prerequisites

- Cursor IDE installed
- Access to TOSS documentation (production or staging)

## Setup Steps

### 1. Open Cursor Settings

1. Open Cursor
2. Press `Cmd/Ctrl + ,` (Settings)
3. Or from menu: **Cursor** → **Settings** (macOS) / **File** → **Preferences** → **Settings** (Windows/Linux)

### 2. Find MCP Settings

Type `mcp` in the Settings search box or navigate directly to MCP settings.

### 3. Add MCP Server

MCP settings in Cursor are typically stored in `settings.json`. To edit directly:

1. Press `Cmd/Ctrl + Shift + P`
2. Type "Preferences: Open User Settings (JSON)" and select it

### 4. TOSS MCP Configuration

Add the following configuration to your `settings.json` file:

#### Production Environment (Recommended)

```json
{
  "mcp.servers": {
    "toss-docs": {
      "name": "TOSS Documentation (Production)",
      "description": "TOSS Protocol documentation and resources",
      "type": "http",
      "url": "https://docs.toss.fi",
      "endpoints": {
        "manifest": "https://docs.toss.fi/mcp-version.json",
        "resources": "https://docs.toss.fi/mcp-resources.json",
        "baseUrl": "https://docs.toss.fi/"
      },
      "enabled": true
    }
  }
}
```

#### Staging Environment (For Testing)

```json
{
  "mcp.servers": {
    "toss-docs-staging": {
      "name": "TOSS Documentation (Staging)",
      "description": "TOSS Protocol documentation and resources - Staging",
      "type": "http",
      "url": "https://staging.docs.toss.fi",
      "endpoints": {
        "manifest": "https://staging.docs.toss.fi/mcp-version.json",
        "resources": "https://staging.docs.toss.fi/mcp-resources.json",
        "baseUrl": "https://staging.docs.toss.fi/"
      },
      "enabled": true
    }
  }
}
```

#### Both Environments

```json
{
  "mcp.servers": {
    "toss-docs": {
      "name": "TOSS Documentation (Production)",
      "description": "TOSS Protocol documentation and resources",
      "type": "http",
      "url": "https://docs.toss.fi",
      "endpoints": {
        "manifest": "https://docs.toss.fi/mcp-version.json",
        "resources": "https://docs.toss.fi/mcp-resources.json",
        "baseUrl": "https://docs.toss.fi/"
      },
      "enabled": true
    },
    "toss-docs-staging": {
      "name": "TOSS Documentation (Staging)",
      "description": "TOSS Protocol documentation and resources - Staging",
      "type": "http",
      "url": "https://staging.docs.toss.fi",
      "endpoints": {
        "manifest": "https://staging.docs.toss.fi/mcp-version.json",
        "resources": "https://staging.docs.toss.fi/mcp-resources.json",
        "baseUrl": "https://staging.docs.toss.fi/"
      },
      "enabled": false
    }
  }
}
```

## Alternative: Add via Cursor UI

If you prefer to add via Cursor UI:

1. **Settings** → **Features** → **Model Context Protocol (MCP)**
2. Click **Add Server** button
3. Enter the following information:

### For Production:

- **Server Name**: `TOSS Documentation`
- **Server Type**: `HTTP`
- **Base URL**: `https://docs.toss.fi`
- **Manifest URL**: `https://docs.toss.fi/mcp-version.json`
- **Resources URL**: `https://docs.toss.fi/mcp-resources.json`
- **Enabled**: ✅ (checked)

### For Staging:

- **Server Name**: `TOSS Documentation (Staging)`
- **Server Type**: `HTTP`
- **Base URL**: `https://staging.docs.toss.fi`
- **Manifest URL**: `https://staging.docs.toss.fi/mcp-version.json`
- **Resources URL**: `https://staging.docs.toss.fi/mcp-resources.json`
- **Enabled**: ✅ (checked)

## Testing

### 1. Restart Cursor

After saving settings, close and reopen Cursor.

### 2. Check MCP Connection

1. Press `Cmd/Ctrl + Shift + P`
2. Type "MCP: Check Servers"
3. Verify that TOSS MCP server shows as **Connected**

### 3. Test Query

Try the following query in Cursor Chat:

```
How does RiskEngine work in the TOSS protocol?
```

or

```
What is the fund creation process in TOSS?
```

AI should respond using information from TOSS documentation.

## Usage Examples

### 1. Documentation Queries

```
User: "What are the responsibilities of a Fund Manager in TOSS?"
AI: [Responds using TOSS documentation]
```

### 2. Process Understanding

```
User: "Explain the fund creation steps"
AI: [Extracts and explains the fund creation process step-by-step from TOSS documentation]
```

### 3. Contract Details

```
User: "What are the functions of the RiskEngine contract?"
AI: [Uses RiskEngine contract documentation to provide function list]
```

### 4. Tokenomics

```
User: "How is the TOSS tokenomics structure?"
AI: [Explains the three-layer architecture using TOSS tokenomics documentation]
```

## MCP Resources Access

Cursor can access the following TOSS MCP resources:

### Documentation Resources (110+)

- Protocol contracts (31 contracts)
- Processes and workflows (30+ processes)
- Governance documentation
- Tokenomics documentation
- API references
- Technical documentation

### URI Format

```
toss://{category}/{subcategory}/{page}
```

Examples:
- `toss://protocol/contracts/risk/RiskEngine`
- `toss://protocol/processes/fund-manager/create-fund`
- `toss://protocol/governance/overview`
- `toss://protocol/tokenomics/immutable-layer`

## Troubleshooting

### MCP Server Won't Connect

1. **Check your internet connection**
   ```bash
   curl https://docs.toss.fi/mcp-version.json
   ```

2. **Verify Manifest URL**
   - Production: `https://docs.toss.fi/mcp-version.json`
   - Staging: `https://staging.docs.toss.fi/mcp-version.json`

3. **Restart Cursor**

4. **Check Settings**
   - `mcp.servers.toss-docs.enabled: true` should be set

### Resources Not Accessible

1. **Check Base URL**
   - Production: `https://docs.toss.fi/`
   - Staging: `https://staging.docs.toss.fi/`

2. **Example URI resolution**
   ```
   toss://protocol/contracts/risk/RiskEngine
   → https://docs.toss.fi/protocol/contracts/risk/RiskEngine.md
   ```

3. **Manual test**
   ```bash
   curl https://docs.toss.fi/protocol/contracts/risk/RiskEngine.md
   ```

### AI Not Providing TOSS Information

1. **Ensure MCP server is active**
   - Settings → MCP → TOSS Documentation → Enabled ✅

2. **Make query more specific**
   - ❌ "What is TOSS?" (too general)
   - ✅ "What is the fund creation process in TOSS protocol?" (specific)

3. **Check MCP logs**
   - Cursor → View → Output → Select MCP logs

## Recommendations

### Production vs Staging

- **Production**: Current, stable documentation
- **Staging**: New features for testing and development

### Best Practices

1. **Use Production as default**
2. **Enable Staging for testing**
3. **Don't enable both simultaneously** (may cause confusion)
4. **Check for regular updates**

## Additional Resources

- [MCP Overview](/mcp-integration/overview)
- [MCP Integration Guide](/mcp-integration/integration-guide)
- [MCP Resources](/mcp-integration/resources/overview)
- [MCP Tools](/mcp-integration/tools/overview)

---

**Next Step**: [MCP Usage Examples](/mcp-integration/examples/overview)
