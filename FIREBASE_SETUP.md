# Firebase Setup Guide

This guide walks you through setting up the Team Leader Dashboard with Firebase Firestore, Cloud Functions, and Firebase Authentication.

## Prerequisites

- Node.js 18+ and pnpm
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Google Cloud Project with billing enabled
- GitHub account for repository

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter your project name (e.g., "team-leader-dashboard")
4. Accept the terms and click "Create project"
5. Wait for the project to be created

## Step 2: Set Up Firebase Services

### Enable Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (we'll set security rules)
4. Select your preferred region (e.g., `us-central1`)
5. Click **Create**

### Enable Firebase Authentication

1. Go to **Build** → **Authentication**
2. Click **Get started**
3. Click **Google** provider
4. Enable it and add your email as a test user
5. Save

### Set Up Cloud Functions

1. Go to **Build** → **Functions**
2. Click **Get started**
3. Follow the prompts to enable Cloud Functions API

## Step 3: Configure Your Local Environment

### Initialize Firebase in Your Project

```bash
cd team-leader-dashboard-firebase
firebase login
firebase init
```

When prompted:
- Select "Firestore", "Functions", and "Hosting"
- Choose your Firebase project
- Accept default configurations (or customize as needed)
- For Functions runtime, select **Node.js 20**

### Update `.firebaserc`

Edit `.firebaserc` and replace `your-firebase-project-id` with your actual Firebase project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### Set Up Environment Variables

Create a `.env.local` file in the project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

To get these values:
1. Go to Firebase Console → Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click on your web app
4. Copy the `firebaseConfig` object values

## Step 4: Deploy Firestore Security Rules

1. Update `firestore.rules` with your security rules (already provided)
2. Deploy rules:

```bash
firebase deploy --only firestore:rules
```

## Step 5: Deploy Cloud Functions

1. Install dependencies:

```bash
cd functions
pnpm install
cd ..
```

2. Deploy functions:

```bash
firebase deploy --only functions
```

This deploys:
- `aggregateMetricsHourly` - Runs every hour to aggregate metrics
- `updateRealtimeMetrics` - Updates real-time metrics when new data arrives
- `initializeUserOnCreate` - Creates user profile when new user signs up
- `cleanupUserOnDelete` - Cleans up user data when user is deleted
- `logAuditEvent` - Logs audit events for compliance

## Step 6: Set Up Firestore Indexes

1. Deploy indexes:

```bash
firebase deploy --only firestore:indexes
```

2. Or create them manually in Firebase Console:
   - Go to **Firestore Database** → **Indexes**
   - Create composite indexes as defined in `firestore.indexes.json`

## Step 7: Deploy to Vercel

### Connect GitHub Repository

1. Push your code to GitHub:

```bash
git init
git add .
git commit -m "Initial commit: Firebase team leader dashboard"
git remote add origin https://github.com/your-username/team-leader-dashboard.git
git push -u origin main
```

### Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables:
   - Add all `VITE_FIREBASE_*` variables from your `.env.local`
5. Click "Deploy"

Vercel will automatically:
- Build your Vite app
- Deploy to a production URL
- Set up automatic deployments on push to main

## Step 8: Seed Demo Data (Optional)

Create demo data for testing:

```bash
firebase firestore:bulk-import --import-path=demo-data.json
```

Or manually create data in Firebase Console:
- Create teams
- Create users
- Assign users to teams

## Step 9: Configure Firebase Hosting (Optional)

If you want to use Firebase Hosting instead of Vercel:

```bash
firebase deploy --only hosting
```

Your app will be available at `https://your-project-id.web.app`

## Firestore Data Structure

```
users/
  {userId}/
    - uid: string
    - email: string
    - displayName: string
    - role: "Admin" | "TeamLeader" | "Member"
    - teams: string[] (team IDs)
    - createdAt: timestamp
    - updatedAt: timestamp

teams/
  {teamId}/
    - name: string
    - description: string
    - leaderId: string (user ID of team lead)
    - createdAt: timestamp
    - updatedAt: timestamp
    
    members/
      {userId}/
        - role: "TeamLeader" | "Member"
        - joinedAt: timestamp
    
    metrics/
      {metricId}/
        - timestamp: number (milliseconds)
        - tasksCompleted: number
        - activeMembers: number
        - responseTime: number
        - throughput: number
        - isAggregated: boolean
        - createdAt: timestamp
    
    realtimeMetrics/
      current/
        - (same as latest metric)
        - lastUpdated: timestamp

auditLogs/
  {logId}/
    - eventType: string
    - teamId: string
    - timestamp: timestamp
    - data: object
```

## Monitoring and Debugging

### View Cloud Functions Logs

```bash
firebase functions:log
```

### Test Cloud Functions Locally

```bash
firebase emulators:start --only functions,firestore
```

### Monitor Firestore Usage

1. Go to Firebase Console → **Firestore Database**
2. Click **Usage** tab to see read/write operations

## Troubleshooting

### "Permission denied" errors

- Check Firestore security rules
- Verify user role is set correctly
- Ensure user is added to team members

### Cloud Functions not triggering

- Check Cloud Functions logs: `firebase functions:log`
- Verify Cloud Scheduler is enabled
- Check Cloud Functions quota

### Metrics not aggregating

- Verify `aggregateMetricsHourly` function is deployed
- Check Cloud Functions logs for errors
- Ensure metrics are being written to Firestore

### Authentication issues

- Verify Firebase Auth is enabled
- Check Google OAuth credentials
- Ensure redirect URLs are configured

## Security Considerations

1. **Firestore Rules**: Review and customize security rules for your use case
2. **API Keys**: Never commit Firebase API keys to git (use `.gitignore`)
3. **Cloud Functions**: Ensure functions validate user permissions
4. **Audit Logging**: Monitor audit logs for suspicious activity
5. **Data Encryption**: Firestore encrypts data at rest and in transit

## Next Steps

1. Deploy Cloud Functions
2. Set up Firestore indexes
3. Configure Firebase Authentication
4. Deploy to Vercel
5. Monitor metrics and logs
6. Set up alerts for errors

## References

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Cloud Functions Guide](https://firebase.google.com/docs/functions)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
