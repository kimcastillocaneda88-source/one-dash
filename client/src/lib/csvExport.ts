/**
 * CSV Export Utility
 * Converts metrics data to CSV format and triggers download
 */

interface ExportData {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Convert array of objects to CSV string
 */
export function convertToCSV(data: ExportData[]): string {
  if (data.length === 0) {
    return "";
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV header row
  const headerRow = headers.map((header) => `"${header}"`).join(",");

  // Create CSV data rows
  const dataRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) {
          return '""';
        }
        if (typeof value === "string") {
          // Escape quotes and wrap in quotes
          return `"${value.replace(/"/g, '""')}"`;
        }
        return `"${value}"`;
      })
      .join(",")
  );

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Format metrics data for CSV export
 */
export function formatMetricsForCSV(
  metrics: any[],
  teamName?: string,
  timeRange?: string
): ExportData[] {
  return metrics.map((metric) => ({
    timestamp: new Date(metric.timestamp).toISOString(),
    team: teamName || "All Teams",
    tasksCompleted: metric.tasksCompleted,
    activeMembers: metric.activeMembers,
    responseTime: parseFloat(metric.responseTime).toFixed(2),
    throughput: parseFloat(metric.throughput).toFixed(2),
  }));
}

/**
 * Trigger CSV download
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Export metrics data as CSV file
 */
export function exportMetricsAsCSV(
  metrics: any[],
  teamName?: string,
  timeRange?: string
): void {
  const formattedData = formatMetricsForCSV(metrics, teamName, timeRange);
  const csvContent = convertToCSV(formattedData);

  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `metrics-${teamName || "all-teams"}-${timestamp}.csv`;

  downloadCSV(csvContent, filename);
}
