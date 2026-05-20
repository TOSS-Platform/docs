# ADR-0059: Model Context Protocol (MCP) for AI Integration

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: api, mcp, ai-integration

## Context and Problem Statement

TOSS documentation and protocol tooling must be consumable by AI assistants such as Cursor, Claude, and ChatGPT. Developers integrating with the protocol increasingly start with natural-language questions, and the quality of the answer they get directly affects integration time and the rate of mistakes that reach production. If the AI has no grounded source, it will guess; if it has only a REST API, it has to know which endpoint exists and how to compose calls.

A REST or GraphQL surface is well suited to deterministic clients but hostile to LLMs. The model must discover routes, learn parameters, handle pagination, and resolve cross-references manually. Each step introduces a chance to hallucinate. What LLMs need instead is a protocol that frames context as discoverable resources and tools with clear semantics — something the model can introspect and call without inferring URL structure.

The Model Context Protocol (MCP) is the emerging standard for exposing such surfaces. It defines tools (callable functions) and resources (addressable content) over JSON-RPC, giving LLMs a structured, predictable way to fetch grounded information. Adopting MCP positions TOSS as natively consumable by the assistants developers already use.

## Decision Drivers

- Lower integration friction for developers using AI-assisted workflows.
- Reduce hallucination by giving assistants a grounded, discoverable surface.
- Avoid bespoke per-assistant integrations; rely on an open standard.
- Preserve the existing REST surface for traditional clients.

## Considered Options

1. **REST-only** — keep the current REST surface, no AI-specific layer.
2. **GraphQL** — schema-first query language.
3. **MCP** — Model Context Protocol with tools and resources.
4. **OpenAPI-based AI plugins** — vendor-specific plugin formats over OpenAPI.

## Decision Outcome

**Chosen option**: *MCP*, because it is purpose-built for AI consumers and provides a discoverable surface that LLMs can use without manual schema interpretation.

We expose protocol context via the Model Context Protocol specification (1.0). The implementation provides 31 MCP tools covering contract reads, search, and validation helpers, and 105+ MCP resources exposing documentation pages as addressable `mcp://...` URIs. Transport is JSON-RPC 2.0 over HTTP with Server-Sent Events for streaming. Authentication uses bearer tokens with rate-limiting set to 100 requests per minute per token. The existing REST API remains available unchanged for clients that do not need the MCP surface.

### Positive Consequences

- AI assistants get a grounded, structured surface and produce fewer hallucinated answers.
- Integration time for developers using Cursor or Claude drops significantly.
- A single MCP implementation serves all major assistants without per-vendor adapters.
- Resources are versioned and signed, so consumers can verify integrity.

### Negative Consequences / Trade-offs

- MCP is a young specification; breaking changes are still possible.
- Maintaining two parallel API surfaces (REST and MCP) doubles the documentation surface.
- Rate limits and abuse prevention require careful tuning.

## Pros and Cons of the Options

### Option A — REST-only

- ✅ Pro: No new infrastructure; existing surface continues to serve.
- ❌ Con: LLMs must learn endpoints by trial and error; hallucination is high.
- ❌ Con: No native concept of resources that the model can discover.

### Option B — GraphQL

- ✅ Pro: Schema introspection helps machines discover capabilities.
- ❌ Con: Still requires the LLM to compose valid queries against a schema.
- ❌ Con: No standard pattern for grounding documentation as addressable content.

### Option C — MCP

- ✅ Pro: Purpose-built for AI consumers; tools and resources map cleanly to LLM use.
- ✅ Pro: Cross-assistant compatibility (Cursor, Claude, ChatGPT).
- ❌ Con: Young specification; subject to revision.
- ❌ Con: Smaller ecosystem of mature server implementations.

### Option D — OpenAPI-based AI plugins

- ✅ Pro: Reuses existing OpenAPI specs.
- ❌ Con: Plugin formats vary by vendor; ecosystem is fragmenting.
- ❌ Con: Less expressive for resource-style content than MCP.

## Implementation Notes

- Server runs alongside the REST API and shares authentication infrastructure.
- Resource URIs follow the pattern `mcp://toss/docs/<slug>` and `mcp://toss/contracts/<name>`.
- Each resource body is content-hashed (SHA-256) for integrity verification by clients.
- Rate-limit headers follow standard `X-RateLimit-*` conventions to ease client implementation.

## Links

- **Source documentation**: `docs/mcp/introduction.md`, `docs/mcp/protocol-overview.md`
- **Related ADRs**: ADR-0058, ADR-0060
- **External references**: https://modelcontextprotocol.io
