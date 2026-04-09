"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { aggregateData, shouldDisableAnimations, getAggregationMessage, AggregationMetadata } from "@/utils/dataUtils";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

interface ForecastResult {
  value: number;
  confidence: number;
}

interface WhatIfSimulatorProps {
  forecasts: ForecastResult[];
  originalForecasts: ForecastResult[];
  onSimulate?: (multiplier: number) => void;
  targetLanguage?: string;
}

export function WhatIfSimulator({
  forecasts,
  originalForecasts,
  onSimulate,
  targetLanguage = "en",
}: WhatIfSimulatorProps) {
  const [marketingMultiplier, setMarketingMultiplier] = useState(1);
  const [chartAggregationMeta, setChartAggregationMeta] = useState<AggregationMetadata>({
    isAggregated: false,
    originalCount: 0,
    aggregatedCount: 0,
    aggregationRatio: 1,
  });

  // Calculate the adjusted forecasts
  const adjustedForecasts = useMemo(() => {
    const bump = (marketingMultiplier - 1) * 0.003;
    return originalForecasts.map((f) => ({
      value: f.value * (1 + bump),
      confidence: f.confidence,
    }));
  }, [marketingMultiplier, originalForecasts]);

  // Prepare chart data with aggregation for large datasets
  const chartData = useMemo(() => {
    const baseData = originalForecasts.map((original, idx) => ({
      day: idx + 1,
      current: Math.round(original.value),
      adjusted: Math.round(adjustedForecasts[idx].value),
    }));

    // Aggregate if data is too large (> 100 points)
    if (baseData.length > 100) {
      const { data: aggregated, metadata } = aggregateData(baseData, 50, "current");
      setChartAggregationMeta(metadata);
      return aggregated;
    } else {
      setChartAggregationMeta({
        isAggregated: false,
        originalCount: baseData.length,
        aggregatedCount: baseData.length,
        aggregationRatio: 1,
      });
      return baseData;
    }
  }, [originalForecasts, adjustedForecasts]);

  // Calculate total impact
  const totalImpactPercent = (marketingMultiplier - 1) * 100;
  const impactAmount = useMemo(() => {
    const originalTotal = originalForecasts.reduce((sum, f) => sum + f.value, 0);
    const adjustedTotal = adjustedForecasts.reduce((sum, f) => sum + f.value, 0);
    return adjustedTotal - originalTotal;
  }, [originalForecasts, adjustedForecasts]);

  const [
    translatedTitle,
    translatedAdjustment,
    translatedCurrent,
    translatedAssumptionTitle,
    translatedAssumptionBody,
    translatedFooterBody,
    translatedDaysAhead,
    translatedCurrentLabel,
    translatedAdjustedLabel,
  ] = useTranslatedTexts(targetLanguage, [
    "What-If Simulator",
    "Marketing Spend Adjustment",
    "0% (current)",
    "Assumption:",
    "Each 1% increase in marketing spend boosts conversion by 0.3%.",
    "This is a simulation tool. Actual results depend on market conditions and campaign execution.",
    "Days Ahead",
    "Current Forecast",
    "Adjusted Forecast",
  ]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setMarketingMultiplier(value);
    onSimulate?.(value);
  };

  return (
    <motion.div
      data-aura-translate-skip
      className="p-6 rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-md"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-semibold text-slate-50">{translatedTitle}</h3>
      </div>

      {/* Marketing Spend Slider */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-slate-300">
            {translatedAdjustment}
          </label>
          <div className="text-right">
            <p className="text-lg font-bold text-green-400">
              {totalImpactPercent > 0 ? "+" : ""}
              {totalImpactPercent.toFixed(0)}%
            </p>
            <p className="text-xs text-slate-400">
              {totalImpactPercent > 0 ? "+" : ""}
              ${impactAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={marketingMultiplier}
          onChange={handleSliderChange}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />

        <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
          <span>-50%</span>
            <span>{translatedCurrent}</span>
            <span>+100%</span>
          </div>
        </div>

      {/* Chart */}
      <div className="mb-6 -mx-6 px-6">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis stroke="#94a3b8" label={{ value: translatedDaysAhead, position: "insideBottomRight", offset: -5 }} />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#cbd5e1" }}
            />
            <Line
              type="monotone"
              dataKey="current"
              stroke="#64748b"
              name={translatedCurrentLabel}
              strokeWidth={2}
              dot={shouldDisableAnimations(chartData.length) ? { r: 0 } : false}
              isAnimationActive={!shouldDisableAnimations(chartData.length)}
            />
            <Line
              type="monotone"
              dataKey="adjusted"
              stroke="#10b981"
              name={translatedAdjustedLabel}
              strokeWidth={2}
              dot={shouldDisableAnimations(chartData.length) ? { r: 0 } : false}
              strokeDasharray="5 5"
              isAnimationActive={!shouldDisableAnimations(chartData.length)}
            />
          </LineChart>
        </ResponsiveContainer>
        {chartAggregationMeta.isAggregated && (
          <p className="text-xs text-slate-400 mt-2">{getAggregationMessage(chartAggregationMeta)}</p>
        )}
      </div>

      {/* Impact Summary */}
      <div className="p-4 rounded-lg bg-slate-700/20 border border-slate-600/30">
        <p className="text-sm text-slate-300 mb-2">
          <span className="font-medium">{translatedAssumptionTitle}</span> {translatedAssumptionBody}
        </p>
        <p className="text-xs text-slate-400">
          {translatedFooterBody}
        </p>
      </div>
    </motion.div>
  );
}
