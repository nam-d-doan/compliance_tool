# Deployment Guide

This guide covers two deployment methods for the Compliance Tool: local sharing via Cloudflare tunnel (for demo/feedback) and production hosting on Vercel.

## Option 1: Cloudflare Tunnel (Local Development & Sharing)

> **Use Case**: Share your local development environment with others for quick demos and feedback.

### Prerequisites

1. Install cloudflared on your machine:
   ```bash
   # macOS
   brew install cloudflared
   
   # Windows (winget)
   winget install --id=Cloudflare.cloudflared
   
   # Linux (apt)
   wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared-linux-amd64.deb
   ```

2. Your Vite dev server is pre-configured to accept tunnel hosts.

### Quick Setup

1. Start your local development server:
   ```bash
   pnpm run dev
   ```
   
2. In a new terminal, create a tunnel:
   ```bash
   cloudflared tunnel --url http://localhost:5173
   ```
   
3. Cloudflared will output a public URL like:
   ```
   https://random-words-here.trycloudflare.com
   ```
   
4. Share this URL with others. They'll be able to access your local app.

### Configuration Details

The `vite.config.ts` is already configured to accept tunnel hosts:

```typescript
server: {
  host: true,              // Allow external connections
  allowedHosts: true,     // Accept any hostname (for tunnel URLs)
}
```

### Troubleshooting

- **Port Issues**: If your dev server runs on a different port, update the tunnel URL accordingly.
- **Blocked Request**: Ensure `allowedHosts: true` is set in `vite.config.ts`.
- **Tunnel Disconnected**: The tunnel stays active as long as cloudflared runs. If you close it, the URL stops working.

---

## Option 2: Vercel (Production Deployment)

> **Use Case**: Deploy to production with a permanent URL, automatic HTTPS, and global CDN.

### Prerequisites

1. GitHub repository with your code
2. Vercel account (free tier available)
3. Connected GitHub account in Vercel

### Step-by-Step Deployment

#### 1. Push Code to GitHub

If not already done, push your code to a GitHub repository:

```bash
# Install dependencies (if not already)
pnpm install

# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit"

# Add remote and push
git remote add origin https://github.com/yourusername/compliance-tool.git
git branch -M main
git push -u origin main
```

#### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect it as a Vite project

#### 3. Configure Build Settings

Vercel should auto-detect most settings, but verify:

```json
{
  "buildCommand": "tsc -b && vite build",
  "outputDirectory": "dist",
  "installCommand": "pnpm install",
  "devCommand": "vite"
}
```

#### 4. Deploy

Click "Deploy" and wait for the build to complete.

Once deployed, you'll get a permanent URL like:
```
https://your-project-name.vercel.app
```

### Custom Domain (Optional)

1. In Vercel dashboard, go to "Domains"
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. SSL certificates are provisioned automatically

### Environment Variables

The app uses MSW (Mock Service Worker) for API mocking. To make it work in production:

1. Go to your Vercel project → "Settings" → "Environment Variables"
2. Add the following variable:
   - **Name**: `VITE_ENABLE_MSW`
   - **Value**: `1`
3. Redeploy to apply changes

This enables the mock API in production. For a real backend deployment, you would:
1. Deploy your backend API separately
2. Set `VITE_API_URL` to your backend URL
3. Remove `VITE_ENABLE_MSW`

### Production Optimizations

To optimize for production:

1. **Build Analysis**: Check the bundle size during build
   ```bash
   pnpm run build
   pnpm run preview  # Should serve from dist/
   ```

2. **Performance**: Vercel automatically enables:
   - Edge caching for static assets
   - HTTP/2 and HTTP/3
   - Automatic compression

3. **Analytics**: Enable Vercel Analytics in the dashboard

### CI/CD Updates

Your deployments will now be automatic:
- Push to `main` branch → Production deployment
- Push to any other branch → Preview deployments

## Important: API Mocking in Production

This app uses MSW (Mock Service Worker) for API endpoints. In production on Vercel:
- Without `VITE_ENABLE_MSW=1`, API calls will fail (404 errors)
- With `VITE_ENABLE_MSW=1`, the app will work using mocked data
- For real production, deploy a backend API and set `VITE_API_URL` instead

---

## Choosing Between Options

| Feature | Cloudflare Tunnel | Vercel |
|---------|-------------------|--------|
| Use Case | Local sharing/demos | Production hosting |
| Setup Time | 2 minutes | 10 minutes |
| Cost | Free | Free tier available |
| Persistence | Temporary (while tunnel runs) | Permanent |
| Performance | Depends on your machine | Global CDN, optimized |
| Custom Domain | No | Yes |
| Environment | Local server | Production build |

**Recommended Workflow**:
1. Use Cloudflare Tunnel for internal demos and user testing during development
2. Deploy to Vercel for production releases or milestone demos

---

## Security Considerations

### Cloudflare Tunnel
- Only share with trusted individuals
- This exposes your local dev server
- Ensure no sensitive data in mocked responses

### Vercel
- Production build (no dev dependencies)
- Automatic HTTPS
- Built-in DDoS protection
- Restricted access to environment variables