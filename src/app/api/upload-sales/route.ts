import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Papa from "papaparse";
import { Readable } from "node:stream";
import { ReadableStream as NodeReadableStream } from "node:stream/web";
import * as XLSX from "xlsx";
import { normalizeFlexibleDate } from "@/lib/date-normalize";

export const runtime = "nodejs";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const UPSERT_BATCH_SIZE = 1000;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in env");
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const publicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

type SalesRow = {
  sale_date: string;
  product_name: string;
  amount: number;
  quantity: number | null;
  region: string;
  additional_data: Record<string, unknown> | null;
  user_id: string;
};

type ChartPoint = {
  sale_date: string;
  amount: number;
};

type PieDatum = {
  name: string;
  value: number;
};

type ColumnMapping = { csvColumn: string; dataField: string };

type UploadFormat = "csv" | "spreadsheet" | "json" | "unsupported";

const FLEXIBLE_HEADER_ALIASES: Record<string, string[]> = {
  sale_date: ["sale_date", "date", "sales_date", "transaction_date", "order_date", "timestamp", "created_at", "sold_at"],
  product_name: ["product_name", "product", "item_name", "item", "productname", "sku", "name"],
  amount: ["amount", "total", "price", "unit_price", "unitprice", "revenue", "sales", "value"],
  quantity: ["quantity", "qty", "units", "unit", "count", "volume"],
  region: ["region", "location", "area", "territory", "market", "zone"],
};

const HEADER_ALIAS_LOOKUP = (() => {
  const lookup = new Map<string, string>();
  for (const [targetField, aliases] of Object.entries(FLEXIBLE_HEADER_ALIASES)) {
    aliases.forEach((alias) => {
      lookup.set(alias.toLowerCase().replace(/[^a-z0-9]/g, ""), targetField);
    });
  }
  return lookup;
})();

function toCanonicalHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseMappings(input: unknown): ColumnMapping[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((item) => item && typeof item === "object")
    .map((item) => item as Record<string, unknown>)
    .filter((item) => typeof item.csvColumn === "string" && typeof item.dataField === "string")
    .map((item) => ({ csvColumn: String(item.csvColumn), dataField: String(item.dataField) }));
}

function applyMapping(input: Record<string, unknown>, mappings: ColumnMapping[] = []): Record<string, unknown> {
  if (!Array.isArray(mappings) || mappings.length === 0) return input;

  const mapped: Record<string, unknown> = { ...input };
  for (const mapping of mappings) {
    if (!mapping?.csvColumn || !mapping?.dataField) continue;
    if (Object.prototype.hasOwnProperty.call(input, mapping.csvColumn)) {
      mapped[mapping.dataField] = input[mapping.csvColumn];
    }
  }

  return mapped;
}

function applyFlexibleHeaderMapping(input: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = { ...input };

  for (const [key, value] of Object.entries(input)) {
    const canonical = toCanonicalHeader(key);
    const targetField = HEADER_ALIAS_LOOKUP.get(canonical);

    if (!targetField) continue;
    if (mapped[targetField] === undefined || mapped[targetField] === null || mapped[targetField] === "") {
      mapped[targetField] = value;
    }
  }

  return mapped;
}

function parseNumericValue(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === null || value === undefined || value === "") return fallback;

  const normalized = String(value).replace(/[^0-9.-]/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalNumericValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = parseNumericValue(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSaleDate(value: unknown): string {
  const fallback = new Date().toISOString().split("T")[0];
  const normalized = normalizeFlexibleDate(value);
  return normalized || fallback;
}

function normalizeRow(input: Record<string, unknown>, userId: string, mappings: ColumnMapping[] = []): SalesRow {
  const mappedInput = applyFlexibleHeaderMapping(applyMapping({ ...input }, mappings));

  const row: Record<string, unknown> = { ...mappedInput };
  if (row.date && !row.sale_date) row.sale_date = row.date;
  if (row.product && !row.product_name) row.product_name = row.product;
  if (row.location && !row.region) row.region = row.location;
  if ((row.total || row.price) && !row.amount) row.amount = row.total ?? row.price;
  if ((row.qty || row.Qty) && !row.quantity) row.quantity = row.qty ?? row.Qty;

  const allowed = new Set([
    "sale_date",
    "product_name",
    "amount",
    "quantity",
    "region",
    "additional_data",
    "user_id",
  ]);

  const baseAdditionalData: Record<string, unknown> =
    row.additional_data && typeof row.additional_data === "object" && !Array.isArray(row.additional_data)
      ? { ...(row.additional_data as Record<string, unknown>) }
      : {};

  const normalized: SalesRow = {
    sale_date: normalizeSaleDate(row.sale_date),
    product_name: row.product_name ? String(row.product_name) : "Unknown",
    amount: parseNumericValue(row.amount, 0),
    quantity: parseOptionalNumericValue(row.quantity),
    region: row.region ? String(row.region) : "Unknown",
    additional_data: baseAdditionalData,
    user_id: userId,
  };

  for (const key of Object.keys(row)) {
    if (!allowed.has(key)) {
      (normalized.additional_data as Record<string, unknown>)[key] = row[key];
    }
  }

  if (normalized.additional_data && Object.keys(normalized.additional_data).length === 0) {
    normalized.additional_data = null;
  }

  if (!Number.isFinite(normalized.amount)) normalized.amount = 0;
  if (normalized.quantity !== null && !Number.isFinite(normalized.quantity)) normalized.quantity = null;

  return normalized;
}

function summarizeDailyRevenue(rows: SalesRow[]): ChartPoint[] {
  const daily = new Map<string, number>();

  for (const row of rows) {
    const date = new Date(row.sale_date);
    if (Number.isNaN(date.getTime())) continue;

    const isoDay = date.toISOString().split("T")[0];
    daily.set(isoDay, (daily.get(isoDay) || 0) + Number(row.amount || 0));
  }

  return Array.from(daily.entries())
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, amount]) => ({
      sale_date: date,
      amount: Math.round(amount),
    }));
}

