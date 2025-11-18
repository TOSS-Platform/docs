# TOSS Protocol Documentation

Comprehensive documentation for TOSS Protocol - a decentralized fund management platform on zkSync.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# ⚠️ Important: If you added new dependencies in package.json,
# commit the updated package-lock.json:
git add package-lock.json
git commit -m "chore: update package-lock.json"

# Start development server
npm start

# Build for production
npm run build

# Serve production build
npm run serve
```

:::note First Time Setup
After cloning, run `npm install` to generate `package-lock.json` with all dependencies including:
- `ts-node` (for MCP scripts)
- `glob` (for file scanning)
- `@types/node` (TypeScript types)
:::

## 📚 Documentation Structure

- **Protocol Documentation**: Smart contract specs, architecture, tokenomics
- **Technical Documentation**: Developer guides, deployment, testing
- **API Reference**: REST API, SDKs, ABIs (coming soon)
- **Investor Deck**: Business overview for VCs

## 🤖 MCP Integration

TOSS documentation includes MCP (Model Context Protocol) integration for AI assistance.

### MCP Sync System

**Automatic synchronization** ensures MCP resources always match documentation:

```bash
# Generate MCP resources
npm run generate-mcp

# Validate sync
npm run validate-mcp-sync
```

**Automation**:
- ✅ Pre-commit hook auto-generates MCP
- ✅ Pre-build validation ensures sync
- ✅ CI/CD validates on every push

## 🛠️ Development

### Adding Documentation

```bash
# 1. Create/edit documentation
vim docs/protocol/new-page.md

# 2. Commit (MCP auto-updates)
git commit -am "docs: add new page"

# 3. Push
git push
```

MCP synchronization is **fully automatic**!

### Updating Sidebar

Edit `sidebars.js` to add new pages to navigation.

## 📝 Scripts

```bash
npm start                  # Start dev server
npm run build              # Build for production
npm run generate-mcp       # Generate MCP resources
npm run validate-mcp-sync  # Check MCP sync
npm run typecheck          # TypeScript check
```

## 🔧 Troubleshooting

### MCP Out of Sync

```bash
npm run generate-mcp
```

### Build Fails

```bash
# Clear cache
npm run clear

# Rebuild
npm run build
```

### Dependencies Issues

```bash
rm -rf node_modules package-lock.json
npm install
```

## 📖 Documentation

- Live: https://docs.toss.fi
- Repository: https://github.com/toss/docs

## 🤝 Contributing

### Quick Start

1. **Create GitHub Issue**: Open issue for new features or significant changes
2. Fork repository
3. Create feature branch: `git checkout -b docs/feature-name`
4. Add/update documentation
5. **Update CHANGELOG.md**: Add entry for your changes
6. Commit (MCP auto-updates): `git commit -m "docs: description"`
7. Push and create PR
8. Link PR to issue

### Documentation Rules

- ✅ **Always create GitHub issue** for new documentation or significant changes
- ✅ **Update CHANGELOG.md** before deploying (includes change, reason, date, issue link)
- ✅ **Follow conventional commits** format
- ✅ **Link PRs to issues** for traceability

**See**: [Development Workflow](/mcp-integration/development-workflow) for complete guidelines

## 📝 Changelog

All notable changes to documentation are documented in [CHANGELOG.md](/CHANGELOG.md).

## 📄 License

MIT License - See LICENSE file

---

**Built with** [Docusaurus](https://docusaurus.io/)
