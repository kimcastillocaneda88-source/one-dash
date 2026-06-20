import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

/**
 * Hourly metrics aggregation function
 * Triggered by Cloud Scheduler every hour
 * Aggregates raw metrics and stores rolled-up stats per team
 */
export const aggregateMetricsHourly = functions
  .region("us-central1")
  .pubsub.schedule("0 * * * *") // Every hour at :00
  .timeZone("UTC")
  .onRun(async (context) => {
    try {
      console.log("Starting hourly metrics aggregation...");

      // Get all teams
      const teamsSnapshot = await db.collection("teams").get();

      if (teamsSnapshot.empty) {
        console.log("No teams found");
        return { success: true, message: "No teams to aggregate" };
      }

      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      let aggregatedCount = 0;

      // Aggregate metrics for each team
      for (const teamDoc of teamsSnapshot.docs) {
        const teamId = teamDoc.id;

        try {
          // Get raw metrics for this team in the last hour
          const metricsSnapshot = await db
            .collection("teams")
            .doc(teamId)
            .collection("metrics")
            .where("timestamp", ">=", oneHourAgo)
            .where("timestamp", "<=", now)
            .get();

          if (metricsSnapshot.empty) {
            console.log(`No metrics for team ${teamId}`);
            continue;
          }

          // Calculate aggregated values
          const metrics = metricsSnapshot.docs.map((doc) => doc.data());

          const avgTasksCompleted =
            metrics.reduce((sum, m) => sum + (m.tasksCompleted || 0), 0) /
            metrics.length;
          const avgActiveMembers =
            metrics.reduce((sum, m) => sum + (m.activeMembers || 0), 0) /
            metrics.length;
          const avgResponseTime =
            metrics.reduce((sum, m) => sum + (m.responseTime || 0), 0) /
            metrics.length;
          const avgThroughput =
            metrics.reduce((sum, m) => sum + (m.throughput || 0), 0) /
            metrics.length;

          // Store aggregated metric at the hour boundary
          const hourBoundary =
            Math.floor(now / (60 * 60 * 1000)) * 60 * 60 * 1000;

          await db
            .collection("teams")
            .doc(teamId)
            .collection("metrics")
            .add({
              timestamp: hourBoundary,
              tasksCompleted: Math.round(avgTasksCompleted),
              activeMembers: Math.round(avgActiveMembers),
              responseTime: parseFloat(avgResponseTime.toFixed(2)),
              throughput: parseFloat(avgThroughput.toFixed(2)),
              isAggregated: true,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              aggregationWindow: {
                start: oneHourAgo,
                end: now,
              },
            });

          aggregatedCount++;
          console.log(`Aggregated metrics for team ${teamId}`);
        } catch (teamError) {
          console.error(`Failed to aggregate metrics for team ${teamId}:`, teamError);
          // Continue with other teams
        }
      }

      console.log(`Successfully aggregated ${aggregatedCount} teams`);
      return {
        success: true,
        aggregatedTeams: aggregatedCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Metrics aggregation failed:", error);
      throw error;
    }
  });

/**
 * Real-time metrics update function
 * Triggered when new metrics are written to a team's metrics subcollection
 * Maintains a real-time metrics document for live dashboard updates
 */
export const updateRealtimeMetrics = functions
  .region("us-central1")
  .firestore.document("teams/{teamId}/metrics/{metricId}")
  .onCreate(async (snap, context) => {
    try {
      const { teamId } = context.params;
      const metricData = snap.data();

      // Skip aggregated metrics (only process raw metrics)
      if (metricData.isAggregated) {
        return;
      }

      // Update the real-time metrics document
      await db
        .collection("teams")
        .doc(teamId)
        .collection("realtimeMetrics")
        .doc("current")
        .set(
          {
            ...metricData,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

      console.log(`Updated real-time metrics for team ${teamId}`);
    } catch (error) {
      console.error("Failed to update real-time metrics:", error);
      throw error;
    }
  });

/**
 * User role initialization function
 * Triggered when a new user is created in Firebase Auth
 * Creates a user document with default Member role
 */
export const initializeUserOnCreate = functions
  .region("us-central1")
  .auth.user()
  .onCreate(async (user) => {
    try {
      const { uid, email, displayName } = user;

      // Create user document in Firestore
      await db.collection("users").doc(uid).set({
        uid,
        email,
        displayName: displayName || email?.split("@")[0] || "User",
        role: "Member", // Default role
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Initialized user ${uid}`);
    } catch (error) {
      console.error("Failed to initialize user:", error);
      throw error;
    }
  });

/**
 * User cleanup function
 * Triggered when a user is deleted from Firebase Auth
 * Removes user document and team associations
 */
export const cleanupUserOnDelete = functions
  .region("us-central1")
  .auth.user()
  .onDelete(async (user) => {
    try {
      const { uid } = user;

      // Delete user document
      await db.collection("users").doc(uid).delete();

      // Remove user from all teams
      const teamsSnapshot = await db.collection("teams").get();

      for (const teamDoc of teamsSnapshot.docs) {
        await teamDoc.ref
          .collection("members")
          .doc(uid)
          .delete()
          .catch(() => {
            // Member might not exist in this team
          });
      }

      console.log(`Cleaned up user ${uid}`);
    } catch (error) {
      console.error("Failed to cleanup user:", error);
      throw error;
    }
  });

/**
 * Audit logging function
 * Triggered on any write to teams or metrics
 * Creates audit log entries for compliance and debugging
 */
export const logAuditEvent = functions
  .region("us-central1")
  .firestore.document("teams/{teamId}/metrics/{metricId}")
  .onCreate(async (snap, context) => {
    try {
      const { teamId, metricId } = context.params;
      const metricData = snap.data();

      // Log the event
      await db.collection("auditLogs").add({
        eventType: "metric_created",
        teamId,
        metricId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        data: metricData,
      });

      console.log(`Logged audit event for metric ${metricId}`);
    } catch (error) {
      console.error("Failed to log audit event:", error);
      // Don't throw - audit logging shouldn't block main operations
    }
  });
