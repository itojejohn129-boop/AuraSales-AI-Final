"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { AuraRisk } from "@/lib/sentiment-engine";

export interface RiskAlertProps {
  risk: AuraRisk | null;
  className?: string;
}

/**
 * RiskAlertCard Component
 * Displays AURA Risk assessment based on revenue and sentiment correlation
 */
export function RiskAlertCard({ risk, className = "" }: RiskAlertProps) {
  if (!risk) {
    return null;
  }

  if (!risk.isAtRisk) {
    // Green success state
    return (
      <div
        className={`rounded-lg border border-green-200 bg-green-50 p-4 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-green-600">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900">{risk.message}</h3>
            <p className="mt-1 text-sm text-green-800">{risk.details}</p>
          </div>
        </div>
      </div>
    );
  }

  // Red warning state for high risk
  const isHighRisk = risk.riskLevel === "high";

  return (
    <div
      className={`rounded-lg border ${isHighRisk ? "border-red-300 bg-red-50" : "border-yellow-300 bg-yellow-50"} p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${isHighRisk ? "text-red-600" : "text-yellow-600"}`}>
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${isHighRisk ? "text-red-900" : "text-yellow-900"}`}>
            {risk.message}
          </h3>
          <p className={`mt-1 text-sm ${isHighRisk ? "text-red-800" : "text-yellow-800"}`}>
            {risk.details}
          </p>
          {isHighRisk && (
            <div className="mt-3">
              <button className="text-sm font-semibold text-red-600 hover:text-red-700">
                Take Action →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RiskAlertCard;
