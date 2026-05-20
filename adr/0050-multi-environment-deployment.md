# ADR-0050: Multi-Environment Deployment (Dev / Staging / Production)

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: deployment, environments

## Context and Problem Statement

A protocol that handles real funds cannot ship changes directly from a developer's branch to mainnet. Contract bugs and integration regressions need to be caught against an environment that mirrors production closely enough to expose problems before user funds are at risk. Without a staging mirror, the only place a bug surfaces is production.

At the same time, ambiguous naming and promotion rules cause their own outages. If "staging" sometimes points at mainnet contracts and sometimes at testnet, engineers will eventually merge the wrong branch to the wrong environment and trigger a real-fund incident. The mapping between git branches, deployment targets, and on-chain network must be unambiguous and enforced by CI.

Documentation, MCP resources, and the dashboard frontends must follow the same environment split so that staging consumers can validate UI and protocol changes together end-to-end.

The decision sets the number of environments, the git branch that drives each, the network each targets, and the promotion gating between them.

## Decision Drivers

- Staging must mirror production tightly enough to catch integration bugs.
- Branch-to-environment mapping must be unambiguous and CI-enforced.
- Frontend, docs, MCP, and contracts must move together per environment.
- Promotion to production must require explicit human approval.

## Considered Options

1. **Two environments only (dev + prod)** — Skip staging.
2. **Ephemeral PR environments only** — Spin per-PR stacks, no persistent staging.
3. **Three-tier branch-mapped (dev / staging / production)** — Persistent staging mirror.

## Decision Outcome

**Chosen option**: *Three-tier branch-mapped environments*, because a persistent staging mirror with explicit promotion gating is the only configuration that consistently catches integration bugs before mainnet exposure.

### Positive Consequences

- Every change exercises a production-shaped environment on testnet before mainnet.
- Branch-to-environment mapping is enforced in CI, removing accidental cross-deploys.
- Frontend, docs, MCP, and contracts stay in lockstep per environment.
- Mainnet deploys require an explicit reviewer approval, not just a merge.

### Negative Consequences / Trade-offs

- Three environments cost more to run than two.
- Staging state can drift from production over time; periodic sync needed.
- Engineers must understand the promotion model, which adds onboarding overhead.

## Pros and Cons of the Options

### Option A — Two environments only

- ✅ Pro: Lowest cost and complexity.
- ❌ Con: No production-shaped place to catch integration bugs.
- ❌ Con: Mainnet becomes the first place new code meets real data.

### Option B — Ephemeral PR environments only

- ✅ Pro: Every PR gets isolated infrastructure.
- ❌ Con: State, data volume, and external integrations never mirror prod.
- ❌ Con: Multi-PR integration scenarios cannot be tested.

### Option C — Three-tier branch-mapped

- ✅ Pro: Persistent staging mirror catches integration issues realistically.
- ✅ Pro: Branch-based mapping is simple and CI-enforceable.
- ❌ Con: Cost and ops overhead of a third environment.
- ❌ Con: Staging drift requires periodic resync.

## Implementation Notes

**Environment-to-branch mapping**:

- **`develop`** — No auto-deploy. PRs against `develop` may spin up preview deployments for the docs site only. Contract deployments do not run from `develop`.
- **`staging`** — Auto-deploy on merge. Targets `staging.docs.toss.fi` for the docs site, the staging dashboard host, and **zkSync Sepolia testnet** contract addresses. MCP resources are published from the staging branch to the staging MCP endpoint.
- **`main`** — Auto-deploy on merge. Targets `docs.toss.fi`, the production dashboard, and **zkSync Era mainnet** contract addresses. MCP resources publish to the production MCP endpoint.

**Promotion** from `staging` to `main` requires a pull request with:

- Full CI matrix green (unit, integration, end-to-end against staging).
- At least one approving review from an engineer not on the change.
- Manual workflow dispatch confirmation before `terraform apply` runs against production.

Terraform workspaces (ADR-0049) parameterize per-environment values; the root module for each environment lives under `envs/<env>/`. Secrets are environment-scoped in Secrets Manager (ADR-0052).

## Links

- **Source documentation**: `docs/mcp-integration/development-workflow.md`
- **Related ADRs**: ADR-0049, ADR-0058
- **External references**: zkSync Sepolia testnet, GitHub Actions environments
