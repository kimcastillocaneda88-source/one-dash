import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRBAC } from "@/contexts/RBACContext";
import { trpc } from "@/lib/trpc";
import { KPICard } from "@/components/KPICard";
import { DashboardFilters, TimeRange } from "@/components/DashboardFilters";
import { TrendLineChart } from "@/components/MetricsCharts";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { exportMetricsAsCSV } from "@/lib/csvExport";

export default function MyTeam() {
  const { user } = useAuth();
  const { isTeamLeader, isMember } = useRBAC();
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("7days");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get user's teams
  const { data: teams = [] } = trpc.teams.list.useQuery();
  const userTeam = teams[0]; // Get first team (user's primary team)

  // Calculate time range
  const getTimeRange = (range: TimeRange) => {
    const now = Date.now();
    let startTime = now;

    switch (range) {
      case "today":
        startTime = new Date(now).setHours(0, 0, 0, 0);
        break;
      case "7days":
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "30days":
        startTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case "custom":
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
    }

    return { startTime, endTime: now };
  };

  const { startTime, endTime } = getTimeRange(selectedTimeRange);

  // Get team metrics
  const { data: metricsData = [], isLoading: metricsLoading, refetch } = trpc.metrics.getTeamMetrics.useQuery(
    {
      teamId: userTeam?.id || 0,
      startTime,
      endTime,
    },
    {
      enabled: !!userTeam,
      refetchInterval: 30000,
    }
  );

  // Get summary
  const { data: summaryData } = trpc.metrics.getSummary.useQuery(
    { teamId: userTeam?.id || 0 },
    { enabled: !!userTeam }
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const handleExport = () => {
    exportMetricsAsCSV(metricsData, userTeam?.name || "My Team", selectedTimeRange);
  };

  const chartData = metricsData.map((metric) => ({
    timestamp: metric.timestamp,
    date: new Date(metric.timestamp).toLocaleDateString(),
    tasksCompleted: metric.tasksCompleted,
    activeMembers: metric.activeMembers,
    responseTime: parseFloat(metric.responseTime.toString()),
    throughput: parseFloat(metric.throughput.toString()),
  }));

  if (!isTeamLeader && !isMember) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You do not have access to this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="headline-massive">My Team</h1>
          <p className="subtext-delicate mt-2">{userTeam?.name || "Team Metrics"}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh team metrics"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={metricsData.length === 0}
            aria-label="Export team metrics as CSV"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <DashboardFilters
        selectedTimeRange={selectedTimeRange}
        onTimeRangeChange={setSelectedTimeRange}
        isLoading={metricsLoading}
      />

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid">
        <KPICard
          label="Tasks Completed"
          value={summaryData?.tasksCompleted || 0}
          unit="tasks"
          trend={12}
          trendLabel="vs last period"
        />
        <KPICard
          label="Active Members"
          value={summaryData?.activeMembers || 0}
          unit="members"
          trend={5}
          trendLabel="vs last period"
        />
        <KPICard
          label="Response Time"
          value={(summaryData?.responseTime || 0).toFixed(2)}
          unit="sec"
          trend={-8}
          trendLabel="improvement"
        />
        <KPICard
          label="Throughput"
          value={(summaryData?.throughput || 0).toFixed(1)}
          unit="tasks/hr"
          trend={15}
          trendLabel="vs last period"
        />
      </div>

      {/* Trend Chart */}
      <TrendLineChart data={chartData} isLoading={metricsLoading} />
    </div>
  );
}
