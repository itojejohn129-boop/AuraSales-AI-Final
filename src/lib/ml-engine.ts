/**
 * AuraSales ML Engine
 * Exponential Smoothing and Linear Regression for sales forecasting
 */

export interface SalesDataPoint {
  date: string;
  sales: number;
}

export interface ForecastResult {
  value: number;
  confidence: number;
}

/**
 * Exponential Smoothing (Simple Exponential Smoothing)
 * Useful for capturing trend in sales data
 * @param data Array of sales values
 * @param alpha Smoothing factor (0-1), typically 0.3
 * @returns Smoothed values
 */
export function exponentialSmoothing(data: number[], alpha: number = 0.3): number[] {
  if (data.length === 0) return [];
  if (alpha < 0 || alpha > 1) throw new Error("Alpha must be between 0 and 1");

  const smoothed: number[] = [data[0]];

  for (let i = 1; i < data.length; i++) {
    const prevSmoothed = smoothed[i - 1];
    const currentValue = data[i];
    const newSmoothed = alpha * currentValue + (1 - alpha) * prevSmoothed;
    smoothed.push(newSmoothed);
  }

  return smoothed;
}

/**
 * Linear Regression using Least Squares Method
 * Returns slope and intercept for the line: y = mx + b
 */
export function linearRegression(
  data: number[]
): {
  slope: number;
  intercept: number;
  r_squared: number;
} {
  if (data.length < 2) {
    // Fallback to a flat trend when data is insufficient for regression.
    return {
      slope: 0,
      intercept: data.length === 1 ? data[0] : 0,
      r_squared: data.length === 1 ? 1 : 0,
    };
  }

  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i); // 0, 1, 2, ...

  // Calculate means
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = data.reduce((a, b) => a + b, 0) / n;

  // Calculate slope and intercept
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - meanX) * (data[i] - meanY);
    denominator += (x[i] - meanX) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;

  // Calculate R²
  let ssRes = 0;
  let ssTot = 0;

  for (let i = 0; i < n; i++) {
    const predicted = slope * x[i] + intercept;
    ssRes += (data[i] - predicted) ** 2;
    ssTot += (data[i] - meanY) ** 2;
  }

  const r_squared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, r_squared };
}

/**
 * Forecast future sales using linear regression
 * @param data Historical sales values
 * @param periods Number of periods to forecast
 * @returns Array of forecast results with confidence intervals
 */
export function forecastLinear(data: number[], periods: number = 3): ForecastResult[] {
  const { slope, intercept, r_squared } = linearRegression(data);
  const forecasts: ForecastResult[] = [];
  const n = data.length;

  for (let i = 1; i <= periods; i++) {
    const value = slope * (n + i - 1) + intercept;
    // Confidence based on R² (higher R² = more confident)
    const confidence = Math.max(0.5, Math.min(1, r_squared));
    forecasts.push({ value, confidence });
  }

  return forecasts;
}

/**
 * Forecast using Exponential Smoothing
 * @param data Historical sales values
 * @param periods Number of periods to forecast
 * @param alpha Smoothing factor
 * @returns Array of forecast results
 */
export function forecastExponential(
  data: number[],
  periods: number = 3,
  alpha: number = 0.3
): ForecastResult[] {
  if (data.length === 0) return [];

  const smoothed = exponentialSmoothing(data, alpha);
  const lastSmoothed = smoothed[smoothed.length - 1];
  const forecasts: ForecastResult[] = [];

  // With simple exponential smoothing, the forecast is constant (last smoothed value)
  for (let i = 0; i < periods; i++) {
    forecasts.push({
      value: lastSmoothed,
      confidence: 0.7, // Default confidence for exponential smoothing
    });
  }

  return forecasts;
}

/**
 * Calculate growth rate between two periods
 */
