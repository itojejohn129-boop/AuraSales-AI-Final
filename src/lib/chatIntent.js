const COMMON_GREETINGS = [
  "hi",
  "hello",
  "hey",
  "good morning",
  "good afternoon",
  "good evening",
  "help",
  "start",
];

const LANGUAGE_GREETINGS = {
  french: ["bonjour", "salut", "bonsoir"],
  spanish: ["hola", "buenos dias", "buenas tardes", "buenas noches"],
  portuguese: ["ola", "bom dia", "boa tarde", "boa noite"],
  german: ["guten tag", "hallo", "gute nacht"],
  italian: ["ciao", "buongiorno", "buonasera"],
  turkish: ["merhaba", "selam"],
  arabic: ["مرحبا", "اهلا", "أهلا"],
  russian: ["привет", "здравствуй", "здравствуйте"],
  japanese: ["こんにちは", "おはよう", "こんばんは"],
  korean: ["안녕하세요", "안녕"],
  chinese: ["你好", "您好", "早上好", "晚上好"],
  vietnamese: ["xin chao", "xin chào"],
  swahili: ["sawa", "habari"],
  hindi: ["namaste", "namaskar", "नमस्ते"],
};

const COMMON_OFF_TOPIC = [
  "weather",
  "meteo",
  "clima",
  "wetter",
  "sports",
  "sport",
  "joke",
  "jokes",
  "news",
  "politics",
  "movies",
  "music",
  "recipes",
  "travel",
  "coding",
  "programming",
  "games",
  "game",
  "stock market",
  "bitcoin",
  "crypto",
];

const LANGUAGE_OFF_TOPIC = {
  french: ["blague", "blagues", "meteo", "actualite", "actualites", "politique", "films", "musique", "recettes", "voyage"],
  spanish: ["broma", "bromas", "noticias", "politica", "peliculas", "musica", "recetas", "viaje"],
  portuguese: ["piada", "piadas", "noticias", "politica", "filmes", "musica", "receitas", "viagem"],
  german: ["witz", "nachrichten", "politik", "filme", "musik", "rezepte", "reise"],
  italian: ["barzelletta", "notizie", "politica", "film", "musica", "ricette", "viaggio"],
  turkish: ["saka", "haberler", "politika", "film", "muzik", "tarifler", "seyahat"],
  arabic: ["نكتة", "اخبار", "سياسة", "افلام", "موسيقى", "وصفات", "سفر"],
  russian: ["шутка", "новости", "политика", "фильмы", "музыка", "рецепты", "путешествие"],
  japanese: ["冗談", "ニュース", "政治", "映画", "音楽", "レシピ", "旅行"],
  korean: ["농담", "뉴스", "정치", "영화", "음악", "레시피", "여행"],
  chinese: ["笑话", "新闻", "政治", "电影", "音乐", "食谱", "旅行"],
  vietnamese: ["cau do", "tin tuc", "chinh tri", "phim", "am nhac", "cong thuc", "du lich"],
  swahili: ["utani", "habari", "siasa", "sinema", "muziki", "mapishi", "safari"],
  hindi: ["joke", "khabar", "rajneeti", "film", "sangeet", "recipes", "yatra"],
};

const COMMON_BUSINESS_TERMS = [
  "dashboard",
  "sales",
  "revenue",
  "orders",
  "metrics",
  "analytics",
  "reports",
  "performance",
  "growth",
  "forecast",
  "trend",
  "insight",
  "insights",
  "summary",
  "chart",
  "graphs",
  "graph",
  "business",
];

