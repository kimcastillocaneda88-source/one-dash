# Vercel Deployment Guide

This guide walks you through deploying the Team Leader Dashboard to Vercel.

## Prerequisites

- GitHub repository created and pushed
- Vercel account (free or paid)
- Firebase project configured

## Step 1: Connect GitHub to Vercel

1. Go to [Vercel](https://vercel.com)
2. Click **Sign Up** or **Sign In**
3. Click **Continue with GitHub**
4. Authorize Vercel to access your GitHub account
5. Select the organization where your repository is located

## Step 2: Import Your Project

1. Click **New Project**
2. Search for `team-leader-dashboard` repository
3. Click **Import**
4. Configure project settings:
   - **Project Name**: `team-leader-dashboard`
   - **Framework**: Vite
   - **Root Directory**: `./` (default)
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

## Step 3: Add Environment Variables

1. In the import dialog, click **Environment Variables**
2. Add all Firebase configuration variables:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id (optional)
```

3. Select which environments these apply to:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. Click **Deploy**

## Step 4: Wait for Deployment

Vercel will:
1. Clone your repository
2. Install dependencies
3. Build your project
4. Deploy to production

You'll see a progress bar and deployment logs. Once complete, you'll get a production URL like:
```
https://team-leader-dashboard.vercel.app
```

## Step 5: Configure Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Click **Settings** → **Domains**
3. Click **Add Domain**
4. Enter your domain (e.g., `dashboard.example.com`)
5. Follow DNS configuration instructions
6. Wait for DNS to propagate (usually 24-48 hours)

## Step 6: Set Up Automatic Deployments

Vercel automatically deploys on every push to `main`:

1. **Production**: Deploys on push to `main`
2. **Preview**: Creates preview URLs for pull requests
3. **Development**: Deploy on demand from Vercel dashboard

### Preview Deployments

Every pull request automatically gets a preview URL:

1. Create a pull request on GitHub
2. Vercel bot comments with preview URL
3. Share preview URL with team for testing
4. Merge PR to deploy to production

## Step 7: Configure Analytics (Optional)

Enable Vercel Analytics to monitor performance:

1. Go to **Settings** → **Analytics**
2. Click **Enable Analytics**
3. View real-time metrics in dashboard

## Step 8: Set Up Monitoring and Alerts

1. Go to **Settings** → **Monitoring**
2. Configure alerts for:
   - Build failures
   - Deployment errors
   - Performance issues

## Environment Variables Management

### Add/Update Variables

1. Go to **Settings** → **Environment Variables**
2. Click **Add New**
3. Enter variable name and value
4. Select environments
5. Click **Save**

### Redeploy After Changing Variables

1. Go to **Deployments**
2. Click **...** on latest deployment
3. Click **Redeploy**

Or push a new commit to trigger automatic redeployment.

## Troubleshooting

### Build Fails: "Cannot find module"

1. Check `package.json` dependencies
2. Verify build command: `pnpm build`
3. Check for missing environment variables

### Build Fails: "Cannot apply unknown utility class"

This is a Tailwind CSS issue:
1. Ensure `client/src/index.css` has all required Tailwind directives
2. Check for typos in CSS class names
3. Rebuild locally: `pnpm build`

### Site Shows Blank Page

1. Check browser console for errors
2. Verify Firebase configuration is correct
3. Check Firestore security rules allow reads
4. Verify Firebase Authentication is enabled

### Slow Performance

1. Enable Vercel Analytics to identify bottlenecks
2. Check Firestore read/write operations
3. Optimize images and assets
4. Consider upgrading Vercel plan

## Production Best Practices

1. **Environment Variables**: Never commit secrets to git
2. **Error Monitoring**: Set up Sentry or similar for error tracking
3. **Performance**: Monitor Core Web Vitals in Vercel Analytics
4. **Security**: Enable HTTPS (automatic with Vercel)
5. **Backups**: Regular Firestore backups
6. **Logging**: Monitor Cloud Functions logs

## Rollback to Previous Deployment

1. Go to **Deployments** tab
2. Find the deployment you want to rollback to
3. Click **...** → **Promote to Production**

## Custom Build Configuration

Create `vercel.json` for advanced configuration:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_FIREBASE_API_KEY": "@firebase_api_key",
    "VITE_FIREBASE_PROJECT_ID": "@firebase_project_id"
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Monitoring Deployments

### View Deployment Logs

1. Go to **Deployments**
2. Click on a deployment
3. Click **Logs** tab

### Real-Time Logs

```bash
vercel logs --follow
```

### Check Deployment Status

```bash
vercel status
```

## CI/CD Integration

Vercel automatically integrates with GitHub:

1. Every push to `main` → Production deployment
2. Every PR → Preview deployment
3. Failed builds → GitHub status check fails
4. Successful builds → GitHub status check passes

## Performance Optimization

### Image Optimization

Vercel automatically optimizes images. Use Next.js Image component or standard `<img>` tags.

### Code Splitting

Vite automatically code-splits your bundle. Monitor bundle size:

```bash
pnpm build --analyze
```

### Caching

Configure caching headers in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## Scaling

### Auto-Scaling

Vercel automatically scales based on traffic. No configuration needed.

### Upgrade Plan

For higher limits:
1. Go to **Settings** → **Billing**
2. Click **Upgrade Plan**
3. Choose Pro or Enterprise

## Support and Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- [Vercel Community](https://vercel.com/community)
- [Vite Documentation](https://vitejs.dev)

## Next Steps

1. Deploy to Vercel
2. Configure custom domain
3. Set up monitoring and alerts
4. Configure CI/CD
5. Monitor performance metrics
6. Gather user feedback
