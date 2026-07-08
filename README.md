# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Running the App

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

### Quick Share with Cloudflare Tunnel

```bash
# Terminal 1: Start dev server
pnpm run dev

# Terminal 2: Create tunnel (requires cloudflared)
cloudflared tunnel --url http://localhost:5173
```

## Deployment

For detailed deployment instructions, see [Deployment Guide](docs/deployment.md).

The guide covers:
- **Cloudflare Tunnel**: Quick local sharing for demos
- **Vercel**: Production deployment from GitHub
