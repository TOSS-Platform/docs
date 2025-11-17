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

### Happy Path Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Execute validated trade | TradeExecutor executes trade with valid RiskEngine approval | Trade executed via router, assets swapped, holdings updated, TradeExecuted event emitted |
| Validate RiskEngine approval | RiskEngine validates trade, TradeExecutor verifies approval | Approval signature verified, trade proceeds if valid |
| Check slippage protection | Trade executed with minAmountOut, output validated | Slippage check passes, trade executes if output meets minimum |
| Update vault holdings | Trade executed, vault holdings updated correctly | Asset holdings reflect new amounts after swap |
| Track trade | Trade recorded with all details | Trade ID assigned, trade details stored for analytics |
| Enforce daily trade limit | Multiple trades executed within daily limit | All trades succeed, daily count tracked correctly |
| Cancel pending trade | Fund Manager cancels trade before execution | Trade cancelled, cancellation recorded, TradeCancelled event emitted |

### Edge Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Execute trade at exact slippage limit | Trade executed with output exactly equal to minAmountOut | Transaction succeeds, slippage at boundary accepted |
| Execute trade at daily limit | Trade executed when daily trade count at limit | Transaction succeeds if at limit but not exceeded |
| Execute trade with maximum input | Trade executed with maximum possible input amount | Transaction succeeds, handles large amounts correctly |
| Execute trade with minimum input | Trade executed with minimum trade size | Transaction succeeds, minimum size enforced |
| Daily trade count reset | Daily trade count resets at midnight, new trades allowed | Count resets correctly, new trades can be executed |

### Failure Cases

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Execute trade without RiskEngine approval | TradeExecutor attempts to execute trade without approval | Transaction reverts with "Not approved" error |
| Execute trade with invalid approval | TradeExecutor attempts to execute with forged approval signature | Transaction reverts with "Invalid approval" error |
| Execute trade with expired approval | TradeExecutor attempts to execute with expired approval | Transaction reverts with "Approval expired" error |
| Execute trade exceeding slippage | Trade executed but output below minAmountOut | Transaction reverts with "Slippage exceeded" error |
| Execute trade from non-FM | Non-Fund Manager attempts to execute trade | Transaction reverts with "Not Fund Manager" error |
| Execute trade exceeding daily limit | Attempt to execute trade when daily limit exceeded | Transaction reverts with "Daily limit exceeded" error |
| Execute trade for non-existent fund | Attempt to execute trade for fund that doesn't exist | Transaction reverts with "Fund not found" error |
| Cancel trade from non-FM | Non-FM attempts to cancel trade | Transaction reverts with "Not FM or Guardian" error |
| Execute trade with invalid router | Router address invalid or non-functional | Transaction reverts with router error |

### Security Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Prevent trade without RiskEngine validation | Attacker attempts to execute trade without RiskEngine approval | Transaction reverts, RiskEngine validation required |
| Prevent approval replay | Attacker attempts to reuse approval signature | Transaction reverts, approvals single-use or nonce-based |
| Prevent approval forgery | Attacker attempts to forge RiskEngine approval | Transaction reverts, signature validation prevents forgery |
| Slippage manipulation protection | FM attempts to accept excessive slippage | Max slippage limits enforced, excessive slippage rejected |
| Daily limit enforcement | Multiple trades attempted to bypass daily limit | Daily limit enforced, cannot bypass via multiple transactions |
| Trade execution authorization | Verify only Fund Manager can initiate trades | Access control enforced, unauthorized execution prevented |
| Router address validation | Verify only valid router addresses can be used | Router address validated, invalid routers rejected |
| Trade tracking integrity | Verify trade records cannot be manipulated | Trade records immutable, cannot modify past trades |

### Access Control Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Execute trade by Fund Manager | FM executes trade for their fund | Transaction succeeds if RiskEngine approved |
| Execute trade by non-FM | Non-FM attempts to execute trade | Transaction reverts with "Not Fund Manager" |
| Cancel trade by FM | FM cancels their trade | Transaction succeeds |
| Cancel trade by Guardian | Guardian cancels trade in emergency | Transaction succeeds |
| Cancel trade by non-authorized | Non-authorized attempts to cancel | Transaction reverts with "Not FM or Guardian" |
| Query functions by any address | Any address queries trades, daily count | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| RiskEngine validation flow | RiskEngine validates trade, approval passed to TradeExecutor | Complete flow succeeds, trade executed only if approved |
| Router swap execution | TradeExecutor routes trade through swap router | Swap executed correctly, output validated, funds transferred |
| Vault holdings update | Trade executed, vault holdings updated | Holdings reflect new asset amounts after trade |
| Daily limit tracking | Multiple trades executed, daily count tracked | Count increments correctly, limit enforced, resets at midnight |
| Trade analytics integration | Trade records used for analytics and reporting | All trade details captured, analytics systems can query records |

### Gas Optimization Tests

| Test Name | Scenario | Expected Result |
|-----------|----------|-----------------|
| Trade execution gas | TradeExecutor executes validated trade | Gas usage reasonable, includes router call gas |
| Approval verification gas | RiskEngine approval signature verified | Gas usage reasonable for signature verification |
| Query operations gas | Multiple queries for trades, daily count | View functions consume no gas (read-only) |

---

**Fund Layer Complete!** [Risk Layer →](/docs/protocol/contracts/risk/RiskEngine)

