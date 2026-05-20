# ADR-0010: Deflationary Burns Only via Slashing

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: tokenomics, slashing, deflation

## Context and Problem Statement

Token burns are a common but often misused mechanism. Burn-on-transfer fees impose a tax on every movement of the token, hurting liquidity and producing surprising accounting in downstream contracts. DAO-initiated buyback-and-burn programs create a discretionary governance lever over supply that is hard to distinguish from minting in reverse. In aggregate these mechanisms tend to function more as "tokenomics theater" than as economic enforcement.

The TOSS token is fixed-supply (ADR-0009): there is no mint function, and there must be no informal mechanism that effectively re-creates one in reverse. At the same time, the protocol does need a path to reduce supply when a Fund Manager violates protocol rules — slashing is the economic enforcement mechanism, and a portion of slashed stake being burned tightens the alignment between violation and supply reduction.

The principle is simple: the only legitimate reason to decrease supply is enforcement against a violator. Every other burn mechanism either taxes good behavior or hands governance a supply lever it should not have.

## Decision Drivers

- Burns must reflect economic enforcement, not discretionary policy
- No tax on routine token movement
- Preserve the fixed-supply guarantee from ADR-0009 by tightly constraining the only path that reduces supply
- Avoid creating a discretionary governance lever over total supply

## Considered Options

1. **Burn-on-transfer fee** — a percentage of every transfer is burned.
2. **DAO-initiated buyback-and-burn** — governance allocates treasury to market buybacks then burns.
3. **Burns only via slashing** — the SlashingEngine is the sole authorized burner.
4. **No burns at all** — supply is strictly fixed; slashing redistributes instead of burning.

## Decision Outcome

**Chosen option**: *Burns only via slashing*, because it aligns supply reduction with enforcement, preserves the integrity of the fixed-supply guarantee, and avoids both the liquidity drag of transfer taxes and the governance attack surface of buyback programs.

The SlashingEngine (referenced by ADR-0025) is the sole address authorized to call the burn hook on the TOSS token. There are no burn-on-transfer fees. There are no DAO-initiated buybacks or burns. The only mechanism that reduces total supply is an authorized slashing event against a violating Fund Manager.

### Positive Consequences

- Supply reductions are always tied to a specific, justifiable enforcement event.
- Liquidity providers and traders do not pay an implicit transfer tax.
- Governance cannot manipulate supply through buyback programs.

### Negative Consequences / Trade-offs

- The deflationary effect is bounded by how often violations occur — and the protocol explicitly does not want frequent violations.
- The SlashingEngine becomes a high-value authority and must be carefully audited and access-controlled.
- There is no "knob" to adjust deflation rate; it is purely a consequence of enforcement.

## Pros and Cons of the Options

### Option A — Burn-on-transfer fee

- ✅ Pro: Predictable, automatic deflation tied to economic activity.
- ❌ Con: Taxes every transfer, hurting liquidity and DEX integrations.
- ❌ Con: Produces confusing accounting in downstream protocols that assume conservation.

### Option B — DAO-initiated buyback-and-burn

- ✅ Pro: Lets governance signal commitment to holders via discretionary burns.
- ❌ Con: A discretionary supply lever is the mirror image of discretionary minting.
- ❌ Con: Requires sustained treasury outflows and creates a governance attack surface.

### Option C — Burns only via slashing

- ✅ Pro: Burns occur only when economically justified by enforcement.
- ✅ Pro: No transfer tax; no governance supply lever.
- ❌ Con: Deflation is irregular and bounded by violation frequency.

### Option D — No burns at all

- ✅ Pro: Maximum simplicity; supply is strictly conserved.
- ❌ Con: Loses the deflationary signal that ties violation to supply reduction.
- ❌ Con: Slashed stake must be fully redistributed, which dilutes the enforcement message.

## Implementation Notes

- The TOSS token exposes a single `burnFrom` hook restricted to `SLASHING_ENGINE` (Risk Domain role from ADR-0008).
- The hook emits a dedicated `SlashBurn` event with the slashing case identifier for traceability.
- Any future change to authorize a different burner would require a token migration, not an upgrade.

## Links

- **Source documentation**: `docs/protocol/tokenomics/overview.md`, `docs/protocol/contracts/risk/SlashingEngine.md`
- **Related ADRs**: ADR-0009, ADR-0025
- **External references**: n/a
