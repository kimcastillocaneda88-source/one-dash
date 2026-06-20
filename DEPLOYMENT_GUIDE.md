# Complete Deployment Guide - Firebase + GitHub + Vercel

This guide provides step-by-step instructions for deploying the Team Leader Dashboard using Firebase, GitHub, and Vercel.

## Overview

The deployment architecture consists of:

1. **Firebase** - Backend services (Firestore, Cloud Functions, Authentication)
2. **GitHub** - Version control and CI/CD
3. **Vercel** - Frontend hosting and deployment

## Phase 1: Firebase Setup (1-2 hours)

### Step 1.1: Create Firebase Project

1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `team-leader-dashboard`
4. Accept terms and create project
5. Wait for project initialization

### Step 1.2: Enable Firestore

1. Go to **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Production mode**
4. Select region (e.g., `us-central1`)
5. Click **Create**

### Step 1.3: Enable Firebase Authentication

1. Go to **Build** → **Authentication**
2. Click **Get started**
3. Enable **Google** provider
4. Add test email addresses
5. Save configuration

### Step 1.4: Set Up Cloud Functions

1. Go to **Build** → **Functions**
2. Click **Get started**
3. Follow prompts to enable Cloud Functions API

### Step 1.5: Get Firebase Credentials

1. Go to **Project Settings** (gear icon)
2. Click on your web app
3. Copy the `firebaseConfig` object
4. Save these values for later:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
   - `measurementId`

### Step 1.6: Deploy Firestore Rules and Indexes

```bash
# From project root
firebase login
firebase init

# Select: Firestore, Functions, Hosting
# Choose your Firebase project
# Accept defaults

# Deploy rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

### Step 1.7: Deploy Cloud Functions

```bash
# Install function dependencies
cd functions
pnpm install
cd ..

# Deploy functions
firebase deploy --only functions
```

**Verify deployment:**
```bash
firebase functions:log
```

## Phase 2: GitHub Setup (30 minutes)

### Step 2.1: Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Enter repository name: `team-leader-dashboard`
3. Add description
4. Choose visibility (Public or Private)
5. Click **Create repository**

### Step 2.2: Initialize Local Git

```bash
cd team-leader-dashboard-firebase

git init
git add .
git commit -m "Initial commit: Firebase team leader dashboard"
git remote add origin https://github.com/YOUR_USERNAME/team-leader-dashboard.git
git branch -M main
git push -u origin main
```

### Step 2.3: Configure GitHub Secrets

1. Go to repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add secrets:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

### Step 2.4: Set Up Branch Protection

1. Go to **Settings** → **Branches**
2. Click **Add rule**
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require pull request before merging
   - ✅ Require status checks to pass
   - ✅ Require branches up to date
5. Click **Create**

## Phase 3: Vercel Deployment (30 minutes)

### Step 3.1: Connect Vercel to GitHub

1. Go to [Vercel](https://vercel.com)
2. Click **Sign Up** or **Sign In**
3. Choose **Continue with GitHub**
4. Authorize Vercel

### Step 3.2: Import Project

1. Click **New Project**
2. Search for `team-leader-dashboard`
3. Click **Import**
4. Configure:
   - **Project Name**: `team-leader-dashboard`
   - **Framework**: Vite
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`

### Step 3.3: Add Environment Variables

1. In import dialog, click **Environment Variables**
2. Add all Firebase credentials:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

3. Select environments: Production, Preview, Development
4. Click **Deploy**

### Step 3.4: Verify Deployment

1. Wait for build to complete
2. Click production URL
3. Verify app loads
4. Test Firebase Auth (Google login)

## Phase 4: Post-Deployment Configuration (30 minutes)

### Step 4.1: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain
4. Follow DNS configuration
5. Wait for DNS propagation (24-48 hours)

### Step 4.2: Set Up Monitoring

**Firebase Monitoring:**
1. Go to Firebase Console
2. Set up alerts for errors
3. Monitor Firestore usage
4. Check Cloud Functions logs

**Vercel Monitoring:**
1. Enable Vercel Analytics
2. Set up error alerts
3. Monitor performance metrics

### Step 4.3: Create Demo Data

Option A: Manually in Firebase Console
1. Go to Firestore Database
2. Create collections: `users`, `teams`
3. Add sample documents

