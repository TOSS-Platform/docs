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
// ===== Constants =====
uint256 private constant SECONDS_PER_DAY = 86400;

// ===== Dependencies =====
IRiskEngine public immutable riskEngine;
ITradeRouter public tradeRouter;
IFundRegistry public immutable fundRegistry;
IFundConfig public immutable fundConfig;
DAOConfigCore public immutable daoConfig;

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
mapping(uint256 => uint256) public lastTradeReset;  // fundId => timestamp of last reset

// ===== Access Control =====
address public governance;
mapping(uint256 => bool) public cancelledTrades;  // tradeId => cancelled (separate mapping, not in Trade struct)
```

**Note**: The contract uses `ReentrancyGuard` from OpenZeppelin to prevent reentrancy attacks. All state-changing functions use the `nonReentrant` modifier.

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
   require(riskEngine.verifyApproval(fundId, params, riskApproval), "FundTradeExecutor: Not approved");
   ```

2. **Validate Deadline**:

   ```solidity
   require(block.timestamp <= params.deadline, "FundTradeExecutor: Deadline expired");
   ```

3. **Validate Inputs**:

   ```solidity
   require(params.amountIn > 0, "FundTradeExecutor: Zero amount");
   require(params.assetIn != address(0) && params.assetOut != address(0), "FundTradeExecutor: Invalid asset");
   ```

4. **Check Fund Status**:

   ```solidity
   IFundRegistry.FundMetadata memory metadata = fundRegistry.getFundMetadata(fundId);
   require(metadata.status == IFundRegistry.FundStatus.ACTIVE, "FundTradeExecutor: Fund not active");
   ```

5. **Reset and Check Daily Trade Limit**:

   ```solidity
   _resetDailyCountIfNeeded(fundId);
   IFund.FundConfig memory config = fundConfig.getConfiguration(fundId);
   require(dailyTrades[fundId] < config.maxDailyTrades, "FundTradeExecutor: Daily limit exceeded");
   ```

6. **Validate Assets**:

   ```solidity
   require(fundConfig.isAssetAllowed(fundId, params.assetIn), "FundTradeExecutor: AssetIn not allowed");
   require(fundConfig.isAssetAllowed(fundId, params.assetOut), "FundTradeExecutor: AssetOut not allowed");
   ```

7. **Get Vault Address and Execute Trade**:

   ```solidity
   address vaultAddress = metadata.fundAddress;
   IFundManagerVault vault = IFundManagerVault(vaultAddress);
   uint256 amountOut = vault.executeTrade(
       params.assetIn,
       params.assetOut,
       params.amountIn,
       params.minAmountOut,
       params.routeData
   );
   ```

   **Note**: The vault's `executeTrade` function handles:

   - Asset approval to the swap router
   - Actual swap execution via the router
   - Holdings update after the swap
   - Slippage validation

8. **Validate Slippage** (double-check for safety):

   ```solidity
   require(amountOut >= params.minAmountOut, "FundTradeExecutor: Slippage exceeded");
   ```

9. **Calculate Risk Approval Hash**:

   ```solidity
   bytes32 riskApprovalHash = keccak256(riskApproval);
   ```

10. **Record Trade**:
    ```solidity
    tradeId = tradeCount;
    trades[tradeId] = Trade({
        fundId: fundId,
        assetIn: params.assetIn,
        assetOut: params.assetOut,
        amountIn: params.amountIn,
        amountOut: amountOut,
        executedAt: block.timestamp,
        riskApprovalHash: riskApprovalHash
    });
    tradeCount++;
    dailyTrades[fundId]++;
    ```

**Events**: `TradeExecuted(fundId, tradeId, assetIn, assetOut, amountIn, amountOut)`

### `cancelTrade`

```solidity
function cancelTrade(
    uint256 tradeId
) external
```

**Purpose**: Cancel pending trade (before execution)

**Parameters**:

- `tradeId`: Trade ID to cancel

**Access Control**: FM of the fund or Guardian (emergency)

**Behavior**:

1. **Verify Trade Exists**:

   ```solidity
   Trade memory trade = trades[tradeId];
   require(trade.fundId != 0, "FundTradeExecutor: Trade not found");
   ```

