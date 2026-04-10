/**
 * Data aggregation utilities for large CSV uploads
 * Helps render charts efficiently by reducing data points while maintaining trends
 */

export interface AggregationMetadata {
  isAggregated: boolean;
  originalCount: number;
  aggregatedCount: number;
  aggregationRatio: number;
}

export type RevenueGranularity = "daily" | "weekly" | "monthly";

export interface RevenueSeriesPoint {
  day: string;
  revenue: number;
  date: string;
}

/**
 * Aggregate data to a target number of points using chunking and averaging
 * @param rawData - Array of data records
 * @param targetPoints - Target number of aggregated points (default: 50)
 * @param aggregateKey - Key to aggregate on (e.g., 'amount', 'revenue')
 * @returns Aggregated data array with metadata
 */
export function aggregateData(
  rawData: any[],
  targetPoints: number = 50,
  aggregateKey: string = "amount"
): { data: any[]; metadata: AggregationMetadata } {
  if (!rawData || rawData.length === 0) {
    return {
      data: [],
      metadata: {
        isAggregated: false,
        originalCount: 0,
        aggregatedCount: 0,
        aggregationRatio: 1,
      },
    };
  }

  // If data is already small, return as-is
  if (rawData.length <= targetPoints) {
    return {
      data: rawData,
      metadata: {
        isAggregated: false,
        originalCount: rawData.length,
        aggregatedCount: rawData.length,
        aggregationRatio: 1,
      },
    };
  }

  const chunkSize = Math.ceil(rawData.length / targetPoints);
  const aggregatedData: any[] = [];

  for (let i = 0; i < rawData.length; i += chunkSize) {
    const chunk = rawData.slice(i, i + chunkSize);

    if (chunk.length === 0) continue;

    // Calculate average for numeric fields in the chunk
    const aggregatedRecord: any = { ...chunk[0] };

    // Sum numeric values
    let sumValue = 0;
    let countValue = 0;

    for (const record of chunk) {
      const val = parseFloat(record[aggregateKey]);
      if (!isNaN(val)) {
        sumValue += val;
        countValue++;
      }
    }

    // Set averaged value back
    if (countValue > 0) {
      aggregatedRecord[aggregateKey] = Math.round(sumValue / countValue);
    }

    // For date fields, use the first date in chunk as representative
    if (aggregatedRecord.sale_date || aggregatedRecord.date) {
      aggregatedRecord.date_label = `${aggregatedRecord.sale_date || aggregatedRecord.date} (${chunk.length} records)`;
    }

    aggregatedData.push(aggregatedRecord);
  }

  return {
    data: aggregatedData,
    metadata: {
      isAggregated: true,
      originalCount: rawData.length,
      aggregatedCount: aggregatedData.length,
      aggregationRatio: Math.round((chunkSize * 100) / rawData.length),
    },
  };
}

/**
 * Determine if animations should be disabled based on data size
 * @param dataLength - Length of the data array
 * @returns boolean indicating if animations should be disabled
 */
export function shouldDisableAnimations(dataLength: number): boolean {
  return dataLength > 500;
}

/**
 * Generate a human-readable aggregation message
 * @param metadata - Aggregation metadata
 * @returns String message describing the aggregation
 */
export function getAggregationMessage(metadata: AggregationMetadata): string {
  if (!metadata.isAggregated) {
    return "";
  }
  return `Showing aggregated trends (${metadata.aggregatedCount} points) from ${metadata.originalCount.toLocaleString()} records.`;
}

function toIsoDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Monday-based week start
  const day = d.getDay(); // 0 = Sun, 1 = Mon
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function aggregateRevenueSeries(
  records: Array<{ sale_date: string; amount: number }>,
  granularity: RevenueGranularity,
  largeDatasetThreshold: number = 500
): {
  data: RevenueSeriesPoint[];
  metadata: AggregationMetadata;
  effectiveGranularity: RevenueGranularity;
} {
  if (!records || records.length === 0) {
    return {
      data: [],
      metadata: {
        isAggregated: false,
        originalCount: 0,
        aggregatedCount: 0,
        aggregationRatio: 1,
      },
      effectiveGranularity: granularity,
    };
  }

  const effectiveGranularity: RevenueGranularity =
    granularity === "daily" && records.length > largeDatasetThreshold
      ? "weekly"
      : granularity;

  const sorted = [...records].sort(
    (a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime()
  );

  if (effectiveGranularity === "daily") {
    const data: RevenueSeriesPoint[] = sorted.map((row, idx) => ({
      day: `Day ${idx + 1}`,
      revenue: Number(row.amount || 0),
      date: row.sale_date,
    }));

    return {
      data,
      metadata: {
        isAggregated: false,
        originalCount: data.length,
        aggregatedCount: data.length,
        aggregationRatio: 1,
      },
      effectiveGranularity,
    };
  }

  const buckets = new Map<string, number>();
  const labels = new Map<string, string>();

  for (const row of sorted) {
    const date = new Date(row.sale_date);
    if (isNaN(date.getTime())) continue;

    let key = "";
    let label = "";

    if (effectiveGranularity === "weekly") {
      const weekStart = getWeekStart(date);
      key = toIsoDate(weekStart);
      label = key;
    } else {
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      key = toIsoDate(monthStart);
      label = monthStart.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    }

    buckets.set(key, (buckets.get(key) || 0) + Number(row.amount || 0));
    if (!labels.has(key)) {
      labels.set(key, label);
    }
  }

  const data: RevenueSeriesPoint[] = Array.from(buckets.entries())
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([key, value], idx) => ({
      day:
        effectiveGranularity === "weekly"
          ? `Week ${idx + 1}`
          : labels.get(key) || `Month ${idx + 1}`,
      revenue: Math.round(value),
      date: labels.get(key) || key,
    }));

  return {
    data,
    metadata: {
      isAggregated: true,
      originalCount: sorted.length,
      aggregatedCount: data.length,
      aggregationRatio:
        sorted.length > 0 ? Math.max(1, Math.round(sorted.length / data.length)) : 1,
    },
    effectiveGranularity,
  };
}
