# ADR-0046: PostgreSQL + Redis Data Layer

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: database, postgresql, redis

## Context and Problem Statement

The TOSS off-chain plane needs durable storage for several distinct workloads: NAV history (append-mostly time series with audit obligations), trade audit logs (transactional, joined with fund and FM metadata), analytics aggregates (relational reports for dashboards and regulators), and operational state for services (compliance findings, fee accruals).

At the same time, services need sub-millisecond reads for hot keys that change frequently: the current committed NAV per fund, session-key state for account-abstraction flows (ADR-0004), per-IP rate-limit counters, and ephemeral compute scratch space. Hitting a relational database on every hot read is too slow and inflates connection pool pressure.

A single store cannot serve both tiers well. Relational databases give ACID guarantees, joins, and rich query semantics but are not designed for sub-ms key lookups at scale. Pure key-value stores hit the latency target but lack the transactional integrity required for accounting and audit records.

A two-store architecture — durable relational primary, in-memory cache secondary — matches the workload shape and is the industry default for this profile.

## Decision Drivers

- ACID guarantees required for NAV history, trade audit, fee accounting.
- Sub-millisecond read latency required for hot session-key and rate-limit paths.
- Operational overhead must stay low; team prefers managed AWS services.
- Schema must support ad-hoc analytics queries during incident investigation.

## Considered Options

1. **PostgreSQL only** — All workloads on the relational store.
2. **Redis only** — All workloads on the in-memory KV store.
3. **DynamoDB only** — AWS-native serverless KV/document store.
4. **PostgreSQL + Redis** — Durable primary plus hot cache.

## Decision Outcome

**Chosen option**: *PostgreSQL + Redis*, because it pairs ACID durability with sub-ms hot reads using two mature managed services that the team can operate without bespoke tooling.

### Positive Consequences

- NAV history, trade audit, and accounting records get true transactional guarantees.
- Hot paths (current NAV read, session-key lookups, rate-limit counters) bypass Postgres latency.
- Analytics teams can run ad-hoc SQL on historical data.
- Managed RDS + ElastiCache reduce operational burden.

### Negative Consequences / Trade-offs

- Two stores to monitor, back up, and reason about.
- Cache invalidation logic must be implemented carefully to avoid stale reads.
- Cost is higher than a single-store deployment.

## Pros and Cons of the Options

### Option A — PostgreSQL only

- ✅ Pro: Single store, single backup story, full ACID.
- ❌ Con: Hot-read latency unacceptable for session-key and rate-limit paths.
- ❌ Con: Connection pool pressure under fan-out.

### Option B — Redis only

- ✅ Pro: Lowest latency for every read.
- ❌ Con: Durability guarantees insufficient for accounting and audit.
- ❌ Con: Ad-hoc analytics queries impossible.

### Option C — DynamoDB only

- ✅ Pro: Managed, scales horizontally, low ops.
- ❌ Con: Relational analytics queries weak; secondary indexes expensive.
- ❌ Con: Migration tooling for time-series analytics is poor.

### Option D — PostgreSQL + Redis

- ✅ Pro: Each workload runs on the right store.
- ✅ Pro: Both are well-known to the team and well-supported on AWS.
- ❌ Con: Two stores to operate.
- ❌ Con: Cache coherence becomes a design concern.

## Implementation Notes

**PostgreSQL 15** on Amazon RDS:

- Multi-AZ deployment for HA failover.
- 100 GB SSD initial, with autoscaling up to 1 TB.
- Automated backups + point-in-time recovery (see ADR-0051).
- Lives in the isolated subnet tier (ADR-0048).

**Redis 7.0** on Amazon ElastiCache:

- Cluster mode enabled for shard-level scaling.
- TLS in transit, encryption at rest.
- Isolated subnet tier, security group restricts ingress to ECS/Lambda service SGs.

**Write pattern**: writes go to Postgres first; on commit, the writer updates or invalidates the corresponding Redis key. Readers always try Redis; on miss, they read Postgres and populate Redis with a short TTL. No service writes to Redis as its source of truth.

## Links

- **Source documentation**: `docs/technical/infrastructure/overview.md`
- **Related ADRs**: ADR-0047
- **External references**: Amazon RDS for PostgreSQL, Amazon ElastiCache for Redis
