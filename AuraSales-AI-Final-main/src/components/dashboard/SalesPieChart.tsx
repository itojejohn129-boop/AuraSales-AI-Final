'use client';

import React, { useEffect, useRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, PieLabelRenderProps } from "recharts";
import type { Formatter, NameType, Payload, ValueType } from "recharts/types/component/DefaultTooltipContent";

const COLORS = [
  "#0ea5e9",
  "#14b8a6",
  "#3b82f6",
  "#06b6d4",
  "#1d4ed8",
  "#0d9488",
  "#2563eb",
  "#0284c7",
  "#0891b2",
  "#60a5fa",
  "#0f766e",
  "#38bdf8",
];

type SalesRow = Record<string, unknown>;
type PieDatum = { name: string; value: number };

interface SalesPieChartProps {
  data: Array<unknown>;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

// Standalone label renderer for Pie
function renderLabel(props: PieLabelRenderProps) {
  const { payload } = props;
  const name = payload && typeof payload.name === "string" ? payload.name : "";
  const value = payload && typeof payload.value === "number" ? payload.value : 0;
  return `${name}: ${currencyFormatter.format(Number(value))}`;
}

function normalizePieData(data: Array<unknown>): { error: string | null; data: PieDatum[] } {
  if (!data || !data.length) return { error: "No data provided.", data: [] };

  const hasNameValueShape = data.every((row) => {
    const candidate = row as PieDatum;
    return typeof candidate?.name === "string" && Number.isFinite(Number(candidate?.value));
  });
  if (hasNameValueShape) {
    const normalized = (data as PieDatum[])
      .map((row) => ({
        name: String(row.name || "Unknown"),
        value: Number(row.value || 0),
      }))
      .filter((row) => Number.isFinite(row.value) && row.value > 0);
    return { error: null, data: normalized };
  }

  const keys = Array.from(new Set(data.flatMap((row) => Object.keys((row as Record<string, unknown>) || {}))));
  const cleanedKeys = keys.map(key => ({
    original: key,
    clean: key.toLowerCase().trim().replace(/[^a-z0-9]/g, "")
  }));

  const preferredCategoryKeys = ["product", "product_name", "item", "name", "category", "type"];
  let matchedKey = preferredCategoryKeys.find((key) => keys.includes(key)) || null;

  if (!matchedKey) {
    const fuzzyKeywords = ["prod", "cat", "item", "type", "name"];
    for (const keyword of fuzzyKeywords) {
      const found = cleanedKeys.find(k => k.clean.includes(keyword));
      if (found) {
        matchedKey = found.original;
        break;
      }
    }
  }

  if (!matchedKey && cleanedKeys.length > 0) {
    matchedKey = cleanedKeys[0].original;
  }

  if (!matchedKey) {
    return { error: `No valid category field found. Available keys: ${keys.join(", ")}` , data: [] };
  }

  const fallbackCategoryKeys = ["product_name", "product", "item", "name", "category", "type"];
  const getCategoryName = (row: SalesRow): string => {
    const primary = row?.[matchedKey];
    if (primary !== undefined && primary !== null && String(primary).trim() !== "") {
      return String(primary).trim();
    }

    for (const key of fallbackCategoryKeys) {
      const value = row?.[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value).trim();
      }
    }

    return "Other";
  };

  const amountKey = keys.find((k) => {
    const lower = k.toLowerCase();
    return (
      lower.includes("amount") ||
      lower.includes("price") ||
      lower.includes("total") ||
      lower.includes("sales") ||
      lower.includes("revenue") ||
      lower.includes("value")
    );
  }) || "amount";

  // Case-insensitive aggregation: lowercase key for totals, first-seen original label for display.
  const bucket = new Map<string, number>();
  const labelMap = new Map<string, string>();

  data.forEach((row) => {
    const typedRow = row as SalesRow;
    const rawName = getCategoryName(typedRow);
    const categoryName = rawName === "" ? "Other" : rawName;
    const categoryKey = categoryName.toLocaleLowerCase();
    const amount = Number(typedRow[amountKey] || 0);

    if (!isNaN(amount)) {
      if (!labelMap.has(categoryKey)) {
        labelMap.set(categoryKey, categoryName);
      }
      bucket.set(categoryKey, (bucket.get(categoryKey) || 0) + amount);
    }
  });

  // Convert to array and sort by value descending
  const pieDataRaw: PieDatum[] = Array.from(bucket.entries())
    .map(([key, value]) => ({ name: labelMap.get(key) || key, value }))
    .sort((a, b) => b.value - a.value);

  // Keep only the top 10 categories so the chart stays readable.
  const pieData = pieDataRaw.slice(0, 10);

  return { error: null, data: pieData };
}

export default function SalesPieChart({ data }: SalesPieChartProps) {
  const { error, data: pieData } = normalizePieData(data);
  const totalSales = pieData.reduce((sum, d) => sum + d.value, 0);
  const chartHostRef = useRef<HTMLDivElement | null>(null);
  const [canRenderChart, setCanRenderChart] = useState(false);

  useEffect(() => {
    const host = chartHostRef.current;
    if (!host) return;

    const updateChartReady = () => {
      const rect = host.getBoundingClientRect();
      setCanRenderChart(rect.width > 0 && rect.height > 0);
    };

    updateChartReady();
    const observer = new ResizeObserver(updateChartReady);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const tooltipFormatter: Formatter<ValueType, NameType> = (
    value,
    _name,
    item: Payload<ValueType, NameType>
  ) => {
    const safeValue = typeof value === "number" ? value : Number(value) || 0;
    const pct = totalSales > 0 ? ((safeValue / totalSales) * 100).toFixed(1) : "0.0";
    const formatted = `${currencyFormatter.format(safeValue)} (${pct}%)`;
    const productTitle =
      typeof item?.payload?.name === "string" ? item.payload.name : "Product";

    return [formatted, productTitle];
  };

  if (error) return <div className="text-red-500 p-4 bg-red-500/10 rounded-lg border border-red-500/20">{error}</div>;
  if (!pieData.length) return <div className="text-slate-400 p-4 text-center">No Sales Data Found</div>;

  return (
    <div className="w-full space-y-4">
      <div ref={chartHostRef} className="w-full h-[350px] min-h-[350px]">
        {canRenderChart ? (
          <ResponsiveContainer width="100%" height="100%" minHeight={350}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={renderLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                  color: "#f8fafc"
                }}
                itemStyle={{ color: "#f8fafc" }}
                formatter={tooltipFormatter}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full animate-pulse rounded-lg border border-slate-700/60 bg-slate-800/40" />
        )}
      </div>
      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <h4 className="text-sm font-semibold text-slate-50 mb-2">What this means</h4>
        <p className="text-xs text-slate-300 mb-4">
          The chart shows your top 10 products only, so the largest slices are your strongest sellers. Focus on the
          top items to grow revenue faster and keep the report easy to read.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {pieData.map((item, index) => {
            const percent = totalSales > 0 ? ((item.value / totalSales) * 100).toFixed(1) : "0.0";
            return (
              <div
                key={item.name}
                className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-200"
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <span className="shrink-0 text-slate-400">
                  {currencyFormatter.format(item.value)} ({percent}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { normalizePieData };
