/**
 * React Context for shared sales data state
 * Manages uploaded CSV data, validation errors, and forecast results
 */

"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { SalesRecord, ForecastRequest } from "./validation";
import {
  forecastLinear,
  forecastExponential,
  calculateStats,
  type ForecastResult,
} from "./ml-engine";

export interface SalesDataContextType {
  // Data state
  records: SalesRecord[];
  fileName: string | null;
  uploadedAt: string | null;

  // Validation state
  validationErrors: Array<{ row: number; error: string }>;
  isValid: boolean;

  // Forecast results
  forecastResults: ForecastResult[];
  forecastStats: ReturnType<typeof calculateStats> | null;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  setSalesData: (records: SalesRecord[], fileName: string) => void;
  setValidationErrors: (errors: Array<{ row: number; error: string }>) => void;
  clearData: () => void;
  runForecast: (method: "linear" | "exponential", periods: number, alpha?: number) => void;
}

const SalesDataContext = createContext<SalesDataContextType | undefined>(undefined);

export function SalesDataProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadedAt, setUploadedAt] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Array<{ row: number; error: string }>
  >([]);
  const [forecastResults, setForecastResults] = useState<ForecastResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setSalesData = useCallback(
    (newRecords: SalesRecord[], newFileName: string) => {
      setRecords(newRecords);
      setFileName(newFileName);
      setUploadedAt(new Date().toISOString());
      setValidationErrors([]);
      setError(null);
    },
    []
  );

  const clearData = useCallback(() => {
    setRecords([]);
    setFileName(null);
    setUploadedAt(null);
    setValidationErrors([]);
    setForecastResults([]);
    setError(null);
  }, []);

  const runForecast = useCallback(
    (method: "linear" | "exponential", periods: number, alpha?: number) => {
      try {
        setIsLoading(true);
        setError(null);

        // Extract sales values (sum by sale_date for aggregation)
        const salesByDate = new Map<string, number>();
        records.forEach((record) => {
          const existing = salesByDate.get(record.sale_date) || 0;
          salesByDate.set(record.sale_date, existing + (record.amount || 0));
        });

        const sortedDates = Array.from(salesByDate.keys()).sort();
        const salesValues = sortedDates.map((date) => salesByDate.get(date) || 0);

        if (salesValues.length < 2) {
          setError("Need at least 2 data points to forecast");
          setIsLoading(false);
          return;
        }

        let results: ForecastResult[] = [];

        if (method === "linear") {
          results = forecastLinear(salesValues, periods);
        } else {
          results = forecastExponential(salesValues, periods, alpha || 0.3);
        }

        setForecastResults(results);

        // Calculate stats from the sales data
        const stats = calculateStats(salesValues);
        // Store stats in a way that can be accessed - you could extend this
      } catch (err) {
        setError(err instanceof Error ? err.message : "Forecast failed");
      } finally {
        setIsLoading(false);
      }
    },
    [records]
  );

  const isValid = records.length > 0 && validationErrors.length === 0;

  const value: SalesDataContextType = {
    records,
    fileName,
    uploadedAt,
    validationErrors,
    isValid,
    forecastResults,
    forecastStats: records.length > 0 ? calculateStats(records.map((r) => r.amount || 0)) : null,
    isLoading,
    error,
    setSalesData,
    setValidationErrors,
    clearData,
    runForecast,
  };

  return (
    <SalesDataContext.Provider value={value}>{children}</SalesDataContext.Provider>
  );
}

export function useSalesData() {
  const context = useContext(SalesDataContext);
  if (context === undefined) {
    throw new Error("useSalesData must be used within SalesDataProvider");
  }
  return context;
}
