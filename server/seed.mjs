import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function seed() {
  const connection = await mysql.createConnection(DB_URL);

  try {
    console.log("🌱 Seeding database with demo data...");

    // Create demo users
    const users = [
      {
        openId: "admin-demo-001",
        name: "Admin User",
        email: "admin@example.com",
        loginMethod: "oauth",
        role: "Admin",
      },
      {
        openId: "lead-demo-001",
        name: "Sarah Johnson",
        email: "sarah@example.com",
        loginMethod: "oauth",
        role: "TeamLeader",
      },
      {
        openId: "lead-demo-002",
        name: "Mike Chen",
        email: "mike@example.com",
        loginMethod: "oauth",
        role: "TeamLeader",
      },
      {
        openId: "member-demo-001",
        name: "Alice Brown",
        email: "alice@example.com",
        loginMethod: "oauth",
        role: "Member",
      },
      {
        openId: "member-demo-002",
        name: "Bob Davis",
        email: "bob@example.com",
        loginMethod: "oauth",
        role: "Member",
      },
    ];

    for (const user of users) {
      await connection.execute(
        "INSERT IGNORE INTO users (openId, name, email, loginMethod, role) VALUES (?, ?, ?, ?, ?)",
        [user.openId, user.name, user.email, user.loginMethod, user.role]
      );
    }
    console.log("✅ Created demo users");

    // Get all user IDs
    const [allUserRows] = await connection.execute("SELECT id, openId FROM users WHERE openId LIKE '%demo%'");
    const userMap = {};
    allUserRows.forEach((row) => {
      userMap[row.openId] = row.id;
    });

    // Create demo teams
    const teams = [
      {
        name: "Engineering Team",
        description: "Core engineering and development",
        leaderId: userMap["lead-demo-001"],
      },
      {
        name: "Product Team",
        description: "Product management and design",
        leaderId: userMap["lead-demo-002"],
      },
    ];

    const teamIds = [];
    for (const team of teams) {
      const [result] = await connection.execute(
        "INSERT INTO teams (name, description, leaderId) VALUES (?, ?, ?)",
        [team.name, team.description, team.leaderId]
      );
      teamIds.push(result.insertId);
    }
    console.log("✅ Created demo teams");

    // Assign users to teams
    const assignments = [
      { userId: userMap["lead-demo-001"], teamId: teamIds[0], role: "TeamLeader" },
      { userId: userMap["lead-demo-002"], teamId: teamIds[1], role: "TeamLeader" },
      { userId: userMap["member-demo-001"], teamId: teamIds[0], role: "Member" },
      { userId: userMap["member-demo-002"], teamId: teamIds[1], role: "Member" },
    ];

    for (const assignment of assignments) {
      await connection.execute(
        "INSERT IGNORE INTO users_teams (userId, teamId, role) VALUES (?, ?, ?)",
        [assignment.userId, assignment.teamId, assignment.role]
      );
    }
    console.log("✅ Assigned users to teams");

    // Generate demo metrics for the last 30 days
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const metricsData = [];

    for (let i = 0; i < 30; i++) {
      const timestamp = thirtyDaysAgo + i * 24 * 60 * 60 * 1000;

      for (const teamId of teamIds) {
        const tasksCompleted = Math.floor(Math.random() * 150) + 50;
        const activeMembers = Math.floor(Math.random() * 8) + 3;
        const responseTime = (Math.random() * 3 + 1).toFixed(2);
        const throughput = (Math.random() * 30 + 20).toFixed(2);

        metricsData.push({
          teamId,
          timestamp,
          tasksCompleted,
          activeMembers,
          responseTime,
          throughput,
        });
      }
    }

    for (const metric of metricsData) {
      await connection.execute(
        "INSERT INTO metrics (teamId, timestamp, tasksCompleted, activeMembers, responseTime, throughput) VALUES (?, ?, ?, ?, ?, ?)",
        [
          metric.teamId,
          metric.timestamp,
          metric.tasksCompleted,
          metric.activeMembers,
          metric.responseTime,
          metric.throughput,
        ]
      );
    }
    console.log(`✅ Created ${metricsData.length} demo metrics records`);

    console.log("\n🎉 Database seeded successfully!");
    console.log("\nDemo Credentials:");
    console.log("- Admin: admin@example.com (role: Admin)");
    console.log("- Team Lead 1: sarah@example.com (role: TeamLeader, team: Engineering Team)");
    console.log("- Team Lead 2: mike@example.com (role: TeamLeader, team: Product Team)");
    console.log("- Member 1: alice@example.com (role: Member, team: Engineering Team)");
    console.log("- Member 2: bob@example.com (role: Member, team: Product Team)");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
