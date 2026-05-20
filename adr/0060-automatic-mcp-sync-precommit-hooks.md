# ADR-0060: Automatic MCP Sync via Pre-Commit Hooks

- **Status**: Accepted
- **Date**: 2026-05-20
- **Deciders**: TOSS Protocol Team
- **Tags**: mcp, automation, devops

## Context and Problem Statement

MCP resources (the machine-readable view of TOSS documentation, see ADR-0059) and the human-readable Docusaurus site must never drift. When the two diverge, AI assistants return stale or incorrect answers that nonetheless look authoritative — a worse outcome than no answer at all, because developers act on them. Drift is silent: there is no runtime symptom and no user-visible error until someone notices a wrong answer.

Relying on developers to regenerate MCP resources after each documentation edit fails in practice. Even well-intentioned contributors forget; pull request reviewers cannot reliably check by eye whether the generated artifacts match the source. Webhooks that trigger regeneration after merge close the gap only partially: they fire too late, after the bad state has already entered `main`, and they create a separate commit that complicates rollback.

The robust path is to make synchronization a precondition of the commit itself, with CI as a second line of defense that blocks merges if the precondition was somehow bypassed. Both layers are needed: pre-commit gives a fast local signal, and CI guarantees correctness even when local hooks are skipped.

## Decision Drivers

- Eliminate drift between docs source and MCP artifacts.
- Catch problems before merge, not after.
- Tolerate developers who skip local hooks (`--no-verify`) without compromising main.
- Provide integrity guarantees that downstream MCP consumers can verify.

## Considered Options

1. **Manual sync** — developers regenerate MCP resources by convention.
2. **Webhooks on push** — regenerate server-side after each push.
3. **Pre-commit hook + CI verification** — automate locally and verify in CI.

## Decision Outcome

**Chosen option**: *Pre-commit hook + CI verification*, because it prevents drift at the source while CI guarantees correctness even when local hooks are bypassed.

A pre-commit Husky hook runs `npm run generate-mcp` automatically when documentation files change; the resulting `mcp-resources.json` is staged into the same commit, so the source and generated artifacts always land together. In CI, `validate-mcp-sync` runs on every push: it regenerates MCP resources from scratch and compares against what was committed. Any difference blocks the merge. Versioning is tracked in `mcp-version.json` following semantic versioning, and each release computes SHA-256 hashes over resource bodies to give downstream MCP consumers a way to verify integrity.

### Positive Consequences

- Drift is structurally impossible for commits that pass CI.
- Developers get immediate local feedback when MCP regeneration produces changes.
- Downstream consumers can verify resource integrity via content hashes.
- Rollbacks are clean — source and generated artifacts move together.

### Negative Consequences / Trade-offs

- Pre-commit hook adds latency to every commit on doc changes.
- Developers who skip hooks see CI failures they could have caught locally.
- Generator must be deterministic; non-determinism would break the CI verification.

## Pros and Cons of the Options

### Option A — Manual sync

- ✅ Pro: No tooling required.
- ❌ Con: Drift occurs in practice; the system relies on human memory.
- ❌ Con: No mechanism to detect drift before it reaches consumers.

### Option B — Webhooks on push

- ✅ Pro: Centralized; developers do not need local hooks.
- ❌ Con: Fires after the bad state is already in the branch.
- ❌ Con: Creates separate sync commits that complicate history and rollback.

### Option C — Pre-commit hook + CI verification

- ✅ Pro: Two-layer defense; CI catches what local hooks miss.
- ✅ Pro: Source and generated artifacts live in the same commit.
- ❌ Con: Requires deterministic generation.
- ❌ Con: Slight commit-time latency on documentation changes.

## Implementation Notes

- Husky hook is scoped to changes under the docs source tree to avoid running on unrelated commits.
- `validate-mcp-sync` regenerates into a temporary directory and uses a content-aware diff that ignores timestamps.
- `mcp-version.json` is bumped automatically only on release branches; routine doc edits do not change the version.
- SHA-256 hashes are published alongside the resource bundle so consumers can pin and verify.

## Links

- **Source documentation**: `docs/mcp-integration/sync-system.md`
- **Related ADRs**: ADR-0058, ADR-0059
- **External references**: https://typicode.github.io/husky
