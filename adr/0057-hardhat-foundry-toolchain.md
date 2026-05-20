# ADR-0057: Hardhat + Foundry for Smart-Contract Testing

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: testing, toolchain

## Context and Problem Statement

Solidity testing tools have complementary strengths. Hardhat, written in TypeScript and built around ethers.js, is well suited to scripted scenarios, deployment simulation, and integration with off-chain code such as keeper bots and indexers. Foundry, written in Rust with tests authored in Solidity, runs unit tests an order of magnitude faster, supports rich fuzzing natively, and exposes cheatcodes that allow precise manipulation of state, time, and storage for invariant testing.

Neither tool covers both spaces well. Hardhat's fuzzing story relies on external libraries and is comparatively slow. Foundry lacks first-class support for zkSync deployment workflows and is awkward when the test scenario requires substantial TypeScript-side orchestration (mock servers, keepers, off-chain signatures). Picking only one forces a compromise on either deployment realism or fuzzing depth.

TOSS has a mix of logic that fits each tool naturally. Deployment scripts, end-to-end flows that span keepers and contracts, and zkSync-specific integration tests fit Hardhat. Pure Solidity libraries — RiskMathLib, FaultIndex calculations, fixed-point helpers — fit Foundry, especially with property-based fuzzing.

## Decision Drivers

- Use the right tool for each test category instead of forcing one to do both jobs.
- Native fuzzing performance is critical for invariant coverage of math-heavy libraries.
- Hardhat-zksync is the established path for zkSync deployment workflows.
- Keep the contributor onboarding burden reasonable.

## Considered Options

1. **Hardhat only** — single toolchain, relies on external fuzz libraries.
2. **Foundry only** — fast tests and native fuzzing, weak zkSync deployment story.
3. **Brownie** — Python-based alternative.
4. **Hardhat + Foundry hybrid** — each tool used where it is strongest.

## Decision Outcome

**Chosen option**: *Hardhat + Foundry hybrid*, because it lets each tool operate where it is strongest without forcing either to handle the other's weaknesses.

Hardhat with the `hardhat-zksync` plugin handles deployment scripts, integration tests, and TypeScript-driven scenarios that involve off-chain components. Foundry handles unit tests for pure Solidity logic (RiskMathLib, FaultIndex calculations) and property-based fuzzing of accounting invariants. Echidna is reserved as an optional layer for stateful invariant fuzzing on the highest-risk contracts such as SlashingEngine, run on demand or before tagged releases.

### Positive Consequences

- Math-heavy libraries get fast, expressive fuzz coverage via `forge`.
- zkSync deployment and AA/paymaster flows remain in the Hardhat ecosystem where tooling is best.
- Foundry cheatcodes simplify invariant testing without elaborate mock plumbing.

### Negative Consequences / Trade-offs

- Contributors must learn two toolchains.
- Two test runners means two CI jobs, two coverage tools, and two sets of configuration to maintain.
- Some fixtures may be duplicated when the same scenario needs to be expressed in both worlds.

## Pros and Cons of the Options

### Option A — Hardhat only

- ✅ Pro: Single toolchain, one mental model.
- ✅ Pro: Tight integration with TypeScript codebase.
- ❌ Con: Fuzzing is slow and requires third-party plugins.
- ❌ Con: Invariant testing is verbose compared to Foundry.

### Option B — Foundry only

- ✅ Pro: Fast unit tests, excellent fuzzing, powerful cheatcodes.
- ❌ Con: zkSync deployment workflows are not first-class.
- ❌ Con: Off-chain integration tests require external orchestration.

### Option C — Brownie

- ✅ Pro: Python ecosystem familiar to some contributors.
- ❌ Con: Ecosystem activity has declined; future maintenance is uncertain.
- ❌ Con: No clear zkSync support path.

### Option D — Hardhat + Foundry hybrid

- ✅ Pro: Each tool used where its strengths apply.
- ✅ Pro: Foundry fuzzing complements Hardhat scenarios without conflict.
- ❌ Con: Two toolchains to maintain in CI.
- ❌ Con: Slightly higher onboarding effort.

## Implementation Notes

- Hardhat tests live under `test/` and run via `npm test`.
- Foundry tests live under `test-foundry/` and run via `forge test`.
- Shared fixtures use a thin Solidity-side helper to avoid duplicating setup logic.
- Echidna runs are not part of the default CI; they are triggered via a separate workflow.

## Links

- **Source documentation**: `docs/technical/testing/overview.md`
- **Related ADRs**: ADR-0056
- **External references**: https://book.getfoundry.sh, https://hardhat.org/hardhat-runner/plugins/matter-labs-hardhat-zksync
