# ADR-0004: Account Abstraction for Fund Manager Session Keys

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: zksync, security, account-abstraction

## Context and Problem Statement

Fund Managers (FMs) on TOSS must execute trades frequently — often programmatically, often from bots or strategy engines. Requiring the FM's main key for every trade forces that key to remain hot, which is the single largest avoidable risk in the system. A breached hot key grants the attacker full vault authority, including the ability to drain positions or accept hostile orders.

Externally Owned Accounts (EOAs) cannot natively express the constraints we need: a trading-only scope, a daily notional limit, a key expiry, or revocation without rotating the main account. Patching these constraints into application-level middleware is brittle: the chain-level signature is still a full-authority signature, and any bypass of the middleware grants full access.

zkSync Era supports native Account Abstraction (AA): the account itself is a smart contract that defines its own signature-validation logic. This makes session keys, scoped permissions, daily limits, and key rotation enforceable at the protocol level rather than at the application level.

## Decision Drivers

- Eliminate the need to keep an FM's main key hot for routine trading
- Enforce scoped permissions and per-key daily limits at the chain level
- Allow key rotation and revocation without changing the FM's main account
- Avoid the cost and complexity overhead of ERC-4337 emulation on a chain that supports native AA

## Considered Options

1. **EOAs** — standard externally owned accounts for FMs.
2. **ERC-4337 Account Abstraction on L1** — bundlers, EntryPoint, paymaster as ERC standard.
3. **zkSync native Account Abstraction** — smart-contract wallet is a first-class account type.
4. **Custodial multisig** — FMs operate through a managed multisig provider.

## Decision Outcome

**Chosen option**: *zkSync native Account Abstraction*, because it is the only option that delivers chain-enforced session keys with no bundler overhead and no custodial trust assumption.

All FM accounts are zkSync-native smart-contract wallets. Session keys are granted with a trading-only scope, a per-key daily notional limit, and a time-bounded expiry. Session keys are rotatable without changing the main FM account.

### Positive Consequences

- The FM's main key can be kept cold; only short-lived, scoped session keys are hot.
- A compromised session key is bounded by scope, limit, and expiry — not by main-account authority.
- Key rotation is routine and does not invalidate the FM's identity on the protocol.
- Sponsorship via Paymaster (ADR-0005) composes cleanly with native AA.

### Negative Consequences / Trade-offs

- FM accounts are smart contracts, which carry deployment cost and upgrade considerations.
- Wallet UX must understand native AA accounts; some third-party tooling still assumes EOAs.
- Custom validation logic in each FM account contract must be audited.

## Pros and Cons of the Options

### Option A — EOAs

- ✅ Pro: Simplest possible model; supported everywhere.
- ❌ Con: No session keys, no scoped permissions, no daily limits at the chain level.
- ❌ Con: Compromise of the trading key is compromise of the entire account.

### Option B — ERC-4337 AA on L1

- ✅ Pro: A widely adopted standard with a growing ecosystem.
- ❌ Con: Bundler and EntryPoint indirection adds gas and operational cost.
- ❌ Con: On a chain with native AA (zkSync), ERC-4337 is strictly more expensive.

### Option C — zkSync native AA

- ✅ Pro: First-class account type; no bundler indirection.
- ✅ Pro: Validation logic lives in the account contract and is chain-enforced.
- ✅ Pro: Composes natively with the protocol Paymaster (ADR-0005).
- ❌ Con: zkSync-specific; an exit to another chain would require porting the wallet contract.

### Option D — Custodial multisig

- ✅ Pro: Familiar enterprise pattern; offloads key management.
- ❌ Con: Introduces a custodial trust assumption inconsistent with the protocol's stance.
- ❌ Con: Operationally slow for high-frequency trading.

## Implementation Notes

- FM account contracts implement `IAccount` per the zkSync AA spec.
- Session keys are stored as scoped permission entries with `(selector, target, dailyLimit, expiry)` fields.
- Revocation is a single transaction on the FM account contract.

## Links

- **Source documentation**: `docs/protocol/zksync/overview.md`
- **Related ADRs**: ADR-0002, ADR-0005
- **External references**: zkSync Account Abstraction documentation
