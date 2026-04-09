"use client";

import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export interface SentimentGaugeProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
}

/**
 * SentimentGauge Component
 * Displays a doughnut gauge chart with sentiment color coding
 * Color Logic: 0-40 (Red), 41-60 (Yellow), 61-100 (Green)
 */
export function SentimentGauge({
  score,
  size = 280,
  strokeWidth = 30,
}: SentimentGaugeProps) {
  // Clamp score between 0-100
  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine color based on score
  const getColor = (value: number): string => {
    if (value <= 40) return "#ef4444"; // Red
    if (value <= 60) return "#eab308"; // Yellow
    return "#10b981"; // Green
  };

  const color = getColor(clampedScore);
  const remainingScore = 100 - clampedScore;

  // Data for doughnut chart
  const data = [
    { name: "Sentiment", value: clampedScore, fill: color },
    { name: "Remaining", value: remainingScore, fill: "#e5e7eb" },
  ];

  // Label for center of gauge
  const getLabel = (value: number): string => {
    if (value <= 40) return "Negative";
    if (value <= 60) return "Neutral";
    return "Positive";
  };

  const label = getLabel(clampedScore);

  return (
    <div className="flex flex-col items-center justify-center">
      <ResponsiveContainer width={size} height={size}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.35}
            outerRadius={size * 0.5}
            paddingAngle={2}
            dataKey="value"
            startAngle={180}
            endAngle={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center display */}
      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
        <div className="text-4xl font-bold" style={{ color }}>
          {clampedScore}
        </div>
        <div className="text-sm font-semibold text-gray-600">{label}</div>
      </div>
    </div>
  );
}

export default SentimentGauge;
