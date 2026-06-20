import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

export type TimeRange = "today" | "7days" | "30days" | "custom";

interface DashboardFiltersProps {
  selectedTimeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  selectedTeamId?: number;
  onTeamChange?: (teamId: number | undefined) => void;
  teams?: Array<{ id: number; name: string }>;
  isLoading?: boolean;
}

export function DashboardFilters({
  selectedTimeRange,
  onTimeRangeChange,
  selectedTeamId,
  onTeamChange,
  teams = [],
  isLoading = false,
}: DashboardFiltersProps) {
  const timeRangeOptions = [
    { value: "today" as const, label: "Today" },
    { value: "7days" as const, label: "Last 7 Days" },
    { value: "30days" as const, label: "Last 30 Days" },
    { value: "custom" as const, label: "Custom" },
  ];

  return (
    <div
      className="flex flex-col md:flex-row gap-4 items-start md:items-center"
      role="toolbar"
      aria-label="Dashboard filters"
    >
      {/* Time Range Selector */}
      <div className="flex flex-col gap-2 min-w-max">
        <label htmlFor="time-range-select" className="text-sm font-medium text-muted-foreground">
          Time Range
        </label>
        <Select value={selectedTimeRange} onValueChange={onTimeRangeChange} disabled={isLoading}>
          <SelectTrigger
            id="time-range-select"
            className="w-48"
            aria-label="Select time range for metrics"
          >
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeRangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Team Filter */}
      {teams.length > 0 && onTeamChange && (
        <div className="flex flex-col gap-2 min-w-max">
          <label htmlFor="team-select" className="text-sm font-medium text-muted-foreground">
            Team
          </label>
          <Select
            value={selectedTeamId?.toString() || "all"}
            onValueChange={(value) => {
              if (value === "all") {
                onTeamChange(undefined);
              } else {
                onTeamChange(parseInt(value, 10));
              }
            }}
            disabled={isLoading}
          >
            <SelectTrigger
              id="team-select"
              className="w-48"
              aria-label="Select team to view metrics"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent" />
          Loading...
        </div>
      )}
    </div>
  );
}
