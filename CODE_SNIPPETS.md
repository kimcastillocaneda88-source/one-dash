# Code Snippets Reference

This document provides key code snippets for understanding the architecture and implementing similar features.

## 1. Role-Based tRPC Procedure (server/routers.ts)

```typescript
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

// Role-based procedure wrapper
function roleBasedProcedure(allowedRoles: string[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx });
  });
}

// Metrics router with role-based access control
export const metricsRouter = router({
  // TeamLeader and Member can access team metrics
  getTeamMetrics: protectedProcedure
    .input(
      z.object({
        teamId: z.number().positive(),
        startTime: z.number().positive(),
        endTime: z.number().positive(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user can access this team
      const hasAccess = await canUserAccessTeam(
        ctx.user.id,
        input.teamId,
        ctx.user.role
      );

      if (!hasAccess) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return getTeamMetrics(
        input.teamId,
        input.startTime,
        input.endTime
      );
    }),

  // Admin-only: get all metrics
  getAllMetrics: roleBasedProcedure(["Admin"])
    .input(
      z.object({
        startTime: z.number().positive(),
        endTime: z.number().positive(),
      })
    )
    .query(async ({ input }) => {
      return getAggregatedMetrics([], input.startTime, input.endTime);
    }),
});
```

## 2. Database Access Control (server/db.ts)

```typescript
import { eq, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { metrics, teams, usersTeams } from "../drizzle/schema";

// Check if user can access a team
export async function canUserAccessTeam(
  userId: number,
  teamId: number,
  userRole: string
): Promise<boolean> {
  // Admins can access any team
  if (userRole === "Admin") {
    return true;
  }

  // Non-admins must be team members
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(usersTeams)
    .where(and(eq(usersTeams.userId, userId), eq(usersTeams.teamId, teamId)))
    .limit(1);

  return result.length > 0;
}

// Get metrics for a team within time range
export async function getTeamMetrics(
  teamId: number,
  startTime: number,
  endTime: number
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(metrics)
    .where(
      and(
        eq(metrics.teamId, teamId),
        gte(metrics.timestamp, startTime),
        lte(metrics.timestamp, endTime)
      )
    )
    .orderBy(metrics.timestamp);
}

// Get teams accessible to user
export async function getUserTeams(
  userId: number,
  userRole: string
) {
  const db = await getDb();
  if (!db) return [];

  if (userRole === "Admin") {
    // Admins see all teams
    return db.select().from(teams);
  }

  // Non-admins see only their teams
  return db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .innerJoin(usersTeams, eq(teams.id, usersTeams.teamId))
    .where(eq(usersTeams.userId, userId));
}
```

## 3. RBAC Context Provider (client/src/contexts/RBACContext.tsx)

```typescript
import React, { createContext, useContext } from "react";

type UserRole = "Admin" | "TeamLeader" | "Member";

interface RBACContextType {
  userRole: UserRole | null;
  canViewAllTeams: boolean;
  canViewTeamMetrics: (teamId: number) => boolean;
  canManageTeam: (teamId: number) => boolean;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export function RBACProvider({
  userRole,
  children,
}: {
  userRole: UserRole | null;
  children: React.ReactNode;
}) {
  const canViewAllTeams = userRole === "Admin";
  
  const canViewTeamMetrics = (teamId: number) => {
    // In practice, check against user's assigned teams
    return true;
  };

  const canManageTeam = (teamId: number) => {
    return userRole === "Admin" || userRole === "TeamLeader";
  };

  return (
    <RBACContext.Provider
      value={{
        userRole,
        canViewAllTeams,
        canViewTeamMetrics,
        canManageTeam,
      }}
    >
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error("useRBAC must be used within RBACProvider");
  }
  return context;
}
```

## 4. KPI Card Component (client/src/components/KPICard.tsx)

