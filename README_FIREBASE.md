# Team Leader Dashboard - Firebase Edition

A production-ready team performance analytics dashboard built with React, Vite, TypeScript, Firebase Firestore, Cloud Functions, and Firebase Authentication.

## Features

### Core Features
- **Multi-Tenant RBAC**: Admin, TeamLeader, and Member roles with role-based access control
- **Real-Time Metrics**: Live metric updates with Firestore listeners
- **Interactive Charts**: Recharts visualizations (line, bar, pie charts)
- **KPI Cards**: Tasks completed, active members, response time, throughput with trend indicators
- **Flexible Filters**: Time-range selector and team filter dropdown
- **CSV Export**: Download filtered metrics as CSV files
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Design
- **Industrial Aesthetic**: Modern monochromatic grayscale palette
- **Geometric Composition**: Overlapping rectangular blocks with depth
- **Typography**: Bold sans-serif headlines with delicate uppercase subtext
- **Accessibility**: Full keyboard navigation and ARIA labels

### Backend
- **Firebase Firestore**: Document database for scalable data storage
- **Cloud Functions**: Hourly metrics aggregation and real-time updates
- **Firebase Auth**: Email and Google OAuth authentication
- **Security Rules**: Role-based access control enforced at database layer

### Deployment
- **Vercel**: Fast, serverless hosting with automatic deployments
- **GitHub**: Version control and CI/CD integration
- **Firebase**: Backend services and real-time database

## Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Firebase CLI
- GitHub account
- Vercel account

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/team-leader-dashboard.git
   cd team-leader-dashboard-firebase
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   cd functions && pnpm install && cd ..
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Firebase credentials
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

5. **In another terminal, start Firebase emulators**
   ```bash
   firebase emulators:start --only firestore,auth
   ```

6. **Open browser**
   ```
   http://localhost:5173
   ```

## Project Structure

```
team-leader-dashboard-firebase/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── KPICard.tsx
│   │   │   ├── MetricsCharts.tsx
│   │   │   ├── DashboardFilters.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── contexts/               # React contexts
│   │   │   ├── FirebaseAuthContext.tsx
│   │   │   └── RBACContext.tsx
│   │   ├── lib/
│   │   │   ├── firebase.ts         # Firebase initialization
│   │   │   ├── firestore.ts        # Firestore data access
│   │   │   └── csvExport.ts        # CSV export utility
│   │   ├── pages/                  # Page components
│   │   │   ├── Overview.tsx
│   │   │   ├── MyTeam.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── Settings.tsx
│   │   ├── App.tsx                 # Main app component
│   │   └── index.css               # Global styles
│   └── index.html
├── functions/                       # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts                # Function definitions
│   ├── package.json
│   └── tsconfig.json
├── firestore.rules                 # Firestore security rules
├── firestore.indexes.json          # Firestore indexes
├── firebase.json                   # Firebase configuration
├── .firebaserc                     # Firebase project config
├── vercel.json                     # Vercel configuration
├── FIREBASE_SETUP.md               # Firebase setup guide
├── GITHUB_SETUP.md                 # GitHub setup guide
├── VERCEL_DEPLOYMENT.md            # Vercel deployment guide
└── package.json
```

## Configuration

### Firebase Setup
See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed Firebase configuration.

### GitHub Setup
See [GITHUB_SETUP.md](./GITHUB_SETUP.md) for GitHub repository setup.

### Vercel Deployment
See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for Vercel deployment steps.

## Environment Variables

Required environment variables for local development (`.env.local`):

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Development

### Build
```bash
pnpm build
```

### Type Check
```bash
pnpm check
```

### Format Code
```bash
pnpm format
```

### Run Tests
```bash
pnpm test
```

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Vercel automatically deploys on push to `main`
3. Preview deployments created for pull requests

### Deploy Cloud Functions

```bash
firebase deploy --only functions
```

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

## Firestore Data Structure

### Users Collection
```
users/{userId}
  - uid: string
  - email: string
  - displayName: string
  - role: "Admin" | "TeamLeader" | "Member"
  - teams: string[] (team IDs)
  - createdAt: timestamp
  - updatedAt: timestamp
```

### Teams Collection
```
teams/{teamId}
  - name: string
  - description: string
  - leaderId: string
  - createdAt: timestamp
  - updatedAt: timestamp
  
  members/{userId}
    - role: "TeamLeader" | "Member"
    - joinedAt: timestamp
  
  metrics/{metricId}
    - timestamp: number
    - tasksCompleted: number
    - activeMembers: number
    - responseTime: number
    - throughput: number
    - isAggregated: boolean
    - createdAt: timestamp
  
  realtimeMetrics/current
    - (latest metric data)
    - lastUpdated: timestamp
```

## Cloud Functions

### aggregateMetricsHourly
Runs every hour to aggregate raw metrics and store rolled-up statistics.

### updateRealtimeMetrics
Updates real-time metrics when new data is written.

### initializeUserOnCreate
Creates user profile when new user signs up.

### cleanupUserOnDelete
Cleans up user data when user is deleted.

### logAuditEvent
Logs audit events for compliance and debugging.

## Security

### Firestore Security Rules
- Admins can read/write all data
- TeamLeaders can read/write their team's data
- Members can read their team's data only
- All writes are restricted to authorized users

### Authentication
- Firebase Authentication with Google OAuth
- Email/password authentication
- Automatic user profile creation on signup

### Best Practices
- Never commit secrets to git
- Use environment variables for sensitive data
- Regularly review security rules
- Monitor audit logs
- Keep dependencies updated

## Performance

### Optimization
- Lazy loading of components
- Code splitting with Vite
- Firestore query optimization with indexes
- Real-time listeners for live updates
- Caching strategies

### Monitoring
- Vercel Analytics for performance metrics
- Firebase Firestore usage monitoring
- Cloud Functions execution logs

## Troubleshooting

### Build Errors
- Clear `node_modules` and reinstall: `pnpm install`
- Clear Vite cache: `rm -rf dist`
- Check Node.js version: `node --version` (should be 18+)

### Firebase Errors
- Check Firebase credentials in `.env.local`
- Verify Firestore security rules
- Check Cloud Functions logs: `firebase functions:log`

### Deployment Issues
- Check Vercel build logs
- Verify environment variables in Vercel dashboard
- Check GitHub Actions CI/CD status

## Contributing

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make changes and commit: `git commit -m "feat: Your feature"`
3. Push to GitHub: `git push origin feat/your-feature`
4. Create a pull request
5. Wait for CI checks to pass
6. Get approval and merge

## Testing

Run tests:
```bash
pnpm test
```

Run tests in watch mode:
```bash
pnpm test --watch
```

## Documentation

- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase configuration
- [GITHUB_SETUP.md](./GITHUB_SETUP.md) - GitHub repository setup
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Vercel deployment
- [SECURITY.md](./SECURITY.md) - Security considerations
- [CODE_SNIPPETS.md](./CODE_SNIPPETS.md) - Code examples

## License

MIT

## Support

For issues and questions:
1. Check documentation
2. Search existing GitHub issues
3. Create a new GitHub issue
4. Contact support

## References

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Recharts Documentation](https://recharts.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Vercel Documentation](https://vercel.com/docs)

---

Built with ❤️ for team leaders and operational excellence.
