import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extended with dashboard-specific roles: Admin, TeamLeader, Member
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["Admin", "TeamLeader", "Member", "user", "admin"]).default("Member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Teams table for multi-tenant organization
 */
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  leaderId: int("leaderId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

/**
 * User-Team relationships for multi-tenant access control
 */
export const usersTeams = mysqlTable("users_teams", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  teamId: int("teamId").notNull(),
  role: mysqlEnum("role", ["Admin", "TeamLeader", "Member"]).default("Member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserTeam = typeof usersTeams.$inferSelect;
export type InsertUserTeam = typeof usersTeams.$inferInsert;

/**
 * Metrics table for storing hourly aggregated performance data
 */
export const metrics = mysqlTable("metrics", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  tasksCompleted: int("tasksCompleted").default(0).notNull(),
  activeMembers: int("activeMembers").default(0).notNull(),
  responseTime: decimal("responseTime", { precision: 10, scale: 2 }).default("0").notNull(), // in seconds
  throughput: decimal("throughput", { precision: 10, scale: 2 }).default("0").notNull(), // tasks per hour
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Metric = typeof metrics.$inferSelect;
export type InsertMetric = typeof metrics.$inferInsert;

/**
 * Audit log for tracking user actions and data changes
 */
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  resource: varchar("resource", { length: 255 }).notNull(),
  resourceId: int("resourceId"),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

/**
 * Relations for Drizzle ORM
 */
export const usersRelations = relations(users, ({ many }) => ({
  teams: many(usersTeams),
}));

export const teamsRelations = relations(teams, ({ many, one }) => ({
  members: many(usersTeams),
  metrics: many(metrics),
  leader: one(users, {
    fields: [teams.leaderId],
    references: [users.id],
  }),
}));

export const usersTeamsRelations = relations(usersTeams, ({ one }) => ({
  user: one(users, {
    fields: [usersTeams.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [usersTeams.teamId],
    references: [teams.id],
  }),
}));

export const metricsRelations = relations(metrics, ({ one }) => ({
  team: one(teams, {
    fields: [metrics.teamId],
    references: [teams.id],
  }),
}));