```typescript
import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number; // Percentage change
  unit?: string;
  icon?: React.ReactNode;
}

export function KPICard({
  title,
  value,
  trend,
  unit = "",
  icon,
}: KPICardProps) {
  const isTrendPositive = trend && trend >= 0;

  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="kpi-value">
            {value}
            {unit && <span className="text-sm ml-2">{unit}</span>}
          </p>
        </div>

        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 ${
              isTrendPositive ? "kpi-trend positive" : "kpi-trend negative"
            }`}
            aria-label={`Trend: ${isTrendPositive ? "up" : "down"} ${Math.abs(trend)}%`}
          >
            {isTrendPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-semibold">
              {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
```

## 5. Metrics Chart Component (client/src/components/MetricsCharts.tsx)

```typescript
import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MetricData {
  timestamp: number;
  tasksCompleted: number;
  activeMembers: number;
  responseTime: number;
  throughput: number;
}

export function TrendChart({ data }: { data: MetricData[] }) {
  const chartData = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleDateString(),
    tasks: d.tasksCompleted,
    throughput: d.throughput,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="tasks"
          stroke="#404040"
          name="Tasks Completed"
        />
        <Line
          type="monotone"
          dataKey="throughput"
          stroke="#737373"
          name="Throughput"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TeamComparisonChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#404040" name="Tasks Completed" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MetricBreakdownChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  const COLORS = ["#404040", "#737373", "#8c8c8c", "#bfbfbf"];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value }) => `${name}: ${value}`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

## 6. CSV Export Utility (client/src/lib/csvExport.ts)

```typescript
export interface MetricRow {
  teamName: string;
  date: string;
  tasksCompleted: number;
  activeMembers: number;
  responseTime: number;
  throughput: number;
}

export function generateCSV(data: MetricRow[]): string {
  const headers = [
    "Team Name",
    "Date",
    "Tasks Completed",
    "Active Members",
    "Response Time (s)",
    "Throughput (ops/s)",
  ];

  const rows = data.map((row) => [
    row.teamName,
    row.date,
    row.tasksCompleted,
    row.activeMembers,
    row.responseTime,
    row.throughput,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
}

export function downloadCSV(
  csvContent: string,
  filename: string = "metrics.csv"
): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

## 7. Database Schema (drizzle/schema.ts)

```typescript
import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  bigint,
  index,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  role: mysqlEnum("role", ["Admin", "TeamLeader", "Member"])
    .default("Member")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  leaderId: int("leaderId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const usersTeams = mysqlTable(
  "users_teams",
  {
    userId: int("userId").notNull(),
    teamId: int("teamId").notNull(),
    role: mysqlEnum("role", ["TeamLeader", "Member"])
      .default("Member")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.teamId] }),
    userIdx: index("user_idx").on(table.userId),
    teamIdx: index("team_idx").on(table.teamId),
  })
);

export const metrics = mysqlTable(
  "metrics",
  {
    id: int("id").autoincrement().primaryKey(),
    teamId: int("teamId").notNull(),
    timestamp: bigint("timestamp", { mode: "number" }).notNull(),
    tasksCompleted: int("tasksCompleted").notNull(),
    activeMembers: int("activeMembers").notNull(),
    responseTime: decimal("responseTime", { precision: 10, scale: 2 }).notNull(),
    throughput: decimal("throughput", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    teamTimestampIdx: index("team_timestamp_idx").on(
      table.teamId,
      table.timestamp
    ),
  })
);

export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Metric = typeof metrics.$inferSelect;
```

## 8. Real-Time Update Hook (client/src/hooks/useMetricsPolling.ts)

```typescript
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export function useMetricsPolling(teamId: number, enabled = true) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { data, isLoading, refetch } = trpc.metrics.getTeamMetrics.useQuery(
    {
      teamId,
      startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
      endTime: Date.now(),
    },
    {
      enabled,
      refetchInterval: 30 * 1000, // Poll every 30 seconds
      onSuccess: () => {
        setLastUpdated(new Date());
      },
    }
  );

  const handleManualRefresh = async () => {
    await refetch();
  };

  return {
    data,
    isLoading,
    lastUpdated,
    refetch: handleManualRefresh,
  };
}
```

## 9. Vitest Unit Test Example (server/metrics.test.ts)

```typescript
import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { TRPCError } from "@trpc/server";

vi.mock("./db");

describe("Metrics RBAC", () => {
  it("should deny TeamLeader access to other team metrics", async () => {
    const user = {
      id: 1,
      role: "TeamLeader",
      // ... other fields
    };

    const ctx = { user } as TrpcContext;
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.metrics.getTeamMetrics({
        teamId: 999,
        startTime: Date.now() - 86400000,
        endTime: Date.now(),
      });
      expect.fail("Should throw FORBIDDEN");
    } catch (error) {
      expect((error as TRPCError).code).toBe("FORBIDDEN");
    }
  });
});
```

## 10. TypeScript Types (shared/types.ts)

```typescript
export interface Metric {
  id: number;
  teamId: number;
  timestamp: number;
  tasksCompleted: number;
  activeMembers: number;
  responseTime: number;
  throughput: number;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  leaderId: number;
}

export interface User {
  id: number;
  openId: string;
  name?: string;
  email?: string;
  role: "Admin" | "TeamLeader" | "Member";
}

export interface MetricsSummary {
  tasksCompleted: number;
  activeMembers: number;
  responseTime: number;
  throughput: number;
  lastUpdated: Date;
}
```

## References

- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM](https://orm.drizzle.team)
- [Recharts](https://recharts.org)
- [React Query](https://tanstack.com/query/latest)