function getDateRange(rows: SalesRow[]): { start: string | null; end: string | null } {
  if (!rows.length) {
    return { start: null, end: null };
  }

  const validDates = rows
    .map((row) => new Date(row.sale_date))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (!validDates.length) {
    return { start: null, end: null };
  }

  return {
    start: validDates[0].toISOString().split("T")[0],
    end: validDates[validDates.length - 1].toISOString().split("T")[0],
  };
}

function getProductTotals(rows: SalesRow[]): PieDatum[] {
  const bucket = new Map<string, number>();
  const labelMap = new Map<string, string>();

  for (const row of rows) {
    const raw = String(row.product_name || "Unknown").trim() || "Unknown";
    const key = raw.toLowerCase();
    const amount = Number(row.amount || 0);
    if (!Number.isFinite(amount)) continue;

    if (!labelMap.has(key)) {
      labelMap.set(key, raw);
    }
    bucket.set(key, (bucket.get(key) || 0) + amount);
  }

  return Array.from(bucket.entries())
    .map(([key, value]) => ({
      name: labelMap.get(key) || key,
      value: Math.round(value),
    }))
    .sort((a, b) => b.value - a.value);
}

function getPieChartData(productTotals: PieDatum[]): PieDatum[] {
  if (productTotals.length <= 10) return productTotals;

  const top10 = productTotals.slice(0, 10);
  const otherValue = productTotals
    .slice(10)
    .reduce((sum, item) => sum + Number(item.value || 0), 0);

  if (otherValue <= 0) return top10;
  return [...top10, { name: "All Others", value: Math.round(otherValue) }];
}

function buildUploadSummary(rows: SalesRow[], productTotals: PieDatum[], dateRangeOverride?: { start: string | null; end: string | null }) {
  return {
    totalRowsProcessed: rows.length,
    dateRange: dateRangeOverride || getDateRange(rows),
    top10Products: productTotals.slice(0, 10),
  };
}

function updateDateRangeTracker(dateRange: { start: string | null; end: string | null }, saleDate: string) {
  const parsed = new Date(saleDate);
  if (Number.isNaN(parsed.getTime())) return;

  const isoDate = parsed.toISOString().split("T")[0];
  if (!dateRange.start || isoDate < dateRange.start) dateRange.start = isoDate;
  if (!dateRange.end || isoDate > dateRange.end) dateRange.end = isoDate;
}

async function verifyUserFromToken(token: string): Promise<{ id: string } | null> {
  const { data, error } = await publicClient.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return { id: data.user.id };
}

async function upsertBatch(rows: SalesRow[]) {
  let { error } = await admin.from("sales").upsert(rows as unknown[], { onConflict: "id" });

  if (error) {
    const safeBatch = rows.map((row) => ({
      sale_date: row.sale_date,
      product_name: row.product_name,
      amount: row.amount,
      quantity: row.quantity,
      region: row.region,
      additional_data: row.additional_data,
      user_id: row.user_id,
    }));

    const retry = await admin.from("sales").upsert(safeBatch as unknown[], { onConflict: "id" });
    error = retry.error;
  }

  if (error) {
    throw new Error(error.message || "Batch upsert failed");
  }
}

async function upsertInBatches(rows: SalesRow[]) {
  let inserted = 0;
  const totalBatches = Math.ceil(rows.length / UPSERT_BATCH_SIZE);

  for (let i = 0; i < rows.length; i += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(i, i + UPSERT_BATCH_SIZE);
    await upsertBatch(batch);
    inserted += batch.length;
  }

  return { inserted, totalBatches };
}

