# End-to-End Flow Documentation

## Overview

Complete end-to-end flow documentation covering full investor and fund manager journeys from onboarding to operations, withdrawals, and fund closure. This document provides comprehensive step-by-step flows for all major operations in the TOSS Protocol.

## Investor Journey

### Journey 1: Complete Investor Onboarding & First Investment

```
Phase 1: Wallet Connection
    ↓
Phase 2: Auto-Registration
    ↓
Phase 3: First Deposit
    ↓
Phase 4: Share Minting
    ↓
Phase 5: Monitoring & Tracking
```

#### Step-by-Step Flow

**Phase 1: Wallet Connection**

1. **Investor Connects Wallet**
   ```typescript
   await wallet.connect();
   // Wallet connected: 0xABC...123
   ```

2. **Wallet Validation**
   - Check wallet is Web3 compatible
   - Verify network is zkSync Era
   - Confirm wallet has ETH for gas

**Phase 2: Auto-Registration**

3. **Trigger Registration (First Deposit)**
   ```solidity
   // On first deposit, auto-register
   investorRegistry.registerInvestor(investor);
   ```

4. **Profile Creation**
   ```solidity
   InvestorProfile {
       wallet: 0xABC...123,
       class: RETAIL,
       icsScore: 0,
       state: ACTIVE,
       registeredAt: block.timestamp,
       totalInvested: 0,
       tossStaked: 0,
       fundsInvested: 0
   }
   ```

5. **Initial State Assignment**
   - Class: RETAIL (default)
   - State: ACTIVE (default)
   - ICS Score: 0 (calculated after first activity)
   - Access: Tier 1-2 funds only

**Phase 3: First Deposit**

6. **Investor Approves USDC**
   ```solidity
   await usdc.approve(fundManagerVault.address, amount);
   ```

7. **Investor Calls Deposit**
   ```solidity
   await fundManagerVault.deposit(fundId, amount, usdc.address);
   ```

8. **Deposit Validation**
   ```solidity
   // Checks performed:
   - Investor registered ✓
   - Investor state ACTIVE ✓
   - Fund exists ✓
   - Fund status ACTIVE ✓
   - Amount >= minInvestment ✓
   - Asset allowed ✓
   - Investor class eligible for fund tier ✓
   ```

9. **Share Calculation**
   ```solidity
   if (totalShares == 0) {
       shares = amount;  // 1:1 for first deposit
   } else {
       shares = (amount × totalShares) / currentNAV;
   }
   ```

10. **Transfer & Mint**
    ```solidity
    usdc.transferFrom(investor, vault, amount);
    vault.mintShares(investor, shares);
    ```

**Phase 4: Share Minting**

11. **Shares Minted**
    ```
    Investor receives: shares (fund shares)
    Fund receives: amount (USDC)
    NAV updated: Previous NAV + amount
    ```

12. **State Update**
    ```solidity
    investorRegistry.updateTotalInvested(investor, amount);
    investorRegistry.incrementFundsInvested(investor);
    ```

**Phase 5: Monitoring & Tracking**

13. **Investor Can Now**
    - View portfolio in dashboard
    - Track NAV changes
    - Monitor fund performance
    - Check share value
    - Request withdrawals (after lockup)

### Journey 2: Investor Class Upgrade

```
Current State: RETAIL
    ↓
Stake TOSS: 1,000 TOSS
    ↓
Calculate ICS Score
    ↓
Check Upgrade Requirements
    ↓
Upgrade to PREMIUM
    ↓
Unlock Tier 3 Funds
```

#### Step-by-Step Flow

1. **Stake TOSS Tokens**
   ```solidity
   await toss.approve(stakingContract.address, 1000e18);
   await stakingContract.stake(1000e18);
   ```

2. **ICS Score Calculation**
   ```
   Loyalty Score: (Days Registered / 365) × 20 + (Funds Invested / 5) × 10
   Volume Score: log10(Total Invested / 1000) × 20
   Behavior Score: 100 - (Violations × 10) - (State Penalty × 20)
   Staking Score: (TOSS Staked / 1000) × 10
   
   ICS = 0.30 × Loyalty + 0.25 × Volume + 0.25 × Behavior + 0.20 × Staking
   ```

