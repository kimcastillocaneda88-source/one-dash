# Security Documentation

## Overview

The Team Leader Dashboard implements multi-layered security controls to protect sensitive team performance data. All security enforcement occurs at the **tRPC procedure layer**, not just the UI, ensuring that unauthorized access is impossible even if the client is compromised. The application uses role-based access control (RBAC) with three distinct roles: Admin (full access to all teams), TeamLeader (access to assigned team only), and Member (read-only access to assigned team). Database access is strictly filtered by user role and team membership, with all queries validated against the user's context. Authentication is handled via Manus OAuth, eliminating the need to manage passwords. All data access is logged to an audit trail for compliance and forensic analysis.

## Authentication & Authorization

### OAuth Flow

The application uses Manus OAuth for authentication, which is more secure than password-based authentication:

- Users are redirected to the Manus OAuth portal to authenticate
- Upon successful authentication, a JWT token is issued and stored in a secure HTTP-only cookie
- The token is automatically included in all tRPC requests via the context
- Token expiration is enforced server-side; expired tokens trigger re-authentication

### Role-Based Access Control (RBAC)

All data access is enforced at the **tRPC procedure layer**:

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

// Usage: admin-only procedures
admin: router({
  getAllTeams: roleBasedProcedure(["Admin"]).query(...),
  getAllMetrics: roleBasedProcedure(["Admin"]).query(...),
})
```

### Role Definitions

| Role | Permissions | Use Case |
|------|-------------|----------|
| Admin | View all teams, all metrics; manage users | Organization leadership |
| TeamLeader | View own team metrics; manage team members | Team managers |
| Member | View own team metrics (read-only) | Team members |

## Data Access Control

### Query Filtering

All metrics queries are filtered by the user's accessible teams:

```typescript
// Get metrics only for accessible teams
const accessibleTeams = await getUserTeams(ctx.user.id, ctx.user.role);
const accessibleTeamIds = accessibleTeams.map(t => t.id);

// If user requests specific teams, verify access
if (input.teamIds) {
  const hasAccessToAll = input.teamIds.every(id => 
    accessibleTeamIds.includes(id)
  );
  if (!hasAccessToAll) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}

// Query only accessible data
return await getAggregatedMetrics(teamIds, startTime, endTime);
```

### Database-Level Security

- **users_teams table**: Tracks user-team relationships and per-team roles
- **Audit log**: Records all data access for compliance
- **Foreign keys**: Enforce referential integrity
- **Indexes**: Optimize query performance and prevent full table scans

## Input Validation & Sanitization

### Type Safety

The application uses TypeScript and Zod for runtime validation:

```typescript
metrics: router({
  getTeamMetrics: protectedProcedure
    .input(z.object({
      teamId: z.number().positive(),
      startTime: z.number().positive(),
      endTime: z.number().positive(),
    }))
    .query(async ({ input }) => {
      // Zod validates input types and ranges
      // Invalid input rejected before query execution
    }),
})
```

### SQL Injection Prevention

Drizzle ORM uses parameterized queries, preventing SQL injection:

```typescript
// Parameterized query - SQL injection impossible
const result = await db
  .select()
  .from(metrics)
  .where(and(
    eq(metrics.teamId, teamId),        // Parameterized
    gte(metrics.timestamp, startTime), // Parameterized
    lte(metrics.timestamp, endTime)    // Parameterized
  ));
```

### XSS Prevention

React automatically escapes all dynamic content:

```typescript
// React escapes the value
<span className="kpi-value">{value}</span>

// Even if value contains HTML, it's rendered as text
// <script>alert('xss')</script> renders as literal text, not executed
```

## API Security

### CORS Configuration

CORS headers are configured to allow requests only from trusted origins:

```typescript
// Configure in Express middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST'],
}));
```

### Rate Limiting

Rate limiting prevents brute-force attacks and DoS:

```typescript
// Configure rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP',
});

