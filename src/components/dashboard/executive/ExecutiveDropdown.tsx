"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

interface Props {
  onSelect: (key: string) => void;
}

export default function ExecutiveDropdown({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const language = useSiteLanguage();
  const [voice, forecast, pdf, anomaly] = useTranslatedTexts(language, [
    "AI Voice Narrator",
    "Predictive Forecasting",
    "PDF Generator",
    "Anomaly Detector",
  ]);

  const items = [
    { key: "ai-voice", label: voice },
    { key: "predictive", label: forecast },
    { key: "pdf", label: pdf },
    { key: "anomaly", label: anomaly },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="p-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md text-slate-50"
        aria-expanded={open}
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-white/10 bg-white/6 backdrop-blur-md shadow-lg z-50">
          <div className="p-2">
            {items.map((it) => (
              <button
                key={it.key}
                onClick={() => {
                  onSelect(it.key);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-white/5 text-slate-100"
              >
                {it.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
