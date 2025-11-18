# Fund Closure Process

## Overview

Orderly fund closure, liquidation of positions, return of capital to investors, and stake return to FM.

## Prerequisites

- All investor shares redeemed OR
- All investors withdrawn OR
- Emergency closure (governance vote)

## Steps

1. **Announce Closure** (7-day notice)
2. **Stop New Deposits**
3. **Liquidate All Positions** (orderly)
4. **Calculate Final NAV**
5. **Process Pending Withdrawals**
6. **Return Capital** to remaining investors (pro-rata)
7. **Calculate Slashing** (if any violations)
8. **Return Stake** to FM (minus slashing)
9. **Mark Fund Closed** in registry

## Sequence

```mermaid
sequenceDiagram
    FM->>FundRegistry: announceClosing(fundId)
    Note over FundRegistry: 7-day notice period
    FM->>Vault: liquidateAllPositions()
    Vault->>Router: Sell all assets to USDC
    Vault->>NAV: Calculate final NAV
    Vault->>Investors: Process withdrawals
    SlashingEngine->>Factory: Calculate remaining stake
    Factory->>FM: Return stake (if any)
    FundRegistry->>FundRegistry: Mark CLOSED
```

## Final Stake Calculation

```solidity
finalStake = initialStake - totalSlashed

If finalStake > 0:
    Transfer finalStake to FM
Else:
    No return (fully slashed)
```

---

**Related**: [Slashing Process](/protocol/processes/risk-compliance/slashing-execution)

