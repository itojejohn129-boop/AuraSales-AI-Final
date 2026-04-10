"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Zap, Loader, Mail } from "lucide-react";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";

export interface ActionTask {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  estimatedROI?: string;
  completed: boolean;
}

interface ActionPanelProps {
  tasks: ActionTask[];
  isLoading?: boolean;
  onTaskToggle?: (taskId: string, completed: boolean) => void;
  onSendStrategy?: () => Promise<void>;
  isSendingStrategy?: boolean;
  targetLanguage?: string;
}

export function ActionPanel({
  tasks = [],
  isLoading = false,
  onTaskToggle,
  onSendStrategy,
  isSendingStrategy = false,
  targetLanguage = "en",
}: ActionPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [translatedTitle, translatedSubtitle, translatedEmpty, translatedTip, translatedSend, translatedSending] =
    useTranslatedTexts(targetLanguage, [
      "Strategic Recommendations",
      "AI-Generated Tasks to increase revenue by 5% next month",
      "Upload a CSV to generate strategic recommendations",
      "Tip:",
      "Send Strategy to Email",
      "Sending...",
    ]);

  const handleToggle = (taskId: string, currentState: boolean) => {
    onTaskToggle?.(taskId, !currentState);
  };

  const handleSendStrategy = async () => {
    try {
      await onSendStrategy?.();
    } catch (error) {
      console.error("Error sending strategy:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      case "medium":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "low":
        return "text-green-400 bg-green-500/10 border-green-500/30";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/30";
    }
  };

  if (isLoading) {
    return (
      <motion.div
        data-aura-translate-skip
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-md"
      >
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-5 h-5 text-blue-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-slate-50">{translatedTitle}</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30 animate-pulse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded bg-slate-600" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-slate-600 rounded" />
                  <div className="h-3 w-full bg-slate-700 rounded" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <motion.div
        data-aura-translate-skip
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-md text-center"
      >
        <Zap className="w-8 h-8 text-slate-500 mx-auto mb-3 opacity-50" />
        <p className="text-slate-400">{translatedEmpty}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      data-aura-translate-skip
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-md"
    >
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-5 h-5 text-blue-500" />
        <div>
          <h3 className="text-lg font-semibold text-slate-50">{translatedTitle}</h3>
          <p className="text-xs text-slate-400 mt-1">{translatedSubtitle}</p>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-lg border backdrop-blur-sm transition-all cursor-pointer ${
                task.completed
                  ? "bg-green-500/5 border-green-500/30"
                  : "bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50"
              }`}
              onClick={() => handleToggle(task.id, task.completed)}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(task.id, task.completed);
                  }}
                  className="mt-1 flex-shrink-0 focus:outline-none"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4
                      className={`font-medium ${
                        task.completed ? "text-slate-400 line-through" : "text-slate-50"
                      }`}
                    >
                      {task.title}
                    </h4>
                    <span
                      className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                    </span>
                  </div>

                  <p className={`text-sm ${task.completed ? "text-slate-500" : "text-slate-300"}`}>
                    {task.description}
                  </p>

                  {task.estimatedROI && (
                    <div className="mt-2 text-xs text-emerald-400 font-medium">
                      Estimated ROI: {task.estimatedROI}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-6 space-y-3">
        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/30">
          <p className="text-sm text-blue-300 m-0">
            <span className="font-semibold">💡 {translatedTip}</span> Prioritize high-impact, low-cost actions first. Track completed tasks to measure progress.
          </p>
        </div>

        <button
          onClick={handleSendStrategy}
          disabled={isSendingStrategy || tasks.length === 0}
          className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all flex items-center justify-center gap-2 border border-indigo-500/30"
        >
          {isSendingStrategy ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>{translatedSending}</span>
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              <span>📧 {translatedSend}</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
