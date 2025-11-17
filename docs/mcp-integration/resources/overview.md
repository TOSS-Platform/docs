# MCP Resources Overview

MCP Resources expose TOSS documentation and protocol state for AI model consumption.

## MCP Endpoint URLs

### Production (`docs.toss.fi`)
- **Manifest**: `https://docs.toss.fi/mcp-version.json`
- **Resources**: `https://docs.toss.fi/mcp-resources.json`
- **Base URL**: `https://docs.toss.fi/docs/`

### Staging (`staging.docs.toss.fi`)
- **Manifest**: `https://staging.docs.toss.fi/mcp-version.json`
- **Resources**: `https://staging.docs.toss.fi/mcp-resources.json`
- **Base URL**: `https://staging.docs.toss.fi/docs/`

## Resource Types

### 1. Documentation Resources

**All 110+ documentation pages** available as MCP resources:

```
URI Pattern: toss://docs/{category}/{page}

Examples:
- toss://docs/protocol/contracts/RiskEngine
- toss://docs/protocol/processes/fund-manager/create-fund
- toss://docs/protocol/governance/overview
- toss://docs/protocol/tokenomics/immutable-layer
```

**URI Resolution**:
- `toss://docs/{path}` → `{baseUrl}{path}.md`
- Example: `toss://docs/protocol/contracts/RiskEngine`
  - Production: `https://docs.toss.fi/docs/protocol/contracts/RiskEngine.md`
  - Staging: `https://staging.docs.toss.fi/docs/protocol/contracts/RiskEngine.md`

**Format**: Markdown (text/markdown)

**AI Usage**:
```typescript
// AI retrieves documentation
// URI: toss://docs/protocol/contracts/RiskEngine
// Resolves to: https://docs.toss.fi/docs/protocol/contracts/RiskEngine.md
const docUri = resolveResourceUri("toss://docs/protocol/contracts/RiskEngine");
const doc = await fetch(docUri).then(r => r.text());
// AI can now answer questions about RiskEngine
```

### 2. Protocol State Resources

**Live protocol data**:

```
toss://state/funds/list - All funds
toss://state/funds/{id} - Specific fund
toss://state/governance/proposals - Active proposals
toss://state/config/parameters - Current DAO config
toss://state/investors/{address} - Investor profile
```

**Format**: JSON (application/json)

### 3. Template Resources

**Configuration templates**:

```
toss://templates/fund-config - Fund config template
toss://templates/proposal - Proposal template
toss://templates/trade-params - Trade parameters template
```

**Format**: JSON

## Complete Resource List

**Documentation** (110+):
- Protocol: 80 pages
- Technical: 6 pages
- API: 7 pages
- Investor Deck: 12 pages
- MCP: 5 pages

**State** (Dynamic):
- Funds, Proposals, Config, Investors

**Templates** (10):
- All operation templates

**Total**: 130+ Resources

---

**Back**: [MCP Overview](/docs/mcp-integration/overview)

