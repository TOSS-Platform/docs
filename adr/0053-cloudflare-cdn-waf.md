# ADR-0053: Cloudflare CDN + WAF for Edge Protection

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: security, edge, cdn, waf

## Context and Problem Statement

The TOSS public surface includes the documentation site, the investor and FM dashboards, the public API endpoints, and the MCP endpoint. Each public hostname attracts continuous low-grade traffic: opportunistic scanners, credential-stuffing bots, vulnerability probes, and occasional bursts of distributed attack traffic from misconfigured or hostile networks.

Sending all of that traffic into AWS Application Load Balancers wastes load-balancer capacity, multiplies bandwidth charges, and concentrates the entire attack surface inside the VPC. AWS WAF can absorb many of these patterns, but it lives at the load balancer level — by the time a request reaches AWS, the bandwidth has already been paid for and the attack has reached the protocol's perimeter.

An edge layer in front of AWS absorbs hostile traffic on a globally distributed network before it ever touches our infrastructure. It also reduces tail latency for legitimate users via CDN caching of static assets.

The decision is whether to use AWS CloudFront + AWS WAF (tightly coupled to AWS, simpler IAM story) or Cloudflare (broader edge footprint, more mature WAF rule set). Existing operations expertise on the team is biased toward Cloudflare; the AWS-native option offers tighter coupling but does not match Cloudflare's edge presence or rule maturity.

## Decision Drivers

- Absorb DDoS, scanning, and credential stuffing before traffic hits AWS.
- Rate-limit and challenge anomalous request patterns at the edge.
- Allow country-level blocking where required by FM-side compliance.
- Mature, well-documented WAF rule set with low false-positive rate.

## Considered Options

1. **No edge layer** — Public traffic terminates at AWS ALBs directly.
2. **AWS CloudFront + AWS WAF** — AWS-native edge and WAF.
3. **Cloudflare** — Cloudflare CDN + WAF + Rate Limiting + Bot Management.

## Decision Outcome

**Chosen option**: *Cloudflare*, because its global edge presence, mature WAF rule set, and stronger native rate-limiting and bot-management features absorb hostile traffic more effectively than the AWS-native equivalent at our scale.

### Positive Consequences

- DDoS and scanning traffic is absorbed at Cloudflare edge, never reaching AWS.
- Static assets are CDN-cached globally, reducing tail latency.
- Country-level blocking and rate limiting are first-class Cloudflare features.
- Cloudflare's WAF rule set covers known SQLi/XSS/exploit patterns without per-rule engineering.

### Negative Consequences / Trade-offs

- A second vendor in the security-critical path; an outage there is an outage for us.
- Some inspection-and-modify rules require Cloudflare Workers, which is a separate runtime to learn.
- Per-request pricing growth at very large scale.

## Pros and Cons of the Options

### Option A — No edge layer

- ✅ Pro: Simplest topology, fewer vendors.
- ❌ Con: All hostile traffic hits AWS bandwidth and ALBs.
- ❌ Con: DDoS protection is limited to AWS Shield Standard.

### Option B — AWS CloudFront + AWS WAF

- ✅ Pro: Stays within AWS billing and IAM.
- ❌ Con: Smaller global edge footprint than Cloudflare in several regions.
- ❌ Con: WAF rule expressiveness and managed-rule maturity trail Cloudflare.

### Option C — Cloudflare

- ✅ Pro: Largest mature edge network for our user geography.
- ✅ Pro: WAF, rate limiting, bot management, and country blocking are first-class features.
- ❌ Con: Additional vendor relationship.
- ❌ Con: Cloudflare-specific tooling for advanced rules (Workers).

## Implementation Notes

**Routing**:

- All public hostnames (`docs.toss.fi`, `staging.docs.toss.fi`, dashboard hosts, API endpoints) resolve to Cloudflare.
- Origin is the AWS Application Load Balancer in the public subnet tier (ADR-0048).
- ALB security groups accept ingress only from Cloudflare's published IP ranges; the AWS origin is not directly reachable from arbitrary internet sources.

**Protections enabled**:

- **CDN caching** for static assets on the documentation and dashboard hosts.
- **WAF managed rules** covering SQL injection, XSS, common CVE signatures.
- **Rate limiting** at 1000 requests per 5 minutes per IP for application API endpoints, with separate stricter limits for `/login` and `/auth/*` paths.
- **Challenge-on-anomaly** for login flows (managed challenge / Turnstile).
- **Country blocking** for jurisdictions that specific FMs' compliance configuration designates as restricted; configurable per host.

**Origin authentication**:

- Authenticated Origin Pulls (mTLS) so the ALB rejects requests not originated from Cloudflare even if origin IPs leak.

## Links

- **Source documentation**: `docs/technical/infrastructure/overview.md`
- **Related ADRs**: ADR-0048
- **External references**: Cloudflare WAF, Cloudflare Rate Limiting, Authenticated Origin Pulls
