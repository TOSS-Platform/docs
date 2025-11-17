# MCP Resources Overview

MCP Resources expose TOSS documentation and protocol state for AI model consumption.

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

**Format**: Markdown (text/markdown)

**AI Usage**:
```typescript
// AI retrieves documentation
const doc = await mcp.getResource("toss://docs/protocol/contracts/RiskEngine");
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

