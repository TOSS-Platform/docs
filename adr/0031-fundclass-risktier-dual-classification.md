# ADR-0031: FundClass + RiskTier Dual Classification

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: fund, classification, standards

## Context and Problem Statement

Funds in the TOSS Protocol vary along two largely orthogonal axes. The first axis is strategy — what the fund is trying to do: capital preservation, stable yield, balanced growth, directional alpha, aggressive returns. The second is risk level — how much can be lost in adverse conditions: tight low-leverage with conservative whitelists versus high-leverage with broad asset access. A market-neutral strategy can be either low-risk or high-risk depending on leverage and execution; an "aggressive" strategy is not automatically high-risk if leverage is bounded.

A single one-dimensional classification (e.g., "high-risk fund") collapses both axes and loses information that both investors and the protocol need. Investors filtering for "stable yield" cannot disambiguate strategy from risk if only one label exists. Conversely, a nested hierarchy (strategy contains risk levels) imposes a rigid structure that prevents legitimate combinations from being expressed.

The chosen design classifies every fund along two independent axes. `RiskTier` controls hard, contract-enforced parameters (max leverage, asset whitelist tightness, minimum FM stake). `FundClass` describes intent and is used for investor matching, FM reputation tracking, and discovery. Both are stored on `FundRegistry` and consumed by their respective downstream systems.

## Decision Drivers

- Risk parameters and strategy intent are independent and must be expressible independently.
- Investors need a clean filter by strategy and a clean filter by risk.
- Hard limits (RiskTier) and soft matching (FundClass) have different consumers.
- Avoidance of rigid hierarchies that exclude valid combinations.

## Considered Options

1. **Single classification** — one label per fund.
2. **Nested hierarchy** — strategy contains risk levels.
3. **Two independent axes** — FundClass and RiskTier.

## Decision Outcome

**Chosen option**: *Two independent axes*, because risk and strategy are orthogonal and the protocol needs both expressible without forcing one to subsume the other.

### Positive Consequences

- Investors can filter on strategy and risk independently.
- Hard risk parameters live in one place; investor matching lives in another.
- New strategies or risk tiers can be added on either axis without cross-impact.

### Negative Consequences / Trade-offs

- Two classifications double the metadata FMs must declare at fund creation.
- The combinatorial space of (FundClass × RiskTier) requires guidance — not every combination is sensible.
- Investor UI must clearly present both axes; a single label is simpler to display.

## Pros and Cons of the Options

### Option A — Single classification

- Pro: Simplest metadata and UI.
- Pro: One filter for investors.
- Con: Conflates risk and strategy; loses information.
- Con: Cannot express "low-risk alpha" or "high-risk yield" cleanly.

### Option B — Nested hierarchy

- Pro: Compact representation.
- Pro: Natural taxonomy when categories nest.
- Con: Rigid; some legitimate combinations become unrepresentable.
- Con: Reorganising the hierarchy later requires migration.

### Option C — Two independent axes

- Pro: Each axis serves its natural consumers.
- Pro: Combinations are expressible without taxonomy changes.
- Pro: Hard limits (RiskTier) and soft matching (FundClass) decoupled.
- Con: More metadata at creation time.
- Con: Some combinations are nonsensical and need guidance.

## Implementation Notes

- `FundClass ∈ {Stable, Yield, Balanced, Alpha, Aggressive, Custom}`.
- `RiskTier ∈ {Tier1, Tier2, Tier3, Tier4}`.
- `RiskTier` controls:
  - Maximum leverage.
  - Asset whitelist tightness (Tier1 is the strictest).
  - Minimum FM stake required to operate the fund.
  - Caps consumed by `FundRiskDomain`.
- `FundClass` controls:
  - Investor matching and discovery filters.
  - FM reputation tracking by class.
  - Class-specific governance and listing rules.
- Both fields are required at fund creation and stored on `FundRegistry`.
- Changes after creation require DAO approval and may force a fund snapshot.

## Links

- **Source documentation**: `docs/protocol/standards/overview.md`, `docs/protocol/tokenomics/fundclass-investorclass-models.md`
- **Related ADRs**: ADR-0018, ADR-0021, ADR-0029
- **External references**: none
