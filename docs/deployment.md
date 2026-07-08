# Deployment Guide

This guide covers deploying the Compliance Tool to production on **Vercel**, the primary deployment method. Vercel provides a permanent URL, automatic HTTPS, a global CDN, and automatic deployments from GitHub.

## Prerequisites

1. GitHub repository with your code
2. Vercel account (free tier available)
3. Connected GitHub account in Vercel

## Step-by-Step Deployment

### 1. Push Code to GitHub

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

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect it as a Vite project

### 3. Configure Build Settings

Vercel should auto-detect most settings, but verify:

```json
{
  "buildCommand": "tsc -b && vite build",
  "outputDirectory": "dist",
  "installCommand": "pnpm install",
  "devCommand": "vite"
}
```

### 4. Deploy

Click "Deploy" and wait for the build to complete.

Once deployed, you'll get a permanent URL like:

```
https://your-project-name.vercel.app
```

## Custom Domain (Optional)

1. In Vercel dashboard, go to "Domains"
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. SSL certificates are provisioned automatically

## Environment Variables

The app uses MSW (Mock Service Worker) for API mocking. To make it work in production, configure this in the **Vercel dashboard** — do not commit a local `.env.production` file:

1. Go to your Vercel project → "Settings" → "Environment Variables"
2. Add the following variable:
   - **Name**: `VITE_ENABLE_MSW`
   - **Value**: `1`
3. Redeploy to apply changes

This enables the mock API in production. For a real backend deployment, you would:

1. Deploy your backend API separately
2. Set `VITE_API_URL` to your backend URL
3. Remove `VITE_ENABLE_MSW`

## Vercel Speed Insights

The app includes [Vercel Speed Insights](https://vercel.com/docs/speed-insights) via the `@vercel/speed-insights` package. The `<SpeedInsights />` component is mounted in `src/App.tsx` and automatically collects Core Web Vitals performance metrics on every page load.

- **No configuration required** — metrics are collected automatically once deployed to Vercel.
- View performance data in your Vercel project dashboard under the **Speed Insights** tab.
- In local development, the component loads a debug script that logs to the console without sending data.

## Production Optimizations

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

## CI/CD Updates

Your deployments are automatic:

- Push to `main` branch → Production deployment
- Push to any other branch → Preview deployments

## Important: API Mocking in Production

This app uses MSW (Mock Service Worker) for API endpoints. In production on Vercel:

- Without `VITE_ENABLE_MSW=1`, API calls will fail (404 errors)
- With `VITE_ENABLE_MSW=1`, the app will work using mocked data
- For real production, deploy a backend API and set `VITE_API_URL` instead

## Security Considerations

- Production build (no dev dependencies)
- Automatic HTTPS
- Built-in DDoS protection
- Restricted access to environment variables
