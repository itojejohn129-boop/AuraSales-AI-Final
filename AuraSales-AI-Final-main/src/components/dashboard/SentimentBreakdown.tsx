"use client";

import React from "react";
import { ThumbsDown } from "lucide-react";

export interface NegativeFeedbackItem {
  text: string;
  score: number;
}

export interface SentimentBreakdownProps {
  negativeComments: NegativeFeedbackItem[];
  totalNegative: number;
  className?: string;
}

/**
 * SentimentBreakdown Component
 * Displays top 3 most negative comments for immediate action
 */
export function SentimentBreakdown({
  negativeComments,
  totalNegative,
  className = "",
}: SentimentBreakdownProps) {
  const displayComments = negativeComments.slice(0, 3);

  return (
    <div className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <ThumbsDown className="h-5 w-5 text-red-600" />
        <h3 className="font-semibold text-red-900">
          Negative Sentiment Breakdown
        </h3>
        <span className="ml-auto inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          {totalNegative} comments
        </span>
      </div>

      {displayComments.length === 0 ? (
        <p className="text-sm text-red-700">No negative feedback found.</p>
      ) : (
        <div className="space-y-3">
          {displayComments.map((comment, idx) => (
            <div
              key={idx}
              className="rounded bg-red-100 p-3 border-l-4 border-red-600"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm text-red-900">{comment.text}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-block bg-red-600 text-white rounded px-2 py-1 text-xs font-bold">
                    {comment.score}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {displayComments.length > 0 && (
        <div className="mt-4 pt-3 border-t border-red-200">
          <button className="text-sm font-semibold text-red-700 hover:text-red-800">
            View All {totalNegative} Comments →
          </button>
        </div>
      )}
    </div>
  );
}

export default SentimentBreakdown;
