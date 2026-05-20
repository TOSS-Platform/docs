# ADR-0044: Trade Router Abstraction over CEX and DEX

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: trading, router, offchain

## Context and Problem Statement

Fund Manager (FM) strategies on TOSS span a wide range of execution venues: spot DEX swaps on zkSync Era, CEX limit orders on Binance and Coinbase, perpetual futures, and complex multi-venue executions that must split a single intent across several books to minimize slippage. Each venue has its own SDK, authentication model, settlement timing, and failure mode.

Hardcoding venue-specific logic into each FM strategy duplicates integration code dozens of times and turns any venue API change into a coordinated migration across strategies. More importantly, it removes the protocol's ability to enforce pre-trade risk checks, venue whitelists, and compliance-driven restrictions in a single place. Audit trails fragment across strategy code, making post-trade investigation slow.

The protocol also needs to monitor and restrict venues for risk and compliance reasons (e.g., disable a venue after a security incident, block certain pairs in restricted jurisdictions). With direct integrations this is impossible without re-deploying every affected strategy.

A trade abstraction layer must mediate every order, expose a unified interface, apply pre-trade gating, and emit a uniform post-trade event stream.

## Decision Drivers

- Single pre-trade risk gate must intercept every order before it reaches any venue.
- Venue churn (new venue, deprecated venue, paused venue) must not require strategy redeployment.
- Large orders must be splittable across venues to minimize slippage.
- Post-trade events must feed NAV and analytics consistently regardless of venue.

## Considered Options

1. **FM direct DEX/CEX integration** — Each strategy talks to venues directly.
2. **Single-DEX-only** — Restrict the protocol to on-chain DEX execution.
3. **Router abstraction with pre-trade RiskEngine call** — Unified order interface.

## Decision Outcome

**Chosen option**: *Router abstraction with pre-trade RiskEngine call*, because it places venue selection, risk gating, and event emission in a single control point that the protocol governs.

### Positive Consequences

- Strategies submit a single canonical order shape; the router handles venue idiosyncrasies.
- A single change disables a venue across all FMs.
- Slippage minimization via cross-venue splitting is centralized and improvable independently of strategies.
- Uniform execution events feed NAV (ADR-0043) and AnalyticsHub (ADR-0042) without per-venue glue.

### Negative Consequences / Trade-offs

- The router is a hot path; its latency directly impacts execution quality.
- Adds a service that must be highly available; outage stops trading.
- Strategies cannot exploit venue-specific order types that the router has not yet exposed.

## Pros and Cons of the Options

### Option A — FM direct DEX/CEX integration

- ✅ Pro: Lowest latency, full access to venue-specific features.
- ❌ Con: No central risk gate; strategies could bypass restrictions.
- ❌ Con: Venue changes force redeploying every strategy.

### Option B — Single-DEX-only

- ✅ Pro: Simplest implementation, fully on-chain.
- ❌ Con: Excludes CEX access — most active strategies become impossible.
- ❌ Con: Liquidity constraints; slippage on large fund sizes.

### Option C — Router abstraction with pre-trade RiskEngine call

- ✅ Pro: Single control point for risk, compliance, venue selection.
- ✅ Pro: Strategies remain stable as venues evolve.
- ❌ Con: Router availability is a new dependency.
- ❌ Con: Latency overhead vs. direct venue calls.

## Implementation Notes

The Trade Router runs as an AWS Lambda function (per ADR-0047) invoked over a private internal endpoint. Per-order flow:

1. FM strategy submits a canonical order: `{fundId, asset, side, size, type, limits}`.
2. Router calls RiskEngine (ADR-0022). Rejection ends the flow before any venue contact.
3. Router consults the fund's venue whitelist and current health flags.
4. Router selects venues to minimize slippage, splitting if size warrants.
5. Router executes on each venue, gathers fills, produces an execution proof.
6. Router emits a uniform `TradeExecuted` event to EventBridge (ADR-0045); NAV Engine and AnalyticsHub consume it.

Venue adapters live behind a single internal interface; adding a venue means writing one adapter, not touching strategy code.

## Links

- **Source documentation**: `docs/technical/offchain/overview.md`
- **Related ADRs**: ADR-0022, ADR-0043, ADR-0045
- **External references**: Binance Spot API, Coinbase Advanced Trade API, zkSync Era DEX aggregators
