import React, { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { KPICard } from "@/components/KPICard";
import { DashboardFilters, TimeRange } from "@/components/DashboardFilters";
import { TrendLineChart, TeamComparisonChart, MetricBreakdownChart } from "@/components/MetricsCharts";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { exportMetricsAsCSV } from "@/lib/csvExport";

export default function Overview() {
  const { user } = useAuth();
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("7days");
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get accessible teams
  const { data: teams = [], isLoading: teamsLoading } = trpc.teams.list.useQuery();

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
        // For now, default to 7 days for custom
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
    }

    return { startTime, endTime: now };
  };

  const { startTime, endTime } = getTimeRange(selectedTimeRange);

  // Get metrics
  const { data: metricsData = [], isLoading: metricsLoading, refetch } = trpc.metrics.getAggregated.useQuery(
    {
      startTime,
      endTime,
      teamIds: selectedTeamId ? [selectedTeamId] : undefined,
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  // Get summary metrics for KPI cards
  const { data: summaryData } = trpc.metrics.getSummary.useQuery(
    { teamId: selectedTeamId || teams[0]?.id || 0 },
    { enabled: !!selectedTeamId || teams.length > 0 }
  );

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  // Handle CSV export
  const handleExport = () => {
    const teamName = teams.find((t) => t.id === selectedTeamId)?.name || "All Teams";
    exportMetricsAsCSV(metricsData, teamName, selectedTimeRange);
  };

  // Format data for charts
  const chartData = metricsData.map((metric) => ({
    timestamp: metric.timestamp,
    date: new Date(metric.timestamp).toLocaleDateString(),
    tasksCompleted: metric.tasksCompleted,
    activeMembers: metric.activeMembers,
    responseTime: parseFloat(metric.responseTime.toString()),
    throughput: parseFloat(metric.throughput.toString()),
  }));

  // Team comparison data (aggregate by team)
  const teamComparisonData = teams.map((team) => {
    const teamMetrics = metricsData.filter((m) => m.teamId === team.id);
    const totalTasks = teamMetrics.reduce((sum, m) => sum + m.tasksCompleted, 0);
    const avgMembers = Math.round(
      teamMetrics.reduce((sum, m) => sum + m.activeMembers, 0) / (teamMetrics.length || 1)
    );

    return {
      team: team.name,
      tasksCompleted: totalTasks,
      activeMembers: avgMembers,
    };
  });

  // Metric breakdown data
  const breakdownData = [
    { name: "Tasks Completed", value: summaryData?.tasksCompleted || 0 },
    { name: "Active Members", value: summaryData?.activeMembers || 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="headline-massive">Performance Overview</h1>
          <p className="subtext-delicate mt-2">Real-time team metrics and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh metrics data"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={metricsData.length === 0}
            aria-label="Export metrics as CSV"
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
        selectedTeamId={selectedTeamId}
        onTeamChange={setSelectedTeamId}
        teams={teams}
        isLoading={teamsLoading}
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
          ariaLabel="Tasks completed metric"
        />
        <KPICard
          label="Active Members"
          value={summaryData?.activeMembers || 0}
          unit="members"
          trend={5}
          trendLabel="vs last period"
          ariaLabel="Active members metric"
        />
        <KPICard
          label="Response Time"
          value={(summaryData?.responseTime || 0).toFixed(2)}
          unit="sec"
          trend={-8}
          trendLabel="improvement"
          ariaLabel="Response time metric"
        />
        <KPICard
          label="Throughput"
          value={(summaryData?.throughput || 0).toFixed(1)}
          unit="tasks/hr"
          trend={15}
          trendLabel="vs last period"
          ariaLabel="Throughput metric"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendLineChart data={chartData} isLoading={metricsLoading} />
        <TeamComparisonChart data={teamComparisonData} isLoading={metricsLoading} />
      </div>

      {/* Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricBreakdownChart data={breakdownData} isLoading={metricsLoading} />
      </div>
    </div>
  );
}
