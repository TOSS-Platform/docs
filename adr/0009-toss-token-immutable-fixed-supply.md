# ADR-0009: Immutable Fixed-Supply TOSS Token

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: tokenomics, token, immutable

## Context and Problem Statement

The TOSS token sits at the center of the protocol's economic model: it secures Fund Managers through staking, gates governance weight, and serves as collateral against risk. The value of all of these uses depends on a credible guarantee that the supply will not be expanded after deployment. Any mechanism that allows future minting — even one gated by governance — undermines that guarantee, because holders must then price in the possibility of dilution.

A common compromise is a capped supply with mintable headroom under DAO control. This is appealing in the abstract but creates a permanent governance attack surface: a hostile majority, a compromised key, or even a well-intentioned but mistaken vote can issue tokens to a chosen recipient. Investors and FMs cannot fully price collateral against a supply whose ceiling is governance-controllable.

A proxy-upgradeable token contract has the same problem at the code level: the upgrade itself can introduce mint authority. The strongest possible guarantee — and the one that requires zero ongoing trust in governance — is an immutable contract with no mint function and no proxy.

## Decision Drivers

- Credible, permanent guarantee that token supply cannot be expanded after deployment
- No governance attack surface around supply
- Clear, simple accounting for staking and collateral use cases
- Compatibility with deflationary slashing (ADR-0010)

## Considered Options

1. **Mintable + capped** — a hard cap with DAO-gated minting up to the cap.
2. **Proxy-upgradeable token** — token logic behind a proxy under DAO control.
3. **Immutable fixed supply** — non-upgradeable contract, no `mint`, no proxy.
4. **Rebasing supply** — balances scale algorithmically to track a target.

## Decision Outcome

**Chosen option**: *Immutable fixed supply*, because it is the only configuration that gives holders an unconditional guarantee against dilution.

TOSS is deployed as a non-upgradeable ERC-20 with the entire supply minted at deployment to the treasury and initial allocations. The contract has no `mint` function. It is not behind a proxy. The only path that decreases supply is the authorized slashing burn hook (ADR-0010).

### Positive Consequences

- Supply ceiling is a property of the bytecode, not of governance.
- Holders, FMs, and analysts can price the token against a fixed denominator.
- No upgrade path means no upgrade-related governance attack surface for the token itself.

### Negative Consequences / Trade-offs

- Bugs in the token contract cannot be fixed by upgrade; the contract must be exceptionally well audited.
- Future protocol features cannot extend token behavior in place; they must wrap or coexist alongside.
- Initial allocation decisions are permanent; there is no headroom for future emissions programs.

## Pros and Cons of the Options

### Option A — Mintable + capped

- ✅ Pro: Flexibility for future emissions, incentive programs, or unforeseen needs.
- ❌ Con: Governance can mint up to the cap; the cap itself is a soft promise.
- ❌ Con: A compromised governance key can dilute holders within the cap.

### Option B — Proxy-upgradeable token

- ✅ Pro: Bugs can be fixed by upgrade; logic can evolve.
- ❌ Con: The upgrade authority is a permanent attack surface.
- ❌ Con: An upgrade can introduce mint authority that the original contract lacked.

### Option C — Immutable fixed supply

- ✅ Pro: Unconditional supply guarantee, enforced by bytecode.
- ✅ Pro: Smallest possible governance attack surface on the token.
- ❌ Con: No path to fix a token-level bug other than a coordinated migration.

### Option D — Rebasing supply

- ✅ Pro: Can target a price or yield programmatically.
- ❌ Con: Confuses accounting in every downstream contract that assumes static balances.
- ❌ Con: Poor fit for collateral and staking use cases.

## Implementation Notes

- The TOSS contract is deployed directly, not behind any proxy.
- All initial allocations are set in the constructor; the contract has no `mint` function.
- A single `burnFrom` hook is exposed and restricted to the SlashingEngine address.

## Links

- **Source documentation**: `docs/protocol/contracts/core/TOSS.md`, `docs/protocol/tokenomics/immutable-layer.md`
- **Related ADRs**: ADR-0010, ADR-0011
- **External references**: ERC-20
