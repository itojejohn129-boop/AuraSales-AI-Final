"use client";

import { motion } from "framer-motion";
import { Mic2, TrendingUp, FileDown, AlertTriangle, X, MessageCircle, Lock } from "lucide-react";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onSelect: (feature: "ai-voice" | "predictive" | "pdf" | "anomaly" | "text-ai") => void;
  hasProAccess: boolean;
  proOnlyFeatureIds: string[];
  onLockedFeatureClick?: (featureId: string) => void;
}

export default function Sidebar({
  open,
  onClose,
  onSelect,
  hasProAccess,
  proOnlyFeatureIds,
  onLockedFeatureClick,
}: SidebarProps) {
  const language = useSiteLanguage();
  const translated = useTranslatedTexts(language, [
    "Intelligence Hub",
    "Text AI",
    "Chat with AI assistant",
    "Narrate Insights",
    "Read summary using AI voice",
    "Forecast Controls",
    "Adjust market assumptions",
    "Export Detailed PDF",
    "Generate dashboard brief",
    "Anomaly Detector",
    "Check sales alerts",
    "Upgrade to Pro to access this feature",
  ]);
  const [
    hubTitle,
    textAiLabel,
    textAiDescription,
    narrateLabel,
    narrateDescription,
    forecastLabel,
    forecastDescription,
    pdfLabel,
    pdfDescription,
    anomalyLabel,
    anomalyDescription,
    upgradeLabel,
  ] = translated;

  const localizedFeatures = [
    {
      id: "text-ai",
      label: textAiLabel,
      icon: MessageCircle,
      description: textAiDescription,
    },
    {
      id: "ai-voice",
      label: narrateLabel,
      icon: Mic2,
      description: narrateDescription,
    },
    {
      id: "predictive",
      label: forecastLabel,
      icon: TrendingUp,
      description: forecastDescription,
    },
    {
      id: "pdf",
      label: pdfLabel,
      icon: FileDown,
      description: pdfDescription,
    },
    {
      id: "anomaly",
      label: anomalyLabel,
      icon: AlertTriangle,
      description: anomalyDescription,
    },
  ];

  return (
    <>
      {/* Overlay backdrop */}
      {open && (
        <motion.div
          className="fixed inset-0 z-40 bg-black/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.div
        className="fixed top-0 left-0 h-screen w-80 z-50 bg-slate-900/60 backdrop-blur-xl border-r border-white/10 flex flex-col"
        initial={{ x: "-100%" }}
        animate={{ x: open ? "0%" : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-lg font-semibold text-slate-50">{hubTitle}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-slate-400 hover:text-slate-200" />
          </button>
        </div>

        {/* Feature List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {localizedFeatures.map((feature, idx) => {
            const Icon = feature.icon;
            const isProFeature = proOnlyFeatureIds.includes(feature.id);
            const isLocked = isProFeature && !hasProAccess;
            return (
              <motion.button
                key={feature.id}
                aria-disabled={isLocked}
                title={isLocked ? upgradeLabel : feature.description}
                onClick={() => {
                  if (isLocked) {
                    onLockedFeatureClick?.(feature.id);
                    onClose();
                    return;
                  }
                  onSelect(feature.id as "ai-voice" | "predictive" | "pdf" | "anomaly" | "text-ai");
                  onClose();
                }}
                className={`w-full p-4 rounded-lg transition-all group text-left ${
                  isLocked
                    ? "opacity-55 cursor-pointer border border-slate-700/60 bg-slate-800/30"
                    : "hover:bg-slate-700/50"
                }`}
                whileHover={isLocked ? undefined : { x: 4 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isLocked ? "text-slate-500" : "text-blue-400"}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium transition-colors ${isLocked ? "text-slate-400" : "text-slate-50 group-hover:text-slate-200"}`}>
                        {feature.label}
                      </p>
                      {isProFeature && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
                          {isLocked && <Lock className="w-3 h-3" />}
                          Pro
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{feature.description}</p>
                    {isLocked && (
                      <p className="text-[11px] text-amber-300 mt-1">{upgradeLabel}</p>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 text-center">
          <p className="text-xs text-slate-500">AuraSales AI v1.0</p>
        </div>
      </motion.div>
    </>
  );
}
