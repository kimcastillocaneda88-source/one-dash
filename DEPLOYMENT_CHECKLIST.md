# Deployment Checklist

## Pre-Deployment

### Code Quality
- [ ] All TypeScript errors resolved: `pnpm check`
- [ ] All tests passing: `pnpm test`
- [ ] Linting clean: `pnpm format`
- [ ] No console errors in development build
- [ ] No security vulnerabilities: `pnpm audit`

### Database
- [ ] Database migrations tested locally
- [ ] Seed data verified in local environment
- [ ] Backup of production database created (if applicable)
- [ ] Migration rollback procedure documented

### Environment Variables
- [ ] All required environment variables listed in `.env.example`
- [ ] No secrets committed to repository
- [ ] Environment variables configured in Vercel dashboard:
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET`
  - [ ] `VITE_APP_ID`
  - [ ] `OAUTH_SERVER_URL`
  - [ ] `VITE_OAUTH_PORTAL_URL`
  - [ ] `OWNER_OPEN_ID`
  - [ ] `OWNER_NAME`

### Security
- [ ] RBAC procedures tested with different roles
- [ ] No unauthorized data access possible
- [ ] CORS headers configured correctly
- [ ] SQL injection prevention verified (using Drizzle ORM)
- [ ] XSS protection enabled (React escaping)
- [ ] CSRF tokens configured (if applicable)

### Performance
- [ ] Bundle size analyzed: `pnpm build`
- [ ] Database queries optimized
- [ ] Metrics queries use proper indexes
- [ ] Client-side caching configured
- [ ] Image and asset optimization verified

## Deployment Steps

### GitHub Repository
- [ ] Repository created and initialized
- [ ] All code committed to `main` branch
- [ ] `.gitignore` configured properly
- [ ] No sensitive files in repository
- [ ] README and documentation committed

### Vercel Configuration
1. [ ] Connect GitHub repository to Vercel
2. [ ] Configure build settings:
   - Build command: `pnpm build`
   - Output directory: `dist`
   - Install command: `pnpm install`
3. [ ] Set environment variables in Vercel dashboard
4. [ ] Configure custom domain (if applicable)
5. [ ] Enable automatic deployments on push to main

### Database Setup (Production)
- [ ] MySQL database provisioned
- [ ] Database credentials configured in Vercel
- [ ] Migrations applied to production database
- [ ] Seed data loaded (if needed)
- [ ] Database backups configured

### Initial Deployment
- [ ] Push code to main branch: `git push origin main`
- [ ] Monitor Vercel build logs
- [ ] Verify deployment successful
- [ ] Test application at production URL

## Post-Deployment

### Functional Testing
- [ ] Login flow works (Manus OAuth)
- [ ] Dashboard loads without errors
- [ ] KPI cards display correct data
- [ ] Charts render properly
- [ ] Time-range selector works
- [ ] Team filter works
- [ ] CSV export downloads correctly
- [ ] Navigation pages load (Overview, My Team, Reports, Settings)
- [ ] Role-based access control enforced:
  - [ ] Admin sees all teams
  - [ ] TeamLeader sees only their team
  - [ ] Member sees only their team
- [ ] Real-time updates work (30-second refresh)
- [ ] Manual refresh button works

### Performance Monitoring
- [ ] Page load time acceptable (< 3 seconds)
- [ ] No console errors in production
- [ ] Database query performance acceptable
- [ ] API response times within SLA
- [ ] Memory usage stable

### Security Verification
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] No sensitive data in logs
- [ ] Rate limiting configured (if applicable)
- [ ] Audit logs working

### Monitoring & Alerts
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Performance monitoring enabled
- [ ] Database monitoring configured
- [ ] Uptime monitoring configured
- [ ] Alert notifications configured

## Rollback Procedure

### If Deployment Fails
1. [ ] Identify the issue from Vercel logs
2. [ ] Revert to previous commit: `git revert <commit-hash>`
3. [ ] Push revert commit: `git push origin main`
4. [ ] Vercel automatically redeploys previous version
5. [ ] Verify rollback successful

### If Database Migration Fails
1. [ ] Stop application
2. [ ] Restore database from backup
3. [ ] Fix migration in `drizzle/schema.ts`
4. [ ] Generate new migration: `pnpm drizzle-kit generate`
5. [ ] Test migration locally
6. [ ] Redeploy application

### If Data Corruption Occurs
1. [ ] Restore from database backup
2. [ ] Identify root cause
3. [ ] Fix application logic
4. [ ] Retest thoroughly
5. [ ] Redeploy

## Monitoring Checklist

### Daily
- [ ] Check application error logs
- [ ] Verify database performance
- [ ] Monitor user activity

### Weekly
- [ ] Review performance metrics
- [ ] Check for security vulnerabilities
- [ ] Verify backups completed

### Monthly
- [ ] Audit access logs
- [ ] Review and optimize slow queries
- [ ] Update dependencies (if needed)
- [ ] Security assessment

## Sign-Off

- [ ] QA Testing Complete: _________________ Date: _______
- [ ] Security Review Complete: _________________ Date: _______
- [ ] Performance Review Complete: _________________ Date: _______
- [ ] Production Deployment Approved: _________________ Date: _______
