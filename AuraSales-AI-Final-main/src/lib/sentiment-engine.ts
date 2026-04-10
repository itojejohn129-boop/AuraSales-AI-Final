/**
 * Sentiment Analysis and Risk Calculation Utilities
 */

export type TrendType = "up" | "down" | "stable";

export interface SentimentAnalysis {
  averageScore: number;
  trend: TrendType;
  positive: number;
  negative: number;
  neutral: number;
}

export interface AuraRisk {
  isAtRisk: boolean;
  riskLevel: "low" | "medium" | "high";
  message: string;
  details: string;
}

/**
 * Calculate AURA Risk based on revenue and sentiment trends
 *
 * Logic: If revenueTrend === 'up' AND sentimentTrend === 'down', trigger a "Future Risk Alert"
 *
 * @param revenueTrend - Direction of revenue: 'up', 'down', or 'stable'
 * @param sentimentTrend - Direction of sentiment: 'up', 'down', or 'stable'
 * @returns Risk assessment object
 */
export function calculateAuraRisk(
  revenueTrend: TrendType,
  sentimentTrend: TrendType
): AuraRisk {
  // High risk: Revenue up but sentiment down
  if (revenueTrend === "up" && sentimentTrend === "down") {
    return {
      isAtRisk: true,
      riskLevel: "high",
      message: "⚠️ AURA RISK ALERT",
      details:
        "Sales are rising, but customer happiness is dropping. This indicates potential churn or brand fatigue in the coming 30 days.",
    };
  }

  // Medium risk: Revenue down and sentiment down
  if (revenueTrend === "down" && sentimentTrend === "down") {
    return {
      isAtRisk: true,
      riskLevel: "medium",
      message: "⚠️ BUSINESS DECLINE ALERT",
      details:
        "Both sales and customer satisfaction are declining. Immediate action is needed to reverse this trend.",
    };
  }

  // Low risk: Revenue stable or down, sentiment stable or up
  if (revenueTrend === "down" && sentimentTrend === "up") {
    return {
      isAtRisk: false,
      riskLevel: "low",
      message: "✓ RECOVERY OPPORTUNITY",
      details:
        "Customer sentiment is improving despite declining sales. This is a positive indicator for recovery.",
    };
  }

  // No risk: Revenue up and sentiment up
  if (revenueTrend === "up" && sentimentTrend === "up") {
    return {
      isAtRisk: false,
      riskLevel: "low",
      message: "✓ EXCELLENT PERFORMANCE",
      details: "Sales and customer satisfaction are both increasing. Maintain current strategies.",
    };
  }

  // Stable revenue, trend depends on sentiment
  if (revenueTrend === "stable" && sentimentTrend === "down") {
    return {
      isAtRisk: true,
      riskLevel: "medium",
      message: "⚠️ SENTIMENT DECLINE",
      details:
        "Customer satisfaction is declining while sales remain flat. This could lead to future revenue loss.",
    };
  }

  if (revenueTrend === "stable" && sentimentTrend === "up") {
    return {
      isAtRisk: false,
      riskLevel: "low",
      message: "✓ IMPROVING SENTIMENT",
      details: "Customer satisfaction is improving while sales remain stable. Good foundation for growth.",
    };
  }

  // Default: stable/stable
  return {
    isAtRisk: false,
    riskLevel: "low",
    message: "✓ STEADY STATE",
    details: "Business metrics are stable. Monitor for any changes.",
  };
}

/**
 * Determine trend based on score change
 *
 * @param previous - Previous score/metric value
 * @param current - Current score/metric value
 * @param threshold - Percentage change threshold to consider significant (default: 5%)
 * @returns Trend direction
 */
export function calculateTrend(
  previous: number,
  current: number,
  threshold: number = 5
): TrendType {
  if (previous === 0) return current > 0 ? "up" : "stable";

  const changePercent = Math.abs((current - previous) / previous) * 100;

  if (changePercent < threshold) {
    return "stable";
  }

  return current > previous ? "up" : "down";
}

/**
 * Extract negative feedback from sentiment scores
 *
 * @param scores - Array of sentiment scores
 * @param limit - Maximum number of comments to return
 * @returns Top negative comments sorted by negativity
 */
export function getTopNegativeComments(
  scores: Array<{ text: string; score: number; label: string }>,
  limit: number = 3
): Array<{ text: string; score: number }> {
  return scores
    .filter((s) => s.label === "Negative")
    .sort((a, b) => a.score - b.score) // Lower scores first (more negative)
    .slice(0, limit)
    .map((s) => ({ text: s.text, score: s.score }));
}

/**
 * Aggregate sentiment statistics
 *
 * @param scores - Array of sentiment scores
 * @returns Aggregated sentiment analysis
 */
export function aggregateSentimentStats(
  scores: Array<{ score: number; label: string }>
): SentimentAnalysis {
  const total = scores.length;
  if (total === 0) {
    return {
      averageScore: 0,
      trend: "stable",
      positive: 0,
      negative: 0,
      neutral: 0,
    };
  }

  const positive = scores.filter((s) => s.label === "Positive").length;
  const negative = scores.filter((s) => s.label === "Negative").length;
  const neutral = scores.filter((s) => s.label === "Neutral").length;
  const averageScore = Math.round(
    scores.reduce((sum, s) => sum + s.score, 0) / total
  );

  return {
    averageScore,
    trend: "stable", // Default to stable; should be calculated with historical data
    positive,
    negative,
    neutral,
  };
}
