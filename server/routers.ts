import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getUserTeams,
  canUserAccessTeam,
  getTeamMetrics,
  getAggregatedMetrics,
  getUserTeamRole,
} from "./db";

/**
 * Role-based procedure wrapper
 * Ensures user has specific role(s) to access the procedure
 */
function roleBasedProcedure(allowedRoles: string[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This action requires one of these roles: ${allowedRoles.join(", ")}`,
      });
    }
    return next({ ctx });
  });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  /**
   * Teams router - multi-tenant team management
   */
  teams: router({
    /**
     * Get all teams accessible to the current user
     * Admins see all teams; TeamLeaders/Members see only their assigned teams
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserTeams(ctx.user.id, ctx.user.role);
    }),

    /**
     * Get a specific team (with access control)
     */
    get: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ ctx, input }) => {
        const hasAccess = await canUserAccessTeam(ctx.user.id, input.teamId, ctx.user.role);
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this team",
          });
        }

        const teams = await getUserTeams(ctx.user.id, ctx.user.role);
        return teams.find((t) => t.id === input.teamId) || null;
      }),
  }),

  /**
   * Metrics router - real-time performance data
   */
  metrics: router({
    /**
     * Get metrics for a specific team within a time range
     * Enforces role-based access control
     */
    getTeamMetrics: protectedProcedure
      .input(
        z.object({
          teamId: z.number(),
          startTime: z.number(),
          endTime: z.number(),
        })
      )
      .query(async ({ ctx, input }) => {
        // Check if user can access this team
        const hasAccess = await canUserAccessTeam(ctx.user.id, input.teamId, ctx.user.role);
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this team's metrics",
          });
        }

        return await getTeamMetrics(input.teamId, input.startTime, input.endTime);
      }),

    /**
     * Get aggregated metrics for all accessible teams
     * Returns metrics for all teams the user can access
     */
    getAggregated: protectedProcedure
      .input(
        z.object({
          startTime: z.number(),
          endTime: z.number(),
          teamIds: z.array(z.number()).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        // Get all teams accessible to the user
        const accessibleTeams = await getUserTeams(ctx.user.id, ctx.user.role);
        const accessibleTeamIds = accessibleTeams.map((t) => t.id);

        // If specific teamIds are requested, verify user has access to all of them
        let teamIds = accessibleTeamIds;
        if (input.teamIds && input.teamIds.length > 0) {
          const requestedIds = input.teamIds;
          const hasAccessToAll = requestedIds.every((id) => accessibleTeamIds.includes(id));
          if (!hasAccessToAll) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You do not have access to one or more of the requested teams",
            });
          }
          teamIds = requestedIds;
        }

        return await getAggregatedMetrics(teamIds, input.startTime, input.endTime);
      }),

    /**
     * Get summary metrics for a team (latest aggregated data)
     */
    getSummary: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ ctx, input }) => {
        const hasAccess = await canUserAccessTeam(ctx.user.id, input.teamId, ctx.user.role);
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this team's metrics",
          });
        }

        // Get the latest hour's metrics
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;

        const metricsData = await getTeamMetrics(input.teamId, oneHourAgo, now);

        if (metricsData.length === 0) {
          return {
            tasksCompleted: 0,
            activeMembers: 0,
            responseTime: 0,
            throughput: 0,
            lastUpdated: new Date(),
          };
        }

        // Return the most recent metric
        const latest = metricsData[metricsData.length - 1];
        return {
          tasksCompleted: latest.tasksCompleted,
          activeMembers: latest.activeMembers,
          responseTime: parseFloat(latest.responseTime.toString()),
          throughput: parseFloat(latest.throughput.toString()),
          lastUpdated: latest.updatedAt,
        };
      }),
  }),

  /**
   * Admin-only procedures
   */
  admin: router({
    /**
     * Get all teams (admin only)
     */
    getAllTeams: roleBasedProcedure(["Admin"]).query(async ({ ctx }) => {
      return await getUserTeams(ctx.user.id, "Admin");
    }),

    /**
     * Get all metrics (admin only)
     */
    getAllMetrics: roleBasedProcedure(["Admin"])
      .input(
        z.object({
          startTime: z.number(),
          endTime: z.number(),
        })
      )
      .query(async ({ ctx, input }) => {
        const allTeams = await getUserTeams(ctx.user.id, "Admin");
        const teamIds = allTeams.map((t) => t.id);
        return await getAggregatedMetrics(teamIds, input.startTime, input.endTime);
      }),
  }),
});

export type AppRouter = typeof appRouter;
