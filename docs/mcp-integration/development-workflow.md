# Development Workflow with MCP

## Git Workflow Standards

### Branch Naming Convention

```bash
# Feature branches
feature/<feature-name>
# Examples:
git checkout -b feature/add-new-contract-doc
git checkout -b feature/update-governance-model

# Bug fixes
fix/<bug-description>
# Examples:
git checkout -b fix/broken-links
git checkout -b fix/typo-in-tokenomics

# Documentation updates
docs/<update-description>
# Examples:
git checkout -b docs/improve-risk-engine-spec
git checkout -b docs/add-process-diagrams

# Chores (automation, config)
chore/<task>
# Examples:
git checkout -b chore/update-dependencies
git checkout -b chore/improve-mcp-sync
```

### Commit Message Format

Follow **Conventional Commits** specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature or documentation section
- `fix`: Bug fix or correction
- `docs`: Documentation changes
- `chore`: Maintenance (scripts, config)
- `refactor`: Code/doc restructure
- `style`: Formatting, no content change
- `test`: Adding tests

**Examples**:
```bash
# Good commits
git commit -m "docs: add RiskEngine contract specification"
git commit -m "feat: add MCP sync automation system"
git commit -m "fix: correct slashing formula in tokenomics"
git commit -m "chore: update Node.js to v24.1.0"
git commit -m "docs(governance): revise multi-level proposal system"

# Bad commits (avoid)
git commit -m "update docs"           # Too vague
git commit -m "fixes"                 # No context
git commit -m "WIP"                   # Don't commit WIP
```

**Scope Examples** (optional but recommended):
- `contracts`: Contract documentation
- `processes`: Process workflows
- `governance`: Governance docs
- `tokenomics`: Tokenomics docs
- `mcp`: MCP integration
- `ci`: CI/CD workflows

### Complete Feature Development Flow

#### Step 1: Create Feature Branch

```bash
# Start from latest main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/add-slashing-process-doc

# Or in one command:
git checkout -b feature/add-slashing-process-doc main
```

#### Step 2: Make Changes

```bash
# Create/edit documentation
touch docs/protocol/processes/risk-compliance/slashing-execution.md
vim docs/protocol/processes/risk-compliance/slashing-execution.md

# Check what changed
git status
git diff

# Stage changes
git add docs/protocol/processes/risk-compliance/slashing-execution.md

# Update sidebar if needed
vim sidebars.js
git add sidebars.js
```

:::important Package Lock Sync
If you added/updated dependencies in `package.json`:

```bash
# Update package-lock.json
npm install

# Commit lock file
git add package-lock.json
git commit -m "chore: update package-lock.json"
```

This ensures CI/CD has matching dependencies.
:::

#### Step 3: Commit Changes

```bash
# Commit with descriptive message
git commit -m "docs(processes): add slashing execution process documentation

- Complete step-by-step slashing flow
- Include FaultIndex calculation
- Add burn/compensation split explanation
- Provide code examples and sequence diagrams"

# Pre-commit hook automatically runs:
# 📚 Documentation changed, updating MCP resources...
# ✅ MCP resources updated and added to commit
```

**Commit includes**:
- Your documentation changes
- Updated `mcp-resources.json` (automatic)
- Updated `mcp-version.json` (automatic)

#### Step 4: Push to GitHub

```bash
# Push feature branch
git push origin feature/add-slashing-process-doc

# First time pushing branch:
git push -u origin feature/add-slashing-process-doc
```

#### Step 5: Create Pull Request

**On GitHub**:

1. Go to repository
2. Click "Compare & pull request" button
3. Fill PR template:

```markdown
## Description
Add comprehensive documentation for slashing execution process

## Changes
- Added `slashing-execution.md` with complete workflow
- Updated sidebar navigation
- Added sequence diagram
- Included code examples

## Type of Change
- [x] Documentation addition
- [ ] Documentation fix
- [ ] Breaking change

## Checklist
- [x] Documentation is clear and complete
- [x] MCP resources updated (automatic)
- [x] Build passes locally
- [x] Followed commit message conventions
- [x] Updated sidebar if needed

## Screenshots (if applicable)
[Add screenshots of new documentation page]

## Related Issues
Closes #123
```

4. **Title**: Use conventional commit format
   ```
   docs(processes): add slashing execution process documentation
   ```

5. **Reviewers**: Tag relevant reviewers
   - @technical-lead
   - @documentation-team

6. **Labels**: Add appropriate labels
   - `documentation`
   - `processes`
   - `enhancement`

#### Step 6: PR Review Process

