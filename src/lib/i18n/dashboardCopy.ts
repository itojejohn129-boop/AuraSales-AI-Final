import { resolveSupportedLanguage, type SupportedLanguageCode } from "./languages";

export interface DashboardPdfLabels {
  reportGenerated: string;
  confidential: string;
  executiveSalesAnalysis: string;
  topInsights: string;
  keyPerformanceIndicators: string;
  dashboardCharts: string;
  aiAnalysisHistory: string;
  metric: string;
  value: string;
  growth: string;
  page: string;
  of: string;
  generated: string;
  you: string;
  auraAi: string;
  totalRevenue: string;
  dailyAverage: string;
  topRegion: string;
  speaker: string;
  message: string;
  revenueOverviewTitle: string;
  revenueOverviewSubtitle: string;
  regionalInsightsTitle: string;
  regionalInsightsSubtitle: string;
  analysisLabel?: string;
  strategyMemoTitle?: string;
  strategySummaryHeading?: string;
  strategyActionsHeading?: string;
  priorityHigh?: string;
  priorityMedium?: string;
  priorityLow?: string;
  estimatedROI?: string;
  readyToExecute?: string;
  openDashboard?: string;
  strategyFooterNote?: string;
  volatility?: string;
  strategySummaryTail?: string;
}

export interface DashboardVoiceLabels {
  analysisComplete: string;
  revenueIs: string;
  trendIs: string;
  topRegionIs: string;
  trendUp: string;
  trendDown: string;
  trendStable: string;
  readyToAnalyze: string;
}

export interface DashboardUiLabels {
  preparingPdf: string;
  pdfExported: string;
  pdfExportFailed: string;
}

export interface DashboardLocaleCopy {
  speechLocale: string;
  languageName: string;
  pdf: DashboardPdfLabels;
  voice: DashboardVoiceLabels;
  ui: DashboardUiLabels;
}

const SPEECH_LOCALES: Record<SupportedLanguageCode, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  pt: "pt-BR",
  ar: "ar-SA",
  hi: "hi-IN",
  zh: "zh-CN",
  de: "de-DE",
  ja: "ja-JP",
  ko: "ko-KR",
  ru: "ru-RU",
  it: "it-IT",
  tr: "tr-TR",
  nl: "nl-NL",
  sw: "sw-KE",
  vi: "vi-VN",
};

