# ADR-0006: L1<->L2 Bridge with Optional Fast Withdrawal

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: bridge, zksync, ux

## Context and Problem Statement

Withdrawing from zkSync to Ethereum L1 through the canonical, proof-based bridge takes hours: a validity proof must be generated, posted to L1, and finalized before the withdrawal is claimable. For most users this is acceptable, but for fund redeemers who need L1 access to their funds — particularly those exiting to fiat off-ramps or rebalancing across L1 venues — hours of latency materially degrades the experience.

The two extremes are unsatisfactory. A bridge that only supports proof-based withdrawals has the strongest security guarantees but a poor UX for time-sensitive flows. A bridge that only supports fast, LP-fronted withdrawals offers great UX but introduces a liquidity-provider trust assumption and additional fees, and does not work when the LP network is unwilling or unable to front a particular withdrawal.

We need a model that lets the user pick the trade-off transaction by transaction: pay nothing extra and wait, or pay a small fee and get near-instant L1 funds.

## Decision Drivers

- Preserve canonical, trust-minimized withdrawal as the default option
- Offer a low-latency alternative for time-sensitive flows
- Do not introduce a single-point-of-failure in the bridge architecture
- Keep both paths protocol-native rather than depending on an off-platform off-ramp

## Considered Options

1. **Proof-based only** — canonical zkSync withdrawal, no fast path.
2. **Fast-only** — only LP-fronted bridging exposed to users.
3. **Dual-path with user choice** — both paths available; user picks per withdrawal.
4. **Centralized exchange off-ramp** — direct users to a CEX for fast L1 access.

## Decision Outcome

**Chosen option**: *Dual-path with user choice*, because it preserves the trust-minimized default while offering a near-instant option for users who accept the cost and trust trade-off.

The standard path uses the canonical zkSync proof-based bridge with no extra fee. The fast path routes through liquidity-provider bridges that front the L1 funds against the in-flight L2 withdrawal. Users select the path at withdrawal time; the UI surfaces fee, latency, and the LP trust assumption clearly.

### Positive Consequences

- Users who care about cost and trust use the canonical path with no compromise.
- Users with time-sensitive flows get sub-minute L1 access for a small fee.
- The protocol depends on no single bridge operator for either path.

### Negative Consequences / Trade-offs

- Two paths means two UX flows to document, audit, and monitor.
- LP-fronted bridges have their own counterparty risk that must be disclosed.
- LP liquidity may be insufficient for very large withdrawals, partially defeating the fast option.

## Pros and Cons of the Options

### Option A — Proof-based only

- ✅ Pro: Strongest security; no third-party trust.
- ❌ Con: Hours-scale latency for every withdrawal regardless of urgency.
- ❌ Con: Drives users to off-platform workarounds that the protocol cannot govern.

### Option B — Fast-only

- ✅ Pro: Best UX; near-instant L1 access for every user.
- ❌ Con: Imposes LP trust and fee on users who would prefer to wait for free.
- ❌ Con: Large withdrawals may exhaust LP liquidity and fail.

### Option C — Dual-path with user choice

- ✅ Pro: Lets each user pick their own latency-vs-trust-vs-cost trade-off.
- ✅ Pro: Canonical path remains the default and is always available.
- ❌ Con: Two flows to maintain; clearer disclosure required.

### Option D — Centralized exchange off-ramp

- ✅ Pro: Lowest engineering cost; reuses existing CEX infrastructure.
- ❌ Con: Not protocol-native; introduces KYC and custodial steps outside the protocol.
- ❌ Con: Subject to CEX listing decisions and policy changes.

## Implementation Notes

- The fast path integrates one or more LP bridge providers behind a common router contract.
- The router enforces the user's selection and does not silently fall back across paths.
- Fee, latency estimate, and LP identity are surfaced in the UI at the moment of withdrawal.

## Links

- **Source documentation**: `docs/protocol/architecture/l1-l2-communication.md`
- **Related ADRs**: ADR-0002, ADR-0003
- **External references**: zkSync canonical bridge documentation
