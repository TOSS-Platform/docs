# Fee Distribution Process

## Overview

Protocol fees collected from funds are distributed to treasury, governance rewards, and operational costs.

## Fee Sources

```
Protocol Fees (0.1% of AUM annually)
├─ Collected continuously from funds
├─ Stored in TOSSTreasury
└─ Distributed via DAO governance
```

## Distribution Allocation

```yaml
Treasury Reserve: 50%
  Purpose: Development, audits, operations

Governance Rewards: 5%
  Purpose: Incentivize governance participation

Gas Vault: 10%
  Purpose: Paymaster gas reserves

FM Incentives: 10%
  Purpose: High-performing FM bonuses

Burn (optional): 25%
  Purpose: Deflationary pressure
```

## Process

```solidity
// Monthly distribution (DAO-approved)
await treasury.distributeProtocolFees({
  reserve: 50%,
  governance: 5%,
  gasVault: 10%,
  fmIncentives: 10%,
  burn: 25%
});
```

---

**Related**: [Treasury](/protocol/contracts/core/TOSSTreasury)

