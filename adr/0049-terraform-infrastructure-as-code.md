# ADR-0049: Terraform for Infrastructure-as-Code

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: iac, terraform, devops

## Context and Problem Statement

The TOSS off-chain plane must be reproducible across development, staging, and production. Without an infrastructure-as-code (IaC) tool, environments drift the moment an engineer makes a one-off change in the AWS Console. Drift is undocumented, unreviewable, and impossible to recreate after an emergency wipe — which is the exact moment reproducibility matters most.

IaC is also a precondition for meaningful code review of infrastructure changes. Console changes cannot be diffed, cannot be requested for review, and cannot be rolled back to a known-good state. Bringing infrastructure into git turns network rules, IAM policies, and database parameters into the same review artifacts as application code.

The chosen tool must integrate with the team's existing GitHub Actions CI, support the AWS services already in scope (VPC, ECS, RDS, ElastiCache, Lambda, EventBridge, Secrets Manager), and have a module ecosystem mature enough that the team does not write every resource from scratch.

Four candidates are in scope: AWS CloudFormation, AWS CDK, Pulumi, and Terraform. The team has Terraform experience from previous projects; the others would require ramp-up.

## Decision Drivers

- Declarative configuration that can be reviewed via pull request.
- Mature module ecosystem for AWS resources to avoid reinventing every primitive.
- Plan/apply workflow with state locking to prevent concurrent destructive changes.
- Team has prior production experience with the tool.

## Considered Options

1. **AWS CloudFormation** — AWS-native declarative templates.
2. **AWS CDK** — Imperative code (TypeScript/Python) compiled to CloudFormation.
3. **Pulumi** — General-purpose imperative IaC across clouds.
4. **Terraform** — HCL declarative IaC with provider model.

## Decision Outcome

**Chosen option**: *Terraform*, because the team has direct production experience with it, the AWS module ecosystem is mature, and the plan/apply workflow with remote state and locking fits our CI cleanly.

### Positive Consequences

- Every infrastructure change goes through a reviewable PR with a plan diff attached.
- Disaster recovery: the entire AWS footprint can be rebuilt from git plus secrets.
- State locking in DynamoDB prevents concurrent applies from racing.
- Reusable modules across dev/staging/production reduce drift.

### Negative Consequences / Trade-offs

- HCL is less expressive than a general-purpose language; complex loops are awkward.
- State file management is its own operational concern.
- Provider version pins must be maintained.

## Pros and Cons of the Options

### Option A — AWS CloudFormation

- ✅ Pro: AWS-native, no extra tool.
- ❌ Con: Slower release cadence for new AWS features than Terraform's AWS provider.
- ❌ Con: Stack update semantics are awkward; rollback is harsh.

### Option B — AWS CDK

- ✅ Pro: General-purpose language gives full programmability.
- ❌ Con: Team has no production experience; ramp cost is real.
- ❌ Con: Compiles to CloudFormation, inheriting its limits.

### Option C — Pulumi

- ✅ Pro: Multi-cloud, general-purpose language.
- ❌ Con: Same ramp cost as CDK without a tie-breaker.
- ❌ Con: Smaller community than Terraform for AWS-specific modules.

### Option D — Terraform

- ✅ Pro: Team has shipped Terraform to production before.
- ✅ Pro: Largest AWS module ecosystem; new services land quickly.
- ❌ Con: HCL expressiveness limits.
- ❌ Con: State file is a hard dependency.

## Implementation Notes

**Repository layout** (in the infrastructure repo):

- `modules/networking` — VPC, subnets, route tables, NAT (ADR-0048).
- `modules/compute` — ECS cluster, Fargate services, Lambda functions (ADR-0047).
- `modules/database` — RDS PostgreSQL, ElastiCache Redis (ADR-0046).
- `modules/monitoring` — CloudWatch alarms, log groups, BetterStack integration (ADR-0054).
- `envs/dev`, `envs/staging`, `envs/production` — root modules per environment (ADR-0050).

**State**: stored in an S3 bucket per environment with versioning; locking via a DynamoDB table.

**CI**: GitHub Actions runs `terraform fmt -check`, `terraform validate`, and `terraform plan` on every PR, posting the plan as a PR comment. `terraform apply` runs from a protected workflow on merge to `main` for production and on merge to `staging` branch for staging.

No infrastructure resource is allowed to exist in AWS without a Terraform definition; drift detection runs weekly.

## Links

- **Source documentation**: `docs/technical/infrastructure/overview.md`
- **Related ADRs**: ADR-0047, ADR-0050
- **External references**: Terraform AWS provider, terraform-aws-modules registry
