"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface SentimentScore {
  text: string;
  score: number; // 0-100
  label: "Positive" | "Negative" | "Neutral";
}

export interface SentimentAnalysisResult {
  scores: SentimentScore[];
  averageScore: number;
  totalProcessed: number;
  batchesProcessed: number;
}

/**
 * Hook for analyzing sentiment from feedback
 * Supports batch processing (50 entries per batch)
 */
export function useSentimentAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeFeedback = useCallback(
    async (
      feedbackList: string[],
      token?: string
    ): Promise<SentimentAnalysisResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        if (!feedbackList || feedbackList.length === 0) {
          const err = "No feedback to analyze";
          setError(err);
          toast.error(err);
          return null;
        }

        // Filter empty feedback
        const validFeedback = feedbackList.filter(
          (f) => typeof f === "string" && f.trim().length > 0
        );

        if (validFeedback.length === 0) {
          const err = "No valid feedback to analyze";
          setError(err);
          toast.error(err);
          return null;
        }

        const batchSize = 50;
        const batches = [];

        // Create batches of up to 50 entries
        for (let i = 0; i < validFeedback.length; i += batchSize) {
          batches.push(validFeedback.slice(i, i + batchSize));
        }

        const allScores: SentimentScore[] = [];
        let totalProcessed = 0;

        // Process each batch
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          const headers: HeadersInit = {
            "Content-Type": "application/json",
          };

          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }

          try {
            const response = await fetch("/api/analyze-sentiment", {
              method: "POST",
              headers,
              body: JSON.stringify({ feedback: batch }),
            });

            if (!response.ok) {
              const result = await response.json();
              throw new Error(
                result.error || `Batch ${i + 1} failed with status ${response.status}`
              );
            }

            const result = await response.json();
            allScores.push(...(result.scores || []));
            totalProcessed += result.totalProcessed || 0;

            // Show progress
            toast.success(
              `Processed batch ${i + 1}/${batches.length} (${totalProcessed} entries)`
            );
          } catch (batchErr: any) {
            const errorMsg = batchErr?.message || `Error processing batch ${i + 1}`;
            console.error(errorMsg, batchErr);
            toast.error(errorMsg);

            // Continue with other batches
          }
        }

        if (allScores.length === 0) {
          const err = "No sentiment scores generated";
          setError(err);
          toast.error(err);
          return null;
        }

        const averageScore = Math.round(
          allScores.reduce((sum, s) => sum + s.score, 0) / allScores.length
        );

        const result: SentimentAnalysisResult = {
          scores: allScores,
          averageScore,
          totalProcessed: allScores.length,
          batchesProcessed: batches.length,
        };

        toast.success(`Sentiment analysis complete! Average score: ${averageScore}`);
        return result;
      } catch (err: any) {
        const errorMsg = err?.message || "Failed to analyze sentiment";
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    analyzeFeedback,
    isLoading,
    error,
  };
}

export default useSentimentAnalysis;
