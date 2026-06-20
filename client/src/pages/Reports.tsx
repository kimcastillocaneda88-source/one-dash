import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportMetricsAsCSV } from "@/lib/csvExport";

interface ReportRow {
  date: string;
  team: string;
  tasksCompleted: number;
  activeMembers: number;
  responseTime: string;
  throughput: string;
}

export default function Reports() {
  const { user } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>();

  // Get teams
  const { data: teams = [] } = trpc.teams.list.useQuery();

  // Get 30 days of metrics
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const { data: metricsData = [], isLoading } = trpc.metrics.getAggregated.useQuery({
    startTime: thirtyDaysAgo,
    endTime: now,
    teamIds: selectedTeamId ? [selectedTeamId] : undefined,
  });

  // Format data for table
  const reportRows: ReportRow[] = metricsData.map((metric) => ({
    date: new Date(metric.timestamp).toLocaleDateString(),
    team: teams.find((t) => t.id === metric.teamId)?.name || "Unknown",
    tasksCompleted: metric.tasksCompleted,
    activeMembers: metric.activeMembers,
    responseTime: parseFloat(metric.responseTime.toString()).toFixed(2),
    throughput: parseFloat(metric.throughput.toString()).toFixed(2),
  }));

  const handleExport = () => {
    const teamName = teams.find((t) => t.id === selectedTeamId)?.name || "All Teams";
    exportMetricsAsCSV(metricsData, teamName, "30days");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="headline-massive">Reports</h1>
          <p className="subtext-delicate mt-2">Detailed metrics and analytics</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={metricsData.length === 0}
          aria-label="Export report as CSV"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Team Filter */}
      <div className="flex gap-4 items-center">
        <label htmlFor="team-filter" className="text-sm font-medium">
          Filter by Team:
        </label>
        <select
          id="team-filter"
          value={selectedTeamId?.toString() || "all"}
          onChange={(e) => {
            if (e.target.value === "all") {
              setSelectedTeamId(undefined);
            } else {
              setSelectedTeamId(parseInt(e.target.value, 10));
            }
          }}
          className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-md bg-card text-foreground"
          aria-label="Select team for report"
        >
          <option value="all">All Teams</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      {/* Metrics Table */}
      <div className="bg-card rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading report...</div>
        ) : reportRows.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No data available</div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full text-sm"
              role="table"
              aria-label="Metrics report table"
            >
              <thead className="bg-muted border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Date</th>
                  <th className="px-6 py-3 text-left font-semibold">Team</th>
                  <th className="px-6 py-3 text-right font-semibold">Tasks Completed</th>
                  <th className="px-6 py-3 text-right font-semibold">Active Members</th>
                  <th className="px-6 py-3 text-right font-semibold">Response Time (sec)</th>
                  <th className="px-6 py-3 text-right font-semibold">Throughput (tasks/hr)</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-200 dark:border-gray-800 hover:bg-muted transition-colors"
                  >
                    <td className="px-6 py-3">{row.date}</td>
                    <td className="px-6 py-3">{row.team}</td>
                    <td className="px-6 py-3 text-right">{row.tasksCompleted}</td>
                    <td className="px-6 py-3 text-right">{row.activeMembers}</td>
                    <td className="px-6 py-3 text-right">{row.responseTime}</td>
                    <td className="px-6 py-3 text-right">{row.throughput}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {reportRows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Tasks</p>
            <p className="text-2xl font-bold mt-2">
              {reportRows.reduce((sum, row) => sum + row.tasksCompleted, 0)}
            </p>
          </div>
          <div className="bg-card p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Members</p>
            <p className="text-2xl font-bold mt-2">
              {Math.round(reportRows.reduce((sum, row) => sum + row.activeMembers, 0) / reportRows.length)}
            </p>
          </div>
          <div className="bg-card p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Response Time</p>
            <p className="text-2xl font-bold mt-2">
              {(
                reportRows.reduce((sum, row) => sum + parseFloat(row.responseTime), 0) /
                reportRows.length
              ).toFixed(2)}
              s
            </p>
          </div>
          <div className="bg-card p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Throughput</p>
            <p className="text-2xl font-bold mt-2">
              {(
                reportRows.reduce((sum, row) => sum + parseFloat(row.throughput), 0) /
                reportRows.length
              ).toFixed(1)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