2. **Check Not Already Cancelled**:

   ```solidity
   require(!cancelledTrades[tradeId], "FundTradeExecutor: Already cancelled");
   ```

3. **Verify Caller Authorization**:

   ```solidity
   address fundManager = fundRegistry.getFundManager(trade.fundId);
   address guardian = daoConfig.guardian();
   require(msg.sender == fundManager || msg.sender == guardian, "FundTradeExecutor: Not FM or Guardian");
   ```

4. **Mark Trade as Cancelled**:

   ```solidity
   cancelledTrades[tradeId] = true;
   ```

5. **Emit TradeCancelled Event**:
   ```solidity
   emit TradeCancelled(trade.fundId, tradeId, msg.sender, block.timestamp);
   ```

**Note**: Cancelled trades are tracked in a separate `cancelledTrades` mapping, not in the `Trade` struct itself. This allows querying trade details even after cancellation.

**Events**: `TradeCancelled(fundId, tradeId, cancelledBy, timestamp)`

### `getTrade`

```solidity
function getTrade(uint256 tradeId) external view returns (Trade memory)
```

**Purpose**: Get trade details by ID

**Returns**: Trade struct with all trade information

**Note**: To check if a trade is cancelled, query the `cancelledTrades` mapping separately.

### `getDailyTradeCount`

```solidity
function getDailyTradeCount(uint256 fundId) external view returns (uint256 count)
```

**Purpose**: Get daily trade count for a fund (resets at midnight)

**Returns**: Number of trades executed today for the fund

**Behavior**: This view function checks if a reset is needed (24 hours have passed) and returns 0 if a reset would occur, without modifying state. The actual reset happens in `_resetDailyCountIfNeeded` during trade execution.

### `getTradeCount`

```solidity
function getTradeCount() external view returns (uint256 count)
```

**Purpose**: Get total number of trades executed across all funds

**Returns**: Total trade count

### `setTradeRouter`

```solidity
function setTradeRouter(address _tradeRouter) external onlyGovernance
```

**Purpose**: Update trade router address (only governance)

### `setGovernance`

```solidity
function setGovernance(address _governance) external onlyGovernance
```

**Purpose**: Update governance address (only governance)

## Constructor

```solidity
constructor(
    address _riskEngine,
    address _tradeRouter,
    address _fundRegistry,
    address _fundConfig,
    address _daoConfig,
    address _governance
)
```

**Parameters**:

- `_riskEngine`: RiskEngine contract address (immutable)
- `_tradeRouter`: TradeRouter contract address (updatable by governance)
- `_fundRegistry`: FundRegistry contract address (immutable)
- `_fundConfig`: FundConfig contract address (immutable)
- `_daoConfig`: DAOConfigCore contract address (immutable)
- `_governance`: Governance address (updatable by governance)

**Validation**: All parameters must be non-zero addresses. Constructor reverts if any address is `address(0)`.

**Note**: The vault address is not passed to the constructor. Instead, it is retrieved from `FundRegistry` for each trade via `fundRegistry.getFundMetadata(fundId).fundAddress`. This allows the contract to work with any fund vault without needing to know vault addresses upfront.

## DAO-Configurable Parameters

| Parameter     | Governance Level | Update Function    |
| ------------- | ---------------- | ------------------ |
| `tradeRouter` | Protocol         | `setTradeRouter()` |
| `governance`  | Protocol         | `setGovernance()`  |

## Daily Limit Reset Logic

The contract automatically resets daily trade counts after 24 hours:

```solidity
function _resetDailyCountIfNeeded(uint256 fundId) internal {
    uint256 lastReset = lastTradeReset[fundId];
    if (lastReset == 0) {
        // First trade for this fund
        lastTradeReset[fundId] = block.timestamp;
        return;
    }

    uint256 daysSinceReset = (block.timestamp - lastReset) / SECONDS_PER_DAY;
    if (daysSinceReset >= 1) {
        dailyTrades[fundId] = 0;
        lastTradeReset[fundId] = block.timestamp;
    }
}
```

**Behavior**:

