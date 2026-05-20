# ADR-0029: Investor Class System (Retail / Premium / Institutional / Strategic)

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: investor, classes, governance

## Context and Problem Statement

Investors using the TOSS Protocol span several orders of magnitude in capital, sophistication, and engagement. A first-time retail user depositing $500 and an institutional allocator deploying $10M have fundamentally different needs: the former requires conservative defaults and tight protective rails, the latter requires access to more aggressive fund tiers and larger position sizes. Treating both identically either over-protects the institution (denying it useful exposure) or under-protects the retail user (exposing them to risk they cannot evaluate).

A simple KYC-tier-only classification would distinguish retail from institutional but misses an important protocol-design lever: investors with skin in the game (TOSS staked) and a clean track record (ICS) should have access to richer features regardless of jurisdictional KYC status. Conversely, an institutional KYC tier without TOSS stake should not automatically unlock the strongest privileges, because the protocol benefits when access is correlated with economic commitment.

The chosen design combines staked TOSS and Investor Composite Score (ADR-0030) into four discrete investor classes. The class determines fund eligibility (some funds are gated to Premium+), voting multipliers (ADR-0035), risk allowances, and deposit caps. Defaults are tuned so that progression through classes requires both commitment and good behaviour.

## Decision Drivers

- Risk-appropriate protection for users of different sophistication levels.
- Reward for protocol commitment (stake) and track record (ICS).
- Composability with FundClass eligibility, voting, and risk allowances.
- Avoidance of pure-KYC gating that doesn't reflect on-chain commitment.

## Considered Options

1. **Single class for everyone** — uniform treatment.
2. **KYC-tier-only classification** — class follows compliance tier.
3. **Composite stake + score class** — four classes from stake and ICS.

## Decision Outcome

**Chosen option**: *Composite stake + score class*, because it ties investor privileges to both economic commitment and demonstrated behaviour rather than to compliance tier alone.

### Positive Consequences

- Class progression rewards stake depth and consistent good behaviour.
- Higher-risk funds are gated to investors who can credibly evaluate them.
- Voting and risk allowance scale naturally with class.

### Negative Consequences / Trade-offs

- Thresholds require calibration and may need DAO adjustment.
- Class changes happen at threshold crossings; some users may oscillate at boundaries.
- The matrix of (stake threshold, ICS threshold) needs both to be met, which can frustrate users who satisfy only one.

## Pros and Cons of the Options

### Option A — Single class for everyone

- Pro: Simplest possible UX.
- Pro: No threshold calibration.
- Con: Under-protects retail or under-serves institutions.
- Con: No lever to reward stake or good behaviour.

### Option B — KYC-tier-only classification

- Pro: Trivially aligns with regulatory categories.
- Pro: No on-chain calibration.
- Con: Ignores commitment and track record.
- Con: Hard to update as protocol matures.

### Option C — Composite stake + score class

- Pro: Aligns privileges with commitment and behaviour.
- Pro: Composes with FundClass, voting, and risk modules.
- Pro: Adjustable via DAO without protocol upgrade.
- Con: Threshold calibration is ongoing work.
- Con: Boundary oscillation needs hysteresis design.

## Implementation Notes

- Classes: `Retail` (default), `Premium`, `Institutional`, `Strategic`.
- Default thresholds (both must be satisfied to advance):
  - Staked TOSS: `0 / 1,000 / 10,000 / 100,000`.
  - ICS: `0 / 50 / 70 / 85`.
- Class controls:
  - Fund eligibility (each fund declares a minimum class).
  - Voting multiplier per ADR-0035.
  - Per-action risk allowance via `InvestorRiskDomain`.
  - Deposit cap and concentration limits.
- Class is recomputed on stake change or ICS update and persisted in `InvestorRegistry`.
- Hysteresis: downgrade requires the lower threshold to be missed by 10% to avoid oscillation.

## Links

- **Source documentation**: `docs/protocol/contracts/investor/InvestorRegistry.md`, `docs/protocol/tokenomics/fundclass-investorclass-models.md`
- **Related ADRs**: ADR-0030, ADR-0031, ADR-0035
- **External references**: none
