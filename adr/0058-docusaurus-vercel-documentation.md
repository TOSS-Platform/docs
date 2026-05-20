# ADR-0058: Docusaurus + Vercel for Documentation Platform

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: documentation, docusaurus, vercel

## Context and Problem Statement

Documentation in TOSS is a first-class deliverable, not an afterthought. It is consumed by auditors reviewing contract behavior, integrators building on top of the protocol, internal developers, and the MCP integration (see ADR-0059) that exposes documentation to AI assistants. The platform must support versioned markdown content, structured sidebar navigation, full-text search, and a build pipeline that can also emit machine-readable resources alongside the human-readable site.

Self-hosting a documentation platform — running our own server, managing TLS, configuring CDN behavior — adds operational burden without proportional benefit. We want to spend engineering time on protocol concerns, not on running a docs deployment. At the same time, the docs source must remain in Git so that review, branching, and provenance are intact.

The choice of static-site generator and host shapes which features are easy and which are awkward. React/MDX support, sidebar configuration, and a clean plugin model matter because we embed interactive components and run a custom build step that generates MCP resources from the same content tree.

## Decision Drivers

- Markdown-first authoring with React/MDX support for embedded components.
- Versioned content with sidebar configuration and built-in search.
- Source-controlled content with branch-based preview deployments.
- Minimal operational overhead; no self-hosted servers.

## Considered Options

1. **Docusaurus + Vercel** — React-based SSG with a managed host.
2. **MkDocs** — Python-based markdown site generator.
3. **Custom Next.js site** — hand-built docs application.
4. **GitBook** — hosted SaaS docs platform.

## Decision Outcome

**Chosen option**: *Docusaurus + Vercel*, because it gives us markdown-first authoring with React/MDX support, versioning, and managed hosting without operational overhead.

Docusaurus renders markdown to a static site, manages sidebar configuration via `sidebars.js`, integrates Algolia for search, and supports React component embedding through MDX. The same build pipeline generates MCP resources, keeping the human-readable and machine-readable surfaces in lockstep. Vercel hosts the site with CI-driven deploys: the `staging` branch publishes to `staging.docs.toss.fi`, and `main` publishes to `docs.toss.fi`. Branch previews provide reviewable URLs for every pull request.

### Positive Consequences

- Auditors and integrators get a polished, searchable site with stable URLs.
- MDX allows embedding interactive components (calculators, contract explorers) inline.
- Preview deploys per pull request shorten the doc review loop.
- MCP resource generation reuses the same content tree without duplication.

### Negative Consequences / Trade-offs

- Tied to Docusaurus' upgrade cadence; major-version migrations require effort.
- Vercel is a third-party dependency; outages affect documentation availability.
- Algolia search requires an external account and configuration.

## Pros and Cons of the Options

### Option A — Docusaurus + Vercel

- ✅ Pro: Mature SSG with strong React/MDX support.
- ✅ Pro: Branch previews, managed TLS, global CDN out of the box.
- ❌ Con: Two third-party dependencies (Docusaurus, Vercel) to track.
- ❌ Con: Build times grow with content size; large doc trees need tuning.

### Option B — MkDocs

- ✅ Pro: Simple, well-suited to pure markdown.
- ❌ Con: React/MDX support is weak; embedding interactive components is awkward.
- ❌ Con: Plugin ecosystem is smaller for our use case.

### Option C — Custom Next.js site

- ✅ Pro: Full control over every aspect of rendering.
- ❌ Con: Builds undifferentiated infrastructure that competitors already solve.
- ❌ Con: Ongoing maintenance burden falls entirely on the team.

### Option D — GitBook

- ✅ Pro: Polished UX, minimal setup.
- ❌ Con: Source-of-truth lives outside Git or behind awkward sync.
- ❌ Con: Vendor lock-in; pricing scales with seats.

## Implementation Notes

- Docusaurus configuration lives in `docusaurus.config.js`; sidebars in `sidebars.js`.
- The MCP resource generator runs as a post-build step using the same content tree.
- Vercel deploy hooks are configured per-branch; preview URLs are commented on each PR by CI.
- Algolia DocSearch crawls production after each `main` deploy.

## Links

- **Source documentation**: `docs/mcp-integration/development-workflow.md`
- **Related ADRs**: ADR-0050, ADR-0059
- **External references**: https://docusaurus.io, https://vercel.com/docs
