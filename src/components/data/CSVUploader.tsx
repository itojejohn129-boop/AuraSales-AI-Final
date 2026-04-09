"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Upload, AlertCircle } from "lucide-react";
import { DataMapper } from "./DataMapper";
import * as XLSX from "xlsx";
import { normalizeFlexibleDate } from "@/lib/date-normalize";

interface ColumnMapping {
  csvColumn: string;
  dataField: string;
  confidence: number;
}

interface CSVData {
  headers: string[];
  rows: Record<string, string>[];
}

interface CSVUploaderProps {
  onUpload: (
    data: CSVData,
    mappings: ColumnMapping[],
    userId?: string,
    token?: string,
    sourceFile?: File
  ) => Promise<void>;
}

const SUPPORTED_UPLOAD_EXTENSIONS = new Set(["csv", "xlsx", "xls", "ods", "json"]);

function toCellString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function rowsToCSVData(rawRows: Record<string, unknown>[]): CSVData {
  const headers: string[] = [];
  const seenHeaders = new Set<string>();

  for (const row of rawRows) {
    for (const key of Object.keys(row)) {
      if (!seenHeaders.has(key)) {
        seenHeaders.add(key);
        headers.push(key);
      }
    }
  }

  const rows: Record<string, string>[] = rawRows.map((row) => {
    const normalized: Record<string, string> = {};
    for (const header of headers) {
      normalized[header] = toCellString(row[header]);
    }
    return normalized;
  });

  return { headers, rows };
}

async function parseSpreadsheetFile(file: File): Promise<CSVData> {
  const fileBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(fileBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Spreadsheet has no readable sheet");
  }

  const firstSheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: "",
  });

  if (!rows.length) {
    throw new Error("Uploaded file has no data rows");
  }

  return rowsToCSVData(rows);
}

async function parseJsonFile(file: File): Promise<CSVData> {
  const text = await file.text();
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON format");
  }

  let rows: unknown = parsed;
  if (!Array.isArray(rows) && rows && typeof rows === "object") {
    const wrapped = rows as Record<string, unknown>;
    if (Array.isArray(wrapped.rows)) rows = wrapped.rows;
    else if (Array.isArray(wrapped.data)) rows = wrapped.data;
    else if (Array.isArray(wrapped.batch)) rows = wrapped.batch;
  }

  if (!Array.isArray(rows)) {
    throw new Error("JSON must be an array of records (or include rows/data/batch)");
  }

  const objectRows = rows.filter((row) => row && typeof row === "object") as Record<string, unknown>[];
  if (!objectRows.length) {
    throw new Error("JSON file does not contain valid object rows");
  }

  return rowsToCSVData(objectRows);
}

function cleanData(
  rows: Record<string, string>[],
  mappings: ColumnMapping[]
): Record<string, unknown>[] {
  const fieldToColumn = new Map<string, string>();
  mappings.forEach((m) => {
    if (m.dataField) {
      fieldToColumn.set(m.dataField, m.csvColumn);
    }
  });

  return rows
    .map((row) => {
      const cleaned: Record<string, unknown> = {};

      fieldToColumn.forEach((csvCol, field) => {
        const value = row[csvCol] ?? "";

        if (field === "amount") {
          const normalizedAmount = String(value).replace(/[^0-9.-]/g, "").trim();
          cleaned[field] = parseFloat(normalizedAmount) || 0;
          return;
        }

        if (field === "date") {
          cleaned[field] = normalizeDateFormat(String(value));
          return;
        }

        cleaned[field] = String(value || "");
      });

      return cleaned;
    })
    .filter((row) => {
      const dateValue = row.date;
      const amountValue = row.amount;

      const hasValidDate = typeof dateValue === "string" && dateValue.length > 0;
      const hasValidAmount =
        typeof amountValue === "number" && Number.isFinite(amountValue);

      return hasValidDate && hasValidAmount;
    });
}

function normalizeDateFormat(dateStr: string): string | null {
  return normalizeFlexibleDate(dateStr);
}

export function CSVUploader({ onUpload }: CSVUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [csvData, setCSVData] = useState<CSVData | null>(null);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [showMapper, setShowMapper] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files?.length) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError("");

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!SUPPORTED_UPLOAD_EXTENSIONS.has(extension)) {
      setError("Unsupported format. Accepted formats: CSV, Excel (XLSX), JSON.");
      return;
    }

    try {
      const data = extension === "json" ? await parseJsonFile(file) : await parseSpreadsheetFile(file);

      setCSVData(data);
      setSourceFile(file);
      setPreviewRows(data.rows.slice(0, 5));
      setShowMapper(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse uploaded file");
    }
  };

  const handleMappingComplete = async (mappings: ColumnMapping[]) => {
    if (!csvData) return;

    setShowMapper(false);
    setIsLoading(true);

    try {
      const cleanedData = cleanData(csvData.rows, mappings);

      if (cleanedData.length === 0) {
        throw new Error(
          "No valid data rows after processing. Please check your file format and column mappings."
        );
      }

      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/auth/signin");
        setIsLoading(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      await onUpload(csvData, mappings, user.id, token, sourceFile || undefined);

      setCSVData(null);
      setPreviewRows([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-500/10"
            : "border-slate-600 bg-slate-800/50 hover:border-slate-500"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.ods,.json,application/json,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.oasis.opendocument.spreadsheet"
          onChange={handleFileInput}
          className="hidden"
        />

        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-50 mb-1">
          Drop your sales file here
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          or{" "}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            browse your computer
          </button>
        </p>
        <p className="text-xs text-slate-500">
          Accepted formats: CSV, Excel (XLSX), JSON.
        </p>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {csvData && previewRows.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">
            Preview ({csvData.rows.length} rows)
          </h3>
          <div className="overflow-x-auto border border-slate-700 rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 border-b border-slate-700">
                  {csvData.headers.map((header) => (
                    <th
                      key={header}
                      className="px-4 py-2 text-left text-slate-300 font-medium"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-700 hover:bg-slate-800/50">
                    {csvData.headers.map((header) => (
                      <td key={header} className="px-4 py-2 text-slate-300">
                        {row[header] || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showMapper && csvData && (
        <DataMapper
          headers={csvData.headers}
          sampleRows={csvData.rows.slice(0, 3).map((r) => csvData.headers.map((h) => r[h] || ""))}
          onMappingComplete={handleMappingComplete}
          onCancel={() => {
            setShowMapper(false);
            setCSVData(null);
            setSourceFile(null);
            setPreviewRows([]);
          }}
        />
      )}

      {isLoading && (
        <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
          <p className="text-sm text-blue-400">Processing file...</p>
        </div>
      )}
    </div>
  );
}
