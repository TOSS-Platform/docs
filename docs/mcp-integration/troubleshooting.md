# MCP Sync Troubleshooting

## Common Issues

### Issue 1: "MCP OUT OF SYNC" on Build

**Error Message**:
```
❌ MCP OUT OF SYNC!

Documentation hash: abc123...
MCP hash: def456...

Run: npm run generate-mcp
```

**Cause**: Documentation changed but MCP not regenerated

**Solution**:
```bash
npm run generate-mcp
git add mcp-resources.json mcp-version.json
git commit -m "chore: sync MCP resources"
```

---

### Issue 2: Pre-Commit Hook Not Running

**Symptoms**: Committing doc changes but MCP not updating

**Cause**: Husky not installed or hook not executable

**Solution**:
```bash
# Reinstall Husky
npm install
npx husky install

# Make hook executable
chmod +x .husky/pre-commit

# Test
git add docs/test.md
git commit -m "test"
# Should see: "📚 Documentation changed..."
```

---

### Issue 3: Resource Count Mismatch

**Error**:
```
⚠️  Resource count mismatch!
   Docs: 118, MCP: 116
```

**Cause**: New docs added but MCP not updated

**Solution**: `npm run generate-mcp`

---

### Issue 4: CI Fails on PR

**Error**: GitHub Actions sync-mcp job fails

**Cause**: MCP out of sync in PR

**Solution**:
```bash
# On your branch
npm run generate-mcp
git add mcp-resources.json mcp-version.json
git commit -m "chore: sync MCP"
git push
```

CI will re-run and pass.

---

### Issue 5: Hash Mismatch After Generation

**Symptoms**: Generate MCP but still shows out of sync

**Cause**: Files modified between generation and validation

**Solution**: Regenerate and immediately validate:
```bash
npm run generate-mcp && npm run validate-mcp-sync
```

---

### Issue 6: TypeScript Errors in Scripts

**Cause**: Missing dependencies or types

**Solution**:
```bash
npm install --save-dev @types/node glob ts-node typescript
```

---

## Debugging

### Check Current State

```bash
# 1. Current doc hash
npm run calculate-doc-hash

# 2. MCP version
cat mcp-version.json | jq -r '.documentationHash'

# 3. Compare
# Should match if in sync
```

### Verbose MCP Generation

```bash
# Run generator directly with console output
ts-node scripts/generate-mcp-resources.ts
```

### Check Git Hooks

```bash
# List installed hooks
ls -la .husky/

# Check pre-commit content
cat .husky/pre-commit
```

## Emergency Recovery

### If MCP Completely Broken

```bash
# 1. Delete current MCP
rm mcp-resources.json mcp-version.json

# 2. Regenerate from scratch
npm run generate-mcp

# 3. Validate
npm run validate-mcp-sync

# 4. Commit
git add mcp-resources.json mcp-version.json
git commit -m "fix: regenerate MCP from scratch"
```

### If Scripts Not Working

```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Rebuild TypeScript
npm run typecheck
```

## Getting Help

**Check logs**:
```bash
# CI logs
# Go to GitHub Actions tab

# Local logs
# Output from npm run commands
```

**Ask for help**:
- GitHub Issues
- Discord #dev-support
- Tag @mcp-team

---

**Prevention**: Follow [Development Workflow](/docs/mcp-integration/development-workflow) to avoid issues!

