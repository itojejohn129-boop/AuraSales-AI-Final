import { SalesRecord } from "@/lib/ml-engine";

export function sevenDayAverage(data: SalesRecord[]) {
  if (!data || data.length === 0) return { average: 0, today: 0 };
  const slice = data.slice(-7);
  const sum = slice.reduce((s, d) => s + (d.amount || 0), 0);
  const avg = slice.length ? sum / slice.length : 0;
  const today = data[data.length - 1]?.amount || 0;
  return { average: avg, today };
}

export function isSignificantDrop(today: number, average: number, threshold = 0.6) {
  if (average === 0) return false;
  return today < average * threshold;
}
