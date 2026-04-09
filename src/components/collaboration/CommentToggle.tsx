"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { CommentThread } from "./CommentThread";
import { ChartContextType } from "@/types/comments";

interface CommentToggleProps {
  chartContext: ChartContextType | string;
  chartTitle: string;
  chartData?: Record<string, any>;
  className?: string;
}

export function CommentToggle({
  chartContext,
  chartTitle,
  chartData,
  className = "",
}: CommentToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title={`Discuss ${chartTitle}`}
        className={`p-2 rounded-lg hover:bg-slate-700/50 transition-colors flex items-center gap-2 ${className}`}
      >
        <MessageCircle className="w-5 h-5 text-slate-300 hover:text-blue-400" />
        <span className="text-xs text-slate-400 hover:text-slate-300">
          War Room
        </span>
      </button>

      <CommentThread
        chartContext={chartContext}
        chartTitle={chartTitle}
        chartData={chartData}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
