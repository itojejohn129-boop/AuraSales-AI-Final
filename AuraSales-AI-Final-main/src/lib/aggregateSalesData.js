// JS copy of aggregateSalesData for node scripts (mirrors TypeScript implementation)
function aggregateSalesData(rawData, groupByField, valueKey = "amount", topN = 9, minPercent = 0.02) {
  const map = new Map();
  for (const r of rawData || []) {
    const k = (r[groupByField]) || "Other";
    const v = Number(r[valueKey] ?? 0) || 0;
    map.set(k, (map.get(k) || 0) + v);
  }

  const entries = Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  const total = entries.reduce((s, e) => s + e.value, 0) || 0;

  entries.sort((a, b) => b.value - a.value);

  const smalls = [];
  const larges = [];
  for (const e of entries) {
    if (total > 0 && e.value / total < minPercent) smalls.push(e);
    else larges.push(e);
  }

  let result = [];
  if (larges.length > topN) {
    const top = larges.slice(0, topN);
    const rest = larges.slice(topN);
    const restSum = rest.reduce((s, r) => s + r.value, 0);
    const smallsSum = smalls.reduce((s, r) => s + r.value, 0);
    const otherSum = restSum + smallsSum;
    result = [...top];
    if (otherSum > 0) result.push({ name: "Other Sales", value: otherSum });
  } else {
    result = [...larges];
    const smallsSum = smalls.reduce((s, r) => s + r.value, 0);
    if (smallsSum > 0) result.push({ name: "Other Sales", value: smallsSum });
  }

  return result;
}

module.exports = { aggregateSalesData };
