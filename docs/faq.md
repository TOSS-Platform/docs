# Frequently Asked Questions

## Overview

Common questions and answers about TOSS Protocol.

## General Questions

### What is TOSS?

TOSS is a decentralized fund management protocol built on zkSync Era, enabling anyone to become a fund manager or invest in professionally managed crypto funds with full transparency and automatic risk enforcement.

### How does TOSS work?

TOSS uses smart contracts to manage funds, enforce risk limits automatically, and ensure complete transparency. Fund Managers stake TOSS tokens as collateral, and violations trigger automatic slashing with NAV compensation.

### Is TOSS secure?

Yes. TOSS uses:
- Smart contract security (audited)
- Economic security (staking and slashing)
- Multi-layer risk validation
- Complete transparency (on-chain)

## Fund Management

### How do I create a fund?

1. Register as Fund Manager
2. Stake required TOSS tokens
3. Configure fund parameters
4. Deploy fund via FundFactory

See: [Create Fund](/protocol/processes/fund-manager/create-fund)

### What are the stake requirements?

Stake = Base Minimum + (Projected AUM × 0.1%)

Minimum: 10,000 TOSS
Typical: 10,000-100,000 TOSS depending on fund size

### Can I modify fund parameters?

Yes, through fund-level governance. Changes require investor approval.

## Investing

### How do I invest in a fund?

1. Connect wallet
2. Choose fund
3. Deposit assets
4. Receive shares

See: [Deposit Process](/protocol/processes/investor/deposit)

### What is the minimum investment?

Minimum investment is set per fund. Typical range: $100 - $10,000.

### How do I withdraw?

1. Request withdrawal
2. Wait for queue processing (24 hours typically)
3. Receive assets to your wallet

See: [Withdrawal Process](/protocol/processes/investor/withdraw)

## Risk & Security

### What happens if Fund Manager violates limits?

Automatic slashing is triggered:
- Part of stake burned (deflation)
- Part compensated to fund NAV (investor protection)
- Manager may be banned for severe violations

### How are my funds protected?

- Fund assets held in secure vaults
- Automatic risk enforcement
- NAV compensation from slashing
- On-chain transparency (you can verify everything)

## Governance

### How does governance work?

TOSS uses multi-level governance:
- **Fund-level**: Investors vote on fund parameters
- **FM-level**: Fund Managers vote on FM standards
- **Protocol-level**: Protocol-wide decisions

See: [Governance Overview](/protocol/governance/overview)

## Technical

### Which blockchain does TOSS use?

zkSync Era L2 (Ethereum scaling solution)

### What are the gas costs?

Very low on zkSync:
- Deposit: ~$0.025
- Trade: ~$0.05-0.10
- Withdrawal: ~$0.025

---

**Related**: [Protocol Introduction](/protocol/intro), [Getting Started](/getting-started/quick-start), [Support](/user-guide/overview)

