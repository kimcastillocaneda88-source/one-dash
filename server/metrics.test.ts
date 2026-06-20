import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { TRPCError } from "@trpc/server";

// Mock database functions
vi.mock("./db", () => ({
  getUserTeams: vi.fn(),
  canUserAccessTeam: vi.fn(),
  getTeamMetrics: vi.fn(),
  getAggregatedMetrics: vi.fn(),
  getUserTeamRole: vi.fn(),
}));

import * as db from "./db";

function createMockContext(user: any): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

describe("Metrics Router - Role-Based Access Control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTeamMetrics", () => {
    it("should allow TeamLeader to access their own team metrics", async () => {
      const user = {
        id: 1,
        name: "Team Lead",
        role: "TeamLeader",
        email: "lead@example.com",
        openId: "lead-123",
        loginMethod: "oauth",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.canUserAccessTeam).mockResolvedValue(true);
      vi.mocked(db.getTeamMetrics).mockResolvedValue([
        {
          id: 1,
          teamId: 1,
          timestamp: Date.now(),
          tasksCompleted: 100,
          activeMembers: 5,
          responseTime: "2.5",
          throughput: "25.0",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await caller.metrics.getTeamMetrics({
        teamId: 1,
        startTime: Date.now() - 86400000,
        endTime: Date.now(),
      });

      expect(result).toHaveLength(1);
      expect(result[0].tasksCompleted).toBe(100);
      expect(db.canUserAccessTeam).toHaveBeenCalledWith(1, 1, "TeamLeader");
    });

    it("should deny TeamLeader access to other team metrics", async () => {
      const user = {
        id: 1,
        name: "Team Lead",
        role: "TeamLeader",
        email: "lead@example.com",
        openId: "lead-123",
        loginMethod: "oauth",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.canUserAccessTeam).mockResolvedValue(false);

      try {
        await caller.metrics.getTeamMetrics({
          teamId: 2,
          startTime: Date.now() - 86400000,
          endTime: Date.now(),
        });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError<any>).code).toBe("FORBIDDEN");
      }
    });

    it("should allow Admin to access any team metrics", async () => {
      const user = {
        id: 1,
        name: "Admin",
        role: "Admin",
        email: "admin@example.com",
        openId: "admin-123",
        loginMethod: "oauth",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.canUserAccessTeam).mockResolvedValue(true);
      vi.mocked(db.getTeamMetrics).mockResolvedValue([]);

      const result = await caller.metrics.getTeamMetrics({
        teamId: 999,
        startTime: Date.now() - 86400000,
        endTime: Date.now(),
      });

      expect(result).toEqual([]);
    });
  });

  describe("getAggregated", () => {
    it("should return metrics only for accessible teams", async () => {
      const user = {
        id: 1,
        name: "Team Lead",
        role: "TeamLeader",
        email: "lead@example.com",
        openId: "lead-123",
        loginMethod: "oauth",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.getUserTeams).mockResolvedValue([
        { id: 1, name: "Team A", leaderId: 1, description: "", createdAt: new Date(), updatedAt: new Date() },
      ]);
      vi.mocked(db.getAggregatedMetrics).mockResolvedValue([]);

      const result = await caller.metrics.getAggregated({
        startTime: Date.now() - 86400000,
        endTime: Date.now(),
      });

      expect(result).toEqual([]);
      expect(db.getUserTeams).toHaveBeenCalledWith(1, "TeamLeader");
    });

    it("should deny access to unauthorized teams", async () => {
      const user = {
        id: 1,
        name: "Team Lead",
        role: "TeamLeader",
        email: "lead@example.com",
        openId: "lead-123",
        loginMethod: "oauth",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.getUserTeams).mockResolvedValue([
        { id: 1, name: "Team A", leaderId: 1, description: "", createdAt: new Date(), updatedAt: new Date() },
      ]);

      try {
        await caller.metrics.getAggregated({
          startTime: Date.now() - 86400000,
          endTime: Date.now(),
          teamIds: [999], // Unauthorized team
        });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError<any>).code).toBe("FORBIDDEN");
      }
    });
  });

  describe("Admin procedures", () => {
    it("should allow Admin to get all teams", async () => {
      const user = {
        id: 1,
        name: "Admin",
        role: "Admin",
        email: "admin@example.com",
        openId: "admin-123",
        loginMethod: "oauth",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.getUserTeams).mockResolvedValue([
        { id: 1, name: "Team A", leaderId: 1, description: "", createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: "Team B", leaderId: 2, description: "", createdAt: new Date(), updatedAt: new Date() },
      ]);

      const result = await caller.admin.getAllTeams();

      expect(result).toHaveLength(2);
      expect(db.getUserTeams).toHaveBeenCalledWith(1, "Admin");
    });

    it("should deny non-Admin access to admin procedures", async () => {
      const user = {
        id: 1,
        name: "Team Lead",
        role: "TeamLeader",
        email: "lead@example.com",
        openId: "lead-123",
        loginMethod: "oauth",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.admin.getAllTeams();
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError<any>).code).toBe("FORBIDDEN");
      }
    });
  });
});
