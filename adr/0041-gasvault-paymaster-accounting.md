# ADR-0041: GasVault for Paymaster Gas Accounting

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: gas, paymaster, accounting

## Context and Problem Statement

The Paymaster (ADR-0005) sponsors gas for users and FM session keys. It requires a reliable, segregated ETH balance to pay gas, plus accounting to detect abuse — for example, a single FM consuming a disproportionate share of sponsorship through high-frequency operations. Without per-user usage tracking, the protocol cannot enforce fair-use caps or attribute consumption to participants.

Funding the Paymaster directly from the protocol Treasury conflates concerns. The Treasury holds reserves and pays operational obligations under daily-spend constraints (ADR-0014); allowing the Paymaster to pull from it directly exposes the Treasury to depletion attacks. If an attacker drives the Paymaster into oversponsorship — by spinning up many fake users, or by exploiting a bug — the loss is felt against the Treasury reserve itself, not against an isolated gas budget.

A dedicated gas reserve solves both problems. GasVault holds only the ETH allocated for sponsorship. It tracks per-user cumulative consumption and enforces per-user and overall daily caps. Refills come from the Treasury through DAO budget proposals or from protocol fee streams. The Treasury's reserve remains insulated from Paymaster abuse.

## Decision Drivers

- Insulate the protocol Treasury from Paymaster abuse.
- Enforce per-user and overall daily sponsorship caps.
- Track cumulative consumption for attribution and reporting.
- Keep the funding path explicit and governance-controlled.

## Considered Options

1. **Paymaster pulls from Treasury directly** — no segregation.
2. **Paymaster self-funded from user fees** — users pay the gas they consume.
3. **Dedicated GasVault with usage tracking** — segregated reserve and accounting.

## Decision Outcome

**Chosen option**: *Dedicated GasVault with usage tracking*, because it isolates the gas budget from Treasury and enables per-user fair-use enforcement.

### Positive Consequences

- Treasury reserve insulated from Paymaster oversponsorship.
- Per-user caps prevent griefing and abuse.
- Refill flow is explicit and visible via DAO budget proposals.
- Usage data exposed via `AnalyticsHub` for reporting.

### Negative Consequences / Trade-offs

- Additional contract to deploy and audit.
- Refill cadence must keep up with sponsorship demand or service degrades.
- Per-user cap can block legitimate edge-case heavy users (mitigated by raise-cap proposals).

## Pros and Cons of the Options

### Option A — Paymaster pulls from Treasury directly

- ✅ Pro: One less contract.
- ❌ Con: Treasury exposed to Paymaster bugs and abuse.
- ❌ Con: No natural place to enforce per-user caps.

### Option B — Paymaster self-funded from user fees

- ✅ Pro: Eliminates protocol-side gas cost.
- ❌ Con: Defeats the purpose of sponsorship.
- ❌ Con: Negates the UX benefit of account abstraction for new users.

### Option C — Dedicated GasVault with usage tracking

- ✅ Pro: Segregated reserve; bounded blast radius.
- ✅ Pro: Per-user accounting enables fair-use enforcement.
- ❌ Con: Extra contract and refill workflow.

## Implementation Notes

- Interface:
  - `withdraw(address user, uint256 amount)` — called by Paymaster only.
  - `dailyCap()` and `userDailyCap(address)` — enforced on each withdraw.
- State: per-user cumulative usage; per-user daily usage; overall daily usage.
- Refill sources:
  - DAO budget proposals from Treasury.
  - Protocol fee streams routed to GasVault.
- Cap raises require governance proposals at the appropriate level.

## Links

- **Source documentation**: `/home/user/docs/protocol/contracts/utilities/GasVault.md`
- **Related ADRs**: ADR-0005, ADR-0014
