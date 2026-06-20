# GitHub Repository Setup Guide

This guide walks you through setting up a GitHub repository for the Team Leader Dashboard.

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Enter repository name: `team-leader-dashboard`
3. Add description: "Production-ready team performance analytics dashboard with Firebase, Firestore, and Cloud Functions"
4. Choose visibility: **Public** or **Private**
5. Click **Create repository**

## Step 2: Initialize Git in Your Project

```bash
cd team-leader-dashboard-firebase

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Firebase team leader dashboard

- Multi-tenant RBAC (Admin, TeamLeader, Member)
- Real-time metrics with Firestore
- Cloud Functions for hourly aggregation
- Industrial monochromatic design
- Recharts visualizations
- Keyboard navigation and ARIA labels
- Firebase Authentication with Google SSO"

# Add remote repository
git remote add origin https://github.com/your-username/team-leader-dashboard.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Configure GitHub Secrets

For CI/CD and deployment, add secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add the following secrets:

### Firebase Secrets
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_API_KEY`: Your Firebase API key
- `FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
- `FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
- `FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
- `FIREBASE_APP_ID`: Your Firebase app ID

### Vercel Secrets (if deploying to Vercel)
- `VERCEL_TOKEN`: Your Vercel authentication token
- `VERCEL_PROJECT_ID`: Your Vercel project ID
- `VERCEL_ORG_ID`: Your Vercel organization ID

### GitHub Secrets
- `GH_TOKEN`: GitHub Personal Access Token (for automated deployments)

## Step 4: Set Up Branch Protection

1. Go to **Settings** → **Branches**
2. Click **Add rule**
3. Enter branch name pattern: `main`
4. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
5. Click **Create**

## Step 5: Configure GitHub Actions CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that:

- Runs on every pull request to `main`
- Runs format check, TypeScript check, and tests
- Builds the project
- Reports coverage

To enable:

1. Go to **Actions** tab
2. Click **Enable GitHub Actions**
3. Workflows will automatically run on next push

## Step 6: Set Up Automated Deployments

### Option A: Deploy to Vercel (Recommended)

1. Connect your GitHub repository to Vercel:
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Click "Deploy"

2. Vercel will automatically deploy on every push to `main`

### Option B: Deploy to Firebase Hosting

Create `.github/workflows/deploy-firebase.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

## Step 7: Commit Message Conventions

Follow conventional commits for clear history:

```
feat: Add new feature
fix: Fix a bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

Example:
```bash
git commit -m "feat: Add real-time metrics polling

- Implement 30-second polling interval
- Add last-updated timestamp display
- Add manual refresh button"
```

## Step 8: Code Review Process

1. Create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make changes and commit:
   ```bash
   git add .
   git commit -m "feat: Your feature description"
   ```

3. Push to GitHub:
   ```bash
   git push origin feat/your-feature-name
   ```

4. Create a Pull Request:
   - Go to your repository on GitHub
   - Click "Compare & pull request"
   - Add description of changes
   - Request reviewers
   - Click "Create pull request"

5. Wait for CI checks to pass
6. Get approval from reviewers
7. Click "Squash and merge" or "Merge pull request"

## Step 9: Release Management

Create releases for production deployments:

1. Go to **Releases** tab
2. Click **Create a new release**
3. Enter version tag (e.g., `v1.0.0`)
4. Add release notes
5. Click **Publish release**

## Step 10: Documentation

Keep documentation up to date:

- `README.md` - Project overview and setup
- `FIREBASE_SETUP.md` - Firebase configuration
- `GITHUB_SETUP.md` - GitHub repository setup
- `DEPLOYMENT_CHECKLIST.md` - Deployment steps
- `SECURITY.md` - Security considerations

## Useful GitHub Commands

### Clone the repository
```bash
git clone https://github.com/your-username/team-leader-dashboard.git
cd team-leader-dashboard
```

### Create a new branch
```bash
git checkout -b feat/new-feature
```

### Push changes
```bash
git add .
git commit -m "feat: Your message"
git push origin feat/new-feature
```

### Pull latest changes
```bash
git pull origin main
```

### View commit history
```bash
git log --oneline
```

### Undo last commit
```bash
git reset --soft HEAD~1
```

## Troubleshooting

### "Permission denied (publickey)"
- Generate SSH key: `ssh-keygen -t ed25519`
- Add to GitHub: Settings → SSH and GPG keys
- Use SSH URL for git remote

### "fatal: 'origin' does not appear to be a 'git' repository"
- Check remote: `git remote -v`
- Add remote: `git remote add origin https://github.com/your-username/team-leader-dashboard.git`

### Merge conflicts
1. Pull latest: `git pull origin main`
2. Resolve conflicts in your editor
3. Commit: `git commit -m "Resolve merge conflicts"`
4. Push: `git push origin your-branch`

## References

- [GitHub Documentation](https://docs.github.com)
- [Git Documentation](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions](https://docs.github.com/en/actions)