const LANGUAGE_BUSINESS_TERMS = {
  french: [
    "tableau de bord",
    "ventes",
    "revenus",
    "chiffre d affaires",
    "commandes",
    "metriques",
    "analyses",
    "rapports",
    "performance",
    "croissance",
    "prevision",
    "tendance",
    "apercu",
    "resume",
    "graphique",
    "entreprise",
  ],
  spanish: [
    "panel de control",
    "tablero",
    "ventas",
    "ingresos",
    "pedidos",
    "metricas",
    "analiticas",
    "informes",
    "rendimiento",
    "crecimiento",
    "pronostico",
    "tendencia",
    "resumen",
    "grafico",
    "negocio",
  ],
  portuguese: [
    "painel de controle",
    "painel",
    "vendas",
    "receita",
    "pedidos",
    "metricas",
    "analises",
    "relatorios",
    "desempenho",
    "crescimento",
    "previsao",
    "tendencia",
    "resumo",
    "grafico",
    "negocio",
  ],
  german: [
    "kontrollfeld",
    "dashboard",
    "verkauf",
    "umsatz",
    "bestellungen",
    "metriken",
    "analysen",
    "berichte",
    "leistung",
    "wachstum",
    "prognose",
    "trend",
    "zusammenfassung",
    "diagramm",
    "geschaeft",
  ],
  italian: [
    "pannello di controllo",
    "dashboard",
    "vendite",
    "ricavi",
    "ordini",
    "metriche",
    "analisi",
    "rapporti",
    "prestazioni",
    "crescita",
    "previsione",
    "tendenza",
    "riepilogo",
    "grafico",
    "azienda",
  ],
  turkish: [
    "gosterge paneli",
    "panel",
    "satis",
    "gelir",
    "siparisler",
    "metrikler",
    "analizler",
    "raporlar",
    "performans",
    "buyume",
    "tahmin",
    "egilim",
    "ozet",
    "grafik",
    "isletme",
  ],
  arabic: [
    "لوحة التحكم",
    "مبيعات",
    "ايرادات",
    "طلبات",
    "مقاييس",
    "تحليلات",
    "تقارير",
    "اداء",
    "نمو",
    "توقع",
    "اتجاه",
    "ملخص",
    "رسم بياني",
    "اعمال",
  ],
  russian: [
    "панель управления",
    "продажи",
    "выручка",
    "заказы",
    "метрики",
    "аналитика",
    "отчеты",
    "производительность",
    "рост",
    "прогноз",
    "тренд",
    "сводка",
    "график",
    "бизнес",
  ],
  japanese: [
    "ダッシュボード",
    "売上",
    "収益",
    "注文",
    "指標",
    "分析",
    "レポート",
    "パフォーマンス",
    "成長",
    "予測",
    "傾向",
    "要約",
    "グラフ",
    "ビジネス",
  ],
  korean: [
    "대시보드",
    "매출",
    "수익",
    "주문",
    "지표",
    "분석",
    "보고서",
    "성과",
    "성장",
    "예측",
    "추세",
    "요약",
    "그래프",
    "비즈니스",
  ],
  chinese: [
    "仪表板",
    "销售",
    "收入",
    "订单",
    "指标",
    "分析",
    "报告",
    "表现",
    "增长",
    "预测",
    "趋势",
    "摘要",
    "图表",
    "业务",
  ],
  vietnamese: [
    "bang dieu khien",
    "doanh so",
    "doanh thu",
    "don hang",
    "chi so",
    "phan tich",
    "bao cao",
    "hieu suat",
    "tang truong",
    "du bao",
    "xu huong",
    "tom tat",
    "bieu do",
    "kinh doanh",
  ],
  swahili: [
    "dashibodi",
    "mauzo",
    "mapato",
    "maagizo",
    "vipimo",
    "uchambuzi",
    "ripoti",
    "utendaji",
    "ukuaji",
    "utabiri",
    "mwelekeo",
    "muhtasari",
    "chati",
    "biashara",
  ],
  hindi: [
    "dashboard",
    "bikri",
    "rajasva",
    "aadesh",
    "maapdand",
    "vishleshan",
    "report",
    "pradarshan",
    "vriddhi",
    "anuman",
    "rukh",
    "saar",
    "graph",
    "vyapar",
  ],
};

const COMMON_ACTION_PATTERNS = [
  "narrat",
  "summaris",
  "summariz",
  "explain",
  "analyse",
  "analyze",
  "review",
  "break down",
  "show",
  "give me",
  "talk about",
  "walk me through",
  "what is",
  "how is",
  "how's",
  "what's",
];

