import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  label: string;
  value: number | string;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
}

export function KPICard({
  label,
  value,
  unit,
  trend,
  trendLabel,
  icon,
  ariaLabel,
  className = "",
}: KPICardProps) {
  const isTrendPositive = trend && trend > 0;
  const isTrendNegative = trend && trend < 0;
  const trendAbsolute = trend ? Math.abs(trend) : 0;

  return (
    <div
      className={`kpi-card ${className}`}
      role="region"
      aria-label={ariaLabel || label}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="kpi-label">{label}</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="kpi-value">{value}</span>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>
        </div>
        {icon && <div className="text-muted-foreground ml-4">{icon}</div>}
      </div>

      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-1">
          {isTrendPositive && (
            <>
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span
                className="kpi-trend positive"
                aria-label={`Trend: ${trendAbsolute}% increase${trendLabel ? " - " + trendLabel : ""}`}
              >
                +{trendAbsolute}%
              </span>
            </>
          )}
          {isTrendNegative && (
            <>
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span
                className="kpi-trend negative"
                aria-label={`Trend: ${trendAbsolute}% decrease${trendLabel ? " - " + trendLabel : ""}`}
              >
                -{trendAbsolute}%
              </span>
            </>
          )}
          {trendLabel && <span className="text-xs text-muted-foreground ml-2">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
