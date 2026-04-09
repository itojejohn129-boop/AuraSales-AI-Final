"use client";

import { useState, useMemo, useEffect } from "react";
import { AlertCircle, CheckCircle2, HelpCircle, Trash2 } from "lucide-react";

interface ColumnMapping {
  csvColumn: string;
  dataField: string; // 'date', 'amount', 'region', 'product', 'category' | ''
  confidence: number; // 0-1
  autoMapped?: boolean;
  source?: "fuzzy" | "inspection" | "saved" | "manual";
}

interface DataMapperProps {
  headers: string[];
  // Optional: first few data rows for inspection (each row is array of cell strings)
  sampleRows?: string[][];
  onMappingComplete: (mappings: ColumnMapping[]) => void;
  onCancel: () => void;
}

// Mapping variants constant as requested
const MAPPING_VARIANTS = {
  Amount: ["revenue", "price", "total", "val", "cost", "money", "amt"],
  Date: ["day", "time", "timestamp", "sold_at", "created", "dt"],
  Product: ["item", "service", "sku", "product_name", "description"],
  Quantity: ["units", "volume", "qty", "count", "number_sold"],
  Region: ["location", "city", "state", "branch", "zone"],
};

// Standard field names to match against (merge a conservative alias list)
const STANDARD_FIELDS = [
  { field: "date", aliases: ["date", "datetime", "timestamp", "day", "time", "created", "transaction_date", ...MAPPING_VARIANTS.Date.map((s) => s.toLowerCase())] },
  { field: "amount", aliases: ["amount", "total", "sales", "revenue", "price", "value", "sum", "cost", ...MAPPING_VARIANTS.Amount.map((s) => s.toLowerCase())] },
  { field: "region", aliases: ["region", "state", "country", "location", "territory", "area", "zone", ...MAPPING_VARIANTS.Region.map((s) => s.toLowerCase())] },
  { field: "product", aliases: ["product", "product_name", "item", "service", "sku", "name", ...MAPPING_VARIANTS.Product.map((s) => s.toLowerCase())] },
  { field: "quantity", aliases: [...MAPPING_VARIANTS.Quantity.map((s) => s.toLowerCase()), "quantity", "qty", "count"] },
  { field: "category", aliases: ["category", "type", "class", "segment", "group"] },
];

const PREF_KEY = "aura_sales_column_prefs_v1";

/**
 * Simple fuzzy string matching (Levenshtein distance)
 */
function fuzzyMatch(input: string, target: string): number {
  const a = input.toLowerCase();
  const b = target.toLowerCase();

  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;

  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  if (longer.length === 0) return 1;

  const editDistance = levenshteinDistance(longer, shorter);
  return 1 - editDistance / longer.length;
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Auto-detect best matching field for a CSV header
 */
function autoDetectField(csvHeader: string): { field: string; confidence: number } {
  let bestMatch = { field: "", confidence: 0 };

  for (const fieldDef of STANDARD_FIELDS) {
    for (const alias of fieldDef.aliases) {
      const match = fuzzyMatch(csvHeader, alias);
      if (match > bestMatch.confidence) {
        bestMatch = { field: fieldDef.field, confidence: match };
      }
    }
  }

  // Only auto-map if confidence is high enough
  return bestMatch.confidence > 0.6
    ? bestMatch
    : { field: "", confidence: 0 };
}

function isDateLike(value: string): boolean {
  // Simple ISO-like YYYY-MM-DD check or common variants
  if (!value) return false;
  const v = value.trim();
  // ISO date
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return true;
  // Other common forms: MM/DD/YYYY or DD/MM/YYYY approx
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(v)) return true;
  return false;
}

function isCurrencyLike(value: string): boolean {
  if (!value) return false;
  const v = value.trim();
  // currency symbol + number or number with commas
  if (/^[\$£€₦]\s?\d+[\d,]*\.?\d*$/.test(v)) return true;
  if (/^\d+[\d,]*\.\d{2}$/.test(v)) return true;
  return false;
}

