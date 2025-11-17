# Development Workflow with MCP

## Daily Development

### Editing Documentation

**Normal workflow** - no special steps needed:

```bash
# 1. Edit documentation
vim docs/protocol/contracts/RiskEngine.md

# 2. Stage changes
git add docs/protocol/contracts/RiskEngine.md

# 3. Commit (hook auto-runs)
git commit -m "docs: update RiskEngine security section"

# Output:
# 📚 Documentation changed, updating MCP resources...
# ✅ MCP resources updated and added to commit
# [main abc123] docs: update RiskEngine security section
#  3 files changed, 45 insertions(+), 12 deletions(-)
#  modified: docs/protocol/contracts/RiskEngine.md
#  modified: mcp-resources.json
#  modified: mcp-version.json

# 4. Push
git push
```

**MCP automatically updated** - you did nothing special!

### Adding New Documentation

Same workflow - hook detects new `.md` files and regenerates MCP.

### Checking Sync Status

```bash
# Before deployment
npm run validate-mcp-sync

# ✅ MCP is IN SYNC
#    Version: 1.0.0
#    Resources: 116
#    Tools: 31
```

## Integration with Existing Tools

### With VS Code

Install recommended extensions:
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint"
  ]
}
```

Pre-commit hook runs automatically on commit via Source Control UI.

### With Git CLI

Works seamlessly - hook runs on `git commit`.

### With GitHub Desktop

Hook runs automatically when you commit.

## PR Workflow

### Creating PR

```bash
# 1. Create branch
git checkout -b docs/update-governance

# 2. Edit docs
# ... make changes ...

# 3. Commit (MCP auto-updates)
git add docs/protocol/governance/overview.md
git commit -m "docs: revise governance model"

# 4. Push
git push origin docs/update-governance

# 5. Create PR
```

### CI Checks

GitHub Actions runs:
```
✓ Validate MCP sync
✓ Build documentation  
✓ Check broken links
```

If MCP out of sync, CI comments:
```
⚠️ MCP needs update

Run: npm run generate-mcp
```

### Reviewing PR

Reviewer sees:
- Documentation changes
- MCP changes (auto-generated)
- Both in same commit

## Common Scenarios

### Scenario 1: Quick Doc Fix

```bash
# Fix typo
sed -i 's/teh/the/g' docs/protocol/intro.md

# Commit
git commit -am "docs: fix typo"

# Hook regenerates MCP
# Pushes with MCP update included
```

**Result**: Typo fixed, MCP updated, deployed

### Scenario 2: Large Documentation Refactor

```bash
# Refactor multiple docs
# ... edit 20 files ...

# Stage all
git add docs/

# Commit
git commit -m "docs: restructure governance section"

# Hook regenerates MCP from all changes
# All 20 docs + MCP update in one commit
```

### Scenario 3: MCP Out of Sync (Error State)

**Detection**:
```bash
npm run build

# Error:
# ❌ MCP OUT OF SYNC!
# Run: npm run generate-mcp
```

**Fix**:
```bash
npm run generate-mcp
git add mcp-resources.json mcp-version.json
git commit -m "chore: sync MCP"
```

## Testing MCP Changes

### Test MCP Generation

```bash
# Backup current MCP
cp mcp-resources.json mcp-resources.json.bak

# Generate fresh
npm run generate-mcp

# Compare
diff mcp-resources.json.bak mcp-resources.json

# Restore if needed
mv mcp-resources.json.bak mcp-resources.json
```

### Test Validation

```bash
# Should pass
npm run validate-mcp-sync

# Break sync (for testing)
echo "test" >> docs/test.md
# Don't generate MCP

# Should fail
npm run validate-mcp-sync
# ❌ MCP OUT OF SYNC!

# Fix
npm run generate-mcp
rm docs/test.md
```

## CI/CD Integration

### On Pull Request

```yaml
Workflow:
1. Developer creates PR
2. CI runs sync validation
3. If out of sync:
   - Bot comments on PR
   - Build fails
4. Developer fixes
5. CI passes, ready to merge
```

### On Push to Main

```yaml
Workflow:
1. Code pushed to main
2. CI calculates doc hash
3. If changed since last MCP:
   - Generate fresh MCP
   - Commit back to main [skip ci]
4. Deploy with current MCP
```

## Maintenance

### Regular Tasks

**Daily**: None (automatic)

**Weekly**: Check CI logs for failures

**Monthly**: Review MCP version increments

### Updating Scripts

If you modify generator/validator scripts:

```bash
# 1. Update script
vim scripts/generate-mcp-resources.ts

# 2. Test
npm run generate-mcp
npm run validate-mcp-sync

# 3. Commit
git add scripts/
git commit -m "chore: improve MCP generator"
```

## Performance Impact

### On Commits

```
Pre-commit hook adds: ~2-3 seconds
Still faster than manual workflow
```

### On Builds

```
Pre-build validation: ~1 second
Negligible compared to full build (30s+)
```

### On CI/CD

```
MCP validation step: ~10 seconds
Worth it for guaranteed sync
```

## Related Documentation

- **[MCP Sync System](/docs/mcp-integration/sync-system)**: Technical details
- **[Troubleshooting](/docs/mcp-integration/troubleshooting)**: Common issues

---

**Summary**: Sync is **fully automatic**. Edit docs normally, MCP stays current!

