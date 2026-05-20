# ADR-0005: Paymaster-Sponsored Gas Model

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: zksync, ux, gas, paymaster

## Context and Problem Statement

Requiring users to hold ETH or USDC purely to pay gas adds significant friction. The problem is sharpest for actions that the protocol itself benefits from: a Fund Manager calling the RiskEngine to validate a trade, a token holder voting in governance, or a user invoking a protective action such as a circuit-breaker check. Charging the actor for gas in these cases is at best inconsistent and at worst discourages exactly the behavior the protocol wants to encourage.

zkSync Era supports native Paymasters: contracts that can pay gas on behalf of a transaction subject to arbitrary on-chain policy. This lets the protocol decide, per call, who pays — without changing the user's wallet flow.

The team must decide which operations the protocol sponsors and which remain user-paid. The risk is twofold: sponsoring too little keeps the UX painful; sponsoring too much creates an attack surface (gas griefing) and a recurring cost the protocol must fund.

## Decision Drivers

- Reduce friction for actions whose execution benefits the protocol or its users
- Avoid creating gas-griefing attack vectors via unbounded sponsorship
- Keep trading itself FM-paid so trading volume does not leak into protocol expense
- Use a funding source (GasVault) that is itself protocol-owned and DAO-controlled

## Considered Options

1. **User-paid gas only** — every actor pays their own gas in ETH or USDC.
2. **Sponsor all operations** — the Paymaster pays for everything.
3. **Selective per-policy sponsorship** — sponsor a defined allowlist of operations.
4. **Third-party Paymaster-as-a-service** — outsource sponsorship to an external provider.

## Decision Outcome

**Chosen option**: *Selective per-policy sponsorship*, because it removes friction exactly where the protocol benefits while keeping cost bounded and FMs accountable for their own trading volume.

The protocol operates a Paymaster funded by GasVault (see ADR-0041). The Paymaster sponsors gas for: (a) RiskEngine validation calls made by FMs; (b) governance voting at all three governance levels; (c) a defined set of user-protective actions (e.g., emergency redemption requests, circuit-breaker checks). Trading itself is FM-paid.

### Positive Consequences

- Governance participation does not require holding native gas tokens.
- FMs are not penalized for performing the safety check the protocol requires of them.
- Cost is bounded by the policy allowlist and the GasVault budget.

### Negative Consequences / Trade-offs

- Sponsorship policy is itself a governance surface and must be carefully tuned to prevent griefing.
- GasVault must be funded and refilled; depletion would silently degrade UX.
- The allowlist must be maintained alongside new contracts and selectors.

## Pros and Cons of the Options

### Option A — User-paid gas only

- ✅ Pro: Zero protocol cost; no attack surface from sponsorship.
- ❌ Con: Users must hold ETH/USDC purely for gas; voter turnout and FM compliance suffer.

### Option B — Sponsor all operations

- ✅ Pro: Best possible UX; users effectively gasless.
- ❌ Con: Unbounded protocol cost and direct griefing surface (spam calls).
- ❌ Con: FMs' trading volume becomes a protocol expense, distorting incentives.

### Option C — Selective per-policy sponsorship

- ✅ Pro: Targets friction where protocol benefits are clearest.
- ✅ Pro: Cost is bounded and DAO-controllable.
- ❌ Con: Policy maintenance is ongoing work.

### Option D — Third-party Paymaster service

- ✅ Pro: No protocol operational burden.
- ❌ Con: Introduces trust in a third party and a censorship vector.
- ❌ Con: Revenue and policy control leak outside the DAO.

## Implementation Notes

- The Paymaster contract checks `(caller, target, selector)` against a DAO-managed policy table.
- Per-policy daily caps prevent griefing; exhausted caps fall back to user-paid.
- GasVault refill is a standing governance line item.

## Links

- **Source documentation**: `docs/protocol/zksync/overview.md`, `docs/protocol/contracts/utilities/GasVault.md`
- **Related ADRs**: ADR-0004, ADR-0041
- **External references**: zkSync Paymaster documentation
