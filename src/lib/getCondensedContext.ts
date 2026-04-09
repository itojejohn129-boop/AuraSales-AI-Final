export default function getCondensedContext(csvContent: string | undefined, dashboardData: any) {
  if (!csvContent) return { condensedCsv: null, reason: null };
  const raw = String(csvContent);
  if (raw.length <= 5000) return { condensedCsv: raw, reason: null };

  // Extract header row (first non-empty line)
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = lines.length ? lines[0] : null;

  // Try to extract high level totals from dashboardData (common fields)
  let totals: string[] = [];
  try {
    if (dashboardData && typeof dashboardData === "object") {
      const s = dashboardData.summary || dashboardData.totals || dashboardData;
      if (s) {
        if (s.totalRevenue) totals.push(`TotalRevenue: ${s.totalRevenue}`);
        if (s.recordCount) totals.push(`RecordCount: ${s.recordCount}`);
        if (s.topProducts) totals.push(`TopProducts: ${JSON.stringify(s.topProducts).slice(0,200)}`);
        if (s.topRegions) totals.push(`TopRegions: ${JSON.stringify(s.topRegions).slice(0,200)}`);
      }
    }
  } catch (e) {
    // ignore
  }

  const condensedParts = [] as string[];
  if (header) condensedParts.push(`CSV Header: ${header}`);
  if (totals.length) condensedParts.push(`Dashboard totals: ${totals.join('; ')}`);
  condensedParts.push(`Note: original CSV truncated to header + dashboard totals due to size (${raw.length} chars).`);

  return { condensedCsv: condensedParts.join('\n'), reason: 'truncated' };
}