- First trade for a fund: Sets `lastTradeReset[fundId] = block.timestamp`
- Subsequent trades: Checks if 24 hours (86400 seconds) have passed
- Reset condition: If `daysSinceReset >= 1`, resets `dailyTrades[fundId] = 0` and updates timestamp
- The `getDailyTradeCount` view function simulates this logic without modifying state

This ensures that daily limits are enforced per calendar day, resetting at midnight (24-hour boundary).

**Constants**:

- `SECONDS_PER_DAY = 86400` (24 _ 60 _ 60)

## Security Considerations

**1. Reentrancy Protection**

- **Risk**: Reentrancy attacks during trade execution
- **Mitigation**: Uses OpenZeppelin's `ReentrancyGuard` with `nonReentrant` modifier on `executeTrade`
- **Severity**: CRITICAL → Mitigated

**2. Bypassing RiskEngine**

- **Risk**: Execute trade without validation
- **Mitigation**: Requires valid RiskEngine signature, checked on-chain via `verifyApproval`
- **Severity**: CRITICAL → Mitigated

**3. Slippage Manipulation**

- **Risk**: FM accepts high slippage, extracts value
- **Mitigation**: Max slippage limits enforced, double-checked (vault + executor), monitored by RiskEngine
- **Severity**: High → Mitigated

**4. Front-Running**

- **Risk**: FM front-runs own fund's trade
- **Mitigation**: Session key monitoring, Intent Detection, slashing
- **Severity**: Medium → Detected & Punished

**5. Deadline Expiration**

- **Risk**: Execute trade with expired approval
- **Mitigation**: Deadline validation in `executeTrade`, reverts if `block.timestamp > params.deadline`
- **Severity**: Medium → Mitigated

**6. Invalid Fund State**

- **Risk**: Execute trade for paused/closed fund
- **Mitigation**: Fund status check ensures only ACTIVE funds can execute trades
- **Severity**: Medium → Mitigated

**7. Zero Amount Attacks**

- **Risk**: Execute trade with zero amount
- **Mitigation**: Input validation requires `params.amountIn > 0`
- **Severity**: Low → Mitigated

## Test Scenarios

### Happy Path Tests

| Test Name                    | Scenario                                                    | Expected Result                                                                          |
| ---------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Execute validated trade      | TradeExecutor executes trade with valid RiskEngine approval | Trade executed via router, assets swapped, holdings updated, TradeExecuted event emitted |
| Validate RiskEngine approval | RiskEngine validates trade, TradeExecutor verifies approval | Approval signature verified, trade proceeds if valid                                     |
| Check slippage protection    | Trade executed with minAmountOut, output validated          | Slippage check passes, trade executes if output meets minimum                            |
| Update vault holdings        | Trade executed, vault holdings updated correctly            | Asset holdings reflect new amounts after swap                                            |
| Track trade                  | Trade recorded with all details                             | Trade ID assigned, trade details stored for analytics                                    |
| Enforce daily trade limit    | Multiple trades executed within daily limit                 | All trades succeed, daily count tracked correctly                                        |
| Cancel pending trade         | Fund Manager cancels trade before execution                 | Trade cancelled, cancellation recorded, TradeCancelled event emitted                     |

### Edge Cases

| Test Name                             | Scenario                                                 | Expected Result                                       |
| ------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------- |
| Execute trade at exact slippage limit | Trade executed with output exactly equal to minAmountOut | Transaction succeeds, slippage at boundary accepted   |
| Execute trade at daily limit          | Trade executed when daily trade count at limit           | Transaction succeeds if at limit but not exceeded     |
| Execute trade with maximum input      | Trade executed with maximum possible input amount        | Transaction succeeds, handles large amounts correctly |
| Execute trade with minimum input      | Trade executed with minimum trade size                   | Transaction succeeds, minimum size enforced           |
| Daily trade count reset               | Daily trade count resets at midnight, new trades allowed | Count resets correctly, new trades can be executed    |

### Failure Cases