Option B: Use Firebase CLI
```bash
firebase firestore:bulk-import --import-path=demo-data.json
```

### Step 4.4: Test RBAC

1. Create test users with different roles
2. Verify access control:
   - Admin sees all teams
   - TeamLeader sees only their team
   - Member sees only their team
3. Test metrics visibility

## Phase 5: Continuous Integration & Deployment

### Automatic Deployments

**On Push to Main:**
1. GitHub Actions runs CI checks
2. Vercel builds and deploys
3. Production URL updated

**On Pull Request:**
1. GitHub Actions runs tests
2. Vercel creates preview URL
3. Preview URL shared in PR comments

### Manual Deployment

**Deploy Cloud Functions:**
```bash
firebase deploy --only functions
```

**Deploy Firestore Rules:**
```bash
firebase deploy --only firestore:rules
```

**Rollback Vercel Deployment:**
1. Go to Vercel dashboard
2. Click **Deployments**
3. Find previous deployment
4. Click **...** → **Promote to Production**

## Troubleshooting

### Firebase Issues

**"Permission denied" errors:**
- Check Firestore security rules
- Verify user role in database
- Check Firebase Auth configuration

**Cloud Functions not triggering:**
- Check Cloud Functions logs: `firebase functions:log`
- Verify Cloud Scheduler is enabled
- Check function memory and timeout settings

### Vercel Issues

**Build fails:**
- Check build logs in Vercel dashboard
- Verify environment variables are set
- Check for TypeScript errors: `pnpm check`

**Blank page on load:**
- Check browser console for errors
- Verify Firebase credentials
- Check Firestore security rules allow reads

### GitHub Issues

**CI checks failing:**
- Check GitHub Actions logs
- Run tests locally: `pnpm test`
- Check TypeScript: `pnpm check`

## Monitoring & Maintenance

### Daily Tasks
- Monitor error logs
- Check Firestore usage
- Review Cloud Functions logs

### Weekly Tasks
- Review security rules
- Check performance metrics
- Update dependencies

### Monthly Tasks
- Audit user access
- Review cost analysis
- Plan capacity upgrades

## Scaling Considerations

### Firestore Scaling
- Use composite indexes for complex queries
- Implement pagination for large datasets
- Monitor read/write operations

### Cloud Functions Scaling
- Increase memory allocation if needed
- Monitor execution time
- Set up error alerts

### Vercel Scaling
- Monitor bandwidth usage
- Consider upgrading plan if needed
- Optimize bundle size

## Cost Optimization

### Firebase
- Use Firestore free tier for development
- Monitor read/write operations
- Optimize queries to reduce costs
- Archive old data

### Vercel
- Free tier suitable for most projects
- Monitor bandwidth usage
- Use preview deployments for testing

### GitHub
- Free tier includes unlimited public repos
- Private repos available with free tier

## Security Checklist

- [ ] Firestore rules reviewed and tested
- [ ] Firebase Auth configured with Google OAuth
- [ ] Environment variables not committed to git
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] API keys restricted to specific domains
- [ ] Audit logging enabled
- [ ] Regular backups configured
- [ ] Error monitoring set up

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Environment variables configured
- [ ] Firebase rules deployed
- [ ] Cloud Functions deployed

### Deployment
- [ ] Push to main branch
- [ ] Verify GitHub Actions passes
- [ ] Verify Vercel build succeeds
- [ ] Test production URL

### Post-Deployment
- [ ] Verify app functionality
- [ ] Check error logs
- [ ] Monitor metrics
- [ ] Gather user feedback

## Next Steps

1. **Monitor Performance**: Track metrics and user feedback
2. **Gather Analytics**: Use Vercel Analytics and Firebase Analytics
3. **Plan Features**: Based on user feedback
4. **Scale Infrastructure**: As usage grows
5. **Optimize Costs**: Regular cost analysis

## Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Documentation](https://docs.github.com)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)

## Contact & Support

For issues:
1. Check documentation
2. Search GitHub issues
3. Create new GitHub issue
4. Contact Firebase support
5. Contact Vercel support

---

**Estimated Total Time**: 3-4 hours for complete setup and deployment

**Estimated Monthly Cost**: $0-50 (depending on usage)

Good luck with your deployment! 🚀