export function DataMapper({ headers, sampleRows, onMappingComplete, onCancel }: DataMapperProps) {
  const [mappings, setMappings] = useState<ColumnMapping[]>(() =>
    headers.map((header) => ({ csvColumn: header, dataField: "", confidence: 0, autoMapped: false }))
  );

  // Initialize mappings: apply saved prefs, then fuzzy detection, then inspection of sample rows
  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem(PREF_KEY) : null;
      const prefs = stored ? JSON.parse(stored) : {};

      const newMappings: ColumnMapping[] = headers.map((header, idx) => {
        // saved preference?
        if (prefs && prefs[header]) {
          return { csvColumn: header, dataField: prefs[header], confidence: 1, autoMapped: true, source: "saved" };
        }

        // fuzzy match on header
        const detected = autoDetectField(header);
        if (detected.field) {
          return { csvColumn: header, dataField: detected.field, confidence: detected.confidence, autoMapped: true, source: "fuzzy" };
        }

        // inspect sample rows (by column index) for date/currency types
        if (sampleRows && sampleRows.length > 0) {
          const values: string[] = [];
          for (let r = 0; r < Math.min(3, sampleRows.length); r++) {
            const row = sampleRows[r];
            if (row && typeof row[idx] !== "undefined") values.push(String(row[idx]));
          }

          const dateCount = values.filter((v) => isDateLike(v)).length;
          const currencyCount = values.filter((v) => isCurrencyLike(v)).length;

          if (dateCount >= 1) {
            return { csvColumn: header, dataField: "date", confidence: 0.95, autoMapped: true, source: "inspection" };
          }

          if (currencyCount >= 1) {
            return { csvColumn: header, dataField: "amount", confidence: 0.95, autoMapped: true, source: "inspection" };
          }
        }

        // default empty
        return { csvColumn: header, dataField: "", confidence: 0, autoMapped: false };
      });

      setMappings(newMappings as ColumnMapping[]);
    } catch (err) {
      // ignore prefs parse errors
      // fallback to basic fuzzy
      const fallback: ColumnMapping[] = headers.map((header) => {
        const detected = autoDetectField(header);
        return { csvColumn: header, dataField: detected.field, confidence: detected.confidence, autoMapped: detected.confidence > 0.7, source: detected.confidence > 0.7 ? "fuzzy" : undefined } as ColumnMapping;
      });
      setMappings(fallback as ColumnMapping[]);
    }
  }, [headers, sampleRows]);

  const clearSavedPrefs = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(PREF_KEY);
      }
    } catch (e) {
      // ignore
    }

    // Re-run detection without saved prefs
    const newMappings: ColumnMapping[] = headers.map((header, idx) => {
      const detected = autoDetectField(header);
      if (detected.field) return { csvColumn: header, dataField: detected.field, confidence: detected.confidence, autoMapped: true, source: "fuzzy" } as ColumnMapping;

      if (sampleRows && sampleRows.length > 0) {
        const values: string[] = [];
        for (let r = 0; r < Math.min(3, sampleRows.length); r++) {
          const row = sampleRows[r];
          if (row && typeof row[idx] !== "undefined") values.push(String(row[idx]));
        }
        const dateCount = values.filter((v) => isDateLike(v)).length;
        const currencyCount = values.filter((v) => isCurrencyLike(v)).length;
        if (dateCount >= 1) return { csvColumn: header, dataField: "date", confidence: 0.95, autoMapped: true, source: "inspection" } as ColumnMapping;
        if (currencyCount >= 1) return { csvColumn: header, dataField: "amount", confidence: 0.95, autoMapped: true, source: "inspection" } as ColumnMapping;
      }

      return { csvColumn: header, dataField: "", confidence: 0, autoMapped: false } as ColumnMapping;
    });

    setMappings(newMappings);
  };

  const requiredFields = ["date", "amount"];
  const isValid = useMemo(() => {
    const mappedFields = mappings.filter((m) => m.dataField).map((m) => m.dataField);
    return requiredFields.every((field) => mappedFields.includes(field));
  }, [mappings]);

  const handleFieldChange = (index: number, field: string) => {
    const newMappings = [...mappings];
    newMappings[index].dataField = field;
    newMappings[index].confidence = field ? 0.85 : 0;
    newMappings[index].autoMapped = false;
    newMappings[index].source = "manual";
    setMappings(newMappings);

    // persist preference for this csv column
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem(PREF_KEY) : null;
      const prefs = stored ? JSON.parse(stored) : {};
      prefs[newMappings[index].csvColumn] = field;
      localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    } catch (e) {
      // ignore storage errors
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto border border-slate-700">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4">
          <h2 className="text-xl font-bold text-slate-50">Map Your CSV Columns</h2>
          <p className="text-sm text-slate-400 mt-1">
            Tell us which CSV column corresponds to each data field
          </p>
          <div className="absolute right-4 top-4">
            <button
              onClick={clearSavedPrefs}
              title="Reset saved mappings"
              className="flex items-center gap-2 px-2 py-1 text-xs text-slate-300 hover:text-white"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {mappings.map((mapping, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg border ${mapping.autoMapped ? 'bg-green-800/5 border-green-600' : 'bg-slate-800/50 border-slate-700'}`}>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-200">{mapping.csvColumn}</p>
                <p className="text-xs text-slate-500">CSV Column</p>
                {/* Sample values preview (first 3 rows) */}
                {Array.isArray(sampleRows) && sampleRows.length > 0 ? (
                  <div className="mt-2 flex gap-2">
                    {sampleRows.slice(0, 3).map((row, ridx) => (
                      <span key={ridx} className="text-xs font-mono text-slate-400 px-2 py-1 bg-slate-800/40 rounded">
                        {row[index] ?? ""}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex-1">
                <select
                  value={mapping.dataField}
                  onChange={(e) => handleFieldChange(index, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-50 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Skip --</option>
                  {STANDARD_FIELDS.map((field) => (
                    <option key={field.field} value={field.field}>
                      {field.field.charAt(0).toUpperCase() + field.field.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {mapping.dataField ? (
                <div className="flex items-center gap-2">
                  <div title={mapping.source ? mapping.source : mapping.confidence > 0.7 ? "Auto-detected" : "Manually selected"}>
                    {mapping.autoMapped || mapping.confidence > 0.7 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <HelpCircle className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  {mapping.source ? (
                    <span className="text-xs text-slate-400">{mapping.source}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}

          {/* Required Fields Check */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              {isValid ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-slate-100">
                  {isValid ? "✓ Mapping Complete" : "⚠ Missing Required Fields"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Required: <span className="font-mono">date</span>, <span className="font-mono">amount</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-4 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-slate-600 text-slate-50 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onMappingComplete(mappings)}
            disabled={!isValid}
            className="px-4 py-2 bg-blue-600 text-slate-950 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Confirm Mapping
          </button>
        </div>
      </div>
    </div>
  );
}
