# Environment Variables

This document describes all environment variables required for the Team Leader Dashboard.

## Required Variables

### Database Configuration

**`DATABASE_URL`**
- **Type**: String (connection string)
- **Description**: MySQL database connection URL
- **Example**: `mysql://user:password@localhost:3306/team_leader_dashboard`
- **Where to set**: Vercel Environment Variables (Settings → Environment Variables)

### Authentication

**`JWT_SECRET`**
- **Type**: String (cryptographic key)
- **Description**: Secret key for signing JWT session tokens
- **Example**: `your-super-secret-jwt-key-change-in-production`
- **Where to set**: Vercel Environment Variables
- **Security**: Must be a strong, random string. Change for each environment.

### Manus OAuth

**`VITE_APP_ID`**
- **Type**: String
- **Description**: Manus OAuth application ID
- **Example**: `app-123456789`
- **Where to set**: Vercel Environment Variables
- **How to get**: Create an OAuth app in Manus dashboard

**`OAUTH_SERVER_URL`**
- **Type**: String (URL)
- **Description**: Manus OAuth server base URL
- **Example**: `https://api.manus.im`
- **Where to set**: Vercel Environment Variables (usually fixed)

**`VITE_OAUTH_PORTAL_URL`**
- **Type**: String (URL)
- **Description**: Manus OAuth portal URL for login redirects
- **Example**: `https://oauth.manus.im`
- **Where to set**: Vercel Environment Variables (usually fixed)

### Owner Information

**`OWNER_OPEN_ID`**
- **Type**: String
- **Description**: Manus OpenID of the application owner (for admin role assignment)
- **Example**: `owner-123456`
- **Where to set**: Vercel Environment Variables
- **How to get**: From your Manus account settings

**`OWNER_NAME`**
- **Type**: String
- **Description**: Display name of the application owner
- **Example**: `John Doe`
- **Where to set**: Vercel Environment Variables

## Optional Variables

**`NODE_ENV`**
- **Type**: String (`development` | `production`)
- **Description**: Application environment
- **Default**: `production`
- **Where to set**: Automatically set by Vercel

**`PORT`**
- **Type**: Number
- **Description**: Server port (for local development)
- **Default**: `3000`
- **Where to set**: Local `.env.local` file only

**`LOG_LEVEL`**
- **Type**: String (`debug` | `info` | `warn` | `error`)
- **Description**: Logging verbosity level
- **Default**: `info`
- **Where to set**: Vercel Environment Variables (optional)

## Setting Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New** for each variable
4. Enter the variable name and value
5. Select which environments it applies to (Development, Preview, Production)
6. Click **Save**

## Local Development Setup

Create a `.env.local` file in the project root:

```env
DATABASE_URL=mysql://root:password@localhost:3306/dashboard_dev
JWT_SECRET=dev-secret-key-not-for-production
VITE_APP_ID=dev-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
OWNER_OPEN_ID=dev-owner-id
OWNER_NAME=Dev Owner
NODE_ENV=development
PORT=3000
```

**Important**: Never commit `.env.local` to git. It's in `.gitignore` by default.

## Environment-Specific Configuration

### Development

- Use local MySQL database
- Use development OAuth app ID
- Use shorter session timeouts for testing
- Enable verbose logging

### Production (Vercel)

- Use production MySQL database
- Use production OAuth app ID
- Use strong JWT_SECRET
- Disable verbose logging
- Enable HTTPS (automatic)

## Vercel Environment Variables UI

In Vercel dashboard, you can set different values for:

- **Development**: Used when running `pnpm dev` locally
- **Preview**: Used for preview deployments (PR branches)
- **Production**: Used for production deployments (main branch)

Example configuration:

| Variable | Development | Preview | Production |
|----------|-------------|---------|------------|
| `DATABASE_URL` | Local dev DB | Staging DB | Production DB |
| `JWT_SECRET` | dev-secret | staging-secret | prod-secret |
| `VITE_APP_ID` | dev-app-id | staging-app-id | prod-app-id |

## Troubleshooting

### "DATABASE_URL not found" error

- Verify the variable is set in Vercel dashboard
- Check that the connection string is correct
- Ensure database is accessible from Vercel servers

### "Invalid OAuth credentials" error

- Verify `VITE_APP_ID` is correct
- Check `OAUTH_SERVER_URL` and `VITE_OAUTH_PORTAL_URL` are correct
- Ensure OAuth app is active in Manus dashboard

### "JWT token invalid" error

- Verify `JWT_SECRET` is set and consistent across deployments
- Check that session cookie is being sent with requests
- Ensure HTTPS is enabled (required for secure cookies)

## Security Best Practices

1. **Never commit secrets** to git (use `.gitignore`)
2. **Use strong secrets** for production (minimum 32 characters)
3. **Rotate secrets regularly** (especially JWT_SECRET)
4. **Use different secrets** for each environment
5. **Restrict access** to Vercel dashboard (use team roles)
6. **Audit secret changes** in Vercel activity log

## Secret Rotation

To rotate a secret (e.g., JWT_SECRET):

1. Generate a new secret value
2. Update in Vercel dashboard
3. Trigger a new deployment (push to main)
4. Verify new deployment works
5. Archive old secret (for reference)
6. Document rotation in audit log

## References

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Node.js Environment Variables](https://nodejs.org/en/docs/guides/nodejs-env-vars/)
- [Manus OAuth Documentation](https://docs.manus.im/oauth)
