# Architecture Decision Records (ADRs)

This directory contains the Architecture Decision Records (ADRs) for the **TOSS Protocol** rewrite (`toss-pm`).

ADRs document the **why** behind significant architectural and design choices, including the context, alternatives considered, and consequences. They are the canonical reference for design intent and are intended to be **append-only** — once accepted, an ADR is not deleted; it is superseded by a newer ADR.

## What is an ADR?

An ADR is a short markdown document that captures **one architectural decision** made during the design or implementation of the system. The format used here is **Extended MADR** (Markdown Architecture Decision Records), which includes:

- **Status** — Proposed / Accepted / Deprecated / Superseded
- **Context and Problem Statement**
- **Decision Drivers**
- **Considered Options** (with pros and cons)
- **Decision Outcome**
- **Consequences** (positive and negative)
- **Links** — source documents, related ADRs

See [`0000-template.md`](./0000-template.md) for the canonical template.

## Source Reference

These ADRs were derived from the [TOSS Protocol Documentation](https://docs.toss.fi) (Docusaurus-based) and capture the architectural decisions documented there. The `toss-pm` rewrite uses these ADRs as the design contract for the new implementation.

Each ADR includes a **Links** section pointing back to the source documentation file that motivated the decision.

## Index

### Foundation — Architecture, zkSync, Security Model

| #   | Title                                                                          |
| --- | ------------------------------------------------------------------------------ |
| 0001 | [Adopt Layered 5-Layer Architecture](./0001-layered-5-layer-architecture.md) |
| 0002 | [Use zkSync Era L2 as Execution Layer](./0002-zksync-era-l2-execution-layer.md) |
| 0003 | [Ethereum L1 as Final Settlement Layer](./0003-ethereum-l1-final-settlement.md) |
| 0004 | [Account Abstraction for FM Session Keys](./0004-account-abstraction-fm-session-keys.md) |
| 0005 | [Paymaster-Sponsored Gas Model](./0005-paymaster-sponsored-gas.md) |
| 0006 | [L1↔L2 Bridge with Optional Fast Withdrawal](./0006-l1-l2-bridge-fast-withdrawal.md) |
| 0007 | [Execution Priority Layer (5-Level Ordering)](./0007-execution-priority-layer-ordering.md) |
| 0008 | [RBAC with Domain Isolation](./0008-rbac-domain-isolation.md) |

### Tokenomics & Core Contracts

| #   | Title                                                                          |
| --- | ------------------------------------------------------------------------------ |
| 0009 | [Immutable Fixed-Supply TOSS Token](./0009-toss-token-immutable-fixed-supply.md) |
| 0010 | [Deflationary Burns Only via Slashing](./0010-deflationary-burns-only-via-slashing.md) |
| 0011 | [EIP-2612 Permit + Snapshot-Based Voting in TOSS](./0011-eip2612-permit-and-snapshot-voting.md) |
| 0012 | [Three-Layer Tokenomics (Immutable / Config / Logic)](./0012-three-layer-tokenomics-architecture.md) |
| 0013 | [DAOConfigCore: Central Configuration with Immutable Bounds](./0013-daoconfigcore-central-config-immutable-bounds.md) |
| 0014 | [Treasury Daily Spend Limit + Emergency Reserve](./0014-treasury-daily-spend-and-reserve.md) |
| 0015 | [High Water Mark for Performance Fees](./0015-high-water-mark-performance-fees.md) |

### Fund Contracts

| #   | Title                                                                          |
| --- | ------------------------------------------------------------------------------ |
| 0016 | [Minimal Proxy (EIP-1167) for Fund Deployment](./0016-minimal-proxy-fund-deployment.md) |
| 0017 | [Separate FundManagerVault for Asset Custody](./0017-fundmanagervault-separate-custody.md) |
| 0018 | [FundRegistry as Central Fund Index](./0018-fundregistry-central-index.md) |
| 0019 | [NAV-Based Share Pricing](./0019-nav-based-share-pricing.md) |
| 0020 | [Withdrawal Queue with Daily Limits](./0020-withdrawal-queue-daily-limits.md) |
| 0021 | [FM Stake Linear with AUM (Base + Ratio)](./0021-fm-stake-linear-with-aum.md) |

### Risk Engine & Oracle

| #   | Title                                                                          |
| --- | ------------------------------------------------------------------------------ |
| 0022 | [RiskEngine as Central Gatekeeper](./0022-riskengine-central-gatekeeper.md) |
| 0023 | [Three Risk Domains (Protocol / Fund / Investor)](./0023-three-risk-domains.md) |
| 0024 | [FaultIndex: Continuous Composite Severity Metric](./0024-faultindex-composite-severity-metric.md) |
| 0025 | [Slashing Split with Gamma (Burn + NAV Compensation)](./0025-slashing-split-gamma-burn-and-nav-compensation.md) |
| 0026 | [PriceOracleRouter: Multi-Source Median Aggregation](./0026-priceoraclerouter-multi-source-median.md) |
| 0027 | [Circuit Breakers on Oracle / Risk Anomalies](./0027-circuit-breakers-on-anomalies.md) |

### Investor Layer

| #   | Title                                                                          |
| --- | ------------------------------------------------------------------------------ |
| 0028 | [Investor State Machine (5 States + Auto Recovery)](./0028-investor-state-machine-five-states.md) |
| 0029 | [Investor Class System (Retail / Premium / Institutional / Strategic)](./0029-investor-class-system.md) |
| 0030 | [Investor Composite Score (ICS) Multi-Factor Reputation](./0030-investor-composite-score-ics.md) |
| 0031 | [FundClass + RiskTier Dual Classification](./0031-fundclass-risktier-dual-classification.md) |

### Governance

| #   | Title                                                                          |
| --- | ------------------------------------------------------------------------------ |
| 0032 | [Multi-Domain DAO Structure (Protocol / FM / Investor)](./0032-multi-domain-dao-structure.md) |
| 0033 | [Three-Level Governance (Fund / FM / Protocol)](./0033-three-level-governance-fund-fm-protocol.md) |
| 0034 | [Fund-Level Share-Based Voting](./0034-fund-share-based-voting.md) |
| 0035 | [Role-Multiplier Voting Power at Protocol Level](./0035-role-multiplier-voting-power-protocol.md) |
| 0036 | [Graduated Timelock Delays (Fund / FM / Protocol)](./0036-graduated-timelock-delays.md) |
| 0037 | [Guardian Committee 24-Hour Emergency Veto](./0037-guardian-committee-emergency-veto.md) |
| 0038 | [Voting Delegation at All Three Levels](./0038-voting-delegation-all-levels.md) |
| 0039 | [Proposal Lifecycle & Quorum Mechanics](./0039-proposal-lifecycle-and-quorum.md) |

### Compliance & Utilities

| #   | Title                                                                          |
| --- | ------------------------------------------------------------------------------ |
| 0040 | [AMLGuard as Separate Compliance Utility](./0040-amlguard-separate-compliance-utility.md) |
| 0041 | [GasVault for Paymaster Gas Accounting](./0041-gasvault-paymaster-accounting.md) |
| 0042 | [AnalyticsHub: On-Chain Data Warehouse Anchors](./0042-analyticshub-data-warehouse.md) |

### Off-Chain Services

| #   | Title                                                                          |
| --- | ------------------------------------------------------------------------------ |
| 0043 | [Off-Chain NAV Engine with On-Chain Commitment](./0043-off-chain-nav-engine-with-on-chain-commitment.md) |
| 0044 | [Trade Router Abstraction over CEX & DEX](./0044-trade-router-cex-dex-abstraction.md) |
| 0045 | [Event-Driven Service Architecture via EventBridge](./0045-event-driven-architecture-eventbridge.md) |
| 0046 | [PostgreSQL + Redis Data Layer](./0046-postgresql-and-redis-data-layer.md) |

### Infrastructure

| #   | Title                                                                          |
| --- | ------------------------------------------------------------------------------ |
| 0047 | [AWS ECS Fargate + Lambda for Compute](./0047-aws-ecs-fargate-lambda-compute.md) |
| 0048 | [Three-Tier VPC Network Architecture](./0048-three-tier-vpc-network.md) |
| 0049 | [Terraform for Infrastructure-as-Code](./0049-terraform-infrastructure-as-code.md) |
| 0050 | [Multi-Environment Deployment (Dev / Staging / Prod)](./0050-multi-environment-deployment.md) |
| 0051 | [Disaster Recovery: 1h RTO / 5min RPO](./0051-disaster-recovery-rto-rpo.md) |
| 0052 | [AWS Secrets Manager + IAM Roles for Secrets](./0052-aws-secrets-manager-iam-roles.md) |
| 0053 | [Cloudflare CDN + WAF for Edge Protection](./0053-cloudflare-cdn-waf.md) |
| 0054 | [CloudWatch + BetterStack Observability Stack](./0054-cloudwatch-betterstack-observability.md) |
| 0055 | [S3 Data Lake for Long-Term Analytics](./0055-s3-data-lake-analytics.md) |

### Testing, Dev & Documentation

| #   | Title                                                                          |
| --- | ------------------------------------------------------------------------------ |
| 0056 | [Multi-Layer Testing Pyramid with zkSync-Specific Tests](./0056-multi-layer-testing-pyramid.md) |
| 0057 | [Hardhat + Foundry for Smart-Contract Testing](./0057-hardhat-foundry-toolchain.md) |
| 0058 | [Docusaurus + Vercel for Documentation Platform](./0058-docusaurus-vercel-documentation.md) |
| 0059 | [Model Context Protocol (MCP) for AI Integration](./0059-mcp-protocol-for-ai-integration.md) |
| 0060 | [Automatic MCP Sync via Pre-Commit Hooks](./0060-automatic-mcp-sync-precommit-hooks.md) |

## Conventions

- **Numbering**: Zero-padded four-digit sequential (`0001`, `0002`, …). Numbers are never reused, even if an ADR is superseded.
- **File name**: `NNNN-kebab-case-slug.md`.
- **Status lifecycle**: `Proposed` → `Accepted` → (optionally) `Deprecated` or `Superseded by ADR-XXXX`.
- **Tone**: Past tense for decisions already made, present tense for ongoing constraints.
- **Scope**: One decision per ADR. If a topic spans multiple decisions, split it.

## Adding a New ADR

1. Copy [`0000-template.md`](./0000-template.md) to `NNNN-your-slug.md` with the next free number.
2. Fill in all sections; remove the `(remove this)` guidance comments.
3. Add an entry to the index table above.
4. Open a pull request titled `adr: NNNN — <short title>`.
5. After review and acceptance, change `Status` from `Proposed` to `Accepted` and merge.

## Superseding an ADR

To replace an existing ADR:

1. Create a new ADR with the next free number that explains the new decision and cites the old one.
2. In the old ADR, change `Status` to `Superseded by ADR-NNNN` and link to the new one.
3. Do not delete or rewrite history — superseded ADRs remain in place for audit traceability.
