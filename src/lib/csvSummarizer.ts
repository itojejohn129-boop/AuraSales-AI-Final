/**
 * Centralized CSV summarization utility
 * Converts raw CSV data into high-level business metrics
 * Prevents "Request Entity Too Large" errors by avoiding raw data transmission
 */

export interface DataSummary {
  recordCount: number;
  totalRevenue: number;
  averageTransaction: number;
  transactionRange: {
    min: number;
    max: number;
  };
  topProducts: Array<{
    name: string;
    revenue: number;
  }>;
  worstProducts: Array<{
    name: string;
    revenue: number;
  }>;
  topRegions: Array<{
    name: string;
    revenue: number;
  }>;
  averageSentimentScore: number | null;
  trend: {
    description: string;
    percentChange: number;
  };
}

/**
 * Summarizes CSV data into key business metrics
 * Instead of sending raw CSV content, this creates a compact summary object
 * that reduces payload size by 90%+ while preserving strategic insights
 */
export function summarizeCSVData(rawData: any[]): DataSummary {
  if (!Array.isArray(rawData) || rawData.length === 0) {
    return {
      recordCount: 0,
      totalRevenue: 0,
      averageTransaction: 0,
      transactionRange: { min: 0, max: 0 },
      topProducts: [],
      worstProducts: [],
      topRegions: [],
      averageSentimentScore: null,
      trend: { description: "No data available", percentChange: 0 },
    };
  }

  // Extract and validate revenue amounts
  const amounts = rawData
    .map((r: any) => {
      const amount = Number(r.amount) || Number(r.revenue) || 0;
      return amount;
    })
    .filter((a) => !isNaN(a) && a > 0);

  const totalRevenue = amounts.reduce((sum, a) => sum + a, 0);
  const averageTransaction = amounts.length > 0 ? totalRevenue / amounts.length : 0;
  const maxTransaction = amounts.length > 0 ? Math.max(...amounts) : 0;
  const minTransaction = amounts.length > 0 ? Math.min(...amounts) : 0;

  // Product analysis - identify top and bottom performers
  const productMap = new Map<string, number>();
  rawData.forEach((r: any) => {
    const product = r.product_name || r.product || "Unknown";
    const amount = Number(r.amount) || Number(r.revenue) || 0;
    productMap.set(product, (productMap.get(product) || 0) + amount);
  });

  const sortedProducts = Array.from(productMap.entries()).sort((a, b) => b[1] - a[1]);

  const topProducts = sortedProducts.slice(0, 5).map((p) => ({
    name: p[0],
    revenue: Math.round(p[1]),
  }));

  const worstProducts = sortedProducts
    .slice(Math.max(0, sortedProducts.length - 5))
    .reverse()
    .map((p) => ({
      name: p[0],
      revenue: Math.round(p[1]),
    }));

  // Regional analysis - identify geographic strengths
  const regionMap = new Map<string, number>();
  rawData.forEach((r: any) => {
    const region = r.region || r.location || r.area || "Unknown";
    const amount = Number(r.amount) || Number(r.revenue) || 0;
    regionMap.set(region, (regionMap.get(region) || 0) + amount);
  });

  const topRegions = Array.from(regionMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((r) => ({
      name: r[0],
      revenue: Math.round(r[1]),
    }));

  // Sentiment analysis - calculate average customer sentiment if available
  let averageSentiment = 0;
  let sentimentCount = 0;
  rawData.forEach((r: any) => {
    const sentiment =
      r.sentiment_score ||
      r.additional_data?.sentiment_score ||
      r.customer_sentiment ||
      null;
    if (sentiment && !isNaN(Number(sentiment))) {
      averageSentiment += Number(sentiment);
      sentimentCount++;
    }
  });

  if (sentimentCount > 0) {
    averageSentiment = Math.round(averageSentiment / sentimentCount);
  }

  // Trend detection - compare recent vs earlier performance
  const recentHalf = rawData.slice(Math.floor(rawData.length / 2));
  const earlierHalf = rawData.slice(0, Math.floor(rawData.length / 2));

  const recentRevenue =
    recentHalf.length > 0 ? recentHalf.reduce((sum, r) => sum + (Number(r.amount) || Number(r.revenue) || 0), 0) / recentHalf.length : 0;
  const earlierRevenue =
    earlierHalf.length > 0 ? earlierHalf.reduce((sum, r) => sum + (Number(r.amount) || Number(r.revenue) || 0), 0) / earlierHalf.length : 0;

  const trendPercent =
    earlierRevenue !== 0
      ? Math.round(((recentRevenue - earlierRevenue) / earlierRevenue) * 100)
      : 0;

  const trendDescription =
    trendPercent > 0
      ? `Sales increased by ${trendPercent}% in recent period`
      : trendPercent < 0
        ? `Sales decreased by ${Math.abs(trendPercent)}% in recent period`
        : "Sales remain stable";

  return {
    recordCount: rawData.length,
    totalRevenue: Math.round(totalRevenue),
    averageTransaction: Math.round(averageTransaction),
    transactionRange: {
      min: Math.round(minTransaction),
      max: Math.round(maxTransaction),
    },
    topProducts,
    worstProducts,
    topRegions,
    averageSentimentScore: sentimentCount > 0 ? averageSentiment : null,
    trend: {
      description: trendDescription,
      percentChange: trendPercent,
    },
  };
}

/**
 * Format summary data into a readable text snippet for AI context
 * Keeps output under specified character limit
 */
export function formatSummaryForPrompt(summary: DataSummary, maxChars: number = 2000): string {
  const parts: string[] = [
    `📊 Business Summary Data`,
    `Records: ${summary.recordCount}`,
    `Total Revenue: $${summary.totalRevenue}`,
    `Avg Transaction: $${summary.averageTransaction}`,
    `Range: $${summary.transactionRange.min} - $${summary.transactionRange.max}`,
    ``,
    `🏆 Top Products:`,
    ...summary.topProducts.map((p) => `  • ${p.name}: $${p.revenue}`),
    ``,
    `📉 Weakest Products:`,
    ...summary.worstProducts.map((p) => `  • ${p.name}: $${p.revenue}`),
    ``,
    `🗺️ Top Regions:`,
    ...summary.topRegions.map((r) => `  • ${r.name}: $${r.revenue}`),
    ``,
    `📈 Trend: ${summary.trend.description}`,
  ];

  if (summary.averageSentimentScore !== null) {
    parts.push(`💬 Customer Sentiment: ${summary.averageSentimentScore}/100`);
  }

  let output = parts.join("\n");

  // Truncate if necessary
  if (output.length > maxChars) {
    output = output.slice(0, maxChars) + "\n[truncated for brevity]";
  }

  return output;
}