export function calculateGrowthRate(
  current: number,
  previous: number
): number {
  if (previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Calculate moving average
 */
export function movingAverage(data: number[], window: number = 3): number[] {
  if (window < 1 || window > data.length) throw new Error("Invalid window size");

  const result: number[] = [];

  for (let i = 0; i <= data.length - window; i++) {
    const slice = data.slice(i, i + window);
    const avg = slice.reduce((a, b) => a + b, 0) / window;
    result.push(avg);
  }

  return result;
}

/**
 * Calculate key statistics
 */
export function calculateStats(data: number[]) {
  if (data.length === 0) return null;

  const sorted = [...data].sort((a, b) => a - b);
  const sum = data.reduce((a, b) => a + b, 0);
  const mean = sum / data.length;
  const variance =
    data.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean,
    median:
      data.length % 2 === 0
        ? (sorted[data.length / 2 - 1] + sorted[data.length / 2]) / 2
        : sorted[Math.floor(data.length / 2)],
    stdDev,
    sum,
  };
}

// ============ ENHANCED ML FEATURES ============

export interface SalesRecord {
  sale_date: string;
  amount: number;
  region?: string;
  product_name?: string;
  quantity?: number | null;
  additional_data?: Record<string, any> | null;
  user_id?: string;
}

export interface Anomaly {
  sale_date: string;
  actual: number;
  expected: number;
  severity: "low" | "medium" | "high";
  type: "spike" | "dip";
}

export interface RegionalAnalysis {
  region: string;
  totalRevenue: number;
  averageTransaction: number;
  transactionCount: number;
  growthRate: number;
}

export interface MLEngineResult {
  forecasts: ForecastResult[];
  anomalies: Anomaly[];
  regionalAnalysis: RegionalAnalysis[];
  error?: string;
  summary: {
    totalRevenue: number;
    averageDaily: number;
    volatility: number;
    trend: "increasing" | "decreasing" | "stable";
  };
}

/**
 * Detect anomalies using moving average and standard deviation
 */
export function detectAnomalies(data: SalesRecord[]): Anomaly[] {
  if (data.length < 5) return [];

  const sorted = [...data].sort(
    (a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime()
  );
  const amounts = sorted.map((d) => d.amount);
  const ma = movingAverage(amounts, 5);
  const stats = calculateStats(amounts);
  if (!stats) return [];

  const { stdDev } = stats;
  const anomalies: Anomaly[] = [];
  const threshold = 2; // 2 standard deviations

  for (let i = 1; i < amounts.length; i++) {
    const expected = ma[i - 1] || amounts[i];
    const actual = amounts[i];
    const zscore = Math.abs((actual - expected) / (stdDev || 1));

    if (zscore > threshold) {
      const severity: "low" | "medium" | "high" =
        zscore > 3 ? "high" : zscore > 2.5 ? "medium" : "low";
      const type = actual > expected ? "spike" : "dip";

      anomalies.push({
        sale_date: sorted[i].sale_date,
        actual,
        expected,
        severity,
        type,
      });
    }
  }

  return anomalies;
}

/**
 * Analyze revenue by region
 */
export function analyzeByRegion(data: SalesRecord[]): RegionalAnalysis[] {
  const regionMap = new Map<string, SalesRecord[]>();

  for (const record of data) {
    const region = record.region || "Unknown";
    if (!regionMap.has(region)) {
      regionMap.set(region, []);
    }
    regionMap.get(region)!.push(record);
  }

  const analysis: RegionalAnalysis[] = [];

  for (const [region, records] of regionMap.entries()) {
    const totalRevenue = records.reduce((sum, r) => sum + r.amount, 0);
    const averageTransaction = totalRevenue / records.length;

    // Calculate growth rate (first half vs second half)
    const mid = Math.floor(records.length / 2);
    const firstHalf = records.slice(0, mid).reduce((sum, r) => sum + r.amount, 0);
    const secondHalf = records
      .slice(mid)
      .reduce((sum, r) => sum + r.amount, 0);
    const growthRate =
      firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

    analysis.push({
      region,
      totalRevenue,
      averageTransaction,
      transactionCount: records.length,
      growthRate,
    });
  }

  // Sort by total revenue
  return analysis.sort((a, b) => b.totalRevenue - a.totalRevenue);
}


/**
 * Main ML Engine entry point - processes all analytics
 */
export function processMLAnalytics(data: SalesRecord[]): MLEngineResult {
  if (data.length === 0) {
    return {
      forecasts: [],
      anomalies: [],
      regionalAnalysis: [],
      summary: {
        totalRevenue: 0,
        averageDaily: 0,
        volatility: 0,
        trend: "stable",
      },
    };
  }

  // Sort by sale_date
  const sorted = [...data].sort(
    (a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime()
  );
  const amounts = sorted.map((d) => d.amount);

  // Generate forecasts (30 days)
  const forecastResults = forecastLinear(amounts, 30);
  const forecasts: ForecastResult[] = forecastResults.map((f, i) => ({
    value: f.value,
    confidence: f.confidence,
  }));

  const anomalies = detectAnomalies(sorted);
  const regionalAnalysis = analyzeByRegion(sorted);

  // Calculate summary
  const totalRevenue = amounts.reduce((a, b) => a + b, 0);
  const averageDaily = totalRevenue / data.length;
  const stats = calculateStats(amounts);
  const volatility = stats ? stats.stdDev / (averageDaily || 1) : 0;

  // Determine trend (first third vs last third)
  const third = Math.max(1, Math.floor(data.length / 3));
  const firstThird = sorted.slice(0, third).reduce((sum, r) => sum + r.amount, 0);
  const lastThird = sorted
    .slice(Math.max(0, sorted.length - third))
    .reduce((sum, r) => sum + r.amount, 0);

  const trend: "increasing" | "decreasing" | "stable" =
    lastThird > firstThird * 1.1
      ? "increasing"
      : lastThird < firstThird * 0.9
        ? "decreasing"
        : "stable";

  return {
    forecasts,
    anomalies,
    regionalAnalysis,
    summary: {
      totalRevenue,
      averageDaily,
      volatility,
      trend,
    },
  };
}

/**
 * Generate AI Insights text summary (3 bullet points)
 */
export function generateInsights(result: MLEngineResult): string[] {
  const insights: string[] = [];

  // Success insight
  if (result.regionalAnalysis.length > 0) {
    const topRegion = result.regionalAnalysis[0];
    insights.push(
      `Success: ${topRegion.region} leads with $${topRegion.totalRevenue.toLocaleString()} revenue (${topRegion.growthRate > 0 ? `+${topRegion.growthRate.toFixed(1)}%` : `${topRegion.growthRate.toFixed(1)}%`} growth).`
    );
  }

  // Risk insight
  if (result.anomalies.length > 0) {
    const highSeverity = result.anomalies.filter((a) => a.severity === "high");
    if (highSeverity.length > 0) {
      insights.push(
        `Risk: Detected ${highSeverity.length} high-severity anomalies. Investigate unusual patterns on ${highSeverity[0].sale_date}.`
      );
    } else {
      insights.push(
        `Stability: Data shows normal variance. No major anomalies detected.`
      );
    }
  }

  // Prediction insight
  if (result.forecasts.length > 0 && result.summary.trend !== "stable") {
    const trend =
      result.summary.trend === "increasing" ? "upward" : "downward";
    const avgForecast =
      result.forecasts.reduce((sum, f) => sum + f.value, 0) / result.forecasts.length;
    insights.push(
      `Prediction: Revenue shows ${trend} momentum. 30-day avg forecast: $${avgForecast.toLocaleString(undefined, { maximumFractionDigits: 0 })}.`
    );
  } else {
    insights.push(
      `Stability: Revenue trend is stable. Continue current strategy.`
    );
  }

  return insights.length > 0
    ? insights
    : [
        "Insights: Upload more sales data to unlock AI predictions.",
      ];
}
/**
 * What-If simulator: adjust forecasts based on marketing spend multiplier
 */
export function simulateWhatIf(
  forecasts: ForecastResult[],
  marketingMultiplier: number
): ForecastResult[] {
  // Assume marketing spend increases conversion by 0.3% per 1% increase in marketing spend
  const conversionBump = (marketingMultiplier - 1) * 0.003;

  return forecasts.map((f) => ({
    value: f.value * (1 + conversionBump),
    confidence: f.confidence,
  }));
}

/**
 * Enhanced forecasting for Revenue Chart with 90-day projection
 * Returns both historical points and forecast points for visualization
 */
export interface ForecastChartData {
  historicalPoints: Array<{
    date: string;
    revenue: number;
    actualRevenue: number;
    label: string;
  }>;
  forecastPoints: Array<{
    date: string;
    revenue: number;
    actualRevenue: number;
    label: string;
  }>;
  slope: number;
  intercept: number;
  confidence: number;
  historicalAverage: number;
  forecastAverage: number;
}

/**
 * Calculate 90-day revenue forecast using linear regression
 * @param sortedData - Sales records sorted by date
 * @param monthsHistory - Number of months to look back (default: 6)
 * @param forecastDays - Number of days to forecast (default: 90)
 * @returns ForecastChartData with historical and forecast points
 */
export function calculateForecast(
  sortedData: SalesRecord[],
  monthsHistory: number = 6,
  forecastDays: number = 90
): ForecastChartData {
  if (sortedData.length === 0) {
    return {
      historicalPoints: [],
      forecastPoints: [],
      slope: 0,
      intercept: 0,
      confidence: 0,
      historicalAverage: 0,
      forecastAverage: 0,
    };
  }

  let currentMonthsHistory = monthsHistory;
  let historicalRecords: SalesRecord[] = [];
  // Iteratively reduce monthsHistory if not enough data
  while (true) {
    const monthsInMs = currentMonthsHistory * 30 * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - monthsInMs);
    historicalRecords = sortedData.filter(
      (record) => new Date(record.sale_date).getTime() >= cutoffDate.getTime()
    );
    if (historicalRecords.length >= 2 || currentMonthsHistory <= 1) {
      // Use all data if monthsHistory gets too small
      if (historicalRecords.length < 2) {
        historicalRecords = sortedData;
      }
      break;
    }
    currentMonthsHistory = Math.floor(currentMonthsHistory / 2);
  }

  // Group by date and sum revenue
  const dateMap = new Map<string, number>();
  for (const record of historicalRecords) {
    const date = record.sale_date.split('T')[0]; // Get YYYY-MM-DD
    dateMap.set(date, (dateMap.get(date) || 0) + record.amount);
  }

  // Sort dates and create time series
  const sortedDates = Array.from(dateMap.keys()).sort();
  const revenues = sortedDates.map((date) => dateMap.get(date) || 0);

  // Calculate linear regression
  const { slope, intercept, r_squared } = linearRegression(revenues);

  // Generate historical points
  const historicalPoints = sortedDates.map((date, index) => ({
    date,
    revenue: revenues[index],
    actualRevenue: revenues[index],
    label: date,
  }));

  // Generate forecast points for next 90 days
  const lastDate = new Date(sortedDates[sortedDates.length - 1]);
  const forecastPoints = [];
  const startIndex = revenues.length;

  for (let i = 1; i <= forecastDays; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);
    const formattedDate = forecastDate.toISOString().split('T')[0];

    const projectedRevenue = Math.max(
      0,
      slope * (startIndex + i - 1) + intercept
    );

    forecastPoints.push({
      date: formattedDate,
      revenue: Math.round(projectedRevenue),
      actualRevenue: Math.round(projectedRevenue), // For forecast, actual = projected
      label: formattedDate,
    });
  }

  // Ensure first forecast point matches last historical point (smooth connection)
  if (forecastPoints.length > 0 && historicalPoints.length > 0) {
    const lastHistorical = historicalPoints[historicalPoints.length - 1];
    const firstForecast = forecastPoints[0];
    
    // Adjust forecast to start from last historical point
    const offset = lastHistorical.revenue - firstForecast.revenue;
    for (const point of forecastPoints) {
      point.revenue += offset;
      point.actualRevenue += offset;
    }
  }

  // Calculate averages
  const historicalAverage =
    revenues.length > 0
      ? revenues.reduce((a, b) => a + b, 0) / revenues.length
      : 0;

  const forecastAverage =
    forecastPoints.length > 0
      ? forecastPoints.reduce((sum, p) => sum + p.revenue, 0) / forecastPoints.length
      : 0;

  // Confidence is based on R² value (0-1)
  const confidence = Math.max(0.5, Math.min(1, r_squared));

  return {
    historicalPoints,
    forecastPoints,
    slope,
    intercept,
    confidence,
    historicalAverage,
    forecastAverage,
  };
}


