# Team Leader Operational Metrics Dashboard

A production-ready, real-time team performance analytics dashboard built with React, Vite, TypeScript, Tailwind CSS, and Recharts. Features multi-tenant role-based access control (RBAC), real-time metric updates via tRPC polling, and secure data access enforcement at the procedure layer.

## 🎯 Features

- **Multi-Tenant RBAC**: Three roles (Admin, TeamLeader, Member) with role-based access control enforced at the tRPC layer
- **Real-Time Metrics**: Live dashboard with auto-refresh every 30 seconds and manual refresh capability
- **Interactive Charts**: Recharts-powered line charts (trends), bar charts (team comparisons), and pie charts (metric breakdown)
- **KPI Cards**: Display key metrics (tasks completed, active members, response time, throughput) with trend indicators
- **Time-Range Selector**: Filter by Today, Last 7 Days, Last 30 Days, or Custom range
- **Team Filter**: Scope all charts and KPIs to specific teams (role-based)
- **CSV Export**: Download filtered metrics data as CSV files
- **Industrial Aesthetic**: Modern monochromatic grayscale design with geometric composition
- **Accessibility**: Full keyboard navigation, ARIA labels, and screen reader support
- **Responsive Design**: Mobile-first layout with sidebar navigation

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS 4
- **Backend**: Express.js + tRPC 11 + TypeScript
- **Database**: MySQL (TiDB compatible)
- **ORM**: Drizzle ORM with type-safe queries
- **Charts**: Recharts for data visualization
- **Auth**: Manus OAuth with role-based context provider
- **Testing**: Vitest with mocked database layer

### Project Structure

```
team-leader-dashboard/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx          # Main dashboard layout with sidebar
│   │   │   ├── KPICard.tsx                  # KPI card component with trends
│   │   │   ├── DashboardFilters.tsx         # Time range and team filters
│   │   │   ├── MetricsCharts.tsx            # Recharts components
│   │   │   └── ...
│   │   ├── contexts/
│   │   │   ├── RBACContext.tsx              # Role-based access control context
│   │   │   └── ThemeContext.tsx
│   │   ├── pages/
│   │   │   ├── Overview.tsx                 # Main dashboard with all KPIs and charts
│   │   │   ├── MyTeam.tsx                   # Team-specific metrics
│   │   │   ├── Reports.tsx                  # Advanced reporting with table
│   │   │   └── Settings.tsx                 # User preferences and profile
│   │   ├── lib/
│   │   │   ├── trpc.ts                      # tRPC client setup
│   │   │   └── csvExport.ts                 # CSV export utilities
│   │   ├── index.css                        # Industrial monochromatic theme
│   │   └── App.tsx                          # Route configuration
│   └── ...
├── server/
│   ├── routers.ts                           # tRPC procedures with RBAC
│   ├── db.ts                                # Database queries and helpers
│   ├── metrics.test.ts                      # Role-based access control tests
│   ├── seed.mjs                             # Demo data seeding script
│   └── _core/
│       ├── context.ts                       # tRPC context with user auth
│       ├── trpc.ts                          # tRPC instance and procedure types
│       └── ...
├── drizzle/
│   ├── schema.ts                            # Database schema with relations
│   └── migrations/                          # Generated SQL migrations
└── ...
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22.13.0+
- pnpm 10.4.1+
- MySQL 8.0+ or TiDB compatible database

### Local Development

1. **Clone and install dependencies**:
   ```bash
   cd team-leader-dashboard
   pnpm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with:
   ```env
   DATABASE_URL=mysql://user:password@localhost:3306/dashboard
   JWT_SECRET=your-secret-key-here
   VITE_APP_ID=your-manus-oauth-app-id
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
   OWNER_OPEN_ID=your-owner-id
   OWNER_NAME=Your Name
   ```

3. **Run database migrations**:
   ```bash
   pnpm drizzle-kit generate
   pnpm drizzle-kit migrate
   ```

4. **Seed demo data** (optional):
   ```bash
   node server/seed.mjs
   ```

5. **Start development server**:
   ```bash
   pnpm dev
   ```
   Server runs on `http://localhost:3000`

6. **Run tests**:
   ```bash
   pnpm test
   ```

## 📊 Database Schema

### Core Tables

- **users**: User accounts with roles (Admin, TeamLeader, Member)
- **teams**: Team definitions with leader assignment
- **users_teams**: User-team relationships with per-team roles
- **metrics**: Hourly aggregated performance data (tasks, members, response time, throughput)
- **audit_log**: Audit trail for compliance and debugging

### Key Relationships

- Users have many teams (many-to-many via users_teams)
- Teams have many members (one-to-many via users_teams)
- Teams have many metrics (one-to-many)
- Teams have a leader (foreign key to users)

## 🔐 Security & Access Control

### Role-Based Access Control (RBAC)

All data access is enforced at the **tRPC procedure layer**, not just the UI:

- **Admin**: Can view all teams and all metrics across the organization
- **TeamLeader**: Can view only their assigned team's metrics
- **Member**: Can view only their assigned team's metrics (read-only)

### tRPC Procedure Security

```typescript
// Role-based procedure wrapper
function roleBasedProcedure(allowedRoles: string[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx });
  });
}

// Usage in routers
metrics: router({
  getTeamMetrics: protectedProcedure
    .input(z.object({ teamId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Check user can access team
      const hasAccess = await canUserAccessTeam(
        ctx.user.id,
        input.teamId,
        ctx.user.role
      );
      if (!hasAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getTeamMetrics(input.teamId, ...);
    }),
})
```

