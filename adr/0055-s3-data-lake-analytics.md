# ADR-0055: S3 Data Lake for Long-Term Analytics

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: data, s3, analytics

## Context and Problem Statement

Analytics, regulatory, and post-mortem workloads all reach far back in time. A BI dashboard might compare daily NAV across two years of fund history. A regulator might request a complete trade history for a specific fund covering twelve months. An incident investigation might join slashing events with governance proposal records from before the incident window. PostgreSQL (ADR-0046) is sized for operational hot data, not for years of immutable history.

Keeping all of that history in Postgres explodes storage cost, slows queries against recent data, and stretches backup windows. It also conflates two different storage shapes: operational state that changes frequently and historical state that is append-only and immutable after a short reconciliation period.

Audit and compliance obligations push in the same direction: regulators expect tiered, immutable retention with explicit lifecycle policies. Storing audit records mutably in a primary database does not meet that bar.

An object-store data lake — append-only, lifecycle-tiered, queryable on demand via a separate engine — separates these concerns cleanly. S3 is the obvious choice given the rest of the stack runs on AWS, and Athena over partitioned Parquet gives ad-hoc SQL access without standing up a warehouse.

## Decision Drivers

- Long-term retention must not bloat Postgres or slow operational queries.
- Audit and compliance need immutable, tiered storage with explicit retention.
- Ad-hoc analytics queries must be possible without standing up a data warehouse.
- Cross-region durability for backup data, not for primary analytics data.

## Considered Options

1. **Keep all history in Postgres** — Retain everything in the operational store.
2. **Amazon Redshift** — Provisioned cloud data warehouse.
3. **S3 + Athena data lake** — Object store with serverless SQL.
4. **Snowflake** — Managed multi-cloud data warehouse.

## Decision Outcome

**Chosen option**: *S3 + Athena data lake*, because it matches the append-only shape of historical data, costs orders of magnitude less than warehouse alternatives at our volume, and integrates with the AWS account and IAM model already in use.

### Positive Consequences

- Operational Postgres stays small and fast; only hot operational data lives there.
- Lifecycle transitions to Glacier cut storage cost for cold data by an order of magnitude.
- Athena's serverless model means no warehouse cluster to operate.
- Versioning and cross-region replication on the backup bucket meet DR requirements (ADR-0051).

### Negative Consequences / Trade-offs

- Athena query latency is higher than a hot warehouse for repeated dashboards.
- Parquet partition design becomes a thing the team must own.
- Joining lake data with Postgres operational state requires deliberate ETL.

## Pros and Cons of the Options

### Option A — Keep all history in Postgres

- ✅ Pro: Single query surface; no ETL.
- ❌ Con: Cost grows linearly with history; eventually unaffordable.
- ❌ Con: Long-running analytics queries impact operational workload.

### Option B — Amazon Redshift

- ✅ Pro: Fast analytics queries on warehouse-shaped data.
- ❌ Con: Cluster ops overhead; storage and compute are coupled.
- ❌ Con: Significantly more expensive than S3+Athena at our scale.

### Option C — S3 + Athena data lake

- ✅ Pro: Cheap, serverless, lifecycle-friendly.
- ✅ Pro: Native integration with the rest of the AWS stack.
- ❌ Con: Higher query latency than a hot warehouse.
- ❌ Con: Partition and file-size design discipline required.

### Option D — Snowflake

- ✅ Pro: Mature, fast, separates compute and storage.
- ❌ Con: Highest cost option at our volume.
- ❌ Con: Vendor lock-in beyond AWS; we would still need S3 for backups.

## Implementation Notes

**Buckets**:

- `toss-data-lake` — Per-fund daily NAV snapshots, trade history, slashing events, governance proposal records, AnalyticsHub commits. Partitioned by `year/month/day` and `fund_id` where applicable.
- `toss-backups` — RDS snapshot exports and other cold backups; cross-region replicated to us-west-2 per ADR-0051.
- `toss-logs` — Long-term log archive (rotated out of CloudWatch / BetterStack per ADR-0054).
- `toss-artifacts` — Build artifacts and contract deployment records.

**Configuration**:

- Versioning enabled on every bucket.
- Server-side encryption with KMS keys per bucket.
- Public access blocked at account level.
- Bucket policies grant read access only to specific IAM roles (analytics, audit, DR).

**Lifecycle policy**:

- S3 Standard for the first 90 days (hot analytics).
- Transition to S3 Glacier Flexible Retrieval after 90 days.
- Versioned object retention follows the same lifecycle.

**Query layer**:

- AWS Glue catalog defines the table schemas over Parquet.
- Athena workgroups separate analytics from audit queries for cost tracking.
- Writers produce Parquet files sized to roughly 128 MB to keep Athena scans efficient.

## Links

- **Source documentation**: `docs/technical/infrastructure/overview.md`
- **Related ADRs**: ADR-0046, ADR-0051
- **External references**: Amazon S3 lifecycle, AWS Glue Data Catalog, Amazon Athena