const DASHBOARD_LOCALE_COPY: Record<SupportedLanguageCode, DashboardLocaleCopy> = {
  en: {
    speechLocale: SPEECH_LOCALES.en,
    languageName: "English",
    pdf: {
      reportGenerated: "Report Generated",
      confidential: "CONFIDENTIAL",
      executiveSalesAnalysis: "Executive Sales Analysis",
      topInsights: "Top Insights",
      keyPerformanceIndicators: "Key Performance Indicators",
      dashboardCharts: "Dashboard Charts",
      aiAnalysisHistory: "AI Analysis History",
      metric: "Metric",
      value: "Value",
      growth: "Growth %",
      page: "Page",
      of: "of",
      generated: "Generated",
      you: "You",
      auraAi: "AURA AI",
      totalRevenue: "Total Revenue",
      dailyAverage: "Daily Average",
      topRegion: "Top Region",
      speaker: "Speaker",
      message: "Message",
      revenueOverviewTitle: "Revenue Overview",
      revenueOverviewSubtitle: "Summary of revenue metrics and trends",
      regionalInsightsTitle: "Regional Insights",
      regionalInsightsSubtitle: "Geographic analysis and regional performance metrics",
    },
    voice: {
      analysisComplete: "Analysis complete.",
      revenueIs: "Revenue is",
      trendIs: "the trend is",
      topRegionIs: "Top region is",
      trendUp: "upward",
      trendDown: "downward",
      trendStable: "stable",
      readyToAnalyze: "I am ready to analyze your data.",
    },
    ui: {
      preparingPdf: "Preparing PDF export...",
      pdfExported: "PDF exported successfully",
      pdfExportFailed: "Failed to export PDF",
    },
  },
  fr: {
    speechLocale: SPEECH_LOCALES.fr,
    languageName: "French",
    pdf: {
      reportGenerated: "Rapport généré",
      confidential: "CONFIDENTIEL",
      executiveSalesAnalysis: "Analyse commerciale exécutive",
      topInsights: "Principales informations",
      keyPerformanceIndicators: "Indicateurs clés de performance",
      dashboardCharts: "Graphiques du tableau de bord",
      aiAnalysisHistory: "Historique des analyses IA",
      metric: "Métrique",
      value: "Valeur",
      growth: "Croissance %",
      page: "Page",
      of: "sur",
      generated: "Généré",
      you: "Vous",
      auraAi: "AURA AI",
      totalRevenue: "Chiffre d'affaires total",
      dailyAverage: "Moyenne journalière",
      topRegion: "Meilleure région",
      speaker: "Locuteur",
      message: "Message",
      revenueOverviewTitle: "Aperçu des revenus",
      revenueOverviewSubtitle: "Résumé des métriques et tendances de revenus",
      regionalInsightsTitle: "Aperçus régionaux",
      regionalInsightsSubtitle: "Analyse géographique et performances régionales",
    },
    voice: {
      analysisComplete: "Analyse terminée.",
      revenueIs: "Le chiffre d'affaires est",
      trendIs: "la tendance est",
      topRegionIs: "La meilleure région est",
      trendUp: "à la hausse",
      trendDown: "à la baisse",
      trendStable: "stable",
      readyToAnalyze: "Je suis prêt à analyser vos données.",
    },
    ui: {
      preparingPdf: "Préparation de l'export PDF...",
      pdfExported: "PDF exporté avec succès",
      pdfExportFailed: "Échec de l'export du PDF",
    },
  },
  es: {
    speechLocale: SPEECH_LOCALES.es,
    languageName: "Spanish",
    pdf: {
      reportGenerated: "Informe generado",
      confidential: "CONFIDENCIAL",
      executiveSalesAnalysis: "Análisis ejecutivo de ventas",
      topInsights: "Principales insights",
      keyPerformanceIndicators: "Indicadores clave de rendimiento",
      dashboardCharts: "Gráficos del panel",
      aiAnalysisHistory: "Historial de análisis de IA",
      metric: "Métrica",
      value: "Valor",
      growth: "Crecimiento %",
      page: "Página",
      of: "de",
      generated: "Generado",
      you: "Tú",
      auraAi: "AURA AI",
      totalRevenue: "Ingresos totales",
      dailyAverage: "Promedio diario",
      topRegion: "Región principal",
      speaker: "Hablante",
      message: "Mensaje",
      revenueOverviewTitle: "Resumen de ingresos",
      revenueOverviewSubtitle: "Resumen de métricas y tendencias de ingresos",
      regionalInsightsTitle: "Perspectivas regionales",
      regionalInsightsSubtitle: "Análisis geográfico y métricas regionales",
    },
    voice: {
      analysisComplete: "Análisis completo.",
      revenueIs: "Los ingresos son",
      trendIs: "la tendencia es",
      topRegionIs: "La región principal es",
      trendUp: "al alza",
      trendDown: "a la baja",
      trendStable: "estable",
      readyToAnalyze: "Estoy listo para analizar tus datos.",
    },
    ui: {
      preparingPdf: "Preparando exportación de PDF...",
      pdfExported: "PDF exportado con éxito",
      pdfExportFailed: "Error al exportar el PDF",
    },
  },
  pt: {
    speechLocale: SPEECH_LOCALES.pt,
    languageName: "Portuguese",
    pdf: {
      reportGenerated: "Relatório gerado",
      confidential: "CONFIDENCIAL",
      executiveSalesAnalysis: "Análise executiva de vendas",
      topInsights: "Principais insights",
      keyPerformanceIndicators: "Principais indicadores de desempenho",
      dashboardCharts: "Gráficos do painel",
      aiAnalysisHistory: "Histórico de análise de IA",
      metric: "Métrica",
      value: "Valor",
      growth: "Crescimento %",
      page: "Página",
      of: "de",
      generated: "Gerado",
      you: "Você",
      auraAi: "AURA AI",
      totalRevenue: "Receita total",
      dailyAverage: "Média diária",
      topRegion: "Região principal",
      speaker: "Falante",
      message: "Mensagem",
      revenueOverviewTitle: "Visão geral da receita",
      revenueOverviewSubtitle: "Resumo das métricas e tendências de receita",
      regionalInsightsTitle: "Insights regionais",
      regionalInsightsSubtitle: "Análise geográfica e métricas regionais",
    },
    voice: {
      analysisComplete: "Análise concluída.",
      revenueIs: "A receita é",
      trendIs: "a tendência está",
      topRegionIs: "A principal região é",
      trendUp: "em alta",
      trendDown: "em queda",
      trendStable: "estável",
      readyToAnalyze: "Estou pronto para analisar seus dados.",
    },
    ui: {
      preparingPdf: "Preparando exportação de PDF...",
      pdfExported: "PDF exportado com sucesso",
      pdfExportFailed: "Falha ao exportar o PDF",
    },
  },
  ar: {
    speechLocale: SPEECH_LOCALES.ar,
    languageName: "Arabic",
    pdf: {
      reportGenerated: "تم إنشاء التقرير",
      confidential: "سري",
      executiveSalesAnalysis: "تحليل مبيعات تنفيذي",
      topInsights: "أهم الرؤى",
      keyPerformanceIndicators: "مؤشرات الأداء الرئيسية",
      dashboardCharts: "مخططات لوحة التحكم",
      aiAnalysisHistory: "سجل تحليل الذكاء الاصطناعي",
      metric: "المؤشر",
      value: "القيمة",
      growth: "النمو %",
      page: "الصفحة",
      of: "من",
      generated: "تم الإنشاء",
      you: "أنت",
      auraAi: "AURA AI",
      totalRevenue: "إجمالي الإيرادات",
      dailyAverage: "المتوسط اليومي",
      topRegion: "أفضل منطقة",
      speaker: "المتحدث",
      message: "الرسالة",
      revenueOverviewTitle: "نظرة عامة على الإيرادات",
      revenueOverviewSubtitle: "ملخص مقاييس واتجاهات الإيرادات",
      regionalInsightsTitle: "رؤى إقليمية",
      regionalInsightsSubtitle: "تحليل جغرافي ومقاييس إقليمية",
    },
    voice: {
      analysisComplete: "اكتمل التحليل.",
      revenueIs: "الإيرادات هي",
      trendIs: "الاتجاه",
      topRegionIs: "المنطقة الأفضل هي",
      trendUp: "صاعد",
      trendDown: "هابط",
      trendStable: "مستقر",
      readyToAnalyze: "أنا مستعد لتحليل بياناتك.",
    },
    ui: {
      preparingPdf: "جارٍ إعداد تصدير PDF...",
      pdfExported: "تم تصدير PDF بنجاح",
      pdfExportFailed: "فشل تصدير PDF",
    },
  },
  hi: {
    speechLocale: SPEECH_LOCALES.hi,
    languageName: "Hindi",
    pdf: {
      reportGenerated: "रिपोर्ट तैयार की गई",
      confidential: "गोपनीय",
      executiveSalesAnalysis: "कार्यकारी बिक्री विश्लेषण",
      topInsights: "मुख्य अंतर्दृष्टि",
      keyPerformanceIndicators: "मुख्य प्रदर्शन संकेतक",
      dashboardCharts: "डैशबोर्ड चार्ट",
      aiAnalysisHistory: "AI विश्लेषण इतिहास",
      metric: "माप",
      value: "मान",
      growth: "वृद्धि %",
      page: "पृष्ठ",
      of: "का",
      generated: "जनरेट किया गया",
      you: "आप",
      auraAi: "AURA AI",
      totalRevenue: "कुल राजस्व",
      dailyAverage: "दैनिक औसत",
      topRegion: "शीर्ष क्षेत्र",
      speaker: "वक्ता",
      message: "संदेश",
      revenueOverviewTitle: "राजस्व अवलोकन",
      revenueOverviewSubtitle: "राजस्व मेट्रिक्स और रुझानों का सारांश",
      regionalInsightsTitle: "क्षेत्रीय अंतर्दृष्टि",
      regionalInsightsSubtitle: "भौगोलिक विश्लेषण और क्षेत्रीय प्रदर्शन मीट्रिक्स",
    },
    voice: {
      analysisComplete: "विश्लेषण पूरा हुआ।",
      revenueIs: "राजस्व है",
      trendIs: "रुझान है",
      topRegionIs: "शीर्ष क्षेत्र है",
      trendUp: "ऊपर की ओर",
      trendDown: "नीचे की ओर",
      trendStable: "स्थिर",
      readyToAnalyze: "मैं आपके डेटा का विश्लेषण करने के लिए तैयार हूँ।",
    },
    ui: {
      preparingPdf: "PDF निर्यात तैयार किया जा रहा है...",
      pdfExported: "PDF सफलतापूर्वक निर्यात हुआ",
      pdfExportFailed: "PDF निर्यात विफल",
    },
  },
  zh: {
    speechLocale: SPEECH_LOCALES.zh,
    languageName: "Chinese",
    pdf: {
      reportGenerated: "报告已生成",
      confidential: "机密",
      executiveSalesAnalysis: "高管销售分析",
      topInsights: "要点",
      keyPerformanceIndicators: "关键绩效指标",
      dashboardCharts: "仪表板图表",
      aiAnalysisHistory: "AI 分析历史",
      metric: "指标",
      value: "数值",
      growth: "增长 %",
      page: "页",
      of: "共",
      generated: "生成时间",
      you: "您",
      auraAi: "AURA AI",
      totalRevenue: "总收入",
      dailyAverage: "日均收入",
      topRegion: "最佳区域",
      speaker: "发言者",
      message: "消息",
      revenueOverviewTitle: "收入概览",
      revenueOverviewSubtitle: "收入指标和趋势摘要",
      regionalInsightsTitle: "区域洞察",
      regionalInsightsSubtitle: "地理分析和区域绩效指标",
    },
    voice: {
      analysisComplete: "分析完成。",
      revenueIs: "收入为",
      trendIs: "趋势为",
      topRegionIs: "最佳区域是",
      trendUp: "上升",
      trendDown: "下降",
      trendStable: "稳定",
      readyToAnalyze: "我已准备好分析您的数据。",
    },
    ui: {
      preparingPdf: "正在准备 PDF 导出...",
      pdfExported: "PDF 导出成功",
      pdfExportFailed: "PDF 导出失败",
    },
  },
  de: {
    speechLocale: SPEECH_LOCALES.de,
    languageName: "German",
    pdf: {
      reportGenerated: "Bericht erstellt",
      confidential: "VERTRAULICH",
      executiveSalesAnalysis: "Executive-Verkaufsanalyse",
      topInsights: "Wichtige Erkenntnisse",
      keyPerformanceIndicators: "Wichtige Leistungskennzahlen",
      dashboardCharts: "Dashboard-Diagramme",
      aiAnalysisHistory: "KI-Analyseverlauf",
      metric: "Metrik",
      value: "Wert",
      growth: "Wachstum %",
      page: "Seite",
      of: "von",
      generated: "Generiert",
      you: "Sie",
      auraAi: "AURA AI",
      totalRevenue: "Gesamtumsatz",
      dailyAverage: "Tagesdurchschnitt",
      topRegion: "Top-Region",
      speaker: "Sprecher",
      message: "Nachricht",
      revenueOverviewTitle: "Umsatzübersicht",
      revenueOverviewSubtitle: "Zusammenfassung der Umsatzmetriken und Trends",
      regionalInsightsTitle: "Regionale Einblicke",
      regionalInsightsSubtitle: "Geografische Analyse und regionale Leistungskennzahlen",
    },
    voice: {
      analysisComplete: "Analyse abgeschlossen.",
      revenueIs: "Der Umsatz beträgt",
      trendIs: "der Trend ist",
      topRegionIs: "Die Top-Region ist",
      trendUp: "aufwärts",
      trendDown: "abwärts",
      trendStable: "stabil",
      readyToAnalyze: "Ich bin bereit, Ihre Daten zu analysieren.",
    },
    ui: {
      preparingPdf: "PDF-Export wird vorbereitet...",
      pdfExported: "PDF erfolgreich exportiert",
      pdfExportFailed: "PDF-Export fehlgeschlagen",
    },
  },
  ja: {
    speechLocale: SPEECH_LOCALES.ja,
    languageName: "Japanese",
    pdf: {
      reportGenerated: "レポートを生成しました",
      confidential: "機密",
      executiveSalesAnalysis: "経営向け売上分析",
      topInsights: "主なインサイト",
      keyPerformanceIndicators: "主要業績指標",
      dashboardCharts: "ダッシュボードチャート",
      aiAnalysisHistory: "AI分析履歴",
      metric: "指標",
      value: "値",
      growth: "成長率 %",
      page: "ページ",
      of: "全",
      generated: "生成日時",
      you: "あなた",
      auraAi: "AURA AI",
      totalRevenue: "総売上",
      dailyAverage: "日次平均",
      topRegion: "トップ地域",
      speaker: "話者",
      message: "メッセージ",
      revenueOverviewTitle: "売上概要",
      revenueOverviewSubtitle: "売上指標と傾向の要約",
      regionalInsightsTitle: "地域別インサイト",
      regionalInsightsSubtitle: "地理分析と地域別パフォーマンス指標",
    },
    voice: {
      analysisComplete: "分析が完了しました。",
      revenueIs: "売上は",
      trendIs: "傾向は",
      topRegionIs: "最上位の地域は",
      trendUp: "上昇",
      trendDown: "下降",
      trendStable: "安定",
      readyToAnalyze: "データを分析する準備ができました。",
    },
    ui: {
      preparingPdf: "PDFのエクスポートを準備中です...",
      pdfExported: "PDF をエクスポートしました",
      pdfExportFailed: "PDF のエクスポートに失敗しました",
    },
  },
  ko: {
    speechLocale: SPEECH_LOCALES.ko,
    languageName: "Korean",
    pdf: {
      reportGenerated: "보고서 생성됨",
      confidential: "기밀",
      executiveSalesAnalysis: "경영진 판매 분석",
      topInsights: "주요 인사이트",
      keyPerformanceIndicators: "핵심 성과 지표",
      dashboardCharts: "대시보드 차트",
      aiAnalysisHistory: "AI 분석 기록",
      metric: "지표",
      value: "값",
      growth: "성장률 %",
      page: "페이지",
      of: "중",
      generated: "생성됨",
      you: "귀하",
      auraAi: "AURA AI",
      totalRevenue: "총 매출",
      dailyAverage: "일일 평균",
      topRegion: "최고 지역",
      speaker: "화자",
      message: "메시지",
      revenueOverviewTitle: "매출 개요",
      revenueOverviewSubtitle: "매출 지표 및 추세 요약",
      regionalInsightsTitle: "지역 인사이트",
      regionalInsightsSubtitle: "지리 분석 및 지역 성과 지표",
    },
    voice: {
      analysisComplete: "분석이 완료되었습니다.",
      revenueIs: "매출은",
      trendIs: "추세는",
      topRegionIs: "상위 지역은",
      trendUp: "상승",
      trendDown: "하락",
      trendStable: "안정적",
      readyToAnalyze: "데이터를 분석할 준비가 되었습니다.",
    },
    ui: {
      preparingPdf: "PDF 내보내기를 준비하는 중...",
      pdfExported: "PDF가 성공적으로 내보내졌습니다",
      pdfExportFailed: "PDF 내보내기 실패",
    },
  },
  ru: {
    speechLocale: SPEECH_LOCALES.ru,
    languageName: "Russian",
    pdf: {
      reportGenerated: "Отчет создан",
      confidential: "КОНФИДЕНЦИАЛЬНО",
      executiveSalesAnalysis: "Исполнительный анализ продаж",
      topInsights: "Главные выводы",
      keyPerformanceIndicators: "Ключевые показатели эффективности",
      dashboardCharts: "Графики панели",
      aiAnalysisHistory: "История анализа ИИ",
      metric: "Показатель",
      value: "Значение",
      growth: "Рост %",
      page: "Страница",
      of: "из",
      generated: "Создано",
      you: "Вы",
      auraAi: "AURA AI",
      totalRevenue: "Общая выручка",
      dailyAverage: "Средний дневной показатель",
      topRegion: "Лучшая область",
      speaker: "Спикер",
      message: "Сообщение",
      revenueOverviewTitle: "Обзор выручки",
      revenueOverviewSubtitle: "Сводка по метрикам и трендам выручки",
      regionalInsightsTitle: "Региональные инсайты",
      regionalInsightsSubtitle: "Географический анализ и показатели по регионам",
    },
    voice: {
      analysisComplete: "Анализ завершен.",
      revenueIs: "Выручка составляет",
      trendIs: "тенденция",
      topRegionIs: "Лучшая область —",
      trendUp: "восходящий",
      trendDown: "нисходящий",
      trendStable: "стабильный",
      readyToAnalyze: "Я готов анализировать ваши данные.",
    },
    ui: {
      preparingPdf: "Подготовка экспорта PDF...",
      pdfExported: "PDF успешно экспортирован",
      pdfExportFailed: "Не удалось экспортировать PDF",
    },
  },
  it: {
    speechLocale: SPEECH_LOCALES.it,
    languageName: "Italian",
    pdf: {
      reportGenerated: "Rapporto generato",
      confidential: "RISERVATO",
      executiveSalesAnalysis: "Analisi esecutiva delle vendite",
      topInsights: "Approfondimenti principali",
      keyPerformanceIndicators: "Indicatori chiave di prestazione",
      dashboardCharts: "Grafici della dashboard",
      aiAnalysisHistory: "Cronologia analisi IA",
      metric: "Metrica",
      value: "Valore",
      growth: "Crescita %",
      page: "Pagina",
      of: "di",
      generated: "Generato",
      you: "Tu",
      auraAi: "AURA AI",
      totalRevenue: "Ricavi totali",
      dailyAverage: "Media giornaliera",
      topRegion: "Regione principale",
      speaker: "Interlocutore",
      message: "Messaggio",
      revenueOverviewTitle: "Panoramica dei ricavi",
      revenueOverviewSubtitle: "Riepilogo di metriche e tendenze dei ricavi",
      regionalInsightsTitle: "Approfondimenti regionali",
      regionalInsightsSubtitle: "Analisi geografica e metriche di performance regionali",
    },
    voice: {
      analysisComplete: "Analisi completata.",
      revenueIs: "Il fatturato è",
      trendIs: "la tendenza è",
      topRegionIs: "La regione principale è",
      trendUp: "in aumento",
      trendDown: "in calo",
      trendStable: "stabile",
      readyToAnalyze: "Sono pronto ad analizzare i tuoi dati.",
    },
    ui: {
      preparingPdf: "Preparazione dell'esportazione PDF...",
      pdfExported: "PDF esportato con successo",
      pdfExportFailed: "Esportazione PDF non riuscita",
    },
  },
  tr: {
    speechLocale: SPEECH_LOCALES.tr,
    languageName: "Turkish",
    pdf: {
      reportGenerated: "Rapor oluşturuldu",
      confidential: "GİZLİ",
      executiveSalesAnalysis: "Yönetici satış analizi",
      topInsights: "Önemli içgörüler",
      keyPerformanceIndicators: "Temel performans göstergeleri",
      dashboardCharts: "Gösterge paneli grafikleri",
      aiAnalysisHistory: "Yapay zeka analiz geçmişi",
      metric: "Metrik",
      value: "Değer",
      growth: "Büyüme %",
      page: "Sayfa",
      of: " / ",
      generated: "Oluşturuldu",
      you: "Siz",
      auraAi: "AURA AI",
      totalRevenue: "Toplam gelir",
      dailyAverage: "Günlük ortalama",
      topRegion: "En iyi bölge",
      speaker: "Konuşmacı",
      message: "Mesaj",
      revenueOverviewTitle: "Gelir özeti",
      revenueOverviewSubtitle: "Gelir metrikleri ve eğilimlerinin özeti",
      regionalInsightsTitle: "Bölgesel içgörüler",
      regionalInsightsSubtitle: "Coğrafi analiz ve bölgesel performans metrikleri",
    },
    voice: {
      analysisComplete: "Analiz tamamlandı.",
      revenueIs: "Gelir",
      trendIs: "eğilim",
      topRegionIs: "En iyi bölge",
      trendUp: "yukarı",
      trendDown: "aşağı",
      trendStable: "stabil",
      readyToAnalyze: "Verilerinizi analiz etmeye hazırım.",
    },
    ui: {
      preparingPdf: "PDF dışa aktarımı hazırlanıyor...",
      pdfExported: "PDF başarıyla dışa aktarıldı",
      pdfExportFailed: "PDF dışa aktarılamadı",
    },
  },
  nl: {
    speechLocale: SPEECH_LOCALES.nl,
    languageName: "Dutch",
    pdf: {
      reportGenerated: "Rapport gegenereerd",
      confidential: "VERTROUWELIJK",
      executiveSalesAnalysis: "Uitvoerende verkoopanalyse",
      topInsights: "Belangrijkste inzichten",
      keyPerformanceIndicators: "Belangrijkste prestatie-indicatoren",
      dashboardCharts: "Dashboardgrafieken",
      aiAnalysisHistory: "AI-analysegeschiedenis",
      metric: "Metriek",
      value: "Waarde",
      growth: "Groei %",
      page: "Pagina",
      of: "van",
      generated: "Gegenereerd",
      you: "U",
      auraAi: "AURA AI",
      totalRevenue: "Totale omzet",
      dailyAverage: "Daggemiddelde",
      topRegion: "Topregio",
      speaker: "Spreker",
      message: "Bericht",
      revenueOverviewTitle: "Omzetoverzicht",
      revenueOverviewSubtitle: "Samenvatting van omzetcijfers en trends",
      regionalInsightsTitle: "Regionale inzichten",
      regionalInsightsSubtitle: "Geografische analyse en regionale prestatie-indicatoren",
    },
    voice: {
      analysisComplete: "Analyse voltooid.",
      revenueIs: "De omzet is",
      trendIs: "de trend is",
      topRegionIs: "Topregio is",
      trendUp: "stijgend",
      trendDown: "dalend",
      trendStable: "stabiel",
      readyToAnalyze: "Ik ben klaar om uw gegevens te analyseren.",
    },
    ui: {
      preparingPdf: "PDF-export wordt voorbereid...",
      pdfExported: "PDF succesvol geëxporteerd",
      pdfExportFailed: "PDF-export mislukt",
    },
  },
  sw: {
    speechLocale: SPEECH_LOCALES.sw,
    languageName: "Swahili",
    pdf: {
      reportGenerated: "Ripoti imetengenezwa",
      confidential: "SIRI",
      executiveSalesAnalysis: "Uchambuzi wa mauzo wa kiutendaji",
      topInsights: "Maarifa muhimu",
      keyPerformanceIndicators: "Viashiria muhimu vya utendaji",
      dashboardCharts: "Chati za dashibodi",
      aiAnalysisHistory: "Historia ya uchambuzi wa AI",
      metric: "Kipimo",
      value: "Thamani",
      growth: "Ukuaji %",
      page: "Ukurasa",
      of: "ya",
      generated: "Imeundwa",
      you: "Wewe",
      auraAi: "AURA AI",
      totalRevenue: "Mapato jumla",
      dailyAverage: "Wastani wa kila siku",
      topRegion: "Eneo bora",
      speaker: "Msemaji",
      message: "Ujumbe",
      revenueOverviewTitle: "Muhtasari wa mapato",
      revenueOverviewSubtitle: "Muhtasari wa vipimo na mienendo ya mapato",
      regionalInsightsTitle: "Maarifa ya kikanda",
      regionalInsightsSubtitle: "Uchambuzi wa kijiografia na vipimo vya utendaji wa kikanda",
    },
    voice: {
      analysisComplete: "Uchambuzi umekamilika.",
      revenueIs: "Mapato ni",
      trendIs: "mwelekeo ni",
      topRegionIs: "Eneo bora ni",
      trendUp: "juu",
      trendDown: "chini",
      trendStable: "thabiti",
      readyToAnalyze: "Niko tayari kuchambua data yako.",
    },
    ui: {
      preparingPdf: "Inatayarisha usafirishaji wa PDF...",
      pdfExported: "PDF imesafirishwa kwa mafanikio",
      pdfExportFailed: "Imeshindwa kusafirisha PDF",
    },
  },
  vi: {
    speechLocale: SPEECH_LOCALES.vi,
    languageName: "Vietnamese",
    pdf: {
      reportGenerated: "Báo cáo đã được tạo",
      confidential: "BẢO MẬT",
      executiveSalesAnalysis: "Phân tích bán hàng cấp điều hành",
      topInsights: "Các điểm nổi bật",
      keyPerformanceIndicators: "Chỉ số hiệu suất chính",
      dashboardCharts: "Biểu đồ bảng điều khiển",
      aiAnalysisHistory: "Lịch sử phân tích AI",
      metric: "Chỉ số",
      value: "Giá trị",
      growth: "Tăng trưởng %",
      page: "Trang",
      of: "trên",
      generated: "Được tạo",
      you: "Bạn",
      auraAi: "AURA AI",
      totalRevenue: "Tổng doanh thu",
      dailyAverage: "Trung bình mỗi ngày",
      topRegion: "Khu vực hàng đầu",
      speaker: "Người nói",
      message: "Tin nhắn",
      revenueOverviewTitle: "Tổng quan doanh thu",
      revenueOverviewSubtitle: "Tóm tắt các chỉ số và xu hướng doanh thu",
      regionalInsightsTitle: "Thông tin khu vực",
      regionalInsightsSubtitle: "Phân tích địa lý và chỉ số hiệu suất khu vực",
    },
    voice: {
      analysisComplete: "Phân tích hoàn tất.",
      revenueIs: "Doanh thu là",
      trendIs: "xu hướng là",
      topRegionIs: "Khu vực hàng đầu là",
      trendUp: "tăng",
      trendDown: "giảm",
      trendStable: "ổn định",
      readyToAnalyze: "Tôi sẵn sàng phân tích dữ liệu của bạn.",
    },
    ui: {
      preparingPdf: "Đang chuẩn bị xuất PDF...",
      pdfExported: "Đã xuất PDF thành công",
      pdfExportFailed: "Xuất PDF thất bại",
    },
  },
};

