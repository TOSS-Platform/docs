# MCP Tools Overview

Complete list of all MCP tools available for TOSS Protocol, organized by category with schemas and usage examples.

## Tool Categories

- **Fund Manager Tools** (8): Operations for creating and managing funds
- **Investor Tools** (7): Operations for investing and portfolio management
- **Governance Tools** (6): Proposal creation and voting
- **Query Tools** (10): Information retrieval and validation

**Total**: 31 MCP Tools

## Fund Manager Tools

### 1. `toss_create_fund`

**Purpose**: Create a new fund with specified configuration

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "fundName": { "type": "string", "minLength": 3, "maxLength": 50 },
    "fundSymbol": { "type": "string", "minLength": 2, "maxLength": 10 },
    "fundClass": { "enum": ["ALPHA", "BALANCED", "STABLE", "QUANT", "INDEX"] },
    "riskTier": { "enum": ["TIER_1", "TIER_2", "TIER_3", "TIER_4"] },
    "managementFee": { "type": "number", "minimum": 0, "maximum": 3 },
    "performanceFee": { "type": "number", "minimum": 0, "maximum": 30 },
    "maxDrawdown": { "type": "number" },
    "maxVolatility": { "type": "number" },
    "allowedAssets": { "type": "array", "items": { "type": "string" } },
    "stakeAmount": { "type": "string", "description": "TOSS amount in wei" }
  },
  "required": ["fundName", "fundClass", "riskTier", "stakeAmount"]
}
```

**Output**:
```json
{
  "fundId": 42,
  "fundAddress": "0x...",
  "staked": "12000000000000000000000",
  "status": "ACTIVE"
}
```

**Example Usage**:
```
User: "Create a balanced fund with $2M target AUM"

AI calls: toss_create_fund({
  fundName: "Balanced Growth Fund",
  fundSymbol: "BGF",
  fundClass: "BALANCED",
  riskTier: "TIER_2",
  managementFee: 2,
  performanceFee: 15,
  stakeAmount: "12000000000000000000000"  // 12,000 TOSS
})

AI responds: "Fund created! 
  Fund ID: 42
  Contract: 0x...
  Stake Locked: 12,000 TOSS
  Status: Ready for deposits"
