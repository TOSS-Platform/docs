# ADR-0026: PriceOracleRouter — Multi-Source Median Aggregation

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: oracle, security, pricing

## Context and Problem Statement

NAV calculation, deposit and withdrawal share pricing, FaultIndex computation, and slashing math all depend on accurate asset prices. Oracle manipulation has been the proximate cause of most large DeFi exploits in recorded history. Relying on a single price source — even a trusted one like Chainlink — creates a single point of failure: a stale feed, a delayed update, or a deliberate manipulation can propagate into protocol-wide damage before mitigations can engage.

Different oracle types have different failure modes. Chainlink has strong update guarantees but discrete heartbeat semantics. Centralised exchange API feeds (Binance, Coinbase) are responsive but introduce off-chain trust. On-chain TWAPs (Uniswap V3) are manipulation-resistant over windows but lag instantaneously. Combining sources with different failure modes makes correlated failure significantly less likely.

The chosen design queries four independent sources, rejects outliers via deviation thresholds, and reports the median of the survivors. Stale data (older than 10 minutes) is excluded outright. This produces a price that is robust to any single-source manipulation and that fails closed (no price returned) rather than fails open (a wrong price returned) when too many sources are unhealthy.

## Decision Drivers

- Resistance to single-source manipulation and stale-data attacks.
- Diversity of failure modes across selected sources.
- Predictable, deterministic aggregation usable on-chain.
- Fail-closed behaviour when source health degrades.

## Considered Options

1. **Single oracle (Chainlink only)** — direct read from one provider.
2. **Two-source min/max** — compare two sources, take one extreme.
3. **Median-of-4 with outlier rejection** — median across four diverse sources.
4. **Off-chain attested aggregator** — a signed feed from a trusted operator.

## Decision Outcome

**Chosen option**: *Median-of-4 with outlier rejection*, because it diversifies across failure modes and yields a robust price without introducing new trust assumptions.

### Positive Consequences

- A single corrupted or stale source cannot move the reported price.
- Outlier rejection makes coordinated two-source manipulation expensive.
- Stale-data exclusion combines naturally with circuit breakers (ADR-0027).

### Negative Consequences / Trade-offs

- Querying four sources is more expensive than one (acceptable on L2).
- Two of the four sources (Binance, Coinbase) are off-chain bridges with their own trust assumptions.
- Median-of-4 has an even cardinality; the implementation must specify tie-handling deterministically.

## Pros and Cons of the Options

### Option A — Single oracle (Chainlink only)

- Pro: Minimal gas; one external call.
- Pro: Strong publisher reputation.
- Con: Single point of failure.
- Con: Heartbeat lag during fast markets.

### Option B — Two-source min/max

- Pro: Mitigates one-source manipulation.
- Pro: Simple to reason about.
- Con: Two sources still allow coordinated manipulation.
- Con: Min/max is biased — not a fair price.

### Option C — Median-of-4 with outlier rejection

- Pro: Robust to any single-source compromise.
- Pro: Diverse failure modes across the four sources.
- Pro: Median is a fair central-tendency statistic.
- Con: Higher gas; more integration surface.
- Con: Even cardinality requires explicit tie-handling.

### Option D — Off-chain attested aggregator

- Pro: Very flexible; can fuse arbitrary signals.
- Pro: Easy to upgrade off-chain.
- Con: Reintroduces a trusted operator.
- Con: Non-atomic with on-chain settlement.

## Implementation Notes

- Contract: `PriceOracleRouter.getPrice(asset) returns (uint256 priceX18, uint64 timestamp)`.
- Sources: Chainlink (primary), Binance API feed, Coinbase API feed, Uniswap V3 TWAP.
- Outlier rule: any source whose value deviates by more than 5% from the candidate median is excluded; the median is recomputed on the survivors.
- Staleness rule: any sample older than 600 seconds is excluded.
- If fewer than two healthy sources remain after exclusion, the call reverts and the caller is expected to engage circuit breakers per ADR-0027.
- Even-cardinality tie: lower of the two central values is taken (deterministic, conservative).

## Links

- **Source documentation**: `docs/protocol/contracts/utilities/PriceOracleRouter.md`, `docs/protocol/security/overview.md`
- **Related ADRs**: ADR-0022, ADR-0027
- **External references**: Chainlink AggregatorV3Interface, Uniswap V3 oracle (`OracleLibrary.consult`).
