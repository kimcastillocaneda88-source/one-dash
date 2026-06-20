import { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { getDb } from "../db";
import { eq, and, gte, lte } from "drizzle-orm";
import { metrics, teams } from "../../drizzle/schema";

/**
 * Hourly metrics aggregation handler
 * Triggered via Heartbeat cron at the top of each hour
 * Computes and stores rolled-up metrics for each team
 */
export async function aggregateMetricsHandler(req: Request, res: Response) {
  try {
    // Authenticate as cron job
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        error: "Database not available",
        taskUid: user.taskUid,
        timestamp: new Date().toISOString(),
      });
    }

    // Get all teams
    const allTeams = await db.select({ id: teams.id }).from(teams);

    if (allTeams.length === 0) {
      return res.json({
        ok: true,
        message: "No teams to aggregate",
        timestamp: new Date().toISOString(),
      });
    }

    // Calculate aggregation window: last hour
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    let aggregatedCount = 0;

    // Aggregate metrics for each team
    for (const team of allTeams) {
      try {
        // Get raw metrics for this team in the last hour
        const teamMetrics = await db
          .select()
          .from(metrics)
          .where(
            and(
              eq(metrics.teamId, team.id),
              gte(metrics.timestamp, oneHourAgo),
              lte(metrics.timestamp, now)
            )
          );

        if (teamMetrics.length === 0) {
          continue; // No metrics to aggregate for this team
        }

        // Calculate aggregated values
        const avgTasksCompleted =
          teamMetrics.reduce((sum, m) => sum + m.tasksCompleted, 0) /
          teamMetrics.length;
        const avgActiveMembers =
          teamMetrics.reduce((sum, m) => sum + m.activeMembers, 0) /
          teamMetrics.length;
        const avgResponseTime =
          teamMetrics.reduce((sum, m) => sum + parseFloat(m.responseTime), 0) /
          teamMetrics.length;
        const avgThroughput =
          teamMetrics.reduce((sum, m) => sum + parseFloat(m.throughput), 0) /
          teamMetrics.length;

        // Store aggregated metric at the hour boundary
        const hourBoundary = Math.floor(now / (60 * 60 * 1000)) * 60 * 60 * 1000;

        await db.insert(metrics).values({
          teamId: team.id,
          timestamp: hourBoundary,
          tasksCompleted: Math.round(avgTasksCompleted),
          activeMembers: Math.round(avgActiveMembers),
          responseTime: avgResponseTime.toFixed(2),
          throughput: avgThroughput.toFixed(2),
        });

        aggregatedCount++;
      } catch (teamError) {
        console.error(
          `Failed to aggregate metrics for team ${team.id}:`,
          teamError
        );
        // Continue with other teams instead of failing the entire job
      }
    }

    return res.json({
      ok: true,
      aggregatedTeams: aggregatedCount,
      window: {
        start: new Date(oneHourAgo).toISOString(),
        end: new Date(now).toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Metrics aggregation failed:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        url: req.url,
        taskUid: (await sdk.authenticateRequest(req).catch(() => null))
          ?.taskUid,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
