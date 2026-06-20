import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, teams, usersTeams, metrics, Metric, Team, UserTeam } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all teams for a user based on their role
 * Admins see all teams; TeamLeaders/Members see only their assigned teams
 */
export async function getUserTeams(userId: number, userRole: string): Promise<Team[]> {
  const db = await getDb();
  if (!db) return [];

  if (userRole === "Admin") {
    return await db.select().from(teams);
  }

  const userTeamRecords = await db
    .select({ teamId: usersTeams.teamId })
    .from(usersTeams)
    .where(eq(usersTeams.userId, userId));

  if (userTeamRecords.length === 0) return [];

  const teamIds = userTeamRecords.map((ut) => ut.teamId);
  return await db.select().from(teams).where(inArray(teams.id, teamIds));
}

/**
 * Check if a user can access a specific team
 */
export async function canUserAccessTeam(
  userId: number,
  teamId: number,
  userRole: string
): Promise<boolean> {
  if (userRole === "Admin") return true;

  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(usersTeams)
    .where(and(eq(usersTeams.userId, userId), eq(usersTeams.teamId, teamId)))
    .limit(1);

  return result.length > 0;
}

/**
 * Get metrics for a team within a time range
 */
export async function getTeamMetrics(
  teamId: number,
  startTime: number,
  endTime: number
): Promise<Metric[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(metrics)
    .where(and(eq(metrics.teamId, teamId), gte(metrics.timestamp, startTime), lte(metrics.timestamp, endTime)))
    .orderBy(metrics.timestamp);
}

/**
 * Get aggregated metrics for multiple teams
 */
export async function getAggregatedMetrics(
  teamIds: number[],
  startTime: number,
  endTime: number
): Promise<Metric[]> {
  const db = await getDb();
  if (!db) return [];

  if (teamIds.length === 0) return [];

  return await db
    .select()
    .from(metrics)
    .where(
      and(
        inArray(metrics.teamId, teamIds),
        gte(metrics.timestamp, startTime),
        lte(metrics.timestamp, endTime)
      )
    )
    .orderBy(metrics.timestamp);
}

/**
 * Insert or update metrics for a team (used by aggregation job)
 */
export async function upsertMetric(
  teamId: number,
  timestamp: number,
  data: {
    tasksCompleted: number;
    activeMembers: number;
    responseTime: number;
    throughput: number;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .insert(metrics)
    .values({
      teamId,
      timestamp,
      tasksCompleted: data.tasksCompleted,
      activeMembers: data.activeMembers,
      responseTime: String(data.responseTime),
      throughput: String(data.throughput),
    })
    .onDuplicateKeyUpdate({
      set: {
        tasksCompleted: data.tasksCompleted,
        activeMembers: data.activeMembers,
        responseTime: String(data.responseTime),
        throughput: String(data.throughput),
        updatedAt: new Date(),
      },
    });
}

/**
 * Get user's team membership and role
 */
export async function getUserTeamRole(userId: number, teamId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({ role: usersTeams.role })
    .from(usersTeams)
    .where(and(eq(usersTeams.userId, userId), eq(usersTeams.teamId, teamId)))
    .limit(1);

  return result.length > 0 ? result[0].role : null;
}
