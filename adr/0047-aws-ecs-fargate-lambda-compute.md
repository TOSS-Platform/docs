# ADR-0047: AWS ECS Fargate + Lambda for Compute

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: compute, aws, ecs, lambda

## Context and Problem Statement

TOSS off-chain workloads divide cleanly into two shapes. Long-running stateful services — the NAV Engine (ADR-0043), AnalyticsHub publishers, the chain listener — maintain in-memory caches, hold WebSocket connections, and benefit from staying warm. Short-lived event-driven functions — the Trade Router (ADR-0044), per-event processors triggered by EventBridge (ADR-0045) — should scale to zero between invocations and spin up only on demand.

Running both shapes on raw EC2 forces the team to manage instances, AMIs, autoscaling groups, and operating system patching. At current scale this is wasted effort. Running both on Kubernetes (EKS) adds a control plane that the team would have to learn and operate; for an off-chain plane of fewer than twenty services, that overhead exceeds the benefit.

AWS offers two managed compute runtimes that fit the two workload shapes directly: ECS Fargate runs containerized services without exposing instance management, and Lambda runs short functions with per-invocation scaling. Using them in combination means each workload runs on the runtime that matches it.

## Decision Drivers

- Avoid managing EC2 instances or a Kubernetes control plane at current scale.
- Long-running services need stable warm state and predictable resource limits.
- Bursty event-driven functions should scale to zero to control cost.
- Both runtimes must integrate with EventBridge, Secrets Manager, and VPC networking.

## Considered Options

1. **EC2 + systemd** — Manage instances, run services as systemd units.
2. **Amazon EKS** — Run everything on managed Kubernetes.
3. **Pure Lambda** — Everything as Lambda functions, no container services.
4. **ECS Fargate + Lambda hybrid** — Right runtime per workload shape.

## Decision Outcome

**Chosen option**: *ECS Fargate + Lambda hybrid*, because each workload runs on the runtime that matches its shape, with no instance management and no Kubernetes overhead.

### Positive Consequences

- Long-running services keep warm state and predictable resource envelopes on Fargate.
- Bursty event handlers scale to zero on Lambda, removing idle cost.
- No EC2 patching, no AMI builds, no Kubernetes control plane to operate.
- Both runtimes have first-class IAM, Secrets Manager, and VPC support.

### Negative Consequences / Trade-offs

- Two runtimes mean two deployment pipelines and two sets of operational quirks.
- Lambda cold starts impact tail latency for low-frequency endpoints.
- Fargate pricing is higher per-CPU-hour than equivalent EC2 reserved instances.

## Pros and Cons of the Options

### Option A — EC2 + systemd

- ✅ Pro: Lowest unit cost, complete control.
- ❌ Con: Team owns instance lifecycle, patching, AMIs.
- ❌ Con: No native scale-to-zero for bursty workloads.

### Option B — Amazon EKS

- ✅ Pro: Industry-standard portable platform.
- ❌ Con: Control plane and node group operations exceed team capacity for our scale.
- ❌ Con: Sourcing Kubernetes expertise costs more than we save.

### Option C — Pure Lambda

- ✅ Pro: Maximum elasticity, simplest packaging.
- ❌ Con: Poor fit for stateful services with long warm-up (NAV Engine, chain listener).
- ❌ Con: 15-minute execution cap and memory ceilings restrict design.

### Option D — ECS Fargate + Lambda hybrid

- ✅ Pro: Each workload uses the runtime that matches it.
- ✅ Pro: Both managed; minimal ops surface.
- ❌ Con: Two deployment paths.
- ❌ Con: Higher per-CPU cost than EC2.

## Implementation Notes

**ECS Fargate** runs:

- NAV Engine (1–4 task autoscaling on EventBridge backlog depth).
- AnalyticsHub publisher (1–2 tasks).
- Chain listener (singleton; restart-on-fail).
- Compliance pipeline workers.

Tasks live in the private subnet tier (ADR-0048). Service discovery via AWS Cloud Map. Each task assumes a least-privilege IAM role for Secrets Manager and EventBridge.

**AWS Lambda** runs:

- Trade Router (invoked per order; reserved concurrency cap).
- EventBridge target functions (per-event-type handlers).
- Scheduled jobs via EventBridge Scheduler.

Lambdas requiring database access are VPC-bound to the private subnets. Cold-start-sensitive functions use provisioned concurrency.

No EC2, no self-managed Kubernetes anywhere in the off-chain plane.

## Links

- **Source documentation**: `docs/technical/infrastructure/overview.md`
- **Related ADRs**: ADR-0045, ADR-0049
- **External references**: AWS Fargate documentation, AWS Lambda VPC networking
