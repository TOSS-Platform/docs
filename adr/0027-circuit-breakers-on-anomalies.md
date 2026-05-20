# ADR-0027: Circuit Breakers on Oracle and Risk Anomalies

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: risk, oracle, safety

## Context and Problem Statement

Even with the multi-source median oracle from ADR-0026, correlated failures and extreme market events can produce unreliable prices. If the protocol continues to mint and burn shares, settle slashings, and update NAV using bad prices, the resulting damage is permanent and unrecoverable: shares get issued at the wrong ratio, harmed funds are mis-compensated, and incorrect FaultIndex values fire unwarranted consequences. The "fail open" default — keep transacting at degraded prices — is the worst possible behaviour during these windows.

The protocol must also avoid the symmetric mistake: a full halt traps user funds. If a user wants to withdraw during a perceived anomaly, the protocol denying them access converts a temporary price problem into a confidence problem. Liquidity provision must remain available even when the protocol stops accepting new exposure.

The chosen design pauses new exposure (trades, deposits, governance-driven parameter changes) when defined anomaly conditions persist, while keeping withdrawals open. Withdrawals during breaker mode use a conservative pricing path (e.g., last validated NAV, or last TWAP) so that users can always exit at a deterministic, bounded ratio. Clearing the breaker is an explicit human-in-the-loop action by the DAO or the Guardian role.

## Decision Drivers

- Avoid acting on demonstrably unreliable prices.
- Preserve user exit liquidity at all times.
- Make breaker engagement and clearance explicit and auditable.
- Avoid noise-driven trips that erode user trust.

## Considered Options

1. **Fail-open** — keep transacting at whatever price the oracle returns.
2. **Fail-closed for everything** — full pause until oracles recover.
3. **Fail-closed with withdrawal-only mode** — pause exposure, allow exits.

## Decision Outcome

**Chosen option**: *Fail-closed with withdrawal-only mode*, because it removes the worst outcomes (mispriced new exposure) without trapping users inside the protocol.

### Positive Consequences

- New mispriced exposure cannot accumulate during anomaly windows.
- Users can always exit at a conservative, deterministic ratio.
- Clear, auditable breaker lifecycle: trip conditions, blocked actions, clearance.

### Negative Consequences / Trade-offs

- Withdrawals during breaker mode may use a conservative price, disadvantaging exiters slightly.
- Defining trip thresholds requires care to avoid false positives.
- Manual clearance introduces operational dependency on DAO/Guardian responsiveness.

## Pros and Cons of the Options

### Option A — Fail-open

- Pro: No new mechanism; simplest behaviour.
- Pro: No false-positive risk.
- Con: Mispriced exposure is irreversible damage.
- Con: Encourages oracle-manipulation attacks.

### Option B — Fail-closed for everything

- Pro: No mispriced action of any kind.
- Pro: Simple "everything off" semantics.
- Con: Traps user funds; converts price risk into trust risk.
- Con: A long-running anomaly becomes a crisis.

### Option C — Fail-closed with withdrawal-only mode

- Pro: Stops new mispriced exposure.
- Pro: Preserves exit liquidity at all times.
- Pro: Lifecycle is auditable and policy-controlled.
- Con: Conservative withdrawal pricing has user-perceivable cost.
- Con: Requires DAO/Guardian to clear breakers.

## Implementation Notes

- Trip conditions (any one sufficient):
  - PriceOracleRouter reports >10% deviation across surviving sources for `N` consecutive blocks.
  - All primary feeds for an asset are stale (>10 min).
  - Protocol-wide cumulative FaultIndex exceeds the per-window threshold.
- Blocked while tripped: trades, new deposits, governance-executed parameter changes.
- Allowed while tripped: withdrawals using conservative pricing (last validated NAV).
- Clearance: DAO proposal or Guardian role action; both emit `BreakerCleared` with full context.
- Events: `BreakerTripped(reason, scope)`, `BreakerCleared(actor)`.

## Links

- **Source documentation**: `docs/protocol/contracts/utilities/PriceOracleRouter.md`, `docs/protocol/contracts/risk/RiskEngine.md`
- **Related ADRs**: ADR-0026, ADR-0037
- **External references**: none
