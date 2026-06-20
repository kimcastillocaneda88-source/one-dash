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

interface ChartDataPoint {
  timestamp?: number;
  date?: string;
  team?: string;
  [key: string]: any;
}

interface MetricsChartsProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

const COLORS = [
  "#1f2937", // gray-800
  "#374151", // gray-700
  "#6b7280", // gray-500
  "#9ca3af", // gray-400
  "#d1d5db", // gray-300
];

/**
 * Line Chart for hourly/daily trends
 */
export function TrendLineChart({ data, isLoading }: MetricsChartsProps) {
  if (isLoading) {
    return (
      <div className="chart-container h-80 flex items-center justify-center">
        <div className="text-muted-foreground">Loading chart...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-container h-80 flex items-center justify-center">
        <div className="text-muted-foreground">No data available</div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold mb-4">Trends Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            aria-label="Time period"
          />
          <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "0.375rem",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="tasksCompleted"
            stroke="#1f2937"
            dot={false}
            name="Tasks Completed"
            aria-label="Tasks completed trend"
          />
          <Line
            type="monotone"
            dataKey="throughput"
            stroke="#6b7280"
            dot={false}
            name="Throughput"
            aria-label="Throughput trend"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Bar Chart for team comparisons
 */
export function TeamComparisonChart({ data, isLoading }: MetricsChartsProps) {
  if (isLoading) {
    return (
      <div className="chart-container h-80 flex items-center justify-center">
        <div className="text-muted-foreground">Loading chart...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-container h-80 flex items-center justify-center">
        <div className="text-muted-foreground">No data available</div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold mb-4">Team Comparison</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="team"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            aria-label="Team names"
          />
          <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "0.375rem",
            }}
          />
          <Legend />
          <Bar
            dataKey="activeMembers"
            fill="#1f2937"
            name="Active Members"
            aria-label="Active members by team"
          />
          <Bar
            dataKey="tasksCompleted"
            fill="#6b7280"
            name="Tasks Completed"
            aria-label="Tasks completed by team"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Pie/Donut Chart for metric breakdown
 */
export function MetricBreakdownChart({ data, isLoading }: MetricsChartsProps) {
  if (isLoading) {
    return (
      <div className="chart-container h-80 flex items-center justify-center">
        <div className="text-muted-foreground">Loading chart...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-container h-80 flex items-center justify-center">
        <div className="text-muted-foreground">No data available</div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold mb-4">Metric Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
            aria-label="Metric breakdown distribution"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
