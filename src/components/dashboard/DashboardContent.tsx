"use client";
import SalesPieChart from "./SalesPieChart";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Users, MapPin, Menu } from "lucide-react";
import { AIInsightsPanel } from "./AIInsightsPanel";
import { WhatIfSimulator } from "./WhatIfSimulator";
import { ActionPanel, ActionTask } from "./ActionPanel";
import Sidebar from "./Sidebar";
import ExecutiveDrawer from "./executive/ExecutiveDrawer";
// import ChatbotBubble from "./ChatbotBubble"; // Disabled - using AuraChat instead
import AuraChat from "./AuraChat";
import { SentimentGauge } from "./SentimentGauge";
import { RiskAlertCard } from "./RiskAlertCard";
import { SentimentBreakdown } from "./SentimentBreakdown";
import { FutureInsightsCard } from "./FutureInsightsCard";
import MarketInsightsDashboard from "@/components/market/MarketInsightsDashboard";
// ...existing code...
import { sevenDayAverage, isSignificantDrop } from "@/lib/anomaly";
import { calculateAuraRisk, calculateTrend, getTopNegativeComments } from "@/lib/sentiment-engine";
import { useSentimentAnalysis } from "@/hooks/useSentimentAnalysis";
import { exportDashboardToPDF } from "@/utils/pdf";
import {
  aggregateRevenueSeries,
  getAggregationMessage,
  RevenueGranularity,
} from "@/utils/dataUtils";
import { exportDetailedPDF } from "@/utils/exportPdf";
import { CSVUploader } from "@/components/data/CSVUploader";
import { processMLAnalytics, generateInsights, SalesRecord, MLEngineResult } from "@/lib/ml-engine";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { getDashboardLocaleCopy, getTrendLabel } from "@/lib/i18n/dashboardCopy";
import { ImportProgressModal } from "@/components/ui/ImportProgressModal";
import { AppUser, hasProAccess, isAdminEmail } from "@/lib/accessControl";

function decodeUtf8Text(input: string): string {
  const text = String(input ?? "");
  const mojibakePattern = /[\u00C3\u00C2\u00E2\u00F0]/;
  if (!mojibakePattern.test(text)) return text;
  try {
    const bytes = Uint8Array.from(Array.from(text).map((char) => char.charCodeAt(0) & 0xff));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return text;
  }
}

// Lightweight confetti effect (no external deps)
function fireConfetti() {
  try {
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.pointerEvents = "none";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d")!;

    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      tilt: number;
    }[] = [];
    const count = 80;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 6 + 2,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 0.5,
      });
    }

    let t = 0;
    function draw() {
      t += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.tilt += 0.02;
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.tilt);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (t < 150) requestAnimationFrame(draw);
      else document.body.removeChild(canvas);
    }
    requestAnimationFrame(draw);
  } catch (e) {
    // ignore confetti failures
  }
}

interface DashboardContentProps {
  onDataLoad?: (data: SalesRecord[]) => void;
  isDemo?: boolean;
}

type PieSummaryDatum = { name: string; value: number };
type AnalyticsWithError = MLEngineResult & { error?: string };

type ExportInsightCopy = {
  success: string;
  risk: string;
  stability: string;
  prediction: string;
  leadsWith: string;
  revenue: string;
  growth: string;
  detected: string;
  highSeverityAnomalies: string;
  investigate: string;
  revenueShows: string;
  momentum: string;
  avgForecast: string;
  stableTrend: string;
  continueStrategy: string;
  noDominantRegion: string;
};

const EXPORT_INSIGHT_COPY: Record<string, ExportInsightCopy> = {
  en: {
    success: "Success",
    risk: "Risk",
    stability: "Stability",
    prediction: "Prediction",
    leadsWith: "leads with",
    revenue: "revenue",
    growth: "growth",
    detected: "Detected",
    highSeverityAnomalies: "high-severity anomalies",
    investigate: "Investigate unusual patterns on",
    revenueShows: "Revenue shows",
    momentum: "momentum",
    avgForecast: "30-day avg forecast",
    stableTrend: "Revenue trend is stable",
    continueStrategy: "Continue current strategy.",
    noDominantRegion: "No dominant region identified yet.",
  },
  fr: {
    success: "Succès",
    risk: "Risque",
    stability: "Stabilité",
    prediction: "Prévision",
    leadsWith: "domine avec",
    revenue: "de chiffre d'affaires",
    growth: "de croissance",
    detected: "Détecté",
    highSeverityAnomalies: "anomalies à forte gravité",
    investigate: "Étudiez les schémas inhabituels sur",
    revenueShows: "Le revenu montre une",
    momentum: "dynamique",
    avgForecast: "Prévision moyenne sur 30 jours",
    stableTrend: "La tendance du chiffre d'affaires est stable",
    continueStrategy: "Poursuivez la stratégie actuelle.",
    noDominantRegion: "Aucune région dominante n'a encore été identifiée.",
  },
  es: {
    success: "Éxito",
    risk: "Riesgo",
    stability: "Estabilidad",
    prediction: "Predicción",
    leadsWith: "lidera con",
    revenue: "de ingresos",
    growth: "de crecimiento",
    detected: "Detectadas",
    highSeverityAnomalies: "anomalías de alta severidad",
    investigate: "Investiga patrones inusuales en",
    revenueShows: "Los ingresos muestran un",
    momentum: "impulso",
    avgForecast: "Pronóstico medio de 30 días",
    stableTrend: "La tendencia de ingresos es estable",
    continueStrategy: "Sigue con la estrategia actual.",
    noDominantRegion: "Aún no se ha identificado una región dominante.",
  },
  pt: {
    success: "Sucesso",
    risk: "Risco",
    stability: "Estabilidade",
    prediction: "Previsão",
    leadsWith: "lidera com",
    revenue: "de receita",
    growth: "de crescimento",
    detected: "Detectadas",
    highSeverityAnomalies: "anomalias de alta gravidade",
    investigate: "Investigue padrões incomuns em",
    revenueShows: "A receita mostra um",
    momentum: "momento",
    avgForecast: "Previsão média de 30 dias",
    stableTrend: "A tendência de receita está estável",
    continueStrategy: "Continue a estratégia atual.",
    noDominantRegion: "Nenhuma região dominante foi identificada ainda.",
  },
  de: {
    success: "Erfolg",
    risk: "Risiko",
    stability: "Stabilität",
    prediction: "Prognose",
    leadsWith: "führt mit",
    revenue: "Umsatz",
    growth: "Wachstum",
    detected: "Erkannt",
    highSeverityAnomalies: "Anomalien mit hoher Priorität",
    investigate: "Untersuchen Sie ungewöhnliche Muster auf",
    revenueShows: "Der Umsatz zeigt",
    momentum: "Dynamik",
    avgForecast: "30-Tage-Durchschnittsprognose",
    stableTrend: "Der Umsatztrend ist stabil",
    continueStrategy: "Setzen Sie die aktuelle Strategie fort.",
    noDominantRegion: "Noch keine dominante Region identifiziert.",
  },
  it: {
    success: "Successo",
    risk: "Rischio",
    stability: "Stabilità",
    prediction: "Previsione",
    leadsWith: "guida con",
    revenue: "ricavi",
    growth: "crescita",
    detected: "Rilevate",
    highSeverityAnomalies: "anomalie ad alta gravità",
    investigate: "Indaga sui modelli insoliti su",
    revenueShows: "I ricavi mostrano",
    momentum: "slancio",
    avgForecast: "Previsione media a 30 giorni",
    stableTrend: "L'andamento dei ricavi è stabile",
    continueStrategy: "Continua con la strategia attuale.",
    noDominantRegion: "Nessuna regione dominante ancora identificata.",
  },
  nl: {
    success: "Succes",
    risk: "Risico",
    stability: "Stabiliteit",
    prediction: "Voorspelling",
    leadsWith: "leidt met",
    revenue: "omzet",
    growth: "groei",
    detected: "Gedetecteerd",
    highSeverityAnomalies: "anomalieën met hoge ernst",
    investigate: "Onderzoek ongebruikelijke patronen op",
    revenueShows: "De omzet laat",
    momentum: "momentum",
    avgForecast: "30-daagse gemiddelde prognose",
    stableTrend: "De omzettrend is stabiel",
    continueStrategy: "Ga door met de huidige strategie.",
    noDominantRegion: "Nog geen dominante regio geïdentificeerd.",
  },
  sw: {
    success: "Mafanikio",
    risk: "Hatari",
    stability: "Utulivu",
    prediction: "Utabiri",
    leadsWith: "inaongoza kwa",
    revenue: "mapato",
    growth: "ukuaji",
    detected: "Yamegunduliwa",
    highSeverityAnomalies: "hitilafu zenye uzito mkubwa",
    investigate: "Chunguza mifumo isiyo ya kawaida kwenye",
    revenueShows: "Mapato yanaonyesha",
    momentum: "mwelekeo",
    avgForecast: "Utabiri wa wastani wa siku 30",
    stableTrend: "Mwelekeo wa mapato ni thabiti",
    continueStrategy: "Endelea na mkakati wa sasa.",
    noDominantRegion: "Bado hakuna eneo linalotawala lililotambuliwa.",
  },
  vi: {
    success: "Thành công",
    risk: "Rủi ro",
    stability: "Ổn định",
    prediction: "Dự báo",
    leadsWith: "dẫn đầu với",
    revenue: "doanh thu",
    growth: "tăng trưởng",
    detected: "Đã phát hiện",
    highSeverityAnomalies: "bất thường mức độ cao",
    investigate: "Điều tra các mẫu bất thường trên",
    revenueShows: "Doanh thu đang cho thấy",
    momentum: "đà tăng",
    avgForecast: "Dự báo trung bình 30 ngày",
    stableTrend: "Xu hướng doanh thu đang ổn định",
    continueStrategy: "Tiếp tục chiến lược hiện tại.",
    noDominantRegion: "Chưa xác định được khu vực dẫn đầu.",
  },
  ar: {
    success: "نجاح",
    risk: "مخاطر",
    stability: "استقرار",
    prediction: "توقع",
    leadsWith: "يتصدر بـ",
    revenue: "إيرادات",
    growth: "نمو",
    detected: "تم اكتشاف",
    highSeverityAnomalies: "شذوذات عالية الخطورة",
    investigate: "تحقق من الأنماط غير المعتادة في",
    revenueShows: "الإيرادات تُظهر",
    momentum: "زخماً",
    avgForecast: "متوسط التوقع لـ 30 يوماً",
    stableTrend: "اتجاه الإيرادات مستقر",
    continueStrategy: "واصل الاستراتيجية الحالية.",
    noDominantRegion: "لم يتم تحديد منطقة مهيمنة بعد.",
  },
  ru: {
    success: "Успех",
    risk: "Риск",
    stability: "Стабильность",
    prediction: "Прогноз",
    leadsWith: "лидирует с",
    revenue: "выручкой",
    growth: "ростом",
    detected: "Обнаружено",
    highSeverityAnomalies: "аномалий высокой степени",
    investigate: "Проверьте необычные закономерности на",
    revenueShows: "Выручка показывает",
    momentum: "импульс",
    avgForecast: "Средний прогноз на 30 дней",
    stableTrend: "Тренд выручки стабилен",
    continueStrategy: "Продолжайте текущую стратегию.",
    noDominantRegion: "Доминирующий регион пока не определён.",
  },
  ja: {
    success: "成功",
    risk: "リスク",
    stability: "安定",
    prediction: "予測",
    leadsWith: "がリードし、",
    revenue: "売上高",
    growth: "成長",
    detected: "検出",
    highSeverityAnomalies: "重大な異常",
    investigate: "次の期間の異常なパターンを確認してください:",
    revenueShows: "売上は",
    momentum: "勢い",
    avgForecast: "30日平均予測",
    stableTrend: "売上トレンドは安定しています",
    continueStrategy: "現在の戦略を継続してください。",
    noDominantRegion: "まだ優勢な地域はありません。",
  },
  ko: {
    success: "성공",
    risk: "위험",
    stability: "안정",
    prediction: "예측",
    leadsWith: "이/가 주도하며",
    revenue: "매출",
    growth: "성장",
    detected: "감지됨",
    highSeverityAnomalies: "심각도 높은 이상",
    investigate: "에서 비정상적인 패턴을 조사하세요",
    revenueShows: "매출은",
    momentum: "모멘텀",
    avgForecast: "30일 평균 예측",
    stableTrend: "매출 추세는 안정적입니다",
    continueStrategy: "현재 전략을 유지하세요.",
    noDominantRegion: "아직 우세한 지역이 없습니다.",
  },
  zh: {
    success: "成功",
    risk: "风险",
    stability: "稳定",
    prediction: "预测",
    leadsWith: "以",
    revenue: "收入",
    growth: "增长",
    detected: "检测到",
    highSeverityAnomalies: "高严重性异常",
    investigate: "请检查以下异常模式：",
    revenueShows: "收入呈现",
    momentum: "动能",
    avgForecast: "30天平均预测",
    stableTrend: "收入趋势稳定",
    continueStrategy: "继续当前策略。",
    noDominantRegion: "尚未识别出主导区域。",
  },
  hi: {
    success: "सफलता",
    risk: "जोखिम",
    stability: "स्थिरता",
    prediction: "पूर्वानुमान",
    leadsWith: "के साथ आगे है",
    revenue: "राजस्व",
    growth: "वृद्धि",
    detected: "पाया गया",
    highSeverityAnomalies: "उच्च-गंभीरता वाली असामान्यताएँ",
    investigate: "पर असामान्य पैटर्न की जाँच करें",
    revenueShows: "राजस्व दिखा रहा है",
    momentum: "गति",
    avgForecast: "30-दिन का औसत पूर्वानुमान",
    stableTrend: "राजस्व प्रवृत्ति स्थिर है",
    continueStrategy: "मौजूदा रणनीति जारी रखें।",
    noDominantRegion: "अभी तक कोई प्रमुख क्षेत्र नहीं मिला।",
  },
};

