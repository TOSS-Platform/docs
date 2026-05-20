# ADR-0052: AWS Secrets Manager + IAM Roles for Secrets

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: security, secrets, iam

## Context and Problem Statement

Off-chain services need a range of credentials: database passwords for RDS PostgreSQL, cache credentials for ElastiCache Redis, API keys for Binance and Coinbase exchanges, Chainlink and Pyth oracle endpoints, and signer keys for chain-publishing operations (the NAV commit transaction, slashing transactions). Each of these is a high-value secret whose leakage carries operational or financial consequences.

Baking secrets into container images via environment variables is the worst common option: anyone with image read access reads the secrets, and rotation requires rebuilding and redeploying every image. Storing them in plaintext config files in the repository is strictly worse. Reading them from a per-host filesystem with manual provisioning is an operational burden that does not scale and produces inconsistent state across hosts.

Services also need a way to authenticate to whatever secret store the protocol chooses. Distributing static AWS access keys to each service multiplies the leak surface: every service now holds long-lived AWS credentials that could be exfiltrated from logs, error reports, or memory dumps.

The right model is a managed secret store accessed via short-lived, role-scoped credentials that the platform issues to the workload identity.

## Decision Drivers

- No long-lived static credentials in code, config, or environment variables.
- Automatic rotation for any secret that supports it (especially DB credentials).
- Workload authentication via short-lived, role-scoped identities, not access keys.
- Per-service least-privilege: a compromised task cannot read all secrets.

## Considered Options

1. **Environment variables / `.env` files** — Bake or mount secrets into the process env.
2. **HashiCorp Vault** — Run a self-managed Vault cluster for secrets.
3. **AWS Secrets Manager + IAM roles** — Managed AWS store, IAM-role authentication.

## Decision Outcome

**Chosen option**: *AWS Secrets Manager + IAM roles*, because it removes static AWS credentials from every workload, supports automatic rotation for our primary secrets (RDS), and integrates natively with the ECS/Lambda runtimes already chosen.

### Positive Consequences

- No service holds long-lived AWS credentials; tasks assume their role at runtime.
- RDS credentials rotate automatically every 30 days with no service code changes.
- Secret access is logged in CloudTrail; per-task read events are auditable.
- Least-privilege is enforced via IAM policies tied to each task role.

### Negative Consequences / Trade-offs

- AWS lock-in for secret management.
- Per-secret pricing accumulates as the secret count grows.
- Cross-region access requires explicit replication configuration per secret.

## Pros and Cons of the Options

### Option A — Environment variables / `.env` files

- ✅ Pro: Trivially simple to consume in any language.
- ❌ Con: Leaks via image, process listing, error dumps, log scraping.
- ❌ Con: Rotation forces redeploy.

### Option B — HashiCorp Vault

- ✅ Pro: Cloud-portable, rich policy and dynamic-credential features.
- ❌ Con: Operating Vault HA at production grade is significant work.
- ❌ Con: Authentication paths to Vault still need bootstrap credentials.

### Option C — AWS Secrets Manager + IAM roles

- ✅ Pro: Fully managed, native ECS/Lambda integration.
- ✅ Pro: Automatic rotation for RDS; no bootstrap credentials needed.
- ❌ Con: AWS-specific.
- ❌ Con: Per-secret cost adds up.

## Implementation Notes

**Storage**:

- All secrets live in AWS Secrets Manager, one secret per logical credential.
- RDS master passwords use Secrets Manager's managed rotation (30-day interval).
- Exchange API keys and oracle endpoints are stored as JSON-structured secrets; rotation is manual but tracked.
- Signer keys for chain-publishing operations are stored as encrypted secrets and loaded only into the specific tasks that need them.

**Access**:

- Each ECS task and Lambda function (ADR-0047) authenticates via an IAM role attached to the workload.
- The role's policy grants `secretsmanager:GetSecretValue` only on the specific secret ARNs the workload needs.
- No service uses long-lived AWS access keys. No access keys are committed to git.

**Runtime usage**:

- Tasks fetch the required secrets at startup using the AWS SDK and cache them in memory.
- On rotation, RDS-fronting services either reload at next connection cycle or restart on a configured schedule.
- Secrets are never logged. Log scrubbers in the BetterStack pipeline (ADR-0054) drop fields matching known secret patterns as a defense in depth.

## Links

- **Source documentation**: `docs/technical/infrastructure/overview.md`
- **Related ADRs**: ADR-0047, ADR-0048
- **External references**: AWS Secrets Manager documentation, IAM roles for ECS tasks