app.use('/api/trpc', limiter);
```

### HTTPS Enforcement

All production traffic is encrypted with HTTPS:

- Vercel automatically provisions SSL certificates
- HTTP requests are redirected to HTTPS
- HSTS header enforces HTTPS for future requests

## Session Management

### Secure Cookies

Session tokens are stored in secure, HTTP-only cookies:

```typescript
const cookieOptions = {
  secure: true,           // HTTPS only
  httpOnly: true,         // Not accessible from JavaScript
  sameSite: 'none',       // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

res.cookie(COOKIE_NAME, token, cookieOptions);
```

### Session Expiration

Sessions expire after 7 days of inactivity. Users must re-authenticate:

```typescript
// Token expiration checked on every request
if (token.exp < Date.now() / 1000) {
  throw new TRPCError({ code: "UNAUTHORIZED" });
}
```

### Logout

Logout clears the session cookie:

```typescript
auth: router({
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(COOKIE_NAME, {
      secure: true,
      httpOnly: true,
      sameSite: 'none',
      path: '/',
    });
    return { success: true };
  }),
})
```

## Audit Logging

### Access Logging

All data access is logged to the audit_log table:

```typescript
// Log metrics access
await db.insert(auditLog).values({
  userId: ctx.user.id,
  action: 'VIEW_METRICS',
  resource: 'metrics',
  resourceId: teamId,
  details: JSON.stringify({ startTime, endTime }),
});
```

### Audit Log Retention

- Audit logs are retained for 1 year (configurable)
- Logs are immutable (append-only)
- Logs include timestamp, user ID, action, resource, and details

### Compliance

Audit logs support compliance requirements:

- **GDPR**: Users can request data access logs
- **SOC 2**: Demonstrates access control and monitoring
- **ISO 27001**: Evidence of security controls

## Secrets Management

### Environment Variables

All secrets are stored as environment variables in Vercel:

- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: Session signing secret
- `VITE_APP_ID`: Manus OAuth application ID
- `OAUTH_SERVER_URL`: Manus OAuth server URL

### Secret Rotation

Secrets should be rotated regularly:

1. Generate new secret value
2. Update in Vercel dashboard
3. Redeploy application
4. Verify new secret works
5. Archive old secret

### No Secrets in Code

- No hardcoded credentials in source code
- No secrets in `.env` files (use `.env.local` for local development)
- No secrets in git history
- `.gitignore` excludes all `.env*` files

## Dependency Security

### Vulnerability Scanning

Check for vulnerabilities in dependencies:

```bash
pnpm audit
```

### Dependency Updates

Keep dependencies up-to-date:

```bash
pnpm update
pnpm audit fix
```

### Lock File

The `pnpm-lock.yaml` file ensures reproducible builds and prevents dependency injection attacks.

## Deployment Security

### Build Process

The build process removes development dependencies and optimizes the bundle:

```bash
pnpm build
```

### Environment Separation

- Development: Uses local environment variables
- Production: Uses Vercel environment variables
- No development secrets in production

### Vercel Security

Vercel provides:

- Automatic SSL/TLS certificates
- DDoS protection
- Web Application Firewall (WAF)
- Automatic security updates

## Incident Response

### Reporting Security Issues

If you discover a security vulnerability, please report it to the security team:

1. **Do not** open a public GitHub issue
2. Email security details to: security@example.com
3. Include steps to reproduce and potential impact
4. Allow 48 hours for initial response

### Incident Response Plan

1. **Identify**: Detect the security issue
2. **Contain**: Limit the scope of the incident
3. **Investigate**: Determine root cause
4. **Remediate**: Fix the vulnerability
5. **Notify**: Inform affected users (if applicable)
6. **Review**: Post-incident analysis and improvements

## Security Best Practices

### For Developers

- Always validate and sanitize user input
- Use parameterized queries (Drizzle ORM)
- Never log sensitive data
- Keep dependencies updated
- Use environment variables for secrets
- Follow principle of least privilege
- Review code for security issues

### For Operators

- Monitor audit logs for suspicious activity
- Rotate secrets regularly
- Keep database backups
- Monitor system resources
- Review access logs
- Test disaster recovery procedures
- Keep infrastructure updated

### For Users

- Use strong, unique passwords (for Manus OAuth)
- Enable two-factor authentication (if available)
- Do not share session cookies
- Log out when finished
- Report suspicious activity

## Compliance

The application is designed to support compliance with:

- **GDPR**: Data protection and user privacy
- **CCPA**: User data rights
- **SOC 2**: Security, availability, and confidentiality
- **ISO 27001**: Information security management
- **HIPAA**: If handling healthcare data (requires additional controls)

## Security Checklist

Before deploying to production, verify:

- [ ] All environment variables configured
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Audit logging enabled
- [ ] Database backups configured
- [ ] Security headers configured
- [ ] Dependencies audited
- [ ] Code reviewed for security issues
- [ ] Secrets not in git history
- [ ] RBAC tested with different roles
- [ ] Unauthorized access denied
- [ ] Error messages don't leak information
- [ ] Logging configured (no sensitive data)

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [React Security](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)
- [Drizzle ORM Security](https://orm.drizzle.team/docs/sql-injection-prevention)
- [Vercel Security](https://vercel.com/security)