3. **Upgrade Validation**
   ```solidity
   require(tossStaked >= 1000e18, "Insufficient stake");
   require(icsScore >= 50, "Insufficient ICS");
   require(state == ACTIVE, "Investor not active");
   ```

4. **Upgrade Execution**
   ```solidity
   investorRegistry.upgradeClass(investor, PREMIUM);
   ```

5. **Benefits Unlocked**
   - Access to Tier 3 funds
   - 10% fee discount
   - 1.2x voting power multiplier

### Journey 3: Complete Withdrawal Flow

```
Check Lockup Period
    ↓
Request Withdrawal
    ↓
Queue Withdrawal
    ↓
NAV Calculation
    ↓
Process Withdrawal
    ↓
Transfer Assets
    ↓
Burn Shares
```

#### Step-by-Step Flow

1. **Lockup Check**
   ```solidity
   uint256 depositTime = investorDepositTime[investor][fundId];
   uint256 lockupPeriod = fundConfig.getLockupPeriod(fundId);
   require(block.timestamp - depositTime >= lockupPeriod, "Lockup not expired");
   ```

2. **Withdrawal Request**
   ```solidity
   await fundManagerVault.requestWithdrawal(fundId, shares);
   ```

3. **Request Validation**
   ```solidity
   // Checks:
   - Investor has shares ✓
   - Lockup expired ✓
   - Fund status allows withdrawals ✓
   - Daily limit not exceeded ✓
   ```

4. **Queue Withdrawal**
   ```solidity
   WithdrawalRequest {
       requestId: nextRequestId++,
       investor: investor,
       fundId: fundId,
       shares: shares,
       requestedAt: block.timestamp,
       processed: false
   }
   ```

5. **Processing (by Keeper)**
   ```solidity
   // Keeper processes after queue delay (24 hours)
   uint256 currentNAV = vault.getNAV(fundId);
   uint256 navPerShare = currentNAV / totalShares;
   uint256 amount = shares × navPerShare;
   
   // Calculate fees
   uint256 withdrawalFee = amount × withdrawalFeeRate / 100;
   uint256 amountAfterFee = amount - withdrawalFee;
   ```

6. **Transfer & Burn**
   ```solidity
   vault.transfer(investor, asset, amountAfterFee);
   vault.burnShares(investor, shares);
   ```

## Fund Manager Journey

### Journey 1: Fund Creation & Launch

```
Phase 1: Registration & Stake
    ↓
Phase 2: Fund Configuration
    ↓
Phase 3: Fund Creation
    ↓
Phase 4: Fund Deployment
    ↓
Phase 5: Fund Activation
```

#### Step-by-Step Flow

**Phase 1: Registration & Stake**

1. **FM Registration**
   ```solidity
   await fmRegistry.registerFM(fmAddress, profileData);
   ```

2. **Stake Calculation**
   ```
   Required Stake = Base Minimum + (Projected AUM × Stake Ratio)
   
   Where:
   - Base Minimum = 10,000 TOSS
   - Stake Ratio = 0.1% (10 basis points)
   - Projected AUM = Expected initial AUM
   ```

3. **Stake Example**
   ```
   FM planning $2M fund:
   Required Stake = 10,000 + (2,000,000 × 0.001)
                   = 10,000 + 2,000
                   = 12,000 TOSS
   ```

4. **Approve & Transfer Stake**
   ```solidity
   await toss.approve(fundFactory.address, 12000e18);
   ```

**Phase 2: Fund Configuration**

5. **Prepare Fund Config**
   ```typescript
   const config = {
       fundName: "Alpha Crypto Fund",
       fundSymbol: "ACF",
       strategyDescription: "High-risk crypto strategies",
       fundClass: FundClass.ALPHA,
       riskTier: RiskTier.TIER_3,
       
       // Risk Limits
       maxPositionSize: 20,  // 20% of NAV
       maxConcentration: 40,  // 40% in single asset
       maxDrawdown: 50,      // 50% max drawdown
       maxVolatility: 100,   // 100% annualized volatility
       maxLeverage: 5,       // 5x leverage
       
       // Fees
       managementFee: 2,     // 2% annual
       performanceFee: 20,   // 20% above HWM
       
       // Operational
       minInvestment: 1000,  // $1,000 minimum
       lockupPeriod: 30,     // 30 days
       allowedAssets: [WBTC, WETH, USDC, ...]
   };
   ```

