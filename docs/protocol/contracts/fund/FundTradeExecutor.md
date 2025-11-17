# FundTradeExecutor.sol

## Overview

The only contract authorized to execute fund trades. Acts as gatekeeper between Fund Manager intentions and actual trade execution, enforcing RiskEngine validation.

## Purpose

- Gate all trade execution through RiskEngine
- Route trades to optimal venues (CEX/DEX)
- Enforce slippage protections
- Log all trades for analytics
- Prevent trade manipulation

## Core Responsibilities

- ✅ Validate RiskEngine approved trade
- ✅ Execute trades via routers
- ✅ Enforce slippage limits
- ✅ Update vault holdings
- ✅ Emit comprehensive trade logs

## State Variables

```solidity
IRiskEngine public immutable riskEngine;
ITradeRouter public tradeRouter;

// ===== Trade Tracking =====
struct Trade {
    uint256 fundId;
    address assetIn;
    address assetOut;
    uint256 amountIn;
    uint256 amountOut;
    uint256 executedAt;
    bytes32 riskApprovalHash;
}

mapping(uint256 => Trade) public trades;  // tradeId => trade
uint256 public tradeCount;

mapping(uint256 => uint256) public dailyTrades;  // fundId => count today
```

## Functions

### `executeTrade`

```solidity
function executeTrade(
    uint256 fundId,
    TradeParams calldata params,
    bytes calldata riskApproval
) external onlyFundManager(fundId) returns (uint256 tradeId)
```

**Purpose**: Execute fund trade after RiskEngine validation

**Parameters**:
- `fundId`: Fund executing trade
- `params`: Trade parameters (assets, amounts, slippage)
- `riskApproval`: Signed approval from RiskEngine

**Returns**: Unique trade ID

**Behavior**:
1. **Verify RiskEngine Approval**:
   ```solidity
   require(riskEngine.verifyApproval(fundId, params, riskApproval), "Not approved");
   ```

2. **Check Daily Trade Limit**:
   ```solidity
   require(dailyTrades[fundId] < fundConfig.maxDailyTrades(fundId), "Daily limit");
   ```

3. **Execute via Router**:
   ```solidity
   amountOut = tradeRouter.execute(params.assetIn, params.assetOut, params.amountIn, params.route);
   ```

4. **Validate Slippage**:
   ```solidity
   require(amountOut >= params.minAmountOut, "Slippage exceeded");
   ```

5. **Update Vault**:
   ```solidity
   vault.recordTrade(params.assetIn, params.assetOut, params.amountIn, amountOut);
   ```

**Events**: `TradeExecuted(fundId, tradeId, assetIn, assetOut, amountIn, amountOut)`

### `cancelTrade`

```solidity
function cancelTrade(
    uint256 tradeId
) external onlyFMOrGuardian
```

**Purpose**: Cancel pending trade (before execution)

**Access Control**: FM or Guardian (emergency)

## DAO-Configurable Parameters

| Parameter | Governance Level |
|-----------|------------------|
| `tradeRouter` | Protocol |
| `maxSlippageTolerance` | Protocol |

## Security Considerations

**1. Bypassing RiskEngine**
- **Risk**: Execute trade without validation
- **Mitigation**: Requires valid RiskEngine signature, checked on-chain
- **Severity**: CRITICAL → Mitigated

**2. Slippage Manipulation**
- **Risk**: FM accepts high slippage, extracts value
- **Mitigation**: Max slippage limits, monitored by RiskEngine
- **Severity**: High → Mitigated

**3. Front-Running**
- **Risk**: FM front-runs own fund's trade
- **Mitigation**: Session key monitoring, Intent Detection, slashing
- **Severity**: Medium → Detected & Punished

## Test Scenarios

```typescript
describe("FundTradeExecutor", () => {
  it("should reject trade without RiskEngine approval", async () => {
    await expect(
      executor.connect(fm).executeTrade(fundId, params, invalidApproval)
    ).to.be.revertedWith("Not approved");
  });
  
  it("should enforce slippage limits", async () => {
    const params = { minAmountOut: 1000, ... };
    // Mock router returns only 900
    
    await expect(
      executor.connect(fm).executeTrade(fundId, params, approval)
    ).to.be.revertedWith("Slippage exceeded");
  });
});
```

---

**Fund Layer Complete!** [Risk Layer →](/docs/protocol/contracts/risk/RiskEngine)