### Database Access Patterns

- All queries filter by user's accessible teams
- Admins bypass team filters; non-admins are restricted
- Audit log tracks all data access and modifications

## 📈 Real-Time Updates

### Polling Strategy

- Dashboard auto-refreshes metrics every 30 seconds via `refetchInterval`
- Manual refresh button available for immediate updates
- Last-updated timestamp displayed for transparency

### Query Optimization

- Metrics queries use indexed lookups by teamId and timestamp
- Aggregated metrics computed hourly to reduce query load
- Client-side caching via tRPC's React Query integration

## 🧪 Testing

### Unit Tests

Run all tests:
```bash
pnpm test
```

Test coverage includes:
- Role-based access control enforcement
- Metric query filtering by team
- Admin-only procedure protection
- CSV export functionality

### Test Example

```typescript
it("should deny TeamLeader access to other team metrics", async () => {
  const user = { id: 1, role: "TeamLeader", ... };
  const ctx = createMockContext(user);
  const caller = appRouter.createCaller(ctx);

  vi.mocked(db.canUserAccessTeam).mockResolvedValue(false);

  try {
    await caller.metrics.getTeamMetrics({ teamId: 999, ... });
    expect.fail("Should have thrown FORBIDDEN");
  } catch (error) {
    expect((error as TRPCError).code).toBe("FORBIDDEN");
  }
});
```

## 📋 Deployment

### Vercel Deployment

1. **Create GitHub repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/team-leader-dashboard.git
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Visit https://vercel.com/new
   - Import the GitHub repository
   - Select "Other" as the framework

3. **Configure environment variables** in Vercel:
   ```
   DATABASE_URL=mysql://...
   JWT_SECRET=...
   VITE_APP_ID=...
   OAUTH_SERVER_URL=...
   VITE_OAUTH_PORTAL_URL=...
   OWNER_OPEN_ID=...
   OWNER_NAME=...
   ```

4. **Build settings**:
   - Build command: `pnpm build`
   - Output directory: `dist`
   - Install command: `pnpm install`

5. **Deploy**:
   ```bash
   git push origin main
   ```
   Vercel automatically deploys on push to main branch.

### CI/CD with GitHub Actions

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm check
      - run: pnpm test
```

## 🔄 Rollback Procedures

### Database Rollback

If a migration fails:

1. **Identify the failed migration**:
   ```bash
   pnpm drizzle-kit drop
   ```

2. **Revert schema changes** in `drizzle/schema.ts`

3. **Generate new migration**:
   ```bash
   pnpm drizzle-kit generate
   ```

4. **Apply corrected migration**:
   ```bash
   pnpm drizzle-kit migrate
   ```

### Application Rollback

If deployment has issues:

1. **Revert to previous commit**:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Vercel automatically redeploys** from the previous commit

3. **Monitor logs** at https://vercel.com/dashboard

## 🌐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | Session signing secret | `your-secret-key` |
| `VITE_APP_ID` | Manus OAuth application ID | `app-123456` |
| `OAUTH_SERVER_URL` | Manus OAuth server URL | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | Manus OAuth portal URL | `https://oauth.manus.im` |
| `OWNER_OPEN_ID` | Owner's Manus OpenID | `owner-123` |
| `OWNER_NAME` | Owner's display name | `Admin User` |

### Optional Variables

- `NODE_ENV`: `development` or `production` (default: `production`)
- `PORT`: Server port (default: `3000`)

## 📚 API Documentation

### tRPC Routers

#### `teams.list`
Get all teams accessible to the current user.
- **Auth**: Protected
- **Returns**: `Team[]`

#### `teams.get`
Get a specific team with access control.
- **Auth**: Protected
- **Input**: `{ teamId: number }`
- **Returns**: `Team | null`

#### `metrics.getTeamMetrics`
Get metrics for a specific team within a time range.
- **Auth**: Protected + role-based
- **Input**: `{ teamId: number, startTime: number, endTime: number }`
- **Returns**: `Metric[]`

#### `metrics.getAggregated`
Get aggregated metrics for accessible teams.
- **Auth**: Protected + role-based
- **Input**: `{ startTime: number, endTime: number, teamIds?: number[] }`
- **Returns**: `Metric[]`

#### `metrics.getSummary`
Get latest summary metrics for a team.
- **Auth**: Protected + role-based
- **Input**: `{ teamId: number }`
- **Returns**: `{ tasksCompleted, activeMembers, responseTime, throughput, lastUpdated }`

#### `admin.getAllTeams`
Get all teams (admin only).
- **Auth**: Admin only
- **Returns**: `Team[]`

#### `admin.getAllMetrics`
Get all metrics across all teams (admin only).
- **Auth**: Admin only
- **Input**: `{ startTime: number, endTime: number }`
- **Returns**: `Metric[]`

## 🎨 Design System

### Color Palette (Monochromatic Grayscale)

- **Background**: `#f8f8f8` (light) / `#131313` (dark)
- **Foreground**: `#1f1f1f` (light) / `#f8f8f8` (dark)
- **Accent**: `#404040` (light) / `#bfbfbf` (dark)
- **Muted**: `#737373` (light) / `#8c8c8c` (dark)

### Typography

- **Headline**: 6xl font-black tracking-tighter
- **Subtext**: xs font-light tracking-widest uppercase
- **Body**: sm font-medium

## 📖 Additional Resources

- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM](https://orm.drizzle.team)
- [Recharts](https://recharts.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Vercel Deployment](https://vercel.com/docs)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details
