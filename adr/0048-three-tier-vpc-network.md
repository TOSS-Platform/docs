# ADR-0048: Three-Tier VPC Network Architecture

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: network, security, vpc

## Context and Problem Statement

The TOSS production AWS network handles public API ingress, internal service-to-service traffic, and data store access. A flat single-subnet VPC forces every service to harden its own public ingress, every database to defend against direct internet probes, and every misconfigured security group to potentially expose state. That posture fails standard defense-in-depth review and increases the blast radius of any single misconfiguration.

The protocol's threat model includes hostile scanners constantly probing public IPs, opportunistic credential stuffing, and the worst-case scenario where a single compute task is compromised. The network must make sure that even after a successful compromise of one task, the attacker cannot directly reach RDS or ElastiCache without traversing additional controls.

A tiered subnet model is the standard solution: separate subnets for public-facing components (load balancers, NAT gateways), for compute workloads that must be reachable from public traffic only via load balancers, and for data stores that must never be reachable from the internet at all.

Spanning multiple Availability Zones is also required to survive a single-AZ outage, which AWS treats as routine.

## Decision Drivers

- Data stores must have no route to or from the public internet.
- Compute must be reachable from public traffic only through load balancers.
- A single-AZ outage must not take down the off-chain plane.
- Security group rules must follow least-privilege and be reviewable in IaC.

## Considered Options

1. **Flat single-subnet VPC** — Everything in one routable subnet.
2. **Two-tier public/private** — Load balancers public, everything else private.
3. **Three-tier public/private/isolated** — Add a no-internet isolated tier for data.

## Decision Outcome

**Chosen option**: *Three-tier public/private/isolated*, because it enforces the strongest network boundary around data stores while still allowing compute to reach the internet for outbound calls via NAT.

### Positive Consequences

- Data stores are unreachable from the internet by network design, not by policy.
- A compromised compute task cannot pivot to RDS or ElastiCache without an explicit SG rule.
- Cross-AZ deployment survives single-AZ failures with no manual intervention.
- Security group rules are short, explicit, and auditable in Terraform.

### Negative Consequences / Trade-offs

- NAT gateway charges for outbound traffic from private subnets.
- More subnets to plan IP ranges for and to monitor.
- Adding a new service type requires deciding which tier it lives in.

## Pros and Cons of the Options

### Option A — Flat single-subnet VPC

- ✅ Pro: Simplest setup, no routing decisions.
- ❌ Con: Weak security boundary; every service self-defends.
- ❌ Con: Data stores are one SG misconfiguration from public exposure.

### Option B — Two-tier public/private

- ✅ Pro: Reasonable defense for compute.
- ❌ Con: Data stores still routable from any compute SG that lists their port.
- ❌ Con: Compromise of one private task can directly attack RDS.

### Option C — Three-tier public/private/isolated

- ✅ Pro: Data tier has no internet route at all.
- ✅ Pro: Explicit cross-tier rules are easy to review.
- ❌ Con: NAT cost and more subnets.
- ❌ Con: Slightly more design effort per new service.

## Implementation Notes

**VPC**: single VPC in us-east-1, CIDR planned to allow future peering.

**Subnets**, across us-east-1a and us-east-1b:

- **Public tier**: hosts Application Load Balancers and NAT gateways only. Route table has a default route to the internet gateway.
- **Private tier**: hosts ECS Fargate tasks (ADR-0047) and VPC-bound Lambda functions. Route table sends 0.0.0.0/0 to the NAT gateway in the same AZ. No inbound from the internet.
- **Isolated tier**: hosts RDS PostgreSQL and ElastiCache Redis (ADR-0046). No default route. No NAT. Reachable only from private-tier security groups on the database ports.

**Security groups**: per-service SGs. Cross-tier rules reference SG IDs, never CIDR blocks. All rules expressed in Terraform (ADR-0049) and reviewed on PR.

Cloudflare (ADR-0053) fronts the ALBs; the ALB security groups accept ingress only from Cloudflare IP ranges.

## Links

- **Source documentation**: `docs/technical/infrastructure/overview.md`
- **Related ADRs**: ADR-0046, ADR-0047
- **External references**: AWS VPC best practices, AWS Well-Architected Security Pillar