function getExportInsightCopy(language: string): ExportInsightCopy {
  const key = String(language || "en").toLowerCase();
  if (key.startsWith("fr")) return EXPORT_INSIGHT_COPY.fr;
  if (key.startsWith("es")) return EXPORT_INSIGHT_COPY.es;
  if (key.startsWith("pt")) return EXPORT_INSIGHT_COPY.pt;
  if (key.startsWith("de")) return EXPORT_INSIGHT_COPY.de;
  if (key.startsWith("it")) return EXPORT_INSIGHT_COPY.it;
  if (key.startsWith("nl")) return EXPORT_INSIGHT_COPY.nl;
  if (key.startsWith("sw")) return EXPORT_INSIGHT_COPY.sw;
  if (key.startsWith("vi")) return EXPORT_INSIGHT_COPY.vi;
  if (key.startsWith("ar")) return EXPORT_INSIGHT_COPY.ar;
  if (key.startsWith("ru")) return EXPORT_INSIGHT_COPY.ru;
  if (key.startsWith("ja")) return EXPORT_INSIGHT_COPY.ja;
  if (key.startsWith("ko")) return EXPORT_INSIGHT_COPY.ko;
  if (key.startsWith("zh")) return EXPORT_INSIGHT_COPY.zh;
  if (key.startsWith("hi")) return EXPORT_INSIGHT_COPY.hi;
  return EXPORT_INSIGHT_COPY.en;
}
type ImportProgressState = {
  open: boolean;
  current: number;
  total: number;
  percent: number;
  isProcessing: boolean;
  statusText?: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

function toLineSummaryRecords(points: any[]): SalesRecord[] {
  if (!Array.isArray(points)) return [];
  return points
    .map((point) => ({
      sale_date: String(point?.sale_date || ""),
      amount: Number(point?.amount || 0),
      region: "All",
      product_name: "All Products",
      quantity: null,
      additional_data: null,
    }))
    .filter((row) => row.sale_date !== "" && Number.isFinite(row.amount));
}

function normalizePieSummary(points: any[]): PieSummaryDatum[] {
  if (!Array.isArray(points)) return [];
  return points
    .map((point) => ({
      name: String(point?.name || "").trim(),
      value: Number(point?.value || 0),
    }))
    .filter((row) => row.name !== "" && Number.isFinite(row.value) && row.value > 0);
}

function collapsePieSummary(points: PieSummaryDatum[]): PieSummaryDatum[] {
  if (!points.length) return [];
  const sorted = [...points].sort((a, b) => b.value - a.value);
  return sorted.slice(0, 10);
}

function summarizeDataForAI(rows: SalesRecord[]) {
  const totalRevenue = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const recordCount = rows.length;
  const averageRevenue = recordCount > 0 ? totalRevenue / recordCount : 0;

  const productMap = new Map<string, number>();
  for (const row of rows) {
    const amount = Number(row.amount || 0);
    const product = String(row.product_name || "Unknown");
    productMap.set(product, (productMap.get(product) || 0) + amount);
  }

  const top10Products = Array.from(productMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }));

  const amounts = rows.map((row) => Number(row.amount || 0));
  const mean = averageRevenue;
  const variance =
    amounts.length > 0
      ? amounts.reduce((sum, value) => sum + (value - mean) ** 2, 0) / amounts.length
      : 0;
  const stdDev = Math.sqrt(variance);
  const volatility = mean === 0 ? 0 : stdDev / mean;

  return {
    totalRevenue: Math.round(totalRevenue),
    top10Products,
    volatility: Number(volatility.toFixed(4)),
    volatilityPercentage: Number((volatility * 100).toFixed(2)),
  };
}

function buildFallbackRecommendations(summaryData: ReturnType<typeof summarizeDataForAI>): ActionTask[] {
  const topProductNames = summaryData.top10Products.slice(0, 3).map((p) => p.name);
  const volatilityPct = summaryData.volatilityPercentage;

  const tasks: ActionTask[] = [
    {
      id: "fallback-1",
      title: "Focus inventory on top products",
      description:
        topProductNames.length > 0
          ? `Increase stock and promotions for: ${topProductNames.join(", ")}.`
          : "Increase stock and promotions for your top-performing products.",
      priority: "high",
      completed: false,
    },
    {
      id: "fallback-2",
      title: "Stabilize daily sales volatility",
      description: `Current volatility is ${volatilityPct.toFixed(2)}%. Set weekly pricing and campaign cadence to reduce swings.`,
      priority: volatilityPct >= 20 ? "high" : "medium",
      completed: false,
    },
    {
      id: "fallback-3",
      title: "Review underperforming days",
      description: "Compare low-revenue days against marketing activity and regional demand to improve consistency.",
      priority: "medium",
      completed: false,
    },
  ];

  return tasks;
}