6. **Config Validation**
   ```solidity
   // Validates config against FundClass and RiskTier limits
   require(riskEngine.validateConfig(config), "Invalid config");
   ```

**Phase 3: Fund Creation**

7. **Call FundFactory**
   ```solidity
   await fundFactory.createFund(config, 12000e18);
   ```

8. **Factory Validation**
   ```solidity
   // Checks:
   - FM registered ✓
   - FM score >= 50 ✓
   - Stake sufficient ✓
   - Config valid ✓
   ```

9. **Stake Locking**
   ```solidity
   toss.transferFrom(fm, factory, stakeAmount);
   factory.lockStake(fm, fundId, stakeAmount);
   ```

**Phase 4: Fund Deployment**

10. **Proxy Deployment**
    ```solidity
    // Deploy minimal proxy
    address fundAddress = deployMinimalProxy(fundImplementation);
    ```

11. **Fund Initialization**
    ```solidity
    fund.initialize(fundId, fm, config);
    ```

12. **Fund Registration**
    ```solidity
    fundRegistry.registerFund(fundAddress, fm, fundClass, riskTier);
    ```

13. **Return Fund Address**
    ```solidity
    return (fundAddress, fundId);
    ```

**Phase 5: Fund Activation**

14. **Fund Status: ACTIVE**
    ```
    Fund is now:
    - Deployed and initialized
    - Registered in FundRegistry
    - Accepting deposits
    - Ready for trading
    ```

15. **NAV Initialization**
    ```solidity
    // Initial NAV = seed capital (if any)
    vault.updateNAV(fundId, seedCapital);
    ```

### Journey 2: Complete Trade Execution Flow

```
Phase 1: Trade Preparation
    ↓
Phase 2: Risk Validation
    ↓
Phase 3: Trade Execution
    ↓
Phase 4: NAV Update
    ↓
Phase 5: Monitoring & Logging
```

#### Step-by-Step Flow

**Phase 1: Trade Preparation**

1. **FM Prepares Trade Parameters**
   ```typescript
   const tradeParams = {
       fundId: 42,
       assetIn: USDC_ADDRESS,
       assetOut: WBTC_ADDRESS,
       amountIn: parseUnits("10000", 6),  // $10k
       minAmountOut: parseUnits("0.24", 8),  // Min 0.24 BTC
       deadline: Math.floor(Date.now() / 1000) + 300  // 5 min
   };
   ```

**Phase 2: Risk Validation**

2. **Request RiskEngine Validation**
   ```solidity
   (bool approved, uint256 faultIndex, bytes memory signature) = 
       riskEngine.validateTrade(fundId, tradeParams);
   ```

3. **Risk Validation Flow**
   ```
   Priority 1: Critical Safety Checks
   - Protocol healthy ✓
   - Oracles operational ✓
   - Sequencer available ✓
   
   Priority 2: Risk Validation
   - Protocol Risk Domain: FI = 0 ✓
   - Fund Risk Domain: FI = 5 ✓
   - Investor Risk Domain: FI = 0 ✓
   - Combined FI = max(0, 5, 0) = 5 ✓
   
   Result: approved = true, FI = 5 (no warning)
   ```

4. **Approval Signature Generated**
   ```solidity
   bytes32 tradeHash = keccak256(abi.encodePacked(...));
   bytes memory signature = signApproval(tradeHash, faultIndex);
   ```

**Phase 3: Trade Execution**

5. **Execute Trade**
   ```solidity
   uint256 tradeId = fundTradeExecutor.executeTrade(
       fundId,
       tradeParams,
       signature
   );
   ```

6. **Execution Flow**
   ```solidity
   // 1. Verify signature
   require(verifySignature(signature), "Invalid signature");
   
   // 2. Check balance
   require(vault.getBalance(fundId, assetIn) >= amountIn, "Insufficient");
   
   // 3. Execute swap via router
   uint256 amountOut = router.swap(assetIn, assetOut, amountIn, minAmountOut);
   
   // 4. Validate slippage
   require(amountOut >= minAmountOut, "Slippage exceeded");
   
   // 5. Update vault
   vault.updateBalance(fundId, assetIn, balance - amountIn);
   vault.updateBalance(fundId, assetOut, balance + amountOut);
   ```