```

---

### 2. `toss_execute_trade`

**Purpose**: Execute validated trade through RiskEngine

**Input Schema**:
```json
{
  "fundId": { "type": "number" },
  "assetIn": { "type": "string", "description": "Asset to sell" },
  "assetOut": { "type": "string", "description": "Asset to buy" },
  "amountIn": { "type": "string", "description": "Amount to sell (wei)" },
  "minAmountOut": { "type": "string", "description": "Min acceptable (slippage)" },
  "deadline": { "type": "number", "description": "Unix timestamp" }
}
```

**Output**:
```json
{
  "tradeId": 123,
  "approved": true,
  "faultIndex": 5,
  "amountOut": "240000000",
  "gasUsed": "185432"
}
```

---

### 3. `toss_update_fund_config`

**Purpose**: Propose fund configuration change via governance

**Input**: fundId, parameter, newValue  
**Output**: proposalId created

---

### 4. `toss_collect_management_fee`

**Purpose**: Collect accrued management fees

---

### 5. `toss_collect_performance_fee`

**Purpose**: Collect performance fee above HWM

---

### 6. `toss_close_fund`

**Purpose**: Close fund and return stake

---

### 7. `toss_increase_stake`

**Purpose**: Add more TOSS stake to fund

---

### 8. `toss_check_fm_eligibility`

**Purpose**: Check if address can create fund

**Output**:
```json
{
  "eligible": true,
  "fmScore": 75,
  "requiredScore": 50,
  "isBanned": false,
  "activeFunds": 2
}
```

## Investor Tools

### 1. `toss_deposit_to_fund`

**Input Schema**:
```json
{
  "fundId": { "type": "number" },
  "amount": { "type": "string", "description": "Amount in wei" },
  "asset": { "type": "string", "enum": ["USDC", "USDT", "DAI", "WETH", "WBTC"] }
}
```

**Output**:
```json
{
  "shares": "1000000000000000000000",
  "nav": "1000000",
  "sharePrice": "1.0",
  "transactionHash": "0x..."
}
```

---

### 2. `toss_request_withdrawal`

**Purpose**: Request withdrawal from fund

**Input**: fundId, shares  
**Output**: requestId, estimatedValue, queuePosition

---

### 3. `toss_stake_toss`

**Purpose**: Stake TOSS for investor class upgrade

---

### 4. `toss_upgrade_investor_class`

**Purpose**: Upgrade to higher investor class

**Checks**:
- TOSS staked ≥ requirement
- ICS score ≥ threshold
- No violations

---

### 5. `toss_vote_on_fund_proposal`

**Purpose**: Vote on fund-level governance proposal

**Input**: proposalId, support (0=against, 1=for, 2=abstain)

---

### 6. `toss_get_portfolio`

**Purpose**: Get investor's complete portfolio

**Output**:
```json
{
  "totalValue": "150000",
  "positions": [
    { "fundId": 42, "shares": "1000", "value": "50000", "return": "15%" },
    { "fundId": 53, "shares": "2000", "value": "100000", "return": "22%" }
  ],
  "totalReturn": "18.5%"
}
```

---

### 7. `toss_calculate_returns`

**Purpose**: Calculate returns over time period

## Governance Tools

### 1. `toss_create_fund_proposal`

**Purpose**: Create fund-level governance proposal

**Input Schema**:
```json
{
  "fundId": { "type": "number" },
  "proposalType": { "enum": ["FEE_CHANGE", "RISK_PARAMETER", "STRATEGY_UPDATE", "ASSET_LIST", "FM_REPLACEMENT"] },
  "title": { "type": "string" },
  "description": { "type": "string" },
  "newValue": {}
}
```

---

### 2. `toss_create_fm_proposal`

**Purpose**: Create FM-level proposal (FMs vote)

---

### 3. `toss_create_protocol_proposal`

**Purpose**: Create protocol-level proposal

**Input**: Must specify voter group (FM_ONLY, INVESTOR_ONLY, BOTH)

---

### 4. `toss_vote_on_proposal`

**Purpose**: Cast vote on any proposal

**Input**:
```json
{
  "proposalId": { "type": "number" },
  "support": { "type": "number", "enum": [0, 1, 2] },
  "reason": { "type": "string", "optional": true }
}
```

---

### 5. `toss_execute_proposal`

**Purpose**: Execute proposal after timelock

---

### 6. `toss_check_proposal_status`

**Purpose**: Get current proposal state

**Output**:
```json
{
  "state": "ACTIVE",
  "forVotes": "150000",
  "againstVotes": "50000",
  "quorum": "30%",
  "quorumMet": true,
  "timeRemaining": 86400,
  "canExecute": false
}
```

## Query Tools

### 1. `toss_get_fund_info`

**Purpose**: Get comprehensive fund information

**Output**:
```json
{
  "fundId": 42,
  "name": "Alpha BTC Fund",
  "manager": "0x...",
  "fundClass": "ALPHA",
  "riskTier": "TIER_3",
  "currentNAV": "1500000",
  "totalShares": "1000000",
  "investorCount": 45,
  "performance30d": "22%",
  "sharpeRatio": 1.8,
  "maxDrawdown": "12%",
  "fees": { "management": 2, "performance": 20 }
}
```

---

### 2. `toss_get_fund_nav`

**Purpose**: Get current and historical NAV

---

### 3. `toss_search_funds`

**Purpose**: Search/filter funds

**Input**:
```json
{
  "fundClass": { "optional": true },
  "riskTier": { "optional": true },
  "minReturn": { "type": "number", "optional": true },
  "maxFee": { "type": "number", "optional": true }
}
```

**Output**: Array of matching funds

---

### 4. `toss_calculate_required_stake`

**Purpose**: Calculate TOSS stake needed

**Input**: projectedAUM  
**Output**: requiredStake in TOSS

---

### 5. `toss_validate_trade`

**Purpose**: Pre-validate trade before execution

**Input**: fundId, tradeParams  
**Output**:
```json
{
  "approved": true,
  "faultIndex": 8,
  "warnings": [],
  "estimatedGas": "185000"
}
```

Or if rejected:
```json
{
  "approved": false,
  "faultIndex": 45,
  "violations": ["Position size would exceed 20% (PSL)"],
  "potentialSlashing": "5%"
}
```

---

### 6. `toss_get_config_parameters`

**Purpose**: Get current DAO config (gamma, alpha, weights, etc.)

---

### 7. `toss_get_risk_metrics`

**Purpose**: Get fund's current risk metrics

---

### 8. `toss_get_investor_profile`

**Purpose**: Get investor class, ICS, stakes

---

### 9. `toss_get_governance_proposals`

**Purpose**: List active proposals at all levels

---

### 10. `toss_estimate_gas`

**Purpose**: Estimate gas for operation

## Tool Usage Patterns

### Pattern 1: Validation Before Action

```typescript
// AI workflow for trade execution
async function aiExecuteTrade(userInput) {
  // Step 1: Validate first
  const validation = await mcp.callTool("toss_validate_trade", {
    fundId: userInput.fundId,
    assetIn: userInput.assetIn,
    assetOut: userInput.assetOut,
    amountIn: userInput.amount
  });
  
  if (!validation.approved) {
    return `❌ Trade would be rejected:
            ${validation.violations.join("\n")}
            Potential slashing: ${validation.potentialSlashing}`;
  }
  
  // Step 2: If valid, provide code
  return `✅ Trade validated (FI: ${validation.faultIndex})
          
          Execute with:
          await fundTradeExecutor.executeTrade(${userInput.fundId}, params, signature);
          
          Estimated gas: ${validation.estimatedGas}`;
}
```

### Pattern 2: Information Retrieval

```typescript
// AI helps user find suitable fund
async function aiFindFund(requirements) {
  const funds = await mcp.callTool("toss_search_funds", {
    riskTier: requirements.riskTolerance,
    minReturn: requirements.targetReturn,
    maxFee: requirements.maxFee
  });
  
  return `Found ${funds.length} matching funds:
          ${funds.map(f => formatFundInfo(f)).join("\n")}`;
}
```

### Pattern 3: Guided Workflow

```typescript
// AI guides through fund creation
async function aiCreateFundFlow(user) {
  // Step 1: Check eligibility
  const eligible = await mcp.callTool("toss_check_fm_eligibility", {
    address: user.address
  });
  
  if (!eligible.eligible) {
    return `You're not eligible yet:
            - FM Score: ${eligible.fmScore} (need ${eligible.requiredScore})
            - Suggestion: [ways to improve score]`;
  }
  
  // Step 2: Calculate stake
  const stake = await mcp.callTool("toss_calculate_required_stake", {
    projectedAUM: user.targetAUM
  });
  
  // Step 3: Guide configuration
  return `Let's create your fund:
          Required stake: ${stake} TOSS
          [Continue with config selection...]`;
}
```

## Tool Safety Features

### Pre-Execution Validation

Every tool that executes on-chain includes validation:
```typescript
{
  "preExecutionChecks": [
    "eligibility",
    "parameters",
    "gas_estimate",
    "risk_assessment"
  ]
}
```

### Risk Warnings

Tools automatically warn of risks:
```
toss_execute_trade returns:
{
  "approved": true,
  "warnings": [
    "Approaching position size limit (18% of 20% max)",
    "High volatility asset",
    "Consider splitting order for better execution"
  ]
}
```

### Gas Estimation

All tools provide gas estimates:
```json
{
  "estimatedGas": {
    "l2": "185000",
    "cost": "$0.09 at current rates"
  }
}
```

## Tool Documentation Format

Each tool documented with:
- ✅ Purpose and description
- ✅ Complete input/output schemas
- ✅ Validation rules
- ✅ Error scenarios
- ✅ Usage examples
- ✅ Related documentation links

## Next Steps

- **[Tool Schemas](/docs/mcp-integration/schemas/overview)**: Detailed JSON schemas
- **[Integration Guide](/docs/mcp-integration/integration-guide)**: How to use
- **[Examples](/docs/mcp-integration/examples/overview)**: Working examples

---

**Back**: [MCP Overview](/docs/mcp-integration/overview)

