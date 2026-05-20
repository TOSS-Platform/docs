# ADR-0051: Disaster Recovery — 1h RTO / 5min RPO

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: reliability, dr, backup

## Context and Problem Statement

The TOSS protocol survives on-chain failures by design: blockchain state lives on zkSync Era and Ethereum L1, replicated across thousands of nodes. The off-chain plane is a different story. A regional AWS outage, a destructive bug in a migration, or a misconfigured `terraform destroy` can corrupt or wipe the PostgreSQL database that stores NAV history, trade audit logs, and analytics aggregates.

If the off-chain plane goes down without a recovery plan, share pricing and withdrawals stop until the database is rebuilt. Because investor flows depend on the committed NAV (ADR-0043) and that pipeline depends on Postgres, recovery time directly determines how long users wait to redeem.

Disaster recovery objectives must therefore be set explicitly. Two numbers matter: Recovery Time Objective (RTO), the maximum acceptable time to restore service, and Recovery Point Objective (RPO), the maximum acceptable data loss measured in time. These two numbers drive the backup investment.

Setting both objectives to zero (synchronous multi-region replication) is technically possible but costs significantly more in cross-region write latency and infrastructure. A more conservative active-passive model with frequent backups achieves objectives that match the protocol's real risk profile at far lower cost.

## Decision Drivers

- Off-chain plane downtime directly blocks share pricing and withdrawals.
- Cost of synchronous cross-region replication is not justified at current scale.
- Audit and regulatory obligations require retention regardless of operational state.
- DR must be tested regularly; an untested plan is no plan.

## Considered Options

1. **No defined DR** — Rely on AWS managed-service durability with no recovery plan.
2. **Zero-RPO multi-region active-active** — Synchronous replication across regions.
3. **1h-RTO / 5min-RPO active-passive with backups** — Frequent backups, manual cutover.

## Decision Outcome

**Chosen option**: *1h-RTO / 5min-RPO active-passive with backups*, because it bounds user-visible downtime to one hour and data loss to five minutes at a cost that is small relative to the protocol's operational budget.

### Positive Consequences

- Recovery from regional failure or destructive bug is bounded and known.
- Cross-region backup copies survive a single-region AWS event.
- 30-day point-in-time recovery covers most "human error" rollbacks.
- Quarterly runbook tests keep the plan exercised, not theoretical.

### Negative Consequences / Trade-offs

- Up to five minutes of data may be lost in a worst-case recovery.
- One-hour RTO means investors will experience downtime in a regional event.
- Quarterly DR tests consume engineering time.

## Pros and Cons of the Options

### Option A — No defined DR

- ✅ Pro: Zero direct cost.
- ❌ Con: Unbounded downtime in any real incident.
- ❌ Con: Fails any meaningful operational review.

### Option B — Zero-RPO multi-region active-active

- ✅ Pro: No data loss, regional failure transparent to users.
- ❌ Con: Cross-region synchronous writes add tens of milliseconds to every commit.
- ❌ Con: Cost roughly doubles the data tier.

### Option C — 1h-RTO / 5min-RPO active-passive

- ✅ Pro: Bounded recovery window at proportionate cost.
- ✅ Pro: Backups survive regional events via cross-region copy.
- ❌ Con: Up to five minutes of data loss in worst case.
- ❌ Con: Cutover is manual and must be drilled.

## Implementation Notes

**Targets**:

- **RTO ≤ 1 hour** — from incident declaration to share pricing and withdrawals resumed.
- **RPO ≤ 5 minutes** — maximum acceptable data loss measured from the last consistent backup point.

**Mechanisms**:

- **RDS automated backups** with point-in-time recovery enabled. Retention: 30 days. Backup window aligned to the lowest-traffic hour.
- **Cross-region backup copy** of RDS snapshots and S3 backup buckets to us-west-2 (active region is us-east-1).
- **S3 versioning** on analytics buckets (ADR-0055) plus Glacier archive for older versions.
- **Documented manual restore runbook** kept in the operations repo, exercised quarterly. The drill replays a recent snapshot into a parallel RDS instance and validates NAV continuity.
- **No synchronous cross-region replication.** A future ADR may revisit this if scale or regulatory posture changes.

Alerting on backup job failures pages the on-call engineer (ADR-0054). A missed backup is treated as an incident even when no real outage has occurred.

## Links

- **Source documentation**: `docs/technical/infrastructure/overview.md`
- **Related ADRs**: ADR-0046, ADR-0048
- **External references**: AWS Backup, RDS point-in-time recovery, S3 cross-region replication
