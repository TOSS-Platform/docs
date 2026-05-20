# ADR-0056: Multi-Layer Testing Pyramid with zkSync-Specific Tests

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: testing, quality

## Context and Problem Statement

Smart contracts on zkSync Era L2 have semantic and runtime constraints that diverge from Ethereum L1. Gas accounting differs, account abstraction is native, paymaster integration affects transaction flow, and certain EVM precompiles and opcodes are unavailable or behave differently. As a result, a contract that passes a full test suite against a local Hardhat EVM node can still fail when deployed to zkSync.

The traditional Ethereum testing pyramid — heavy on unit tests, light on integration, occasional mainnet fork tests — assumes EVM-equivalent execution. For TOSS this assumption does not hold. We need a layered strategy that exercises both pure Solidity logic and zkSync-specific runtime behavior (AA, paymaster, custom precompile substitutes).

In addition, several modules in TOSS (NAV math, FaultIndex weight composition, high-water-mark accrual) carry accounting risk where silent rounding errors compound over time. Coverage alone is insufficient; we need property-based fuzzing and, for the highest-risk paths, an option to apply formal methods.

## Decision Drivers

- Catch zkSync-specific failures before testnet, not after deployment.
- Maintain a fast inner development loop while keeping high-fidelity tests in CI.
- Validate accounting invariants under adversarial inputs, not just hand-picked cases.
- Keep cost proportional to risk — formal verification is expensive and should be selective.

## Considered Options

1. **Hardhat-only on EVM** — single toolchain, fastest setup.
2. **zkSync-only test suite** — maximum fidelity, every test on a zkSync node.
3. **Layered pyramid + zkSync simulation + fuzz + selective formal** — graduated coverage matched to risk.

## Decision Outcome

**Chosen option**: *Layered pyramid + zkSync simulation + fuzz + selective formal*, because it matches test fidelity to risk while keeping the iteration loop fast for routine changes.

The pyramid is structured as 60% unit tests (Jest + `hardhat-zksync` runner), 30% integration tests covering multi-contract flows on a local zkSync node, and 10% end-to-end tests against a public testnet via CI. On top of the pyramid we add dedicated layers: zkSync simulation tests that exercise Account Abstraction and Paymaster flows specifically; Foundry fuzz tests for property invariants on pure Solidity libraries; and optional Certora formal verification reserved for critical accounting logic (NAV math, FaultIndex weights, SlashingEngine reductions).

### Positive Consequences

- zkSync-specific failures (AA validation, paymaster rejection, gas-limit edge cases) surface in CI rather than on testnet.
- Property fuzzing catches rounding and overflow bugs that example-based unit tests miss.
- Developers retain a fast EVM-side unit loop for routine logic changes.
- Formal verification budget is concentrated where it provides the most assurance.

### Negative Consequences / Trade-offs

- CI runtime grows substantially compared to a Hardhat-only setup.
- Tooling matrix is wider; engineers must be fluent in Hardhat, Foundry, and zkSync nuances.
- Maintaining a local zkSync node in CI introduces image and version pinning overhead.

## Pros and Cons of the Options

### Option A — Hardhat-only on EVM

- ✅ Pro: Single toolchain, lowest learning curve, fastest CI.
- ✅ Pro: Mature ecosystem and broad community familiarity.
- ❌ Con: Misses zkSync-specific behavior entirely.
- ❌ Con: AA and paymaster flows cannot be tested faithfully.

### Option B — zkSync-only test suite

- ✅ Pro: Highest fidelity, every test reflects production runtime.
- ❌ Con: Test loop is slow, harming developer productivity.
- ❌ Con: No native fuzzing story; property testing is awkward.
- ❌ Con: Pure Solidity logic does not need this level of fidelity.

### Option C — Layered pyramid + zkSync sim + fuzz + selective formal

- ✅ Pro: Fidelity scales with risk; cheap tests run often, expensive ones run where they matter.
- ✅ Pro: Fuzzing covers invariants; formal methods cover critical math.
- ❌ Con: More moving parts; CI configuration is non-trivial.
- ❌ Con: Requires engineers to understand multiple tools.

## Implementation Notes

- Jest + `hardhat-zksync` runner is the default for unit and integration suites.
- Foundry (`forge`) targets the `libs/` directory containing pure Solidity helpers.
- Certora specifications are checked in under `formal/` and run only on tagged releases or on demand.
- Local zkSync node version is pinned via Docker image digest, not tag.

## Links

- **Source documentation**: `docs/technical/testing/overview.md`
- **Related ADRs**: ADR-0002, ADR-0057
- **External references**: https://docs.zksync.io/build/test-and-debug
