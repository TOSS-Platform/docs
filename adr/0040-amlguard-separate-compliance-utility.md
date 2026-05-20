# ADR-0040: AMLGuard as Separate Compliance Utility

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: compliance, aml, utility

## Context and Problem Statement

The protocol must apply AML and sanctions screening (OFAC, EU consolidated, UN) at deposit, withdrawal, and high-value transfer paths. Screening logic includes list membership checks, threshold-based triggers, and integration with reported suspicious-address sets. These rules evolve on a regulatory cadence — list additions, jurisdictional updates, and policy changes occur far more frequently than vault contract logic itself changes.

Embedding the screening logic inside each vault contract duplicates the same code across every fund and other compliance-bound surface. Audit cost grows with the number of surfaces; each update to a list must touch every contract that performs the check. Drift between implementations is likely: one vault patches a list while another does not. Inline logic also slows updates because every list addition becomes a contract change.

A central utility addresses these problems. Vaults and other consumers make a single call to `AMLGuard.check(...)` before sensitive operations and revert on rejection. The list and reporting state live in one place, audited once, and updated through governance with a fast emergency path for sanctions additions.

## Decision Drivers

- Regulatory lists update faster than vault contract logic.
- Single audit surface for compliance logic.
- Avoid drift between per-contract inline implementations.
- Emergency additions to sanctions lists must be deployable quickly.

## Considered Options

1. **Inline checks per contract** — each vault embeds AML logic.
2. **Off-chain only screening** — checks happen off-chain before signing.
3. **Central on-chain AMLGuard utility** — single contract called by all consumers.

## Decision Outcome

**Chosen option**: *Central on-chain AMLGuard utility*, because it concentrates compliance logic in one audited surface and supports rapid list updates without touching consumers.

### Positive Consequences

- Single audited compliance surface across all consumers.
- List updates do not require redeploying vault contracts.
- Emergency sanctions additions can use a Guardian Committee fast path.
- Reverts on rejection are uniform and observable on-chain.

### Negative Consequences / Trade-offs

- AMLGuard becomes a single point of failure if buggy or paused.
- Every protected operation incurs the cost of an external call.
- Centralizes the policy power that decides what addresses are blocked.

## Pros and Cons of the Options

### Option A — Inline checks per contract

- ✅ Pro: No external call cost at the protection site.
- ❌ Con: Drift and duplicated audit cost across contracts.
- ❌ Con: Every list update requires touching every contract.

### Option B — Off-chain only screening

- ✅ Pro: Most flexibility for policy and updates.
- ❌ Con: Not enforceable on-chain against any user with direct contract access.
- ❌ Con: Provides no on-chain audit trail of compliance decisions.

### Option C — Central on-chain AMLGuard utility

- ✅ Pro: Single audited surface; uniform behavior.
- ✅ Pro: Fast update path without touching consumers.
- ❌ Con: Single point of failure if misconfigured; mitigated by Guardian veto and governance review.

## Implementation Notes

- Interface: `AMLGuard.check(address subject, bytes32 action, uint256 amount) returns (bool ok)`; revert on rejection.
- State: sanctions list, suspicious-address reports, action-specific thresholds.
- Updates:
  - Routine list updates via governance proposal (FM-level or Protocol-level depending on scope).
  - Emergency sanctions additions via Guardian Committee multisig fast path.
- Consumers: all Vault contracts, the Bridge layer, and any high-value transfer surface.

## Links

- **Source documentation**: `/home/user/docs/protocol/contracts/utilities/AMLGuard.md`
- **Related ADRs**: ADR-0008, ADR-0017, ADR-0028