function detectUploadFormat(file: File): UploadFormat {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const mimeType = (file.type || "").toLowerCase();

  if (extension === "json" || mimeType.includes("application/json") || mimeType.includes("text/json")) {
    return "json";
  }

  if (extension === "csv" || mimeType.includes("text/csv") || mimeType.includes("application/csv")) {
    return "csv";
  }

  if (["xlsx", "xls", "ods"].includes(extension)) {
    return "spreadsheet";
  }

  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("officedocument") || mimeType.includes("opendocument")) {
    return "spreadsheet";
  }

  return "unsupported";
}

function isPayloadTooLargeError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as Record<string, unknown>;
  const message = String(err.message || "").toLowerCase();
  const status = Number(err.status || err.statusCode || 0);
  return (
    status === 413 ||
    message.includes("413") ||
    message.includes("payload too large") ||
    message.includes("request entity too large") ||
    message.includes("body exceeded") ||
    message.includes("request body exceeded") ||
    message.includes("content length")
  );
}

async function parseSpreadsheetRows(file: File): Promise<Record<string, unknown>[]> {
  const fileBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(fileBuffer), { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Spreadsheet has no readable sheet");
  }

  const firstSheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: "",
  });
}

function extractJsonRows(parsed: unknown): Record<string, unknown>[] {
  let rows: unknown = parsed;

  if (!Array.isArray(rows) && rows && typeof rows === "object") {
    const wrapped = rows as Record<string, unknown>;
    if (Array.isArray(wrapped.rows)) rows = wrapped.rows;
    else if (Array.isArray(wrapped.data)) rows = wrapped.data;
    else if (Array.isArray(wrapped.batch)) rows = wrapped.batch;
  }

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.filter((row) => row && typeof row === "object") as Record<string, unknown>[];
}

async function parseJsonRows(file: File): Promise<Record<string, unknown>[]> {
  const raw = await file.text();
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON file");
  }

  const rows = extractJsonRows(parsed);
  if (!rows.length) {
    throw new Error("JSON file must contain an array of object rows");
  }

  return rows;
}

