"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Upload, Download, AlertCircle, CheckCircle, Trash2, Loader } from "lucide-react";
import Papa from "papaparse";
import { useSalesData } from "@/lib/sales-data-context";
import { validateSalesData } from "@/lib/validation";
import { useCSVUpload } from "@/hooks/useCSVUpload";
import type { SalesRecord } from "@/lib/validation";
import { toast } from "sonner";

export default function UploadPage() {
  const MAX_UPLOAD_SIZE_MB = 50;
  const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const {
    records,
    validationErrors,
    isValid,
    setSalesData,
    setValidationErrors,
    clearData,
  } = useSalesData();

  const { uploadCSVData, isLoading: isUploading } = useCSVUpload();

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setParseError("Please upload a CSV file");
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setParseError(`File size exceeds ${MAX_UPLOAD_SIZE_MB}MB limit`);
      return;
    }

    setParseError(null);
    setFileName(file.name);

    Papa.parse(file as any, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        if (results.errors && results.errors.length > 0) {
          setParseError(`Parse error: ${results.errors[0].message}`);
          return;
        }

        if (!results.data || results.data.length === 0) {
          setParseError("CSV file is empty");
          return;
        }

        const { valid, errors } = validateSalesData(results.data);

        if (valid.length === 0) {
          setParseError(
            `No valid records found. ${errors.length} rows with errors.`
          );
          setValidationErrors(errors);
          return;
        }

        setSalesData(valid, file.name);
        setValidationErrors(errors);
        setParseError(null);
      },
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "date",
      "product",
      "quantity",
      "unitPrice",
      "region",
      "salesperson",
      "channel",
      "notes",
    ];
    const sampleData = [
      [
        "2024-01-15",
        "Product A",
        "10",
        "50.00",
        "North",
        "John Doe",
        "direct",
        "Q1 sale",
      ],
      [
        "2024-01-16",
        "Product B",
        "5",
        "100.00",
        "South",
        "Jane Smith",
        "online",
        "",
      ],
    ];

    const csv =
      Papa.unparse({
        fields: headers,
        data: sampleData,
      });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUploadToBackend = async () => {
    // Defensive null checks
    if (!records || !Array.isArray(records) || records.length === 0) {
      toast.error("No valid records to upload");
      return;
    }

    if (!isValid) {
      toast.error("Data validation failed. Please fix errors and try again.");
      return;
    }

    // Filter out any null/undefined records and transform to match Supabase schema
    const batch = records
      .filter(record => record !== null && typeof record === "object")
      .map((record) => ({
        sale_date: record?.sale_date || new Date().toISOString(),
        product_name: record?.product_name || "",
        amount: typeof record?.amount === "number" ? record.amount : 0,
        quantity: record?.quantity || null,
        region: record?.region || "",
        additional_data: record?.additional_data || null,
      }));

    if (batch.length === 0) {
      toast.error("No valid records found after filtering");
      return;
    }

    const result = await uploadCSVData(batch);

    if (result.success) {
      setUploadSuccess(true);
      clearData();
      setFileName("");
      // Reset success message after 5 seconds
      setTimeout(() => setUploadSuccess(false), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-blue-400 hover:text-blue-300 text-sm font-semibold mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-slate-50 mb-2">Upload Sales Data</h1>
          <p className="text-slate-400">
            Import your CSV file to analyze and forecast sales trends
          </p>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Upload Area */}
          <div className="lg:col-span-2">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-600 bg-slate-800/50 hover:border-slate-500"
              }`}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <h2 className="text-xl font-semibold text-slate-50 mb-2">
                Drop your CSV file here
              </h2>
              <p className="text-slate-400 mb-4">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-slate-950 font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Select File
              </button>
            </div>

            {/* File Info */}
            {fileName && (
              <div className="mt-6 p-4 rounded-lg bg-slate-800 border border-slate-700">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400">File name</p>
                    <p className="text-slate-50 font-semibold">{fileName}</p>
                    <p className="text-sm text-slate-400 mt-2">
                      {records.length} valid records
                      {validationErrors.length > 0 &&
                        ` • ${validationErrors.length} errors`}
                    </p>
                  </div>
                  <button
                    onClick={clearData}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Error Messages */}
            {parseError && (
              <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-400">Parse Error</p>
                  <p className="text-red-300 text-sm mt-1">{parseError}</p>
                </div>
              </div>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/50">
                <div className="flex gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <p className="font-semibold text-yellow-400">
                    {validationErrors.length} rows with validation errors
                  </p>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {validationErrors.map((err, idx) => (
                    <p key={idx} className="text-sm text-yellow-300">
                      Row {err.row}: {err.error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Success Message */}
            {isValid && (
              <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/50 flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-400">Data validated successfully</p>
                  <p className="text-green-300 text-sm mt-1">
                    Ready to analyze and generate forecasts
                  </p>
                </div>
              </div>
            )}

            {/* Upload Success Message */}
            {uploadSuccess && (
              <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/50 flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-400">Upload successful!</p>
                  <p className="text-green-300 text-sm mt-1">
                    Your data has been saved to the database
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Download Template */}
            <div className="p-6 rounded-lg bg-slate-800 border border-slate-700">
              <h3 className="font-semibold text-slate-50 mb-4">Need a template?</h3>
              <button
                onClick={downloadTemplate}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-50 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>

            {/* Requirements */}
            <div className="p-6 rounded-lg bg-slate-800 border border-slate-700">
              <h3 className="font-semibold text-slate-50 mb-4">CSV Requirements</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex gap-2">
                  <span className="text-blue-400 flex-shrink-0">✓</span>
                  <span>CSV format (.csv)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 flex-shrink-0">✓</span>
                  <span>Max {MAX_UPLOAD_SIZE_MB}MB file size</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 flex-shrink-0">✓</span>
                  <span>Headers: date, product, quantity, unitPrice, region, salesperson</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 flex-shrink-0">✓</span>
                  <span>Date format: YYYY-MM-DD</span>
                </li>
              </ul>
            </div>

            {/* Data Summary */}
            {records.length > 0 && (
              <div className="p-6 rounded-lg bg-slate-800 border border-slate-700">
                <h3 className="font-semibold text-slate-50 mb-4">Data Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Records</span>
                    <span className="text-slate-50 font-semibold">{records.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Products</span>
                    <span className="text-slate-50 font-semibold">
                      {new Set(records.map((r) => r.product_name)).size}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Regions</span>
                    <span className="text-slate-50 font-semibold">
                      {new Set(records.map((r) => r.region)).size}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Revenue</span>
                    <span className="text-slate-50 font-semibold">
                      ${records.reduce((sum, r) => sum + r.amount, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isValid && (
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleUploadToBackend}
              disabled={isUploading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 disabled:cursor-not-allowed text-slate-950 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload to Database
                </>
              )}
            </button>
            <Link
              href="/dashboard/analytics"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-slate-950 font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              View Analytics
            </Link>
            <button
              onClick={clearData}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-50 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Clear & Upload New
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