const STRATEGY_MEMO_PDF_COPY: Record<
  SupportedLanguageCode,
  Pick<
    DashboardPdfLabels,
    | "analysisLabel"
    | "strategyMemoTitle"
    | "strategySummaryHeading"
    | "strategyActionsHeading"
    | "priorityHigh"
    | "priorityMedium"
    | "priorityLow"
    | "estimatedROI"
    | "readyToExecute"
    | "openDashboard"
    | "strategyFooterNote"
    | "volatility"
    | "strategySummaryTail"
  >
> = {
  en: {
    analysisLabel: "Analysis",
    strategyMemoTitle: "AURA Strategic Intelligence Memo",
    strategySummaryHeading: "Executive Summary",
    strategyActionsHeading: "Prescriptive Actions (Prioritized)",
    priorityHigh: "High",
    priorityMedium: "Medium",
    priorityLow: "Low",
    estimatedROI: "Estimated ROI",
    readyToExecute: "Ready to execute?",
    openDashboard: "Open Dashboard",
    strategyFooterNote:
      "This report was autonomously generated by AURA AI based on your sales performance data. All insights are data-driven and confidential.",
    volatility: "Volatility",
    strategySummaryTail:
      "The analysis identifies 3 prioritized, low-cost actions tailored to your selected language and dashboard context.",
  },
  fr: {
    analysisLabel: "Analyse",
    strategyMemoTitle: "Mémo stratégique AURA",
    strategySummaryHeading: "Résumé exécutif",
    strategyActionsHeading: "Actions prescriptives (priorisées)",
    priorityHigh: "Élevée",
    priorityMedium: "Moyenne",
    priorityLow: "Faible",
    estimatedROI: "ROI estimé",
    readyToExecute: "Prêt à exécuter ?",
    openDashboard: "Ouvrir le tableau de bord",
    strategyFooterNote:
      "Ce rapport a été généré automatiquement par AURA AI à partir de vos données de performance commerciale. Toutes les informations sont fondées sur les données et confidentielles.",
    volatility: "Volatilité",
    strategySummaryTail:
      "L'analyse identifie 3 actions prioritaires et peu coûteuses adaptées à votre langue sélectionnée et au contexte du tableau de bord.",
  },
  es: {
    analysisLabel: "Análisis",
    strategyMemoTitle: "Memorando estratégico de AURA",
    strategySummaryHeading: "Resumen ejecutivo",
    strategyActionsHeading: "Acciones prescriptivas (priorizadas)",
    priorityHigh: "Alta",
    priorityMedium: "Media",
    priorityLow: "Baja",
    estimatedROI: "ROI estimado",
    readyToExecute: "¿Listo para ejecutar?",
    openDashboard: "Abrir panel",
    strategyFooterNote:
      "Este informe fue generado automáticamente por AURA AI a partir de tus datos de rendimiento de ventas. Todas las conclusiones se basan en datos y son confidenciales.",
    volatility: "Volatilidad",
    strategySummaryTail:
      "El análisis identifica 3 acciones prioritarias y de bajo costo adaptadas a tu idioma seleccionado y al contexto del panel.",
  },
  pt: {
    analysisLabel: "Análise",
    strategyMemoTitle: "Memorando estratégico da AURA",
    strategySummaryHeading: "Resumo executivo",
    strategyActionsHeading: "Ações prescritivas (priorizadas)",
    priorityHigh: "Alta",
    priorityMedium: "Média",
    priorityLow: "Baixa",
    estimatedROI: "ROI estimado",
    readyToExecute: "Pronto para executar?",
    openDashboard: "Abrir painel",
    strategyFooterNote:
      "Este relatório foi gerado automaticamente pela AURA AI com base nos seus dados de desempenho de vendas. Todas as percepções são baseadas em dados e confidenciais.",
    volatility: "Volatilidade",
    strategySummaryTail:
      "A análise identifica 3 ações prioritárias e de baixo custo adaptadas ao idioma selecionado e ao contexto do painel.",
  },
  ar: {
    analysisLabel: "تحليل",
    strategyMemoTitle: "مذكرة AURA الاستراتيجية",
    strategySummaryHeading: "الملخص التنفيذي",
    strategyActionsHeading: "الإجراءات الموصى بها (حسب الأولوية)",
    priorityHigh: "عالية",
    priorityMedium: "متوسطة",
    priorityLow: "منخفضة",
    estimatedROI: "العائد المتوقع",
    readyToExecute: "هل أنت مستعد للتنفيذ؟",
    openDashboard: "فتح لوحة التحكم",
    strategyFooterNote:
      "تم إنشاء هذا التقرير تلقائيًا بواسطة AURA AI استنادًا إلى بيانات أداء المبيعات الخاصة بك. جميع الرؤى مستندة إلى البيانات وسرية.",
    volatility: "التقلب",
    strategySummaryTail:
      "يحدد التحليل 3 إجراءات ذات أولوية ومنخفضة التكلفة مخصصة للغة المختارة وسياق لوحة التحكم.",
  },
  hi: {
    analysisLabel: "विश्लेषण",
    strategyMemoTitle: "AURA रणनीतिक इंटेलिजेंस मेमो",
    strategySummaryHeading: "कार्यकारी सारांश",
    strategyActionsHeading: "निर्धारित कार्य (प्राथमिकता के साथ)",
    priorityHigh: "उच्च",
    priorityMedium: "मध्यम",
    priorityLow: "निम्न",
    estimatedROI: "अनुमानित ROI",
    readyToExecute: "कार्यान्वयन के लिए तैयार?",
    openDashboard: "डैशबोर्ड खोलें",
    strategyFooterNote:
      "यह रिपोर्ट AURA AI द्वारा आपके बिक्री प्रदर्शन डेटा के आधार पर स्वचालित रूप से तैयार की गई थी। सभी अंतर्दृष्टियाँ डेटा-आधारित और गोपनीय हैं।",
    volatility: "अस्थिरता",
    strategySummaryTail:
      "यह विश्लेषण आपके चयनित भाषा और डैशबोर्ड संदर्भ के अनुसार 3 प्राथमिक, कम-लागत वाले कार्यों की पहचान करता है।",
  },
  zh: {
    analysisLabel: "分析",
    strategyMemoTitle: "AURA 战略情报备忘录",
    strategySummaryHeading: "执行摘要",
    strategyActionsHeading: "建议行动（按优先级）",
    priorityHigh: "高",
    priorityMedium: "中",
    priorityLow: "低",
    estimatedROI: "预估投资回报率",
    readyToExecute: "准备执行？",
    openDashboard: "打开仪表板",
    strategyFooterNote:
      "本报告由 AURA AI 根据您的销售表现数据自动生成。所有洞察均基于数据且保密。",
    volatility: "波动性",
    strategySummaryTail:
      "该分析确定了 3 项优先级高、低成本的行动，适配您选择的语言和仪表板上下文。",
  },
  de: {
    analysisLabel: "Analyse",
    strategyMemoTitle: "AURA Strategisches Intelligenz-Memo",
    strategySummaryHeading: "Zusammenfassung für die Geschäftsleitung",
    strategyActionsHeading: "Empfohlene Maßnahmen (priorisiert)",
    priorityHigh: "Hoch",
    priorityMedium: "Mittel",
    priorityLow: "Niedrig",
    estimatedROI: "Geschätzter ROI",
    readyToExecute: "Bereit zur Ausführung?",
    openDashboard: "Dashboard öffnen",
    strategyFooterNote:
      "Dieser Bericht wurde von AURA AI automatisch auf Grundlage Ihrer Verkaufsdaten erstellt. Alle Erkenntnisse sind datenbasiert und vertraulich.",
    volatility: "Volatilität",
    strategySummaryTail:
      "Die Analyse identifiziert 3 priorisierte, kostengünstige Maßnahmen, die auf Ihre ausgewählte Sprache und den Dashboard-Kontext zugeschnitten sind.",
  },
  ja: {
    analysisLabel: "分析",
    strategyMemoTitle: "AURA 戦略インテリジェンスメモ",
    strategySummaryHeading: "エグゼクティブサマリー",
    strategyActionsHeading: "推奨アクション（優先順）",
    priorityHigh: "高",
    priorityMedium: "中",
    priorityLow: "低",
    estimatedROI: "想定 ROI",
    readyToExecute: "実行の準備はできましたか？",
    openDashboard: "ダッシュボードを開く",
    strategyFooterNote:
      "このレポートは、売上実績データに基づいて AURA AI が自動生成しました。すべてのインサイトはデータ駆動で機密です。",
    volatility: "変動性",
    strategySummaryTail:
      "この分析では、選択された言語とダッシュボードの文脈に合わせた、優先度の高い低コストの 3 つのアクションを特定しています。",
  },
  ko: {
    analysisLabel: "분석",
    strategyMemoTitle: "AURA 전략 인텔리전스 메모",
    strategySummaryHeading: "경영진 요약",
    strategyActionsHeading: "우선순위 실행 항목",
    priorityHigh: "높음",
    priorityMedium: "보통",
    priorityLow: "낮음",
    estimatedROI: "예상 ROI",
    readyToExecute: "실행할 준비가 되셨나요?",
    openDashboard: "대시보드 열기",
    strategyFooterNote:
      "이 보고서는 판매 실적 데이터를 기반으로 AURA AI가 자동 생성했습니다. 모든 인사이트는 데이터 기반이며 기밀입니다.",
    volatility: "변동성",
    strategySummaryTail:
      "이 분석은 선택한 언어와 대시보드 맥락에 맞춘 우선순위가 높은 저비용 작업 3가지를 식별합니다.",
  },
  ru: {
    analysisLabel: "Анализ",
    strategyMemoTitle: "Стратегическая записка AURA",
    strategySummaryHeading: "Краткое резюме",
    strategyActionsHeading: "Рекомендованные действия (по приоритету)",
    priorityHigh: "Высокий",
    priorityMedium: "Средний",
    priorityLow: "Низкий",
    estimatedROI: "Ожидаемый ROI",
    readyToExecute: "Готовы к запуску?",
    openDashboard: "Открыть панель",
    strategyFooterNote:
      "Этот отчет был автоматически создан AURA AI на основе данных о продажах. Все выводы основаны на данных и конфиденциальны.",
    volatility: "Волатильность",
    strategySummaryTail:
      "Анализ определяет 3 приоритетных недорогих действия, адаптированных к выбранному языку и контексту панели.",
  },
  it: {
    analysisLabel: "Analisi",
    strategyMemoTitle: "Promemoria strategico AURA",
    strategySummaryHeading: "Riepilogo esecutivo",
    strategyActionsHeading: "Azioni prescritte (prioritarie)",
    priorityHigh: "Alta",
    priorityMedium: "Media",
    priorityLow: "Bassa",
    estimatedROI: "ROI stimato",
    readyToExecute: "Pronto per eseguire?",
    openDashboard: "Apri dashboard",
    strategyFooterNote:
      "Questo rapporto è stato generato automaticamente da AURA AI in base ai dati sulle prestazioni di vendita. Tutte le informazioni sono basate sui dati e riservate.",
    volatility: "Volatilità",
    strategySummaryTail:
      "L'analisi identifica 3 azioni prioritarie e a basso costo adattate alla lingua selezionata e al contesto della dashboard.",
  },
  tr: {
    analysisLabel: "Analiz",
    strategyMemoTitle: "AURA Stratejik Zeka Notu",
    strategySummaryHeading: "Yönetici Özeti",
    strategyActionsHeading: "Önerilen Eylemler (öncelikli)",
    priorityHigh: "Yüksek",
    priorityMedium: "Orta",
    priorityLow: "Düşük",
    estimatedROI: "Tahmini ROI",
    readyToExecute: "Çalıştırmaya hazır mısınız?",
    openDashboard: "Gösterge panelini aç",
    strategyFooterNote:
      "Bu rapor, satış performans verilerinize dayanarak AURA AI tarafından otomatik olarak oluşturuldu. Tüm içgörüler veri odaklıdır ve gizlidir.",
    volatility: "Oynaklık",
    strategySummaryTail:
      "Bu analiz, seçilen dilinize ve gösterge paneli bağlamına uygun 3 öncelikli, düşük maliyetli eylemi belirler.",
  },
  nl: {
    analysisLabel: "Analyse",
    strategyMemoTitle: "AURA strategische intelligentienota",
    strategySummaryHeading: "Managementsamenvatting",
    strategyActionsHeading: "Voorgeschreven acties (geprioriteerd)",
    priorityHigh: "Hoog",
    priorityMedium: "Gemiddeld",
    priorityLow: "Laag",
    estimatedROI: "Geschatte ROI",
    readyToExecute: "Klaar om uit te voeren?",
    openDashboard: "Dashboard openen",
    strategyFooterNote:
      "Dit rapport is automatisch gegenereerd door AURA AI op basis van uw verkoopprestatiedata. Alle inzichten zijn datagedreven en vertrouwelijk.",
    volatility: "Volatiliteit",
    strategySummaryTail:
      "De analyse identificeert 3 prioritaire, goedkope acties die zijn afgestemd op uw geselecteerde taal en dashboardcontext.",
  },
  sw: {
    analysisLabel: "Uchambuzi",
    strategyMemoTitle: "Memo ya kimkakati ya AURA",
    strategySummaryHeading: "Muhtasari wa kiutendaji",
    strategyActionsHeading: "Hatua zilizopendekezwa (zilizopangiwa kipaumbele)",
    priorityHigh: "Juu",
    priorityMedium: "Kati",
    priorityLow: "Chini",
    estimatedROI: "ROI inayokadiriwa",
    readyToExecute: "Tayari kutekeleza?",
    openDashboard: "Fungua dashibodi",
    strategyFooterNote:
      "Ripoti hii imetengenezwa kiotomatiki na AURA AI kulingana na data yako ya utendaji wa mauzo. Maarifa yote yanategemea data na ni ya siri.",
    volatility: "Mabadiliko",
    strategySummaryTail:
      "Uchambuzi unagundua vitendo 3 vya kipaumbele, vya gharama ya chini vilivyolinganishwa na lugha yako iliyochaguliwa na muktadha wa dashibodi.",
  },
  vi: {
    analysisLabel: "Phân tích",
    strategyMemoTitle: "Bản ghi nhớ chiến lược AURA",
    strategySummaryHeading: "Tóm tắt điều hành",
    strategyActionsHeading: "Hành động khuyến nghị (ưu tiên)",
    priorityHigh: "Cao",
    priorityMedium: "Trung bình",
    priorityLow: "Thấp",
    estimatedROI: "ROI ước tính",
    readyToExecute: "Sẵn sàng thực hiện?",
    openDashboard: "Mở bảng điều khiển",
    strategyFooterNote:
      "Báo cáo này được AURA AI tự động tạo dựa trên dữ liệu hiệu suất bán hàng của bạn. Tất cả thông tin đều dựa trên dữ liệu và được bảo mật.",
    volatility: "Biến động",
    strategySummaryTail:
      "Phân tích xác định 3 hành động ưu tiên, chi phí thấp phù hợp với ngôn ngữ bạn đã chọn và ngữ cảnh bảng điều khiển.",
  },
};

export function getDashboardLocaleCopy(language?: string | null): DashboardLocaleCopy {
  const resolved = resolveSupportedLanguage(language || "en") || "en";
  return {
    ...DASHBOARD_LOCALE_COPY[resolved],
    pdf: {
      ...DASHBOARD_LOCALE_COPY[resolved].pdf,
      ...STRATEGY_MEMO_PDF_COPY[resolved],
    },
  };
}

export function getSpeechLocale(language?: string | null): string {
  return getDashboardLocaleCopy(language).speechLocale;
}

export function getLanguageDisplayName(language?: string | null): string {
  return getDashboardLocaleCopy(language).languageName;
}

export function getTrendLabel(language?: string | null, trend?: string): string {
  const copy = getDashboardLocaleCopy(language);
  const normalized = String(trend || "").toLowerCase();
  if (normalized.includes("down")) return copy.voice.trendDown;
  if (normalized.includes("stable")) return copy.voice.trendStable;
  return copy.voice.trendUp;
}