async function streamCsvFileAndUpsert(file: File, userId: string, mappings: ColumnMapping[] = []) {
  const queue: SalesRow[] = [];
  const dailySummary = new Map<string, number>();
  const productTotalsMap = new Map<string, number>();
  const productLabelMap = new Map<string, string>();
  const dateRange = { start: null as string | null, end: null as string | null };

  let processed = 0;
  let inserted = 0;
  let totalBatches = 0;

  const flushQueue = async () => {
    if (!queue.length) return;
    const batch = queue.splice(0, queue.length);
    await upsertBatch(batch);
    inserted += batch.length;
    totalBatches += 1;
  };

  await new Promise<void>((resolve, reject) => {
    const nodeStream = Readable.fromWeb(file.stream() as unknown as NodeReadableStream<Uint8Array>);
    const parser = Papa.parse(Papa.NODE_STREAM_INPUT, {
      header: true,
      skipEmptyLines: true,
    }) as NodeJS.ReadWriteStream;

    let chain = Promise.resolve();

    parser.on("data", (row: Record<string, unknown>) => {
      parser.pause();
      chain = chain
        .then(async () => {
          const normalized = normalizeRow(row, userId, mappings);
          processed += 1;
          queue.push(normalized);

          const day = normalized.sale_date;
          dailySummary.set(day, (dailySummary.get(day) || 0) + Number(normalized.amount || 0));

          const productKey = normalized.product_name.trim().toLowerCase() || "unknown";
          if (!productLabelMap.has(productKey)) productLabelMap.set(productKey, normalized.product_name || "Unknown");
          productTotalsMap.set(productKey, (productTotalsMap.get(productKey) || 0) + Number(normalized.amount || 0));

          updateDateRangeTracker(dateRange, normalized.sale_date);

          if (queue.length >= UPSERT_BATCH_SIZE) {
            await flushQueue();
          }
        })
        .then(() => {
          parser.resume();
        })
        .catch((error) => reject(error));
    });

    parser.on("end", () => {
      chain
        .then(async () => {
          await flushQueue();
          resolve();
        })
        .catch(reject);
    });

    parser.on("error", reject);
    nodeStream.pipe(parser);
  });

  const lineChartData = Array.from(dailySummary.entries())
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([sale_date, amount]) => ({ sale_date, amount: Math.round(amount) }));

  const pieChartTotals = Array.from(productTotalsMap.entries())
    .map(([key, value]) => ({
      name: productLabelMap.get(key) || key,
      value: Math.round(value),
    }))
    .sort((a, b) => b.value - a.value);

  const pieChartData = getPieChartData(pieChartTotals);

  return {
    inserted,
    processed,
    totalBatches,
    lineChartData,
    pieChartData,
    pieChartTotals,
    summary: {
      totalRowsProcessed: processed,
      dateRange,
      top10Products: pieChartTotals.slice(0, 10),
    },
  };
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Missing Authorization token" }, { status: 401 });
    }

    const user = await verifyUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      let formData: FormData;
      try {
        formData = await req.formData();
      } catch (error) {
        if (isPayloadTooLargeError(error)) {
          return NextResponse.json(
            { error: "File is too large. Please limit uploads to 50MB." },
            { status: 413 }
          );
        }
        throw error;
      }
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Upload file is required (form-data key: file)" }, { status: 400 });
      }

      const rawMappings = formData.get("mappings");
      let mappings: ColumnMapping[] = [];
      if (typeof rawMappings === "string" && rawMappings.trim()) {
        try {
          mappings = parseMappings(JSON.parse(rawMappings));
        } catch {
          mappings = [];
        }
      }
      const format = detectUploadFormat(file);

      if (format === "unsupported") {
        return NextResponse.json(
          { error: "Unsupported file format. Accepted formats: CSV, Excel (XLSX/XLS/ODS), JSON." },
          { status: 400 }
        );
      }

      if (format === "csv") {
        const streamResult = await streamCsvFileAndUpsert(file, user.id, mappings);
        return NextResponse.json({
          success: true,
          ...streamResult,
          parsedRows: streamResult.processed,
          chartSummary: streamResult.lineChartData,
          granularity: "daily",
        });
      }

      const parsedRows =
        format === "json" ? await parseJsonRows(file) : await parseSpreadsheetRows(file);

      if (!parsedRows.length) {
        return NextResponse.json({ error: "No rows found in uploaded file" }, { status: 400 });
      }

      const normalized = parsedRows
        .filter((row) => row && typeof row === "object")
        .map((row) => normalizeRow(row, user.id, mappings));

      if (!normalized.length) {
        return NextResponse.json({ error: "No valid rows to upsert" }, { status: 400 });
      }

      const { inserted, totalBatches } = await upsertInBatches(normalized);
      const lineChartData = summarizeDailyRevenue(normalized);
      const pieChartTotals = getProductTotals(normalized);
      const pieChartData = getPieChartData(pieChartTotals);
      const uploadSummary = buildUploadSummary(normalized, pieChartTotals);

      return NextResponse.json({
        success: true,
        inserted,
        processed: normalized.length,
        totalBatches,
        lineChartData,
        pieChartData,
        pieChartTotals,
        chartSummary: lineChartData,
        granularity: "daily",
        summary: uploadSummary,
      });
    }

    let body: Record<string, unknown> | null = null;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch (error) {
      if (isPayloadTooLargeError(error)) {
        return NextResponse.json(
          { error: "File is too large. Please limit uploads to 50MB." },
          { status: 413 }
        );
      }
      body = null;
    }
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const mappings = parseMappings((body as Record<string, unknown>).mappings);
    const bodyRows = (body as Record<string, unknown>).rows;
    const bodyBatch = (body as Record<string, unknown>).batch;

    const rawRows: Record<string, unknown>[] = Array.isArray(bodyRows)
      ? (bodyRows as Record<string, unknown>[])
      : Array.isArray(bodyBatch)
        ? (bodyBatch as Record<string, unknown>[])
        : [];

    if (!rawRows.length) {
      return NextResponse.json({ error: "No rows to upsert" }, { status: 400 });
    }

    const normalized = rawRows
      .filter((row) => row && typeof row === "object")
      .map((row) => normalizeRow(row, user.id, mappings));

    if (!normalized.length) {
      return NextResponse.json({ error: "No valid rows to upsert" }, { status: 400 });
    }

    const { inserted, totalBatches } = await upsertInBatches(normalized);
    const lineChartData = summarizeDailyRevenue(normalized);
    const pieChartTotals = getProductTotals(normalized);
    const pieChartData = getPieChartData(pieChartTotals);
    const uploadSummary = buildUploadSummary(normalized, pieChartTotals);

    return NextResponse.json({
      success: true,
      inserted,
      processed: normalized.length,
      totalBatches,
      lineChartData,
      pieChartData,
      pieChartTotals,
      chartSummary: lineChartData,
      granularity: "daily",
      summary: uploadSummary,
    });
  } catch (err: unknown) {
    if (isPayloadTooLargeError(err)) {
      return NextResponse.json(
        { error: "File is too large. Please limit uploads to 50MB." },
        { status: 413 }
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
