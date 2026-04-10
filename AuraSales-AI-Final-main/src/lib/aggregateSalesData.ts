export interface AggregatedItem {
  name: string;
  value: number;
}

/**
 * Aggregate raw sales rows by a given field and sum the numeric valueKey.
 * - Keeps topN categories and groups the rest into 'Other Sales'
 * - Merges any categories under minPercent of total into the 'Other Sales' bucket
 */
export function aggregateSalesData(
  rawData: any[],
  groupByField: string,
  valueKey = "amount",
  topN = 9,
  minPercent = 0.02
): AggregatedItem[] {
  const map = new Map<string, number>();
  for (const r of rawData || []) {
    const k = (r[groupByField] as string) || "Other";
    const v = Number(r[valueKey] ?? 0) || 0;
    map.set(k, (map.get(k) || 0) + v);
  }

  const entries = Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  const total = entries.reduce((s, e) => s + e.value, 0) || 0;

  // First, sort descending
  entries.sort((a, b) => b.value - a.value);

  // Partition very small items (under minPercent)
  const smalls: AggregatedItem[] = [];
  const larges: AggregatedItem[] = [];
  for (const e of entries) {
    if (total > 0 && e.value / total < minPercent) smalls.push(e);
    else larges.push(e);
  }

  // If too many larges (more than topN), move lowest larges into other bucket
  let result: AggregatedItem[] = [];
  if (larges.length > topN) {
    const top = larges.slice(0, topN);
    const rest = larges.slice(topN);
    const restSum = rest.reduce((s, r) => s + r.value, 0);
    const smallsSum = smalls.reduce((s, r) => s + r.value, 0);
    const otherSum = restSum + smallsSum;
    result = [...top];
    if (otherSum > 0) result.push({ name: "Other Sales", value: otherSum });
  } else {
    // Not too many larges. Merge smalls into Other if they exist
    result = [...larges];
    const smallsSum = smalls.reduce((s, r) => s + r.value, 0);
    if (smallsSum > 0) result.push({ name: "Other Sales", value: smallsSum });
  }

  return result;
}

export default aggregateSalesData;
