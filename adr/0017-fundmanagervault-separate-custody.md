# ADR-0017: Separate FundManagerVault for Asset Custody

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: fund, custody, security

## Context and Problem Statement

A fund contract has two distinct responsibilities: custody of investor assets and execution of trades on behalf of those assets. Trade execution requires complex logic — routing across venues, handling slippage, applying risk checks, supporting strategy-specific operations. Custody requires the opposite: minimal logic, narrow surface, and aggressive auditing because any bug touches the entire vault balance.

Combining both responsibilities in a single contract inflates its bytecode, its attack surface, and the blast radius of any bug. A defect in a niche trade-routing path could expose the full vault balance to drainage, even though the path itself only ever moves a small fraction of assets. Auditing a combined contract is also disproportionately expensive: every line counts as custody-sensitive.

Separating custody from execution lets each contract optimize for its role. The vault becomes a small, easy-to-audit primitive: hold tokens, enforce who can move them, and refuse anything else. The executor can iterate on strategy-specific logic without ever having direct access to the vault's storage beyond authorized transfer requests.

## Decision Drivers

- Minimize the audit surface of custody.
- Limit blast radius of bugs in execution paths.
- Allow execution logic to evolve without re-auditing custody.
- Keep risk checks at the boundary between execution and custody.

## Considered Options

1. **Single fund contract with custody + execution** — monolithic vault.
2. **Separate vault + executor** — custody in a minimal `FundManagerVault`, execution in `FundTradeExecutor`.
3. **Per-investor custody** — each investor's assets live in their own contract or sub-vault.

## Decision Outcome

**Chosen option**: *Separate vault + executor*, because it isolates custody from execution complexity and lets risk checks gate every asset movement.

### Positive Consequences

- `FundManagerVault` bytecode is small and audit-focused: hold assets, enforce role-gated transfers, expose accounting reads.
- `FundTradeExecutor` can implement strategy-specific routing without holding assets directly.
- All asset movements pass through a single chokepoint where `RiskEngine` validation is applied.
- Upgrades to execution logic do not require re-auditing custody.

### Negative Consequences / Trade-offs

- Two contracts per fund instead of one, increasing deployment and integration complexity.
- Every trade incurs a cross-contract call from executor to vault.
- The vault must expose enough primitives for the executor to operate but not so many that custody becomes flexible.

## Pros and Cons of the Options

### Option A — Single fund contract with custody + execution

- ✅ Pro: Lowest cross-contract overhead.
- ✅ Pro: Simpler integration surface.
- ❌ Con: Bugs in any execution path can drain the vault.
- ❌ Con: Audit cost scales with full feature set.

### Option B — Separate vault + executor

- ✅ Pro: Minimal, hardened custody contract.
- ✅ Pro: Risk checks live at the vault/executor boundary.
- ❌ Con: Two contracts per fund, more deployment work.
- ❌ Con: Cross-contract call gas per trade.

### Option C — Per-investor custody

- ✅ Pro: Maximum isolation between investors.
- ❌ Con: Gas cost grows linearly with investor count for any pooled operation.
- ❌ Con: Pro-rata logic becomes intractable.

## Implementation Notes

- `FundManagerVault` exposes: `deposit(token, amount)`, `withdrawTo(token, to, amount)`, `executeTransfer(token, to, amount)` (executor-only), `balanceOf(token)`, and `totalNAV()`.
- `executeTransfer` is callable only by the bound `FundTradeExecutor`, set immutably at clone construction.
- `FundTradeExecutor` calls `RiskEngine.check(...)` before invoking `executeTransfer`; the vault itself does not embed risk logic.
- Both contracts are EIP-1167 clones (ADR-0016) bound to a single FM at creation.
- Withdrawal queue (ADR-0020) and NAV pricing (ADR-0019) live on the vault, not the executor.

## Links

- **Source documentation**: `docs/protocol/contracts/fund/FundManagerVault.md`, `docs/protocol/contracts/fund/FundTradeExecutor.md`
- **Related ADRs**: ADR-0016, ADR-0022
- **External references**: —