**CI/CD runs automatically**:
```
✓ Node.js 24.1.0 setup
✓ Dependencies installed
✓ MCP resources generated
✓ MCP sync validated
✓ Documentation built
✓ No broken links
```

**If CI fails**: Fix issues and push again

**Reviewers check**:
- Content accuracy
- Clarity and completeness
- Proper formatting
- Correct cross-references
- MCP sync (automatic, should always pass)

#### Step 7: Address Review Comments

```bash
# Make requested changes
vim docs/protocol/processes/risk-compliance/slashing-execution.md

# Commit changes
git add .
git commit -m "docs(processes): address review comments

- Clarify FaultIndex calculation
- Add more error scenarios
- Improve sequence diagram"

# Push
git push origin feature/add-slashing-process-doc

# CI runs again on updated PR
```

#### Step 8: Merge PR

**After approval**:

1. **Squash and Merge** (recommended):
   - All commits squashed into one
   - Clean history
   - Single commit message

2. **Merge Commit**:
   - Preserves all commits
   - More history

3. **Rebase and Merge**:
   - Linear history
   - No merge commit

**GitHub automatically**:
- Merges to main/staging
- Deletes feature branch (optional)
- Triggers deployment workflow

#### Step 9: Deployment

```
PR Merged → Workflow Triggers → MCP Sync → Build → Deploy
```

**Timeline**:
- Workflow starts: ~30 seconds
- Build: ~2 minutes
- Deploy: ~1 minute
- **Total**: ~3-4 minutes to live

#### Step 10: Cleanup

```bash
# Switch back to main
git checkout main

# Pull latest (includes your merged changes)
git pull origin main

# Delete local feature branch
git branch -d feature/add-slashing-process-doc

# Verify your changes live
curl https://docs.toss.fi/docs/protocol/processes/risk-compliance/slashing-execution
```

---

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

## Best Practices Checklist

### Before Starting

- [ ] Pull latest from main: `git pull origin main`
- [ ] Create descriptive feature branch
- [ ] Understand what you're documenting

### During Development

- [ ] Follow naming conventions (branch, commits)
- [ ] Write clear, complete documentation
- [ ] Update sidebars if adding new pages
- [ ] Add cross-references to related docs
- [ ] Include code examples where helpful
- [ ] Test build locally: `npm run build`

### Before Committing

- [ ] Review your changes: `git diff`
- [ ] Stage only relevant files
- [ ] Write descriptive commit message (conventional commits)
- [ ] Let pre-commit hook run (don't skip)

### Pull Request

- [ ] Use conventional commit format for PR title
- [ ] Fill out PR template completely
- [ ] Add appropriate labels
- [ ] Tag relevant reviewers
- [ ] Ensure CI passes
- [ ] Address review comments promptly

### After Merge

- [ ] Pull latest main
- [ ] Delete feature branch
- [ ] Verify deployment successful
- [ ] Check documentation live

---

## Quick Reference Card

```bash
# === Start New Feature ===
git checkout main && git pull
git checkout -b feature/my-feature

# === Make Changes ===
# Edit docs...
git add docs/
git commit -m "docs(scope): description"

# === Push & PR ===
git push -u origin feature/my-feature
# Create PR on GitHub

# === After Merge ===
git checkout main && git pull
git branch -d feature/my-feature

# === MCP Commands (if needed) ===
npm run generate-mcp       # Generate
npm run validate-mcp-sync  # Validate

# === Common Fixes ===
npm install               # Fix dependencies
npm run clear && npm run build  # Clear cache
git fetch --prune        # Clean remote branches
```

---

## Environment-Specific Workflows

### Development Environment

```bash
# Local development (no deploy)
git checkout develop
git pull
git checkout -b feature/my-feature
# ... make changes ...
git push origin feature/my-feature
# PR to develop (no deploy, just review)
```

### Staging Environment

```bash
# Ready for staging test
git checkout staging
git merge develop  # or PR from develop
git push origin staging

# Triggers staging deployment
# → Deploy to staging.docs.toss.fi
```

### Production Environment

```bash
# Ready for production
git checkout main
git merge staging  # or PR from staging
git push origin main

# Triggers production deployment  
# → Deploy to docs.toss.fi
```

---

**Summary**: 

✅ **Follow Conventions**: Branch names, commit messages, PR templates  
✅ **Let Automation Work**: Pre-commit hook, CI/CD, MCP sync  
✅ **Test Locally**: Build before pushing  
✅ **Small Commits**: Logical, focused changes  
✅ **Clear Communication**: Descriptive messages and PR descriptions  

**MCP sync is fully automatic** - just follow Git best practices!

