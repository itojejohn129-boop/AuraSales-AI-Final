"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { sanitizeRecordKeys } from "@/lib/validation";
import { toast } from "sonner";

export interface UploadResult {
  success: boolean;
  inserted?: number;
  data?: any;
  error?: string;
}

export function useCSVUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const CHUNK_SIZE = 1000;

  const uploadCSVData = async (
    rows: Array<Record<string, any>>
  ): Promise<UploadResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate input
      if (!Array.isArray(rows) || rows.length === 0) {
        const err = "No data to upload";
        setError(err);
        toast.error(err);
        return { success: false, error: err };
      }

      // Get current user and session
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        const err = "You must be signed in to upload data";
        setError(err);
        toast.error(err);
        return { success: false, error: err };
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!user || !token) {
        const err = "Session expired. Please sign in again.";
        setError(err);
        toast.error(err);
        return { success: false, error: err };
      }

      // Normalize each row's keys to match Supabase schema, then prepare batch with user_id
      const batch = rows.map((row) => {
        const normalized = sanitizeRecordKeys(row);
        return {
          ...normalized,
          user_id: user.id,
        };
      });

      const totalBatches = Math.ceil(batch.length / CHUNK_SIZE);
      let insertedTotal = 0;

      for (let index = 0; index < totalBatches; index++) {
        const start = index * CHUNK_SIZE;
        const payloadBatch = batch.slice(start, start + CHUNK_SIZE);

        const response = await fetch("/api/upload-sales", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ batch: payloadBatch }),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          const err =
            result.error ||
            `Upload failed on batch ${index + 1} of ${totalBatches} (status ${response.status})`;
          setError(err);
          toast.error(err);
          return { success: false, error: err };
        }

        insertedTotal += Number(result.inserted || payloadBatch.length);
      }

      toast.success(`Successfully uploaded ${insertedTotal} records`);
      return {
        success: true,
        inserted: insertedTotal,
      };
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to upload CSV data";
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    uploadCSVData,
    isLoading,
    error,
  };
}
