# TOSS Protocol Documentation

Comprehensive documentation for TOSS Protocol - a decentralized fund management platform on zkSync.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Serve production build
npm run serve
```

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

1. Fork repository
2. Create feature branch
3. Add/update documentation
4. Commit (MCP auto-updates)
5. Push and create PR

## 📄 License

MIT License - See LICENSE file

---

**Built with** [Docusaurus](https://docusaurus.io/)