**Phase 4: NAV Update**

7. **NAV Engine Triggered**
   ```solidity
   // Event emitted
   emit TradeExecuted(fundId, tradeId, assetIn, assetOut, amountIn, amountOut);
   ```

8. **NAV Recalculation (Off-Chain)**
   ```
   NAV Engine:
   1. Listens for TradeExecuted event
   2. Fetches current holdings from vault
   3. Gets prices from oracles
   4. Calculates new NAV
   5. Publishes NAV on-chain
   ```

9. **NAV Updated**
   ```solidity
   vault.updateNAV(fundId, newNAV);
   ```

**Phase 5: Monitoring & Logging**

10. **Trade Logged**
    ```solidity
    analyticsHub.recordTrade(fundId, tradeId, params, block.timestamp);
    ```

11. **Performance Tracking**
    ```
    - Trade recorded in analytics
    - NAV change tracked
    - FM performance updated
    - Risk metrics recalculated
    ```

### Journey 3: Fee Collection Flow

```
Phase 1: Management Fee Calculation
    ↓
Phase 2: Performance Fee Calculation
    ↓
Phase 3: Fee Collection
    ↓
Phase 4: HWM Update
```

#### Step-by-Step Flow

**Phase 1: Management Fee Calculation**

1. **Trigger Fee Collection**
   ```solidity
   await vault.collectManagementFee(fundId);
   ```

2. **Calculate Management Fee**
   ```
   Time Since Last Collection = block.timestamp - lastFeeCollection
   Annual Fee Rate = managementFee (e.g., 2% = 0.02)
   
   Management Fee = NAV × Annual Fee Rate × (Time Since Last / 365 days)
   ```

3. **Management Fee Example**
   ```
   NAV: $1,000,000
   Management Fee Rate: 2% annual
   Days Since Last Collection: 30 days
   
   Management Fee = $1,000,000 × 0.02 × (30/365)
                   = $1,000,000 × 0.001644
                   = $1,644
   ```

**Phase 2: Performance Fee Calculation**

4. **Check HWM**
   ```solidity
   uint256 currentNAV = vault.getNAV(fundId);
   uint256 highWaterMark = vault.getHighWaterMark(fundId);
   
   if (currentNAV > highWaterMark) {
       // Calculate performance fee
   }
   ```

5. **Calculate Performance Fee**
   ```
   Performance Fee = (Current NAV - High Water Mark) × Performance Fee Rate
   ```

6. **Performance Fee Example**
   ```
   Current NAV: $1,200,000
   High Water Mark: $1,000,000
   Performance Fee Rate: 20%
   
   Performance Fee = ($1,200,000 - $1,000,000) × 0.20
                    = $200,000 × 0.20
                    = $40,000
   ```

**Phase 3: Fee Collection**

7. **Collect Fees**
   ```solidity
   // Option 1: Mint shares to FM (dilution)
   uint256 feeShares = (managementFee × totalShares) / currentNAV;
   vault.mintShares(fm, feeShares);
   
   // Option 2: Transfer assets to FM
   vault.transfer(fm, asset, managementFee + performanceFee);
   ```

8. **Update HWM**
   ```solidity
   if (currentNAV > highWaterMark) {
       vault.updateHighWaterMark(fundId, currentNAV);
   }
   ```

### Journey 4: Fund Closure Flow

```
Phase 1: Closure Request
    ↓
Phase 2: Final Settlements
    ↓
Phase 3: Asset Distribution
    ↓
Phase 4: Stake Return
    ↓
Phase 5: Fund Deactivation
```

#### Step-by-Step Flow

**Phase 1: Closure Request**

1. **FM Initiates Closure**
   ```solidity
   await fundGovernance.createProposal("Close Fund", closureData);
   ```

2. **Governance Vote**
   ```
   - Fund investors vote
   - Requires >50% approval
   - Voting period: 3-7 days
   ```

3. **Closure Approval**
   ```solidity
   if (approval > 50%) {
       fundRegistry.markForClosure(fundId);
   }
   ```