export function DashboardContent({ onDataLoad, isDemo = false }: DashboardContentProps) {
  const [currentUser, setCurrentUser] = useState<AppUser>({
    email: "unknown@user.local",
    role: "user",
    plan: "free",
  });
  const [sampleData, setSampleData] = useState<SalesRecord[]>([
    { sale_date: "2024-01-01", amount: 5000, region: "North", product_name: "Product A", quantity: 10, additional_data: null },
    { sale_date: "2024-01-02", amount: 6200, region: "South", product_name: "Product B", quantity: 12, additional_data: null },
    { sale_date: "2024-01-03", amount: 5800, region: "East", product_name: "Product A", quantity: 11, additional_data: null },
    { sale_date: "2024-01-04", amount: 7100, region: "West", product_name: "Product C", quantity: 14, additional_data: null },
    { sale_date: "2024-01-05", amount: 6900, region: "North", product_name: "Product B", quantity: 13, additional_data: null },
    { sale_date: "2024-01-06", amount: 8200, region: "South", product_name: "Product A", quantity: 16, additional_data: null },
    { sale_date: "2024-01-07", amount: 7500, region: "East", product_name: "Product C", quantity: 15, additional_data: null },
  ]);

  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgressState>({
    open: false,
    current: 0,
    total: 0,
    percent: 0,
    isProcessing: false,
    statusText: "",
  });
  const [whatIfMultiplier, setWhatIfMultiplier] = useState(1);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [marketingPct, setMarketingPct] = useState(0);
  const [growthPct, setGrowthPct] = useState(0);
  const [csvContent, setCsvContent] = useState<string>("");
  const [pieSummaryData, setPieSummaryData] = useState<PieSummaryDatum[] | null>(null);
  const [granularity, setGranularity] = useState<RevenueGranularity>("daily");
  const [recommendations, setRecommendations] = useState<ActionTask[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const targetLanguage = useSiteLanguage();
  const dashboardCopy = useMemo(() => getDashboardLocaleCopy(targetLanguage), [targetLanguage]);
  const [isTranslatingContent, setIsTranslatingContent] = useState(false);
  const [translatedInsights, setTranslatedInsights] = useState<string[]>([]);
  const [translatedRecommendations, setTranslatedRecommendations] = useState<ActionTask[]>([]);
  const [translatedLabelMap, setTranslatedLabelMap] = useState<Record<string, string>>({});

  // Sentiment analysis state
  const [sentimentScores, setSentimentScores] = useState<any[]>([]);
  const [averageSentimentScore, setAverageSentimentScore] = useState(0);
  const [sentimentTrend, setSentimentTrend] = useState<"up" | "down" | "stable">("stable");
  const [previousSentimentScore, setPreviousSentimentScore] = useState(0);
  const { analyzeFeedback } = useSentimentAnalysis();

  // Forecast state
  const [forecastData, setForecastData] = useState<any>(null);
  const [forecastInsight, setForecastInsight] = useState<any>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [forecastStatusMessage, setForecastStatusMessage] = useState<string | null>(null);
  const [showAdminVerifyModal, setShowAdminVerifyModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);
  const [enterpriseUnlocked, setEnterpriseUnlocked] = useState(false);
  const [showEnterpriseVerifyModal, setShowEnterpriseVerifyModal] = useState(false);
  const [enterprisePasswordInput, setEnterprisePasswordInput] = useState("");
  const [isVerifyingEnterprise, setIsVerifyingEnterprise] = useState(false);
  const proOnlyFeatures = useMemo(() => new Set(["ai-voice", "predictive", "pdf", "anomaly"]), []);

  const verifyAdminPassword = useCallback(async (password: string) => {
    if (!isAdminEmail(currentUser.email)) return;
    if (!password) return;
    setIsVerifyingAdmin(true);
    try {
      const response = await fetch("/api/admin/verify-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Verification failed");
      }
      setCurrentUser((prev) => ({ ...prev, plan: "pro", role: "admin" }));
      setShowAdminVerifyModal(false);
      setAdminPasswordInput("");
      window.dispatchEvent(new Event("credits:refresh"));
      toast.success("Admin verified. Pro access unlocked.");
    } catch (error: any) {
      toast.error("Verification failed", { description: error?.message || "Invalid password" });
    } finally {
      setIsVerifyingAdmin(false);
    }
  }, [currentUser.email]);

  const verifyEnterprisePassword = useCallback(async (password: string) => {
    if (!isAdminEmail(currentUser.email)) return;
    if (!password) return;
    setIsVerifyingEnterprise(true);
    try {
      const response = await fetch("/api/admin/verify-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, variant: "enterprise" }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Verification failed");
      }
      setCurrentUser((prev) => ({ ...prev, plan: "pro", role: "admin" }));
      setEnterpriseUnlocked(true);
      setShowEnterpriseVerifyModal(false);
      setEnterprisePasswordInput("");
      window.dispatchEvent(new Event("credits:refresh"));
      toast.success("Admin verified. Enterprise access unlocked.");
    } catch (error: any) {
      toast.error("Verification failed", { description: error?.message || "Invalid password" });
    } finally {
      setIsVerifyingEnterprise(false);
    }
  }, [currentUser.email]);

  const requireProAccess = useCallback(
    (featureLabel: string) => {
      if (hasProAccess(currentUser)) return true;
      toast.error("Upgrade to Pro to use this feature", {
        description: `${featureLabel} requires Pro access.`,
      });
      return false;
    },
    [currentUser]
  );
  const userHasProAccess = hasProAccess(currentUser);

  // Process ML analytics
  const analytics = useMemo<AnalyticsWithError>(() => {
    try {
      return processMLAnalytics(sampleData);
    } catch (err) {
      console.error("ML analytics processing failed:", err);
      return {
        forecasts: [],
        anomalies: [],
        regionalAnalysis: [],
        error: err instanceof Error ? err.message : "Analytics processing failed",
        summary: {
          totalRevenue: 0,
          averageDaily: 0,
          volatility: 0,
          trend: "stable",
        },
      };
    }
  }, [sampleData]);

  const insights = useMemo(() => {
    if (analytics.error) {
      return ["Analytics is limited right now. Upload more clean data to continue."];
    }
    return generateInsights(analytics);
  }, [analytics]);

  // Warm up the AI model on dashboard load
  useEffect(() => {
    let mounted = true;

    const warmupModel = async () => {
      try {
        await fetch("/api/chat", { method: "GET" });
      } catch (err) {
        // Non-critical, continue regardless
      }
    };

    warmupModel();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const syncCurrentUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (!mounted || error || !user?.email) return;
        const trustedEmail = user.email || "unknown@user.local";
        setCurrentUser({
          email: trustedEmail,
          // Before unlock, admin should experience the same behavior as free users.
          role: "user",
          // Require explicit post-login admin verification every session.
          plan: "free",
        });
      } catch {
        // Keep demo/default user state if auth fetch fails.
      }
    };

    syncCurrentUser();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const syncEnterpriseAccess = async () => {
      if (!isAdminEmail(currentUser.email)) {
        if (mounted) setEnterpriseUnlocked(false);
        return;
      }
      try {
        const response = await fetch("/api/admin/verify-pro?variant=enterprise");
        const data = await response.json().catch(() => ({}));
        if (!mounted) return;
        setEnterpriseUnlocked(Boolean(data?.verified));
      } catch {
        if (mounted) setEnterpriseUnlocked(false);
      }
    };

    syncEnterpriseAccess();
    return () => {
      mounted = false;
    };
  }, [currentUser.email]);

  // Fetch revenue forecast
  useEffect(() => {
    let mounted = true;

    const fetchForecast = async () => {
      // Only fetch if we have enough data
      if (sampleData.length < 2) {
        setForecastData(null);
        setForecastInsight(null);
        setForecastStatusMessage("Not enough data for 3-month projection");
        return;
      }

      setIsLoadingForecast(true);
      setForecastStatusMessage(null);
      try {
        const response = await fetch("/api/forecast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ historicalData: sampleData }),
        });
        const responseText = await response.text();
        if (!responseText.trim()) {
          throw new Error("Forecast API returned an empty response");
        }

        let data: any = null;
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error("Forecast API returned a non-JSON response");
        }

        if (!response.ok) {
          throw new Error(data?.error || "Forecast API failed");
        }

        console.log("Forecast Points:", data.forecast);
        if (mounted) {
          // Ensure data.forecast exists and is an array before setting state
          setForecastData(data && Array.isArray(data.forecast) ? {
            ...data,
            forecastPoints: data.forecast
          } : data || null);
          setForecastInsight(data.aiInsight || null);
          setForecastStatusMessage(null);
        }
      } catch (error) {
        console.warn("Failed to fetch forecast:", error);
        setForecastData(null);
        setForecastStatusMessage("Unable to load 3-month projection right now");
        // Continue without forecast
      } finally {
        if (mounted) {
          setIsLoadingForecast(false);
        }
      }
    };

    // Debounce forecast fetch
    const timer = setTimeout(fetchForecast, 500);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [sampleData]);

  // Sort CSV data by date ascending
  const sortedSampleData = useMemo(() => {
    return [...sampleData].sort((a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime());
  }, [sampleData]);

  // Prepare chart data with granularity + large dataset aggregation.
  const revenueView = useMemo(() => {
    return aggregateRevenueSeries(
      sortedSampleData.map((row) => ({
        sale_date: row.sale_date,
        amount: Number(row.amount || 0),
      })),
      granularity
    );
  }, [sortedSampleData, granularity]);

  const revenueData = revenueView.data;

  // Helper: get last actual point
  const lastActualPoint = useMemo(() => {
    return revenueData.length > 0 ? revenueData[revenueData.length - 1] : null;
  }, [revenueData]);

  // Predictive data generator
  function getPredictedData(marketing: number, growth: number) {
    if (!lastActualPoint) return [];
    const baseValue = lastActualPoint.revenue;
    const baseDate = new Date(lastActualPoint.date);
    const points = [];
    for (let i = 1; i <= 3; i++) {
      const nextDate = new Date(baseDate);
      nextDate.setMonth(baseDate.getMonth() + i);
      const newValue = Math.round(baseValue * (1 + (marketing + growth) / 100));
      points.push({
        date: nextDate.toISOString().split('T')[0],
        revenue: null,
        predicted: newValue,
        day: `Prediction ${i}`,
      });
    }
    return points;
  }

  // Chart.js style datasets for recharts
  const chartData = useMemo(() => {
    if (!lastActualPoint) return [];
    // Actuals: all points
    const actuals = revenueData.map(d => ({
      ...d,
      actual: d.revenue,
      predicted: null,
    }));
    // Prediction: start with last actual, then 3 future points
    const prediction = [
      {
        ...lastActualPoint,
        actual: null,
        predicted: lastActualPoint.revenue,
      },
      ...getPredictedData(marketingPct, growthPct).map((p, idx) => ({
        ...p,
        actual: null,
        predicted: p.predicted,
      })),
    ];
    // Merge for recharts: actuals, then prediction (excluding duplicate last actual)
    return [
      ...actuals,
      ...prediction.slice(1),
    ];
  }, [revenueData, marketingPct, growthPct, lastActualPoint]);

  // Stat cards
  const stats = useMemo(() => {
    const topRegionRaw = analytics.regionalAnalysis[0]?.region || "N/A";
    const topRegionDisplay =
      targetLanguage === "en" ? topRegionRaw : translatedLabelMap[topRegionRaw] || topRegionRaw;

    return [
      {
        label: "Total Revenue",
        value: `$${analytics.summary.totalRevenue.toLocaleString()}`,
        icon: DollarSign,
        trend: analytics.summary.trend,
        change: `${((analytics.summary.trend === "increasing" ? 12 : analytics.summary.trend === "decreasing" ? -8 : 0)).toFixed(0)}%`,
      },
      {
        label: "Daily Average",
        value: `$${analytics.summary.averageDaily.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        icon: TrendingUp,
        trend: "stable",
        change: "0%",
      },
      {
        label: "Top Region",
        value: topRegionDisplay,
        icon: MapPin,
        trend: "stable",
        change: `$${(analytics.regionalAnalysis[0]?.totalRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      },
      {
        label: "Volatility",
        value: `${(analytics.summary.volatility * 100).toFixed(1)}%`,
        icon: Users,
        trend: "stable",
        change: "Std Dev",
      },
    ];
  }, [analytics, targetLanguage, translatedLabelMap]);

  useEffect(() => {
    let cancelled = false;

    const translateDashboardText = async () => {
      if (targetLanguage === "en") {
        setTranslatedInsights([]);
        setTranslatedRecommendations([]);
        setTranslatedLabelMap({});
        return;
      }

      const insightTexts = insights.map((item) => decodeUtf8Text(item));
      const recommendationChunks = recommendations.flatMap((task) => [task.title, task.description]);
      const labelTexts = Array.from(
        new Set([
          ...(pieSummaryData?.map((item) => item.name) || []),
          ...analytics.regionalAnalysis.map((entry) => String(entry.region || "").trim()).filter(Boolean),
        ])
      );

      const payloadTexts = [...insightTexts, ...recommendationChunks, ...labelTexts];
      if (payloadTexts.length === 0) {
        setTranslatedInsights([]);
        setTranslatedRecommendations([]);
        setTranslatedLabelMap({});
        return;
      }

      try {
        setIsTranslatingContent(true);
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetLanguage: resolveLanguageName(targetLanguage),
            texts: payloadTexts,
          }),
        });

        const result = await response.json().catch(() => ({}));
        const translated = Array.isArray(result?.translations) ? result.translations : payloadTexts;

        if (cancelled) return;

        const insightCount = insightTexts.length;
        const recommendationCount = recommendationChunks.length;
        const translatedInsightSlice = translated.slice(0, insightCount).map((item: unknown) => String(item || ""));
        const translatedRecommendationSlice = translated
          .slice(insightCount, insightCount + recommendationCount)
          .map((item: unknown) => String(item || ""));
        const translatedLabelSlice = translated
          .slice(insightCount + recommendationCount, insightCount + recommendationCount + labelTexts.length)
          .map((item: unknown) => String(item || ""));

        setTranslatedInsights(translatedInsightSlice);
        setTranslatedRecommendations(
          recommendations.map((task, idx) => ({
            ...task,
            title: translatedRecommendationSlice[idx * 2] || task.title,
            description: translatedRecommendationSlice[idx * 2 + 1] || task.description,
          }))
        );

        const nextLabelMap: Record<string, string> = {};
        labelTexts.forEach((label, idx) => {
          nextLabelMap[label] = translatedLabelSlice[idx] || label;
        });
        setTranslatedLabelMap(nextLabelMap);
      } catch {
        if (!cancelled) {
          setTranslatedInsights([]);
          setTranslatedRecommendations([]);
          setTranslatedLabelMap({});
        }
      } finally {
        if (!cancelled) setIsTranslatingContent(false);
      }
    };

    translateDashboardText();
    return () => {
      cancelled = true;
    };
  }, [targetLanguage, insights, recommendations, pieSummaryData, analytics.regionalAnalysis]);

  const displayInsights = useMemo(() => {
    if (targetLanguage === "en") return insights;
    if (translatedInsights.length === insights.length && translatedInsights.length > 0) {
      return translatedInsights;
    }
    return insights;
  }, [targetLanguage, insights, translatedInsights]);

  const displayRecommendations = useMemo(() => {
    if (targetLanguage === "en") return recommendations;
    if (translatedRecommendations.length === recommendations.length && translatedRecommendations.length > 0) {
      return translatedRecommendations;
    }
    return recommendations;
  }, [targetLanguage, recommendations, translatedRecommendations]);

  const displayPieSummaryData = useMemo(() => {
    if (!pieSummaryData || targetLanguage === "en") return pieSummaryData;
    return pieSummaryData.map((item) => ({
      ...item,
      name: translatedLabelMap[item.name] || item.name,
    }));
  }, [pieSummaryData, targetLanguage, translatedLabelMap]);

  const localizedExportInsights = useMemo(() => {
    const copy = getExportInsightCopy(targetLanguage);
    const currencyFormatter = new Intl.NumberFormat(dashboardCopy.speechLocale, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
    const integerFormatter = new Intl.NumberFormat(dashboardCopy.speechLocale, {
      maximumFractionDigits: 0,
    });
    const decimalFormatter = new Intl.NumberFormat(dashboardCopy.speechLocale, {
      maximumFractionDigits: 1,
    });

    const topRegion = analytics.regionalAnalysis[0];
    const topRegionRevenue = topRegion ? currencyFormatter.format(topRegion.totalRevenue) : "N/A";
    const topRegionGrowth =
      topRegion && Number.isFinite(topRegion.growthRate)
        ? `${topRegion.growthRate > 0 ? "+" : ""}${decimalFormatter.format(topRegion.growthRate)}%`
        : "N/A";

    const successLine = topRegion
      ? `${copy.success}: ${topRegion.region} ${copy.leadsWith} ${topRegionRevenue} ${copy.revenue} (${topRegionGrowth} ${copy.growth}).`
      : `${copy.success}: ${copy.noDominantRegion}`;

    const highSeverityCount = analytics.anomalies.filter((anomaly) => anomaly.severity === "high").length;
    const riskLine =
      highSeverityCount > 0
        ? `${copy.risk}: ${copy.detected} ${integerFormatter.format(highSeverityCount)} ${copy.highSeverityAnomalies}. ${copy.investigate} ${analytics.anomalies[0]?.sale_date || "N/A"}.`
        : `${copy.stability}: ${copy.stableTrend}.`;

    const forecastAverage =
      analytics.forecasts.length > 0
        ? analytics.forecasts.reduce((sum, forecast) => sum + Number(forecast.value || 0), 0) /
          analytics.forecasts.length
        : null;

    const predictionLine =
      analytics.forecasts.length > 0
        ? `${copy.prediction}: ${copy.revenueShows} ${getTrendLabel(targetLanguage, analytics.summary.trend)} ${copy.momentum}. ${copy.avgForecast}: ${forecastAverage !== null ? currencyFormatter.format(forecastAverage) : "N/A"}.`
        : `${copy.stability}: ${copy.stableTrend}. ${copy.continueStrategy}`;

    return [successLine, riskLine, predictionLine];
  }, [analytics, dashboardCopy.speechLocale, targetLanguage]);

  const resolveLanguageName = (codeOrLabel: string) => {
    const known: Record<string, string> = {
      en: "English",
      fr: "French",
      es: "Spanish",
      pt: "Portuguese",
      ar: "Arabic",
      hi: "Hindi",
      zh: "Chinese (Simplified)",
      de: "German",
      ja: "Japanese",
      ko: "Korean",
      ru: "Russian",
      it: "Italian",
      tr: "Turkish",
      nl: "Dutch",
      sw: "Swahili",
      vi: "Vietnamese",
    };
    return known[codeOrLabel] || codeOrLabel || "English";
  };
  const [
    translatedMarketNews,
    translatedHighPriority,
    translatedDetectedAnomalies,
    translatedTodaySalesAlert,
    translatedBelowThreshold,
    translatedHighPriorityToast,
    translatedSpike,
    translatedDip,
    translatedExpected,
    translatedUpgradeAnomaly,
    translatedUpgradeButton,
    translatedUploadSalesData,
    translatedCustomerSentiment,
    translatedLater,
    translatedVerifying,
    translatedUnlockPro,
  ] = useTranslatedTexts(targetLanguage, [
    "Market & News Intelligence",
    "High Priority:",
    "Detected Anomalies",
    "Today's sales",
    "are below 60% of the 7-day average",
    "High-priority alert: Today's sales significantly below 7-day average",
    "Spike",
    "Dip",
    "expected",
    "Upgrade to Pro to detect anomalies in your sales data and get priority alerts.",
    "Upgrade to Pro",
    "Upload Sales Data",
    "Customer Sentiment",
    "Later",
    "Verifying...",
    "Unlock Pro",
  ]);

  const text = {
    marketNews: translatedMarketNews,
    highPriority: translatedHighPriority,
    detectedAnomalies: translatedDetectedAnomalies,
    todaySalesAlert: translatedTodaySalesAlert,
    belowThreshold: translatedBelowThreshold,
    highPriorityToast: translatedHighPriorityToast,
    spike: translatedSpike,
    dip: translatedDip,
    expected: translatedExpected,
    upgradeAnomaly: translatedUpgradeAnomaly,
    upgradeButton: translatedUpgradeButton,
    uploadSalesData: translatedUploadSalesData,
    customerSentiment: translatedCustomerSentiment,
    later: translatedLater,
    verifying: translatedVerifying,
    unlockPro: translatedUnlockPro,
  };

  const handleCSVUpload = useCallback(
    async (csvData: any, mappings: any, userId?: string, token?: string, sourceFile?: File) => {
      setIsUploadingCSV(true);
      setPieSummaryData(null);
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !authUser) {
          throw new Error("You must be signed in to upload sales data.");
        }
        if (userId && userId !== authUser.id) {
          throw new Error("Session mismatch. Please sign in again.");
        }
        const userIdFinal = authUser.id;

        let tokenToUse = token;
        if (!tokenToUse) {
          const { data: sessionData } = await supabase.auth.getSession();
          tokenToUse = sessionData?.session?.access_token;
        }
        if (!tokenToUse) {
          throw new Error("Session missing or expired. Please sign in again.");
        }

        const uploadCreditResponse = await fetch("/api/credits/consume-upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenToUse}`,
          },
        });
        const uploadCreditPayload = await uploadCreditResponse.json().catch(() => ({}));
        if (!uploadCreditResponse.ok) {
          throw new Error(uploadCreditPayload?.error || "Unable to consume upload credit");
        }

        // For very large uploads, use server-side ingestion endpoint.
        const shouldUseHighCapacityUpload = Boolean(
          sourceFile && (csvData?.rows?.length >= 30000 || sourceFile.size >= 10 * 1024 * 1024)
        );
        if (sourceFile && shouldUseHighCapacityUpload) {
          setImportProgress({
            open: true,
            current: 0,
            total: 1,
            percent: 10,
            isProcessing: false,
            statusText: "Uploading file...",
          });
          const form = new FormData();
          form.append("file", sourceFile);
          form.append("mappings", JSON.stringify(mappings || []));

          const uploadRequest = fetch("/api/sales/upload", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tokenToUse}`,
            },
            body: form,
          });
          setImportProgress({
            open: true,
            current: 1,
            total: 1,
            percent: 100,
            isProcessing: true,
            statusText: "Processing... server is importing and aggregating your data.",
          });

          const res = await uploadRequest;

          const payload = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(payload?.error || `Streaming upload failed with status ${res.status}`);
          }
          setImportProgress({
            open: true,
            current: 1,
            total: 1,
            percent: 100,
            isProcessing: true,
            statusText: "Processing... finalizing charts and metrics.",
          });

          const lineSummary = toLineSummaryRecords(
            Array.isArray(payload?.lineChartData) ? payload.lineChartData : payload?.chartSummary
          );
          const pieSummary = normalizePieSummary(
            Array.isArray(payload?.pieChartData) ? payload.pieChartData : payload?.productSummary
          );
          const displayData = lineSummary.length > 0 ? lineSummary : [];
          setSampleData(displayData);
          setPieSummaryData(pieSummary.length > 0 ? pieSummary : null);
          onDataLoad?.(displayData);
          setCsvContent(JSON.stringify(csvData.rows, null, 2));
          fireConfetti();
          toast.success(`Uploaded ${payload?.insertedRows || payload?.inserted || 0} sales records`, {
            description: "Large file processed with high-capacity ingestion",
          });
          window.dispatchEvent(new Event("credits:refresh"));

          generateRecommendations(displayData);
          return;
        }

        // Build a map of csv columns that are mapped to main schema fields
        const mappedCsvColumns = new Set<string>();
        mappings.forEach((m: any) => {
          if (m.dataField && m.csvColumn) {
            // mark csv column as mapped (so it won't be included in additional_data)
            mappedCsvColumns.add(m.csvColumn);
          }
        });

        // Transform CSV rows into strict sales objects matching new schema
        const processed: any[] = csvData.rows.map((row: any) => {
          // Create a mapping object (dataField -> value)
          const mapping = mappings.reduce((acc: any, m: any) => {
            if (m.dataField) acc[m.dataField] = row[m.csvColumn];
            return acc;
          }, {});

          // Date standardization: prefer sale_date, fallback to date, else today
          const rawDate = mapping.sale_date || mapping.date || row.sale_date || row.date || new Date().toISOString();
          const sale_date = (() => {
            const d = new Date(rawDate);
            if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
            return d.toISOString().split("T")[0];
          })();

          // Numeric cleaning helpers
          const cleanNumber = (val: any) => {
            if (val === null || val === undefined || val === "") return 0;
            const s = String(val).replace(/[$₦€¥£\s]/g, "").replace(/,/g, "");
            const n = Number(s);
            return isNaN(n) ? 0 : n;
          };

          const amount = cleanNumber(mapping.amount ?? mapping.value ?? row.amount ?? row.value);
          const quantity = cleanNumber(mapping.quantity ?? row.quantity ?? mapping.qty ?? row.qty);

          // Prepare additional_data by including any CSV columns that were not mapped
          const additional_data: Record<string, any> = {};
          Object.keys(row).forEach((col) => {
            if (!mappedCsvColumns.has(col)) {
              additional_data[col] = row[col];
            }
          });

          return {
            user_id: userIdFinal,
            sale_date,
            // keep `date` for internal ML engine compatibility
            date: sale_date,
            amount,
            quantity: quantity || null,
            region: mapping.region || row.region || "Unknown",
            product_name:
              mapping.product_name ||
              mapping.product ||
              row.product_name ||
              row.product ||
              row.item ||
              "Unknown",
            product:
              mapping.product ||
              mapping.product_name ||
              row.product ||
              row.product_name ||
              row.item ||
              "Unknown",
            category: mapping.category || row.category || "Other",
            additional_data: Object.keys(additional_data).length ? additional_data : null,
          };
        });

          // Show initial mapping toast
          toast(`Mapping ${processed.length} rows...`);

          // Chunked insert strategy
          const CHUNK_SIZE = 500;
          const totalBatches = Math.ceil(processed.length / CHUNK_SIZE);
          setImportProgress({
            open: true,
            current: 0,
            total: totalBatches,
            percent: 0,
            isProcessing: false,
            statusText: "Uploading batches...",
          });
          const IMPORT_PROGRESS_KEY = "aura_sales_import_progress_v1";
          const sessionId = `import_${Date.now()}`;

          // Load existing progress map (object of sessionId -> uploaded batch indices)
          let progressMap: Record<string, number[]> = {};
          try {
            const raw = typeof window !== "undefined" ? localStorage.getItem(IMPORT_PROGRESS_KEY) : null;
            progressMap = raw ? JSON.parse(raw) : {};
          } catch (e) {
            progressMap = {};
          }

          progressMap[sessionId] = progressMap[sessionId] || [];

          let allInserted: SalesRecord[] = [];
          const chartSummaryMap = new Map<string, number>();
          const pieSummaryTotals = new Map<string, PieSummaryDatum>();

          for (let b = 0; b < totalBatches; b++) {
            // Skip if this batch already recorded for this session
            if (progressMap[sessionId].includes(b)) continue;

            const start = b * CHUNK_SIZE;
            const batch = processed.slice(start, start + CHUNK_SIZE);

              toast(`Uploading batch ${b + 1} of ${totalBatches}...`);

              const res = await fetch("/api/upload-sales", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${tokenToUse}`,
                },
                body: JSON.stringify({ batch }),
              });

              if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(errBody?.error || `Upload failed with status ${res.status}`);
              }

              const resJson = await res.json();
              const batchData = resJson.data ?? null;

              const lineSummarySource = Array.isArray(resJson.lineChartData)
                ? resJson.lineChartData
                : Array.isArray(resJson.chartSummary)
                  ? resJson.chartSummary
                  : [];

              if (Array.isArray(lineSummarySource)) {
                for (const point of lineSummarySource) {
                  const key = String(point?.sale_date || "");
                  const amount = Number(point?.amount || 0);
                  if (!key) continue;
                  chartSummaryMap.set(key, (chartSummaryMap.get(key) || 0) + amount);
                }
              }

              const pieSummarySource = normalizePieSummary(
                Array.isArray(resJson.pieChartTotals)
                  ? resJson.pieChartTotals
                  : Array.isArray(resJson.pieChartData)
                    ? resJson.pieChartData
                    : resJson.productSummary
              );

              for (const point of pieSummarySource) {
                const key = point.name.toLowerCase();
                const existing = pieSummaryTotals.get(key);
                if (existing) {
                  existing.value += point.value;
                } else {
                  pieSummaryTotals.set(key, { ...point });
                }
              }

              const insertedBatch = (batchData ?? batch) as SalesRecord[];
            allInserted = [...allInserted, ...insertedBatch];

            // mark batch as uploaded for this session
            progressMap[sessionId].push(b);
            try {
              localStorage.setItem(IMPORT_PROGRESS_KEY, JSON.stringify(progressMap));
            } catch (e) {
              // ignore
            }

            const currentBatch = b + 1;
            setImportProgress({
              open: true,
              current: currentBatch,
              total: totalBatches,
              percent: Math.round((currentBatch / totalBatches) * 100),
              isProcessing: false,
              statusText: `Uploading batch ${currentBatch} of ${totalBatches}...`,
            });
          }

          setImportProgress({
            open: true,
            current: totalBatches,
            total: totalBatches,
            percent: 100,
            isProcessing: true,
            statusText: "Processing... finalizing analytics and AI context.",
          });

          // Clear session progress on success
          try {
            delete progressMap[sessionId];
            localStorage.setItem(IMPORT_PROGRESS_KEY, JSON.stringify(progressMap));
          } catch (e) {
            // ignore
          }

          const summarizedSeries: SalesRecord[] = Array.from(chartSummaryMap.entries())
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([sale_date, amount]) => ({
              sale_date,
              amount: Math.round(amount),
              region: "All",
              product_name: "All Products",
              quantity: null,
              additional_data: null,
            }));

          const summarizedPie = collapsePieSummary(Array.from(pieSummaryTotals.values()));

          const displayData =
            processed.length > 2000 && summarizedSeries.length > 0
              ? summarizedSeries
              : allInserted;

          setSampleData(displayData);
          setPieSummaryData(summarizedPie.length > 0 ? summarizedPie : null);
          onDataLoad?.(displayData);

          // Store CSV content for AI context
          setCsvContent(JSON.stringify(csvData.rows, null, 2));

          // Trigger success UX: confetti + high-end toast
          fireConfetti();
          toast.success(`Uploaded ${allInserted.length} sales records`, {
            description: "Your data is ready for AI analysis",
          });
          window.dispatchEvent(new Event("credits:refresh"));

          // Generate strategic recommendations
          generateRecommendations(allInserted);
      } catch (error) {
        setImportProgress((p) => ({ ...p, open: false }));
        toast.error("Upload failed", {
          description: error instanceof Error ? error.message : "An error occurred",
        });
      } finally {
        setImportProgress((p) => ({ ...p, open: false }));
        setIsUploadingCSV(false);
      }
    },
    [onDataLoad]
  );

  // Generate strategic recommendations based on uploaded data
  const generateRecommendations = useCallback(
    async (uploadedData: SalesRecord[]) => {
      try {
        setIsLoadingRecommendations(true);

        // Extract feedback from additional_data for sentiment analysis
        const feedbackList: string[] = [];
        uploadedData.forEach((record) => {
          if (record.additional_data && typeof record.additional_data === "object") {
            const feedback = record.additional_data.feedback;
            if (feedback && typeof feedback === "string" && feedback.trim().length > 0) {
              feedbackList.push(feedback);
            }
          }
        });

        // Analyze sentiment if feedback exists
        let sentimentData: any = null;
        if (feedbackList.length > 0) {
          sentimentData = await analyzeFeedback(feedbackList);
          if (sentimentData) {
            // Update sentiment state
            setSentimentScores(sentimentData.scores || []);
            setAverageSentimentScore(sentimentData.averageScore || 0);

            // Calculate sentiment trend
            const trend = calculateTrend(previousSentimentScore, sentimentData.averageScore);
            setSentimentTrend(trend as any);
            setPreviousSentimentScore(sentimentData.averageScore);
          }
        }

        const summaryDataForAI = summarizeDataForAI(uploadedData);

        // Build dashboard data for AI context
        const dashboardData = {
          totalRecords: uploadedData.length,
          topProducts: summaryDataForAI.top10Products,
          summary: {
            totalRevenue: summaryDataForAI.totalRevenue,
            volatility: summaryDataForAI.volatility,
            volatilityPercentage: summaryDataForAI.volatilityPercentage,
            recordCount: uploadedData.length,
          },
        };

        if (!analytics || analytics.error) return;

        try {
          const response = await fetch("/api/chat/recommendations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dashboardData,
              summaryDataForAI,
              businessName: "AuraSales",
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 402) {
              window.location.href = errorData?.redirectTo || "/pricing?payment=required";
              return;
            }
            throw new Error(errorData?.error || "Failed to fetch recommendations");
          }

          const data = await response.json();
          const nextRecommendations = Array.isArray(data.recommendations) ? data.recommendations : [];
          setRecommendations(nextRecommendations.length > 0 ? nextRecommendations : buildFallbackRecommendations(summaryDataForAI));
        } catch (error) {
          console.error("Recommendations API failed, using local fallback:", error);
          setRecommendations(buildFallbackRecommendations(summaryDataForAI));
          toast("Using local recommendations", {
            description: "Live AI recommendations are temporarily unavailable.",
          });
        }
        
        const successMsg = feedbackList.length > 0 
          ? `Strategic recommendations generated with sentiment analysis (${feedbackList.length} feedback entries)`
          : "Strategic recommendations generated";
        
        toast.success(successMsg, {
          description: "Check the recommendations section below",
        });

        if (!userHasProAccess) {
          toast("Upgrade to Pro for anomaly detection", {
            description:
              "Analysis is complete. Upgrade to Pro to detect anomalies in your data and unlock more advanced features.",
          });
        }
      } catch (err) {
        console.error("Recommendation generation error:", err);
        setRecommendations((prev) => (prev.length > 0 ? prev : buildFallbackRecommendations(summarizeDataForAI(uploadedData))));
        toast("Recommendations ready", {
          description: "Using local strategy guidance.",
        });
      } finally {
        setIsLoadingRecommendations(false);
      }
    },
    [analyzeFeedback, previousSentimentScore, analytics, userHasProAccess]
  );

  // Anomaly detection: check 7-day avg
  const { average: sevenAvg, today: todayAmount } = sevenDayAverage(sampleData as any);
  const showAnomalyBanner = isSignificantDrop(todayAmount, sevenAvg, 0.6);

  // AI Voice summary
  const speakSummary = () => {
    try {
      const total = analytics.summary.totalRevenue;
      const trend = analytics.summary.trend || "stable";
      const today = sampleData[sampleData.length - 1]?.amount || 0;
      const prev = sampleData[sampleData.length - 2]?.amount || today;
      const pct = prev ? Math.round(((today - prev) / prev) * 100) : 0;
      const topRegion = analytics.regionalAnalysis[0]?.region || "N/A";
      const currency = new Intl.NumberFormat(dashboardCopy.speechLocale, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(total);
      const localizedTrend = getTrendLabel(targetLanguage, trend);
      const sentence = [
        dashboardCopy.voice.analysisComplete,
        `${dashboardCopy.voice.revenueIs} ${currency}.`,
        `${dashboardCopy.voice.trendIs} ${localizedTrend} (${pct}%).`,
        `${dashboardCopy.voice.topRegionIs} ${topRegion}.`,
      ].join(" ");
      const utter = new SpeechSynthesisUtterance(sentence);
      utter.lang = dashboardCopy.speechLocale;
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (voice) =>
          voice.lang?.toLowerCase().startsWith(dashboardCopy.speechLocale.toLowerCase().split("-")[0]) ||
          voice.lang?.toLowerCase().startsWith(dashboardCopy.speechLocale.toLowerCase()) ||
          voice.name.toLowerCase().includes(dashboardCopy.languageName.toLowerCase())
      );
      if (preferredVoice) {
        utter.voice = preferredVoice;
      }
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.error(e);
      toast.error("Speech not supported in this browser");
    }
  };

  const exportPDF = async () => {
    try {
      // Get revenue chart section (first chart)
      const revenueSection = document.querySelector(".revenue-overview") as HTMLElement | null;
      // Get regional insights section (second chart)
      const regionalSection = document.querySelector(".regional-insights") as HTMLElement | null;

      if (!revenueSection || !regionalSection) {
        throw new Error("Revenue or Regional section not found. Please ensure dashboard is fully loaded.");
      }

      await exportDashboardToPDF(revenueSection, regionalSection, `AuraSales_Report_${Date.now()}.pdf`, {
        locale: dashboardCopy.speechLocale,
        labels: dashboardCopy.pdf,
      });
      toast.success(dashboardCopy.ui.pdfExported);
    } catch (err: any) {
      console.error(err);
      toast.error(dashboardCopy.ui.pdfExportFailed, { description: err?.message });
    }
  };

  // Handle task completion toggle
  const handleTaskToggle = useCallback(
    (taskId: string, completed: boolean) => {
      setRecommendations((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed } : task
        )
      );
    },
    []
  );

  // Handle sending strategy via email
  const [isSendingStrategy, setIsSendingStrategy] = useState(false);

  const handleSendStrategy = useCallback(async () => {
    if (!recommendations || recommendations.length === 0) {
      toast.error("No recommendations to send");
      return;
    }

    try {
      setIsSendingStrategy(true);

      // Get user email from Supabase
      const supabase = createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user?.email) {
        toast.error("No email address found. Please sign in.");
        return;
      }

      // Build executive summary from analytics
      const localizedTrend = getTrendLabel(targetLanguage, analytics.summary.trend);
      const executiveSummary = `${dashboardCopy.pdf.executiveSalesAnalysis}: ${dashboardCopy.pdf.totalRevenue} ${new Intl.NumberFormat(targetLanguage).format(analytics.summary.totalRevenue)}. ${dashboardCopy.pdf.dailyAverage} ${new Intl.NumberFormat(targetLanguage).format(analytics.summary.averageDaily)}. ${dashboardCopy.pdf.topRegion}: ${analytics.regionalAnalysis[0]?.region || "N/A"}. ${localizedTrend}. ${dashboardCopy.pdf.strategySummaryTail ?? "The analysis identifies 3 prioritized, low-cost actions tailored to your selected language and dashboard context."}`;

      // Send via email API
      const payload = {
      toEmail: user.email,
        actions: displayRecommendations.map((rec) => ({
          title: rec.title,
          description: rec.description,
          priority: rec.priority,
          estimatedROI: rec.estimatedROI,
        })),
        executiveSummary,
        businessName: "AuraSales",
        locale: targetLanguage,
      };

      let lastError: any = null;
      const maxAttempts = 5;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const response = await fetch("/api/send-strategy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData?.details || errorData?.error || "Failed to send email");
          }

          toast.success("Strategy sent to your email!", {
            description: `Memo sent to ${user.email}. Check your inbox or spam folder.`,
          });
          return;
        } catch (err: any) {
          lastError = err;
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 800));
            continue;
          }
        }
      }

      throw new Error(
        lastError?.message?.includes("fetch failed")
          ? "Unable to send strategy right now. Please check your internet connection and try again."
          : (lastError?.message || "Failed to send email")
      );
    } catch (error) {
      console.error("Send strategy error:", error);
      toast.error("Failed to send strategy", {
        description: (error as any)?.message || "Please try again",
      });
    } finally {
      setIsSendingStrategy(false);
    }
  }, [displayRecommendations, analytics.summary, dashboardCopy, targetLanguage, analytics.regionalAnalysis]);

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <ImportProgressModal
        open={importProgress.open}
        current={importProgress.current}
        total={importProgress.total}
        percent={importProgress.percent}
        isProcessing={importProgress.isProcessing}
        statusText={importProgress.statusText}
        onClose={() => setImportProgress((p) => ({ ...p, open: false }))}
      />
      {/* Header controls */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-slate-300 hover:text-slate-100" />
          </button>
        </div>
        <div />
      </div>

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        hasProAccess={hasProAccess(currentUser)}
        proOnlyFeatureIds={Array.from(proOnlyFeatures)}
        onLockedFeatureClick={() => {
          toast.error("Upgrade to Pro to use this feature");
          window.location.href = "/pricing?payment=required";
        }}
        onSelect={(feature) => {
          if (proOnlyFeatures.has(feature) && !requireProAccess(feature)) {
            return;
          }
          setActiveFeature(feature);
          if (feature === "text-ai") toast("Use the mic inside the AURA chat input beside Send.");
          if (feature === "predictive") setDrawerOpen(true);
          if (feature === "ai-voice") speakSummary();
          if (feature === "pdf") {
            (async () => {
              try {
                toast(dashboardCopy.ui.preparingPdf);

                // Fetch recent chat history for context
                let chatHistory: any[] = [];
                try {
                  const res = await fetch('/api/chat/history');
                  if (res.ok) {
                    const j = await res.json();
                    chatHistory = j.messages || [];
                  }
                } catch (e) {
                  // ignore chat history failure
                }

                // Build a concise executive summary from analytics + insights
                const summaryText = [
                  `${dashboardCopy.pdf.totalRevenue}: ${new Intl.NumberFormat(dashboardCopy.speechLocale).format(analytics.summary.totalRevenue)}`,
                  `${dashboardCopy.pdf.dailyAverage}: ${new Intl.NumberFormat(dashboardCopy.speechLocale).format(analytics.summary.averageDaily)}`,
                  `${dashboardCopy.pdf.topRegion}: ${analytics.regionalAnalysis[0]?.region || "N/A"}`,
                  "",
                  `${dashboardCopy.pdf.topInsights}:`,
                  ...localizedExportInsights.map((i) => `- ${i}`),
                ].join("\n");

                // Calculate growth percentages based on available analytics
                const sevenDayTotal = analytics.summary.averageDaily * 7;
                const revenueGrowth = sevenDayTotal > 0 
                  ? (((analytics.summary.totalRevenue - sevenDayTotal) / sevenDayTotal) * 100).toFixed(1)
                  : '0';

                const kpis = [
                  { label: dashboardCopy.pdf.totalRevenue, value: analytics.summary.totalRevenue, growth: parseFloat(revenueGrowth) },
                  { label: dashboardCopy.pdf.dailyAverage, value: analytics.summary.averageDaily, growth: 5.2 },
                  { label: dashboardCopy.pdf.topRegion, value: analytics.regionalAnalysis[0]?.region || "N/A" },
                  { label: dashboardCopy.pdf.volatility ?? "Volatility", value: `${(analytics.summary.volatility * 100).toFixed(1)}%`, growth: -2.1 },
                ];

                const chartSelectors = ['.revenue-overview', '.regional-insights'];

                await exportDetailedPDF({ summaryText, kpis, chartSelectors, chatHistory, locale: dashboardCopy.speechLocale, labels: dashboardCopy.pdf });
                toast.success(dashboardCopy.ui.pdfExported);
              } catch (err: any) {
                console.error('Export failed', err);
                toast.error(dashboardCopy.ui.pdfExportFailed, { description: err?.message || 'Export failed' });
              }
            })();
          }
          if (feature === "anomaly") {
            if (showAnomalyBanner) {
              toast.error(text.highPriorityToast, { description: `Today: $${todayAmount.toLocaleString()} vs 7-day avg $${Math.round(sevenAvg).toLocaleString()}` });
            } else {
              toast.success("No major anomalies detected");
            }
          }
        }}
      />

      <motion.section variants={itemVariants} className="p-3 rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <p>
              Access: <span className="font-semibold text-slate-100">{currentUser.plan.toUpperCase()}</span> | Role:{" "}
              <span className="font-semibold text-slate-100">{currentUser.role.toUpperCase()}</span> | {currentUser.email}
            </p>
            {isAdminEmail(currentUser.email) && (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  enterpriseUnlocked
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-cyan-500/15 text-cyan-300"
                }`}
              >
                {enterpriseUnlocked ? "Enterprise Unlocked" : "Enterprise Access"}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdminEmail(currentUser.email) && currentUser.plan !== "pro" && (
              <button
                onClick={() => setShowAdminVerifyModal(true)}
                className="px-3 py-1.5 text-xs rounded border border-emerald-600 text-emerald-200 hover:bg-emerald-900/30"
              >
                Unlock Pro
              </button>
            )}
            {isAdminEmail(currentUser.email) && !enterpriseUnlocked && (
              <button
                onClick={() => setShowEnterpriseVerifyModal(true)}
                className="px-3 py-1.5 text-xs rounded border border-cyan-600 text-cyan-200 hover:bg-cyan-900/30"
              >
                Unlock Enterprise
              </button>
            )}
          </div>
        </div>
      </motion.section>

      {showAdminVerifyModal && (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-2">Admin Pro Verification</h3>
            <p className="text-xs text-slate-400 mb-4">Enter Admin Pro Password to unlock Pro access.</p>
            <input
              type="password"
              value={adminPasswordInput}
              onChange={(e) => setAdminPasswordInput(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 text-sm outline-none focus:border-emerald-500"
              placeholder="Admin Pro Password"
              autoFocus
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  if (isVerifyingAdmin) return;
                  setShowAdminVerifyModal(false);
                }}
                className="px-3 py-1.5 text-xs rounded border border-slate-600 text-slate-200 hover:bg-slate-800"
                disabled={isVerifyingAdmin}
              >
                {text.later}
              </button>
              <button
                onClick={() => verifyAdminPassword(adminPasswordInput)}
                className="px-3 py-1.5 text-xs rounded border border-emerald-600 text-emerald-200 hover:bg-emerald-900/30 disabled:opacity-60"
                disabled={isVerifyingAdmin || !adminPasswordInput.trim()}
              >
                {isVerifyingAdmin ? text.verifying : text.unlockPro}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEnterpriseVerifyModal && (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-2">Admin Enterprise Verification</h3>
            <p className="text-xs text-slate-400 mb-4">Enter the enterprise password to unlock Enterprise access.</p>
            <input
              type="password"
              value={enterprisePasswordInput}
              onChange={(e) => setEnterprisePasswordInput(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-600 text-slate-100 text-sm outline-none focus:border-cyan-500"
              placeholder="Admin Enterprise Password"
              autoFocus
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  if (isVerifyingEnterprise) return;
                  setShowEnterpriseVerifyModal(false);
                }}
                className="px-3 py-1.5 text-xs rounded border border-slate-600 text-slate-200 hover:bg-slate-800"
                disabled={isVerifyingEnterprise}
              >
                {text.later}
              </button>
              <button
                onClick={() => verifyEnterprisePassword(enterprisePasswordInput)}
                className="px-3 py-1.5 text-xs rounded border border-cyan-600 text-cyan-200 hover:bg-cyan-900/30 disabled:opacity-60"
                disabled={isVerifyingEnterprise || !enterprisePasswordInput.trim()}
              >
                {isVerifyingEnterprise ? "Verifying..." : "Unlock Enterprise"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      {!isDemo && (
        <motion.section variants={itemVariants} className="p-6 rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-md">
          <h2 className="text-lg font-semibold text-slate-50 mb-4">{text.uploadSalesData}</h2>
          <CSVUploader onUpload={handleCSVUpload} />
        </motion.section>
      )}

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const isPositive = stat.trend === "increasing";
          return (
            <div
              key={idx}
              className="p-4 rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-md"
            >
              <div className="flex items-start justify-between mb-2">
                <Icon className="w-5 h-5 text-blue-500" />
                {isPositive ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
              </div>
              <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-50 mb-1">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.change}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Sentiment Analysis Section */}
      {sentimentScores.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sentiment Gauge */}
          <div className="p-6 rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-md flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-slate-50 mb-4 w-full text-center">{text.customerSentiment}</h3>
            <div className="relative w-full flex items-center justify-center">
              <SentimentGauge score={averageSentimentScore} size={200} />
            </div>
          </div>

          {/* Risk Alert */}
          <div className="lg:col-span-2 p-6 rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-md">
            <RiskAlertCard
              risk={calculateAuraRisk(
                analytics.summary.trend === "increasing" ? "up" : analytics.summary.trend === "decreasing" ? "down" : "stable",
                sentimentTrend
              )}
            />
          </div>
        </motion.div>
      )}

      {/* Sentiment Breakdown - Top Negative Comments */}
      {sentimentScores.length > 0 && (
        <motion.div variants={itemVariants}>
          <SentimentBreakdown
            negativeComments={getTopNegativeComments(sentimentScores, 3)}
            totalNegative={sentimentScores.filter((s) => s.label === "Negative").length}
          />
        </motion.div>
      )}

      {/* Charts Grid (Bento Box Style) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="revenue-overview p-6 rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-50">Revenue Over Time</h3>
            <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900/60 p-1">
              {(["daily", "weekly", "monthly"] as RevenueGranularity[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition ${
                    granularity === g
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:text-slate-100"
                  }`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                stroke="#94a3b8"
                dataKey="date"
                height={50}
                angle={-45}
                textAnchor="end"
                tick={{ fontSize: 12, fontFamily: 'inherit' }}
                minTickGap={50}
                interval="preserveStartEnd"
              />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#cbd5e1" }}
                formatter={(value, name, props) => {
                  if (props.payload && props.payload.predicted && !props.payload.actual) {
                    return [
                      `$${props.payload.predicted.toLocaleString()}`,
                      'AI Prediction',
                    ];
                  }
                  return [`$${value?.toLocaleString()}`, 'Actual Revenue'];
                }}
              />
              <Line
                {...({ dataMissBuffer: 0 } as any)}
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 2, fill: "#3b82f6" }}
                activeDot={{ r: 3, fill: "#3b82f6" }}
                isAnimationActive={true}
              />
              <Line
                {...({ dataMissBuffer: 0 } as any)}
                type="monotone"
                dataKey="predicted"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 2, fill: "#f59e0b" }}
                activeDot={{ r: 3, fill: "#f59e0b" }}
                strokeDasharray="5 5"
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
          {revenueView.metadata.isAggregated && (
            <p className="text-xs text-slate-400 mt-2">
              {getAggregationMessage(revenueView.metadata)}
              {granularity === "daily" && revenueView.effectiveGranularity === "weekly"
                ? " Auto-switched to weekly for performance."
                : ""}
            </p>
          )}
          {forecastData && (
            <div className="mt-3 text-xs text-slate-400 space-y-1">
              <p>
                3-Month Forecast | Historical Avg: $
                {forecastData.historicalAverage?.toLocaleString()}
              </p>
              <p>
                Forecast Avg: $
                {forecastData.forecastAverage?.toLocaleString()} | Confidence:{" "}
                {forecastData.confidence
                  ? Math.round(forecastData.confidence * 100)
                  : 0}
                %
              </p>
            </div>
          )}
          {!forecastData && !isLoadingForecast && sampleData.length < 2 && (
            <div className="mt-3 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2">
              Not enough data for 3-month projection
            </div>
          )}
          {!forecastData && !isLoadingForecast && sampleData.length >= 2 && forecastStatusMessage && (
            <div className="mt-3 text-xs text-slate-300 bg-slate-700/30 border border-slate-600/30 rounded px-3 py-2">
              {forecastStatusMessage}
            </div>
          )}
        </div>

        {/* Category Distribution (Dynamic Pie Chart) */}
        <div className="regional-insights p-6 rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-md mb-6">
          <h3 className="text-lg font-semibold text-slate-50 mb-2">Dynamic Sales Pie Chart</h3>
          <SalesPieChart data={displayPieSummaryData ?? sampleData} />
        </div>
      </motion.div>

      {/* Future Insights Card */}
      {forecastInsight && (
        <motion.div variants={itemVariants}>
          <FutureInsightsCard
            risk={forecastInsight.risk}
            opportunity={forecastInsight.opportunity}
            confidenceScore={forecastInsight.confidenceScore}
            isLoading={isLoadingForecast}
            targetLanguage={targetLanguage}
            trendPoints={[
              ...((forecastData?.historicalPoints || []) as Array<{
                date?: string;
                label?: string;
                revenue?: number;
                actualRevenue?: number;
              }>).map((point) => ({
                date: point.date || point.label || "",
                label: point.label || point.date || "",
                revenue: Number(point.revenue ?? point.actualRevenue ?? 0),
                isForecast: false,
              })),
              ...((forecastData?.forecastPoints || []) as Array<{
                date?: string;
                label?: string;
                revenue?: number;
                actualRevenue?: number;
              }>).map((point) => ({
                date: point.date || point.label || "",
                label: point.label || point.date || "",
                revenue: Number(point.revenue ?? point.actualRevenue ?? 0),
                isForecast: true,
              })),
            ]}
          />
        </motion.div>
      )}

      {/* Market Insights (includes market/news demo mode states) */}
      <motion.div variants={itemVariants}>
        <div className="p-6 rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-md">
          <h3 className="text-lg font-semibold text-slate-50 mb-4">
            {text.marketNews}
          </h3>
          <MarketInsightsDashboard
            targetLanguage={targetLanguage}
            hasUploadedData={csvContent.trim().length > 0}
            csvContent={csvContent}
          />
        </div>
      </motion.div>

      {/* AI Insights */}
      <motion.div variants={itemVariants}>
        <AIInsightsPanel insights={displayInsights} isLoading={isUploadingCSV} targetLanguage={targetLanguage} />
      </motion.div>

      {/* What-If Simulator */}
      <motion.div variants={itemVariants}>
        <WhatIfSimulator
          forecasts={analytics.forecasts}
          originalForecasts={analytics.forecasts}
          onSimulate={setWhatIfMultiplier}
          targetLanguage={targetLanguage}
        />
      </motion.div>

      {/* Strategic Recommendations */}
      <motion.div variants={itemVariants}>
        <ActionPanel
          tasks={displayRecommendations}
          isLoading={isLoadingRecommendations}
          onTaskToggle={handleTaskToggle}
          onSendStrategy={handleSendStrategy}
          isSendingStrategy={isSendingStrategy}
          targetLanguage={targetLanguage}
        />
      </motion.div>

      <ExecutiveDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        marketing={marketingPct}
        growth={growthPct}
        setMarketing={setMarketingPct}
        setGrowth={setGrowthPct}
      />

      {/* AURA Chat Bubble - Primary AI Chat Interface */}
      <AuraChat
        dashboardData={analytics}
        csvContent={csvContent}
        businessName="AuraSales"
        targetLanguage={targetLanguage}
      />

      {/* Anomalies */}
      {userHasProAccess && showAnomalyBanner && (
        <div className="fixed top-16 left-0 right-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto max-w-7xl mx-4">
            <div className="rounded-lg p-3 text-center bg-red-600/20 border border-red-500 shadow-lg animate-pulse">
              <strong className="text-red-200">{text.highPriority}</strong>
              <span className="text-red-100 ml-2">{text.todaySalesAlert} ${todayAmount.toLocaleString()} {text.belowThreshold} (${Math.round(sevenAvg).toLocaleString()})</span>
            </div>
          </div>
        </div>
      )}

      {userHasProAccess && analytics.anomalies.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-md"
        >
          <h3 className="text-lg font-semibold text-slate-50 mb-4">{text.detectedAnomalies}</h3>
          <div className="space-y-2">
            {analytics.anomalies.map((anomaly, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {anomaly.type === "spike" ? "📈" : "📉"} {anomaly.sale_date}
                  </p>
                  <p className="text-xs text-slate-400">
                    {anomaly.type === "spike" ? text.spike : text.dip}: ${anomaly.actual.toLocaleString()} ({text.expected}: ${anomaly.expected.toLocaleString()})
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    anomaly.severity === "high"
                      ? "bg-red-500/20 text-red-400"
                      : anomaly.severity === "medium"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {anomaly.severity}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!userHasProAccess && (
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-lg border border-slate-700 bg-slate-800/40 backdrop-blur-md opacity-90"
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <h3 className="text-lg font-semibold text-slate-50">{text.detectedAnomalies}</h3>
            <span className="text-xs px-2 py-1 rounded-full border border-cyan-500/50 text-cyan-300">
              PRO
            </span>
          </div>
          <p className="text-sm text-slate-300 mb-3">
            {text.upgradeAnomaly}
          </p>
          <button
            type="button"
            onClick={() => {
              toast.error("Upgrade to Pro to use this feature");
              window.location.href = "/pricing?payment=required";
            }}
            className="px-3 py-2 text-xs rounded border border-cyan-500/50 text-cyan-200 hover:bg-cyan-900/20"
          >
            {text.upgradeButton}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}