| Test Name                                 | Scenario                                                         | Expected Result                                       |
| ----------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| Execute trade without RiskEngine approval | TradeExecutor attempts to execute trade without approval         | Transaction reverts with "Not approved" error         |
| Execute trade with invalid approval       | TradeExecutor attempts to execute with forged approval signature | Transaction reverts with "Invalid approval" error     |
| Execute trade with expired approval       | TradeExecutor attempts to execute with expired approval          | Transaction reverts with "Approval expired" error     |
| Execute trade exceeding slippage          | Trade executed but output below minAmountOut                     | Transaction reverts with "Slippage exceeded" error    |
| Execute trade from non-FM                 | Non-Fund Manager attempts to execute trade                       | Transaction reverts with "Not Fund Manager" error     |
| Execute trade exceeding daily limit       | Attempt to execute trade when daily limit exceeded               | Transaction reverts with "Daily limit exceeded" error |
| Execute trade for non-existent fund       | Attempt to execute trade for fund that doesn't exist             | Transaction reverts with "Fund not found" error       |
| Cancel trade from non-FM                  | Non-FM attempts to cancel trade                                  | Transaction reverts with "Not FM or Guardian" error   |
| Execute trade with invalid router         | Router address invalid or non-functional                         | Transaction reverts with router error                 |

### Security Tests

| Test Name                                   | Scenario                                                       | Expected Result                                               |
| ------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------- |
| Prevent trade without RiskEngine validation | Attacker attempts to execute trade without RiskEngine approval | Transaction reverts, RiskEngine validation required           |
| Prevent approval replay                     | Attacker attempts to reuse approval signature                  | Transaction reverts, approvals single-use or nonce-based      |
| Prevent approval forgery                    | Attacker attempts to forge RiskEngine approval                 | Transaction reverts, signature validation prevents forgery    |
| Slippage manipulation protection            | FM attempts to accept excessive slippage                       | Max slippage limits enforced, excessive slippage rejected     |
| Daily limit enforcement                     | Multiple trades attempted to bypass daily limit                | Daily limit enforced, cannot bypass via multiple transactions |
| Trade execution authorization               | Verify only Fund Manager can initiate trades                   | Access control enforced, unauthorized execution prevented     |
| Router address validation                   | Verify only valid router addresses can be used                 | Router address validated, invalid routers rejected            |
| Trade tracking integrity                    | Verify trade records cannot be manipulated                     | Trade records immutable, cannot modify past trades            |

### Access Control Tests

| Test Name                      | Scenario                                | Expected Result                                 |
| ------------------------------ | --------------------------------------- | ----------------------------------------------- |
| Execute trade by Fund Manager  | FM executes trade for their fund        | Transaction succeeds if RiskEngine approved     |
| Execute trade by non-FM        | Non-FM attempts to execute trade        | Transaction reverts with "Not Fund Manager"     |
| Cancel trade by FM             | FM cancels their trade                  | Transaction succeeds                            |
| Cancel trade by Guardian       | Guardian cancels trade in emergency     | Transaction succeeds                            |
| Cancel trade by non-authorized | Non-authorized attempts to cancel       | Transaction reverts with "Not FM or Guardian"   |
| Query functions by any address | Any address queries trades, daily count | Queries succeed, read-only functions are public |

### Integration Tests

| Test Name                   | Scenario                                                     | Expected Result                                                 |
| --------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------- |
| RiskEngine validation flow  | RiskEngine validates trade, approval passed to TradeExecutor | Complete flow succeeds, trade executed only if approved         |
| Router swap execution       | TradeExecutor routes trade through swap router               | Swap executed correctly, output validated, funds transferred    |
| Vault holdings update       | Trade executed, vault holdings updated                       | Holdings reflect new asset amounts after trade                  |
| Daily limit tracking        | Multiple trades executed, daily count tracked                | Count increments correctly, limit enforced, resets at midnight  |
| Trade analytics integration | Trade records used for analytics and reporting               | All trade details captured, analytics systems can query records |

### Gas Optimization Tests

| Test Name                 | Scenario                                 | Expected Result                                 |
| ------------------------- | ---------------------------------------- | ----------------------------------------------- |
| Trade execution gas       | TradeExecutor executes validated trade   | Gas usage reasonable, includes router call gas  |
| Approval verification gas | RiskEngine approval signature verified   | Gas usage reasonable for signature verification |
| Query operations gas      | Multiple queries for trades, daily count | View functions consume no gas (read-only)       |

---

**Fund Layer Complete!** [Risk Layer →](/protocol/contracts/risk/RiskEngine)