const LANGUAGE_ACTION_PATTERNS = {
  french: ["resume", "resumer", "explique", "analyse", "revoit", "montre", "donne moi", "parle de", "guide moi"],
  spanish: ["resume", "resumeme", "explica", "analiza", "muestra", "dame", "habla de", "guiame"],
  portuguese: ["resuma", "explique", "analise", "mostre", "diga me", "fale sobre", "guie me"],
  german: ["fasse zusammen", "erklaere", "analysiere", "zeige", "gib mir", "sprich ueber"],
  italian: ["riassumi", "spiega", "analizza", "mostra", "dammi", "parla di", "guidami"],
  turkish: ["ozetle", "acikla", "analiz et", "goster", "ver bana", "hakkinda konus"],
  arabic: ["لخص", "اشرح", "حلل", "أرني", "اعطني", "تحدث عن"],
  russian: ["суммируй", "объясни", "проанализируй", "покажи", "дай мне", "расскажи о"],
  japanese: ["要約", "説明", "分析", "見せて", "教えて", "話して"],
  korean: ["요약", "설명", "분석", "보여줘", "알려줘", "말해줘"],
  chinese: ["总结", "解释", "分析", "展示", "告诉我", "说说"],
  vietnamese: ["tom tat", "giai thich", "phan tich", "hien thi", "cho toi", "noi ve"],
  swahili: ["fupisha", "eleza", "chambua", "onyesha", "niambie", "zungumzia"],
  hindi: ["saar", "samjhao", "vishleshan", "dikhao", "batao", "batayo"],
};

