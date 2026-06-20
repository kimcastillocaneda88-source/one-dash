# Heartbeat Scheduled Jobs Setup

This document describes how to set up the hourly metrics aggregation job using the Manus Heartbeat scheduler.

## Overview

The Team Leader Dashboard uses Heartbeat (HTTP cron) to run hourly metrics aggregation. This job:

- Runs every hour at the top of the hour (UTC)
- Aggregates raw metrics for each team
- Computes averages for tasks completed, active members, response time, and throughput
- Stores aggregated metrics for efficient querying and reporting

## Handler Implementation

The aggregation handler is located at `server/scheduled/aggregateMetrics.ts` and implements:

- Cron-only authentication via `sdk.authenticateRequest()`
- Per-team metric aggregation over the previous hour
- Error handling with detailed logging
- Idempotent aggregation (safe to retry)

## Setup Instructions

### Step 1: Deploy the Application

Before creating the cron job, the application must be deployed to production:

```bash
# Save a checkpoint
# Click "Publish" in the Management UI
# Wait for deployment to complete
```

### Step 2: Create the Heartbeat Job

From the sandbox terminal, create the hourly aggregation cron:

```bash
manus-heartbeat create \
  --name metrics-aggregation-hourly \
  --cron "0 0 * * * *" \
  --path /api/scheduled/aggregateMetrics \
  --description "Hourly metrics aggregation for all teams"
```

This creates a cron that:

- Runs at the top of every hour (00:00 UTC, 01:00 UTC, etc.)
- POSTs to `/api/scheduled/aggregateMetrics` on the deployed site
- Aggregates metrics from the previous hour

**Save the returned `task_uid`** for future reference.

### Step 3: Verify the Handler is Mounted

The handler must be registered in `server/_core/index.ts`:

```typescript
import { aggregateMetricsHandler } from "../scheduled/aggregateMetrics";

// Mount the handler (before Vite/static fallthrough)
app.post("/api/scheduled/aggregateMetrics", aggregateMetricsHandler);
```

This is already configured in the template.

### Step 4: Monitor Execution

View recent executions of the aggregation job:

```bash
manus-heartbeat logs --task-uid <task_uid_from_step_2> --with-body
```

View all scheduled jobs:

```bash
manus-heartbeat list
```

## Cron Expression Format

The cron uses 6 fields (with seconds): `sec min hour dom mon dow`

- `0 0 * * * *` = Every hour at :00 seconds, :00 minutes
- `0 30 * * * *` = Every hour at :30 minutes
- `0 0 9 * * *` = Daily at 09:00 UTC
- `0 0 0 * * 0` = Weekly on Sunday at 00:00 UTC

## Aggregation Logic

The aggregation job:

1. Gets all teams in the system
2. For each team, queries metrics from the last hour
3. Computes averages for:
   - Tasks completed (rounded to nearest integer)
   - Active members (rounded to nearest integer)
   - Response time (2 decimal places)
   - Throughput (2 decimal places)
4. Stores the aggregated metric at the hour boundary timestamp
5. Returns success/failure status

## Error Handling

The handler is **idempotent** and safe to retry:

- If a team has no metrics in the hour, it's skipped
- If one team fails to aggregate, others continue
- Errors are logged with full context for debugging
- The platform automatically retries on 5xx errors (up to 3 times)

## Monitoring & Debugging

### Check Recent Executions

```bash
manus-heartbeat logs --task-uid <task_uid> --status failed
```

### View Full Response Body

```bash
manus-heartbeat logs --task-uid <task_uid> --with-body --run-uid <run_uid>
```

### Pause the Job

```bash
manus-heartbeat update --task-uid <task_uid> --enable=false
```

### Resume the Job

```bash
manus-heartbeat update --task-uid <task_uid> --enable=true
```

### Delete the Job

```bash
manus-heartbeat delete --task-uid <task_uid>
```

## Troubleshooting

### "Cron not firing"

1. Verify the application is deployed: `curl https://your-domain.com/api/health`
2. Check that the handler is mounted in `server/_core/index.ts`
3. View logs: `manus-heartbeat logs --task-uid <task_uid>`

### "Aggregation errors in logs"

1. Check database connectivity: `DATABASE_URL` is set correctly
2. Verify metrics table exists and has data
3. Check for any recent schema changes

### "Duplicate aggregated metrics"

This is expected if the job runs multiple times in the same hour. The aggregation uses the hour boundary as the timestamp, so multiple runs produce the same result. This is idempotent and safe.

## Performance Considerations

- **Timeout**: 2 minutes per execution (plenty for aggregation)
- **Retry**: Automatic retry on 5xx errors (3 times, 3s → 1m backoff)
- **Frequency**: Hourly (60-second minimum interval)
- **Scalability**: Handles any number of teams efficiently

## Next Steps

After setting up the cron job:

1. Monitor the first few executions via `manus-heartbeat logs`
2. Verify aggregated metrics appear in the Reports page
3. Set up alerts for failed executions (optional)
4. Document the `task_uid` in your runbook

## References

- [Periodic Updates Reference](./references/periodic-updates.md)
- [Heartbeat SDK Documentation](./references/periodic-updates.md#5a-site-sdk--server_core_heartbeatts)
- [Manus Heartbeat CLI](./references/periodic-updates.md#5b-sandbox-cli--manus-heartbeat)
