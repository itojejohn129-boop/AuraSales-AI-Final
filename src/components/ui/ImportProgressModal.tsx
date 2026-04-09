"use client";

import React from "react";
import { X } from "lucide-react";

interface ImportProgressModalProps {
  open: boolean;
  current: number;
  total: number;
  percent: number;
  isProcessing?: boolean;
  statusText?: string;
  onClose?: () => void;
}

export function ImportProgressModal({
  open,
  current,
  total,
  percent,
  isProcessing = false,
  statusText,
  onClose,
}: ImportProgressModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-slate-900 rounded-lg border border-slate-700 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-50">
              {isProcessing ? "Processing Upload" : "Importing Data"}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {isProcessing
                ? statusText || "Processing... server is crunching your rows."
                : `Uploading batch ${current} of ${total}`}
            </p>
          </div>
          <div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200"
              aria-label="Close progress"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="w-full h-3 bg-slate-800 rounded overflow-hidden border border-slate-700">
            <div
              className="h-3 bg-blue-600"
              style={{ width: `${percent}%`, transition: "width 300ms ease" }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">{percent}%</span>
            <span className="text-xs text-slate-400">
              {isProcessing ? "Server processing..." : `${current}/${total} batches`}
            </span>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-400 flex items-center gap-2">
          {isProcessing && (
            <span className="inline-flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          )}
          <p>
            {isProcessing
              ? "Processing... keep this window open while we finish aggregation."
              : "Import runs in the background - keep this window open until complete."}
          </p>
        </div>
      </div>
    </div>
  );
}