function normalizeText(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(text, phrases) {
  const normalized = normalizeText(text);
  return phrases.some((phrase) => normalized.includes(normalizeText(phrase)));
}

function getLanguageKey(language) {
  const normalized = normalizeText(language);
  if (!normalized) return "default";
  if (["fr", "french", "francais"].some((item) => normalized.includes(item))) return "french";
  if (["es", "spanish", "espanol", "castellano"].some((item) => normalized.includes(item))) return "spanish";
  if (["pt", "portuguese", "portugues", "brazil"].some((item) => normalized.includes(item))) return "portuguese";
  if (["de", "german", "deutsch"].some((item) => normalized.includes(item))) return "german";
  if (["it", "italian", "italiano"].some((item) => normalized.includes(item))) return "italian";
  if (["tr", "turkish", "turkce"].some((item) => normalized.includes(item))) return "turkish";
  if (["ar", "arabic", "العربية"].some((item) => normalized.includes(item))) return "arabic";
  if (["ru", "russian", "russkiy", "русский"].some((item) => normalized.includes(item))) return "russian";
  if (["ja", "japanese", "nihongo", "日本語"].some((item) => normalized.includes(item))) return "japanese";
  if (["ko", "korean", "hangul", "한국어"].some((item) => normalized.includes(item))) return "korean";
  if (["zh", "chinese", "mandarin", "中文"].some((item) => normalized.includes(item))) return "chinese";
  if (["vi", "vietnamese", "tieng viet", "tiếng việt"].some((item) => normalized.includes(item))) return "vietnamese";
  if (["sw", "swahili", "kiswahili"].some((item) => normalized.includes(item))) return "swahili";
  if (["hi", "hindi", "देवनागरी", "हिंदी"].some((item) => normalized.includes(item))) return "hindi";
  return "default";
}

function getLanguageTerms(language) {
  const key = getLanguageKey(language);
  return {
    greetings: [...COMMON_GREETINGS, ...(LANGUAGE_GREETINGS[key] || [])],
    offTopic: [...COMMON_OFF_TOPIC, ...(LANGUAGE_OFF_TOPIC[key] || [])],
    business: [...COMMON_BUSINESS_TERMS, ...(LANGUAGE_BUSINESS_TERMS[key] || [])],
    actions: [...COMMON_ACTION_PATTERNS, ...(LANGUAGE_ACTION_PATTERNS[key] || [])],
  };
}

function containsBusinessIntent(text, language) {
  const normalized = normalizeText(text);
  if (!normalized) return false;

  const terms = getLanguageTerms(language);
  if (containsAny(normalized, terms.business)) return true;

  const actionMatched = containsAny(normalized, terms.actions);
  if (!actionMatched) return false;

  return containsAny(normalized, [
    "it",
    "this",
    "that",
    "them",
    "dashboard",
    "sales",
    "revenue",
    "orders",
    "metrics",
    "analytics",
    "reports",
    "performance",
    "growth",
    "forecast",
    "trend",
    "insight",
    "summary",
    "chart",
    "graph",
    "business",
  ]) || containsAny(normalized, terms.business);
}

export function isDashboardSalesIntent(message, language = "en") {
  const text = normalizeText(message);
  if (!text) return false;

  const terms = getLanguageTerms(language);

  if (containsAny(text, terms.offTopic)) {
    return false;
  }

  if (containsAny(text, terms.greetings)) {
    return true;
  }

  if (containsBusinessIntent(text, language)) {
    return true;
  }

  return false;
}

const REFOCUS_MESSAGES = {
  french: "Je suis Aura, votre assistante de tableau de bord. Je peux seulement aider avec des questions liées au tableau de bord et aux ventes. Que souhaitez-vous examiner ?",
  spanish: "Soy Aura, tu asistente de panel de control. Solo puedo ayudar con preguntas relacionadas con el panel y las ventas. ¿Qué te gustaría revisar?",
  portuguese: "Sou a Aura, sua assistente de painel de negócios. Só posso ajudar com perguntas sobre painel e vendas. O que você gostaria de revisar?",
  german: "Ich bin Aura, Ihre Dashboard-Assistentin. Ich kann nur bei Fragen zum Dashboard und zu Verkäufen helfen. Was möchten Sie ansehen?",
  italian: "Sono Aura, la tua assistente per il dashboard. Posso aiutare solo con domande sul dashboard e sulle vendite. Cosa vuoi analizzare?",
  turkish: "Ben Aura, iş panosu asistanınızım. Yalnızca pano ve satış ile ilgili sorulara yardımcı olabilirim. Neyi incelemek istersiniz?",
  arabic: "أنا Aura، مساعدتك الخاصة بلوحة التحكم. أستطيع فقط المساعدة في الأسئلة المتعلقة بلوحة التحكم والمبيعات. ماذا تريد أن تراجع؟",
  russian: "Я Aura, ваш помощник по панели управления. Я могу помогать только с вопросами о панели и продажах. Что вы хотите посмотреть?",
  japanese: "私はAuraです。ダッシュボードのアシスタントです。ダッシュボードと売上に関する質問だけお手伝いできます。何を確認しますか？",
  korean: "저는 Aura입니다. 대시보드 도우미예요. 대시보드와 매출 관련 질문만 도와드릴 수 있습니다. 무엇을 확인해 볼까요?",
  chinese: "我是 Aura，你的数据看板助手。我只能帮助处理看板和销售相关的问题。你想查看什么？",
  vietnamese: "Tôi là Aura, trợ lý bảng điều khiển của bạn. Tôi chỉ có thể hỗ trợ các câu hỏi về bảng điều khiển và doanh số. Bạn muốn xem gì?",
  swahili: "Mimi ni Aura, msaidizi wako wa dashibodi. Ninaweza kusaidia tu kuhusu maswali ya dashibodi na mauzo. Ungependa kuchunguza nini?",
  hindi: "मैं Aura हूं, आपकी डैशबोर्ड सहायक। मैं केवल डैशबोर्ड और बिक्री से जुड़े प्रश्नों में मदद कर सकती हूं। आप क्या देखना चाहेंगे?",
  default: "I'm Aura, your business dashboard assistant. I can only help with dashboard and sales-related questions. What would you like to review?",
};

export function buildDashboardSalesRefocusMessage(language = "en") {
  const key = getLanguageKey(language);
  return REFOCUS_MESSAGES[key] || REFOCUS_MESSAGES.default;
}
