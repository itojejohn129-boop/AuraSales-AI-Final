"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { TrendingUp, AlertCircle, Lightbulb } from "lucide-react";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

type TrendPoint = {
  date?: string;
  label: string;
  revenue: number;
  isForecast?: boolean;
};

type TrendView = "daily" | "weekly" | "monthly";

interface FutureInsightsProps {
  risk: string;
  opportunity: string;
  confidenceScore: number;
  isLoading?: boolean;
  targetLanguage?: string;
  trendPoints?: TrendPoint[];
}

export function FutureInsightsCard({
  risk,
  opportunity,
  confidenceScore,
  isLoading = false,
  targetLanguage = "en",
  trendPoints = [],
}: FutureInsightsProps) {
  const [trendView, setTrendView] = useState<TrendView>("monthly");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [
    translatedTitle,
    translatedConfidence,
    translatedRisk,
    translatedOpportunity,
    translatedFooter,
    translatedTrendTitle,
    translatedSummaryTitle,
    translatedViewTitle,
    translatedDaily,
    translatedWeekly,
    translatedMonthly,
    translatedUpSummary,
    translatedDownSummary,
    translatedFlatSummary,
    translatedDailyExplanation,
    translatedWeeklyExplanation,
    translatedMonthlyExplanation,
  ] = useTranslatedTexts(targetLanguage, [
    "Future Insights",
    "AI Confidence:",
    "Major Risk",
    "Major Opportunity",
    "Based on 90-day linear regression forecast analysis",
    "Forecast Trend",
    "What this means",
    "View",
    "Daily",
    "Weekly",
    "Monthly",
    "The forecast is rising, which suggests stronger demand ahead. Focus on scaling the winning products, inventory, and staffing.",
    "The forecast is trending down, which suggests weaker momentum ahead. Protect revenue by reviewing pricing, retention, and underperforming segments.",
    "The forecast is steady, which suggests a stable market. Use this window to test bundles, upsells, and new campaigns.",
    "The daily view shows short-term movement and helps you spot immediate changes in sales behavior.",
    "The weekly view smooths out day-to-day noise and makes performance trends easier to compare.",
    "The monthly view highlights the bigger business pattern and is best for identifying strategic direction over time.",
  ]);

  const chartPoints = useMemo(() => {
    const filtered = trendPoints
      .filter((point) => Number.isFinite(point.revenue))
      .map((point) => ({
        ...point,
        revenue: Number(point.revenue),
        date: point.date || point.label,
      }));

    if (filtered.length <= 1) return [];

    const bucketMap = new Map<
      string,
      { label: string; revenue: number; isForecast: boolean; sortKey: string; date: string }
    >();

    for (const point of filtered) {
      const parsedDate = new Date(point.date || point.label);
      if (Number.isNaN(parsedDate.getTime())) continue;

      const bucketKey =
        trendView === "daily"
          ? `${parsedDate.getUTCFullYear()}-${String(parsedDate.getUTCMonth() + 1).padStart(2, "0")}-${String(parsedDate.getUTCDate()).padStart(2, "0")}`
          : trendView === "weekly"
            ? `${parsedDate.getUTCFullYear()}-W${String(
                Math.ceil((((parsedDate.getTime() - Date.UTC(parsedDate.getUTCFullYear(), 0, 1)) / 86400000) + 1) / 7)
              ).padStart(2, "0")}`
            : `${parsedDate.getUTCFullYear()}-${String(parsedDate.getUTCMonth() + 1).padStart(2, "0")}`;
      const label =
        trendView === "daily"
          ? parsedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })
          : trendView === "weekly"
            ? `W${String(
                Math.ceil((((parsedDate.getTime() - Date.UTC(parsedDate.getUTCFullYear(), 0, 1)) / 86400000) + 1) / 7)
              ).padStart(2, "0")} ${parsedDate.getUTCFullYear()}`
            : parsedDate.toLocaleDateString(undefined, { month: "short", year: "numeric" });

      const existing = bucketMap.get(bucketKey);
      bucketMap.set(bucketKey, {
        label,
        revenue: (existing?.revenue || 0) + point.revenue,
        isForecast: Boolean(existing?.isForecast || point.isForecast),
        sortKey: bucketKey,
        date: point.date || point.label,
      });
    }

    return Array.from(bucketMap.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [trendPoints, trendView]);

  const confidenceLabel = useMemo(() => {
    if (confidenceScore >= 80) return "High";
    if (confidenceScore >= 60) return "Moderate";
    if (confidenceScore >= 40) return "Fair";
    return "Limited";
  }, [confidenceScore]);

  const confidenceHint = useMemo(() => {
    if (chartPoints.length < 3) {
      return "Confidence is lower because the forecast has limited history to compare against.";
    }
    if (confidenceScore < 60) {
      return "Confidence is moderate because the trend still contains some variability.";
    }
    return "Confidence is stronger because the forecast follows a more consistent pattern.";
  }, [chartPoints.length, confidenceScore]);

  const chartSummary = useMemo(() => {
    if (chartPoints.length < 2) return translatedFlatSummary;

    const first = chartPoints[0].revenue;
    const last = chartPoints[chartPoints.length - 1].revenue;
    const delta = first === 0 ? 0 : ((last - first) / Math.abs(first)) * 100;

    if (delta > 3) return translatedUpSummary;
    if (delta < -3) return translatedDownSummary;
    return translatedFlatSummary;
  }, [chartPoints, translatedDownSummary, translatedFlatSummary, translatedUpSummary]);

  const chartLayout = useMemo(() => {
    if (chartPoints.length < 2) return null;

    const width = 720;
    const height = 240;
    const paddingLeft = 42;
    const paddingRight = 16;
    const paddingTop = 20;
    const paddingBottom = 54;
    const values = chartPoints.map((point) => point.revenue);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const stepX = (width - paddingLeft - paddingRight) / (chartPoints.length - 1);

    const scaleY = (value: number) =>
      height - paddingBottom - ((value - min) / range) * (height - paddingTop - paddingBottom);

    const points = chartPoints.map((point, index) => ({
      ...point,
      x: paddingLeft + index * stepX,
      y: scaleY(point.revenue),
    }));

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const value = min + range * ratio;
      return { value, y: scaleY(value) };
    });

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      points,
      yTicks,
    };
  }, [chartPoints]);

  const hoveredPoint = useMemo(() => {
    if (hoveredPointIndex === null || !chartLayout) return null;
    return chartLayout.points[hoveredPointIndex] || null;
  }, [chartLayout, hoveredPointIndex]);

  const hoveredPointInsight = useMemo(() => {
    if (!hoveredPoint || !chartLayout) return null;

    const pointIndex = hoveredPointIndex ?? 0;
    const previousPoint = pointIndex > 0 ? chartLayout.points[pointIndex - 1] : null;
    const currentValue = hoveredPoint.revenue;
    const previousValue = previousPoint?.revenue ?? null;
    const delta =
      previousValue === null || previousValue === 0
        ? null
        : ((currentValue - previousValue) / Math.abs(previousValue)) * 100;

    const parsedDate = new Date(hoveredPoint.date || hoveredPoint.label);
    const readableDate = Number.isNaN(parsedDate.getTime())
      ? hoveredPoint.label
      : parsedDate.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: trendView === "monthly" ? "numeric" : undefined,
        });

    const valueText = currentValue.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });

    let movementText = "This is the starting point of the trend.";
    if (delta !== null) {
      if (Math.abs(delta) < 0.5) {
        movementText =
          "This period is nearly flat compared with the previous one, which suggests stable momentum.";
      } else if (delta > 0) {
        movementText = `This is about ${Math.abs(delta).toFixed(1)}% higher than the previous period, which points to improving momentum.`;
      } else {
        movementText = `This is about ${Math.abs(delta).toFixed(1)}% lower than the previous period, which suggests a softer period.`;
      }
    }

    const forecastNote = hoveredPoint.isForecast
      ? "Because this point is forecasted, treat it as a direction signal rather than a guaranteed result."
      : "Because this point is historical, it reflects the actual recorded dashboard value for that period.";

    const explanation = hoveredPoint.isForecast
      ? `The model expects revenue around ${valueText} for this period. ${movementText} ${forecastNote}`
      : `${movementText} ${forecastNote}`;

    return {
      date: readableDate,
      label: hoveredPoint.isForecast ? "Forecast Revenue" : "Actual Revenue",
      value: valueText,
      explanation,
    };
  }, [chartLayout, hoveredPoint, hoveredPointIndex, trendView]);

  const formatAxisLabel = (label: string) => {
    const parsedDate = new Date(label);
    if (Number.isNaN(parsedDate.getTime())) {
      return label;
    }

    if (trendView === "monthly") {
      return parsedDate.toLocaleDateString(undefined, {
        month: "short",
        year: "2-digit",
      });
    }

    if (trendView === "weekly") {
      const year = String(parsedDate.getUTCFullYear()).slice(-2);
      const week = String(
        Math.ceil((((parsedDate.getTime() - Date.UTC(parsedDate.getUTCFullYear(), 0, 1)) / 86400000) + 1) / 7)
      ).padStart(2, "0");
      return `W${week} '${year}`;
    }

    return parsedDate.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const actualPath = useMemo(() => {
    if (!chartLayout) return "";
    return chartLayout.points
      .filter((point) => !point.isForecast)
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(" ");
  }, [chartLayout]);

  const forecastPath = useMemo(() => {
    if (!chartLayout) return "";
    return chartLayout.points
      .filter((point) => point.isForecast)
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(" ");
  }, [chartLayout]);

  const forecastSplitIndex = useMemo(
    () => chartPoints.findIndex((point) => point.isForecast),
    [chartPoints]
  );

  const chartDateLabels = useMemo(() => {
    if (!chartLayout) return [];
    const picks =
      chartLayout.points.length <= 4
        ? chartLayout.points.map((_, index) => index)
        : [0, Math.floor(chartLayout.points.length / 2), chartLayout.points.length - 1];

    return Array.from(new Set(picks)).map((index) => chartLayout.points[index]);
  }, [chartLayout]);

  const handleChartMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!chartLayout || chartLayout.points.length === 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const localX = ((event.clientX - rect.left) / rect.width) * chartLayout.width;
    const localY = ((event.clientY - rect.top) / rect.height) * chartLayout.height;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    chartLayout.points.forEach((point, index) => {
      const dx = point.x - localX;
      const dy = point.y - localY;
      const distance = dx * dx + dy * dy;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setHoveredPointIndex(nearestIndex);
  };

  return (
    <motion.div
      data-aura-translate-skip
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-md"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          {translatedTitle}
        </h3>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs font-medium text-slate-300">
            {translatedConfidence} {confidenceScore}%
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-16 bg-slate-700/30 rounded animate-pulse" />
          <div className="h-16 bg-slate-700/30 rounded animate-pulse" />
        </div>
      ) : (
        <div className="space-y-4">
          {chartPoints.length > 1 && (
            <div
              className="rounded-lg border border-slate-700 bg-slate-900/40 p-4"
              onMouseMove={handleChartMove}
              onMouseLeave={() => setHoveredPointIndex(null)}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  {translatedTrendTitle}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {chartPoints[0].label} - {chartPoints[chartPoints.length - 1].label}
                  </span>
                    <div className="inline-flex rounded-md border border-slate-700 bg-slate-800/80 p-0.5">
                    {(["daily", "weekly", "monthly"] as TrendView[]).map((view) => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => setTrendView(view)}
                        className={`px-2 py-1 text-[11px] font-medium rounded ${
                          trendView === view
                            ? "bg-blue-600 text-white"
                            : "text-slate-300 hover:text-slate-100"
                        }`}
                      >
                        {view === "daily"
                          ? translatedDaily
                          : view === "weekly"
                            ? translatedWeekly
                            : translatedMonthly}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative">
                <svg viewBox="0 0 720 240" className="w-full h-60 overflow-visible">
                <defs>
                  <linearGradient id="aura-forecast-line" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
                {chartLayout && (
                  <>
                    {chartLayout.yTicks.map((tick) => (
                      <g key={`y-tick-${tick.value.toFixed(0)}`}>
                        <line
                          x1={chartLayout.paddingLeft}
                          x2={chartLayout.width - chartLayout.paddingRight}
                          y1={tick.y}
                          y2={tick.y}
                          stroke="#334155"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={chartLayout.paddingLeft - 10}
                          y={tick.y + 4}
                          textAnchor="end"
                          className="fill-slate-400"
                          fontSize="10"
                        >
                          {Math.round(tick.value).toLocaleString()}
                        </text>
                      </g>
                    ))}

                    <line
                      x1={chartLayout.paddingLeft}
                      x2={chartLayout.width - chartLayout.paddingRight}
                      y1={chartLayout.height - chartLayout.paddingBottom}
                      y2={chartLayout.height - chartLayout.paddingBottom}
                      stroke="#64748b"
                    />
                    <line
                      x1={chartLayout.paddingLeft}
                      x2={chartLayout.paddingLeft}
                      y1={chartLayout.paddingTop}
                      y2={chartLayout.height - chartLayout.paddingBottom}
                      stroke="#64748b"
                    />

                    <path
                      d={actualPath}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {forecastPath && (
                      <path
                        d={forecastPath}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="3"
                        strokeDasharray="8 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {chartLayout.points.map((point, index) => (
                      <circle
                        key={`${point.label}-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r={hoveredPointIndex === index ? 6 : point.isForecast ? 4 : 3}
                        fill={point.isForecast ? "#f59e0b" : "#3b82f6"}
                        opacity={point.isForecast ? 0.95 : 0.9}
                        stroke={hoveredPointIndex === index ? "#e2e8f0" : "transparent"}
                        strokeWidth={hoveredPointIndex === index ? 2 : 0}
                      />
                    ))}

                    {hoveredPoint && (
                      <line
                        x1={hoveredPoint.x}
                        x2={hoveredPoint.x}
                        y1={chartLayout.paddingTop}
                        y2={chartLayout.height - chartLayout.paddingBottom}
                        stroke="#94a3b8"
                        strokeDasharray="4 4"
                      />
                    )}

                    {forecastSplitIndex > 0 && forecastSplitIndex < chartLayout.points.length && (
                      <line
                        x1={chartLayout.points[forecastSplitIndex].x - (chartLayout.points[1]?.x - chartLayout.points[0]?.x || 0) / 2}
                        x2={chartLayout.points[forecastSplitIndex].x - (chartLayout.points[1]?.x - chartLayout.points[0]?.x || 0) / 2}
                        y1={chartLayout.paddingTop}
                        y2={chartLayout.height - chartLayout.paddingBottom}
                        stroke="#475569"
                        strokeDasharray="4 4"
                      />
                    )}

                    {chartDateLabels.map((point) => (
                      <text
                        key={`axis-${point.label}`}
                        x={point.x}
                        y={chartLayout.height - 12}
                        textAnchor="middle"
                        className="fill-slate-500"
                        fontSize="10"
                      >
                        {formatAxisLabel(point.label)}
                      </text>
                    ))}
                  </>
                )}
                </svg>

                {hoveredPoint && hoveredPointInsight && (
                  <div
                    className="pointer-events-none absolute z-20 max-w-[280px] rounded-xl border border-slate-600 bg-slate-900/95 px-4 py-3 shadow-2xl backdrop-blur-md"
                    style={{
                      left: `${Math.min(Math.max((hoveredPoint.x / chartLayout!.width) * 100, 16), 84)}%`,
                      top: `${Math.min(Math.max((hoveredPoint.y / chartLayout!.height) * 100, 18), 82)}%`,
                      transform: "translate(-50%, -110%)",
                    }}
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-400">{hoveredPointInsight.date}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-100">{hoveredPointInsight.label}: {hoveredPointInsight.value}</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">
                      {hoveredPointInsight.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Risk Section */}
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-800/30">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-300 mb-1">
                  {translatedRisk}
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {risk}
                </p>
              </div>
            </div>
          </div>

          {/* Opportunity Section */}
          <div className="p-4 rounded-lg bg-green-900/20 border border-green-800/30">
            <div className="flex gap-3">
              <Lightbulb className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-green-300 mb-1">
                  {translatedOpportunity}
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {opportunity}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-slate-200">{translatedViewTitle}</h4>
              <span className="text-xs px-2 py-1 rounded-full border border-slate-700 text-slate-300">
                {confidenceLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">{confidenceHint}</p>
            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              {trendView === "daily"
                ? translatedDailyExplanation
                : trendView === "weekly"
                  ? translatedWeeklyExplanation
                  : translatedMonthlyExplanation}
            </p>
          </div>
          <p className="text-xs text-slate-500 -mt-1">
            Hover over any point in the chart to review the exact date, the revenue value, and the AI explanation for that period.
          </p>
        </div>
      )}

      {!isLoading && (
        <div className="mt-1 rounded-lg border border-slate-700 bg-slate-900/30 p-4">
          <h4 className="text-sm font-semibold text-slate-200 mb-2">{translatedSummaryTitle}</h4>
          <p className="text-sm text-slate-300 leading-relaxed">{chartSummary}</p>
        </div>
      )}

      <p className="text-xs text-slate-500 mt-4">
        {translatedFooter}
      </p>
    </motion.div>
  );
}