**Phase 2: Final Settlements**

4. **Stop New Deposits**
   ```solidity
   fundRegistry.setFundStatus(fundId, FundStatus.CLOSING);
   ```

5. **Final NAV Calculation**
   ```solidity
   uint256 finalNAV = vault.calculateFinalNAV(fundId);
   ```

6. **Final Fee Collection**
   ```solidity
   vault.collectFinalFees(fundId);
   ```

**Phase 3: Asset Distribution**

7. **Process All Withdrawals**
   ```solidity
   // Process all pending withdrawals
   for (uint i = 0; i < withdrawalQueue.length; i++) {
       vault.processWithdrawal(withdrawalQueue[i]);
   }
   ```

8. **Distribute Remaining Assets**
   ```solidity
   // Pro-rata distribution to all investors
   uint256 navPerShare = finalNAV / totalShares;
   for (each investor) {
       uint256 amount = investorShares × navPerShare;
       vault.transfer(investor, asset, amount);
       vault.burnShares(investor, investorShares);
   }
   ```

**Phase 4: Stake Return**

9. **Return Remaining Stake**
   ```solidity
   uint256 remainingStake = factory.getFMStake(fm, fundId);
   factory.returnStake(fm, fundId, remainingStake);
   ```

10. **Stake Transfer**
    ```solidity
    toss.transfer(fm, remainingStake);
    ```

**Phase 5: Fund Deactivation**

11. **Deactivate Fund**
    ```solidity
    fundRegistry.setFundStatus(fundId, FundStatus.CLOSED);
    fundRegistry.deactivateFund(fundId);
    ```

12. **Cleanup**
    ```
    - Fund removed from active registry
    - Historical data preserved
    - Final report generated
    ```

## Cross-Journey Interactions

### Investor → Fund Manager Interaction

```
Investor Journey:
1. Investor deposits → Fund receives capital
2. NAV increases → Share price increases
3. FM executes trades → NAV changes
4. FM collects fees → Share price decreases (dilution)
5. Investor withdraws → Fund NAV decreases
```

### Fund Manager → Investor Interaction

```
FM Journey:
1. FM creates fund → Investors can deposit
2. FM executes trades → NAV changes affect investors
3. FM collects fees → Investors' share value changes
4. FM closes fund → Investors receive final distribution
```

## Error Handling & Recovery

### Common Error Scenarios

| Error | Investor Impact | FM Impact | Recovery |
|-------|----------------|-----------|----------|
| Trade Rejected | None | Slashing triggered | FM reduces risk, stake slashed |
| NAV Calculation Error | Share price incorrect | Fee calculation affected | NAV recalculated manually |
| Oracle Failure | Price unavailable | Trade delayed | Cached price used, NAV marked estimated |
| Insufficient Liquidity | Trade delayed | Trade fails | Retry with different venue |
| Fund Emergency | Withdrawals paused | Fund paused | Emergency procedures activated |

## Timeline Examples

### Investor: First Investment to Withdrawal

```
Day 0: Connect wallet, register
Day 0: Deposit $10,000 → Receive 10,000 shares (NAV = $1.00/share)
Day 30: NAV = $1.20/share (20% gain)
Day 31: Lockup expires
Day 32: Request withdrawal of 5,000 shares
Day 33: Withdrawal processed → Receive $6,000 (5,000 × $1.20)
Day 33: Remaining shares: 5,000
```

### Fund Manager: Fund Creation to First Trade

```
Day 0: Register as FM
Day 0: Stake 12,000 TOSS
Day 0: Create fund → Fund deployed
Day 1: First investor deposits $100,000 → NAV = $100,000
Day 2: NAV = $100,500 (500 gain from yield)
Day 3: Execute first trade: Buy $10,000 BTC
Day 3: NAV updated → NAV = $100,400 (after fees)
Day 30: Collect management fee → NAV = $100,194
Day 60: NAV = $120,000 → Collect performance fee → HWM = $120,000
```

---

**Related**: [Investor Processes](/protocol/processes/investor/onboarding), [Fund Manager Processes](/protocol/processes/fund-manager/create-fund), [Trade Execution](/protocol/processes/fund-manager/execute-trade)

