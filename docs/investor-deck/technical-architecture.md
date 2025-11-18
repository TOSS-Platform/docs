# Technical Architecture

## High-Level Stack

```
Frontend (React + Next.js)
    ↕
Off-Chain Services (AWS ECS + Lambda)
├─ NAV Engine
├─ Trade Router
└─ Analytics Hub
    ↕
zkSync L2 Smart Contracts
├─ FundFactory
├─ RiskEngine
├─ DAOGovernance
└─ Fund Vaults
    ↕
Ethereum L1 (Settlement & Security)
```

## Key Technologies

- **zkSync Era**: L2 scaling solution with validity proofs
- **Account Abstraction**: Smart contract wallets for UX
- **PostgreSQL**: Off-chain data storage
- **AWS**: Cloud infrastructure
- **Hardhat**: Smart contract development

---

For complete technical specs, see [Protocol Documentation](/protocol/intro) and [Technical Documentation](/technical/intro).

**Back**: [Platform Overview](/investor-deck/platform-overview)

