# TOSS Documentation

Official documentation for TOSS Crypto Fund System with MCP (Model Context Protocol) integration.

## Features

- 📚 Comprehensive user and developer documentation
- 🤖 MCP protocol integration for AI assistants
- 🔌 Interactive API reference with OpenAPI specs
- 🎨 Modern, responsive design
- 🔍 Full-text search
- 🌙 Dark mode support

## Development

### Prerequisites

- Node.js >= 18.0
- npm or yarn

### Installation

```bash
npm install
```

### Local Development

```bash
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

The documentation is automatically deployed to Vercel:

- **Production**: Deployed from `main` branch
- **Staging**: Deployed from `staging` or `develop` branch

## Project Structure

```
docs/
├── docs/              # Documentation pages
├── blog/              # Blog posts
├── src/               # Custom components and styles
├── static/            # Static assets
└── docusaurus.config.js  # Configuration file
```

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

Copyright © 2025 TOSS. All rights reserved.

