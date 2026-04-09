import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Papa from "papaparse";
import { Readable } from "node:stream";
import * as XLSX from "xlsx";
import { normalizeFlexibleDate } from "@/lib/date-normalize";

export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STREAM_BATCH_SIZE = 1000;
const SPREADSHEET_EXTENSIONS = new Set(["xlsx", "xls", "ods"]);

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
  additional_data: Record<string, any> | null;
  user_id: string;
};

type PieDatum = {
  name: string;
  value: number;
};

type ColumnMapping = { csvColumn: string; dataField: string };
type UploadFormat = "csv" | "spreadsheet" | "json" | "unsupported";

function parseMappings(input: unknown): ColumnMapping[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item) => item && typeof item === "object")
    .map((item) => item as Record<string, unknown>)
    .filter((item) => typeof item.csvColumn === "string" && typeof item.dataField === "string")
    .map((item) => ({ csvColumn: String(item.csvColumn), dataField: String(item.dataField) }));
}

function applyMapping(input: Record<string, any>, mappings: ColumnMapping[] = []) {
  if (!Array.isArray(mappings) || mappings.length === 0) return input;
  const mapped: Record<string, any> = { ...input };
  for (const m of mappings) {
    if (!m?.csvColumn || !m?.dataField) continue;
    if (Object.prototype.hasOwnProperty.call(input, m.csvColumn)) {
      mapped[m.dataField] = input[m.csvColumn];
    }
  }
  return mapped;
}

function normalizeDateValue(value: unknown): string {
  const fallback = new Date().toISOString().split("T")[0];
  const normalized = normalizeFlexibleDate(value);
  return normalized || fallback;
}

function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === null || value === undefined || value === "") return fallback;
  const normalized = String(value).replace(/[^0-9.-]/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeRow(
  input: Record<string, any>,
  userId: string,
  mappings: ColumnMapping[] = []
): SalesRow {
  const row = applyMapping({ ...input }, mappings);
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

  const normalized: any = {
    sale_date: normalizeDateValue(row.sale_date),
    product_name: row.product_name ? String(row.product_name) : "Unknown",
    amount: parseNumber(row.amount, 0),
    quantity: row.quantity === undefined || row.quantity === null || row.quantity === ""
      ? null
      : parseNumber(row.quantity, Number.NaN),
    region: row.region ? String(row.region) : "Unknown",
    additional_data:
      row.additional_data && typeof row.additional_data === "object"
        ? { ...row.additional_data }
        : {},
    user_id: userId,
  };

  for (const key of Object.keys(row)) {
    if (!allowed.has(key)) {
      normalized.additional_data[key] = row[key];
    }
  }

  if (Object.keys(normalized.additional_data).length === 0) {
    normalized.additional_data = null;
  }

  if (!isFinite(normalized.amount)) normalized.amount = 0;
  if (normalized.quantity !== null && !isFinite(normalized.quantity)) normalized.quantity = null;
  return normalized as SalesRow;
}

function addDailySummary(daily: Map<string, number>, row: SalesRow) {
  const date = new Date(row.sale_date);
  if (isNaN(date.getTime())) return;
  const dayKey = date.toISOString().split("T")[0];
  daily.set(dayKey, (daily.get(dayKey) || 0) + Number(row.amount || 0));
}

function addProductSummary(
  totals: Map<string, number>,
  labels: Map<string, string>,
  row: SalesRow
) {
  const raw = String(row.product_name || "Unknown").trim() || "Unknown";
  const key = raw.toLowerCase();
  const amount = Number(row.amount || 0);
  if (!Number.isFinite(amount)) return;

  if (!labels.has(key)) {
    labels.set(key, raw);
  }
  totals.set(key, (totals.get(key) || 0) + amount);
}

function summaryToArray(map: Map<string, number>) {
  return Array.from(map.entries())
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([sale_date, amount]) => ({
      sale_date,
      amount: Math.round(amount),
    }));
}

function productSummaryToArray(
  totals: Map<string, number>,
  labels: Map<string, string>
): PieDatum[] {
  return Array.from(totals.entries())
    .map(([key, value]) => ({
      name: labels.get(key) || key,
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

async function verifyUserFromToken(token: string): Promise<{ id: string } | null> {
  const { data, error } = await publicClient.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return { id: data.user.id };
}

async function upsertBatch(rows: SalesRow[]) {
  let { error } = await admin.from("sales").upsert(rows as any[], { onConflict: "id" });
  if (error) {
    const safeRows = rows.map((row) => ({
      sale_date: row.sale_date,
      product_name: row.product_name,
      amount: row.amount,
      quantity: row.quantity,
      region: row.region,
      additional_data: row.additional_data,
      user_id: row.user_id,
    }));
    const retry = await admin.from("sales").upsert(safeRows as any[], { onConflict: "id" });
    error = retry.error;
  }
  if (error) throw new Error(error.message || "Batch upsert failed");
}

function detectUploadFormat(file: File): UploadFormat {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const mimeType = (file.type || "").toLowerCase();

  if (
    extension === "json" ||
    mimeType.includes("application/json") ||
    mimeType.includes("text/json")
  ) {
    return "json";
  }

  if (
    extension === "csv" ||
    mimeType.includes("text/csv") ||
    mimeType.includes("application/csv")
  ) {
    return "csv";
  }

  if (
    SPREADSHEET_EXTENSIONS.has(extension) ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("officedocument") ||
    mimeType.includes("opendocument")
  ) {
    return "spreadsheet";
  }

  return "unsupported";
}

function isPayloadTooLargeError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = String((error as any).message || "").toLowerCase();
  const status = Number((error as any).status || (error as any).statusCode || 0);
  return (
    status === 413 ||
    message.includes("413") ||
    message.includes("payload too large") ||
    message.includes("request entity too large") ||
    message.includes("body exceeded") ||
    message.includes("content length")
  );
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
      return NextResponse.json(
        { error: "Upload file is required (form-data key: file)" },
        { status: 400 }
      );
    }

    const format = detectUploadFormat(file);
    if (format === "unsupported") {
      return NextResponse.json(
        { error: "Unsupported file format. Accepted formats: CSV, Excel (XLSX/XLS/ODS), JSON." },
        { status: 400 }
      );
    }

    let mappings: ColumnMapping[] = [];
    const rawMappings = formData.get("mappings");
    if (typeof rawMappings === "string") {
      try {
        mappings = parseMappings(JSON.parse(rawMappings));
      } catch {
        // ignore invalid mapping payload
      }
    }

    let parsedRows = 0;
    let insertedRows = 0;
    let batchesProcessed = 0;
    const queue: SalesRow[] = [];
    const dailySummary = new Map<string, number>();
    const productTotals = new Map<string, number>();
    const productLabels = new Map<string, string>();

    const flush = async () => {
      if (queue.length === 0) return;
      const batch = queue.splice(0, queue.length);
      await upsertBatch(batch);
      insertedRows += batch.length;
      batchesProcessed += 1;
    };

    const processRow = async (row: Record<string, unknown>) => {
      const normalized = normalizeRow(row, user.id, mappings);
      parsedRows += 1;
      addDailySummary(dailySummary, normalized);
      addProductSummary(productTotals, productLabels, normalized);
      queue.push(normalized);
      if (queue.length >= STREAM_BATCH_SIZE) {
        await flush();
      }
    };

    if (format === "csv") {
      await new Promise<void>((resolve, reject) => {
        const nodeStream = Readable.fromWeb((file as any).stream());
        const parser = Papa.parse(Papa.NODE_STREAM_INPUT, {
          header: true,
          skipEmptyLines: true,
        }) as any;

        let chain = Promise.resolve();

        parser.on("data", (row: Record<string, unknown>) => {
          parser.pause();
          chain = chain
            .then(async () => {
              await processRow(row);
            })
            .then(() => parser.resume())
            .catch((e: Error) => reject(e));
        });

        parser.on("end", () => {
          chain
            .then(async () => {
              await flush();
              resolve();
            })
            .catch(reject);
        });

        parser.on("error", reject);
        nodeStream.pipe(parser);
      });
    } else if (format === "spreadsheet") {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const workbook = XLSX.read(fileBuffer, { type: "buffer", cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        return NextResponse.json({ error: "Spreadsheet has no readable sheet" }, { status: 400 });
      }

      const firstSheet = workbook.Sheets[firstSheetName];
      const parsedSheetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
        defval: "",
        raw: true,
      });

      for (const row of parsedSheetRows) {
        await processRow(row);
      }
      await flush();
    } else {
      const rawJson = await file.text();
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawJson);
      } catch {
        return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
      }

      let rows: unknown = parsedJson;
      if (!Array.isArray(rows) && rows && typeof rows === "object") {
        const wrapped = rows as Record<string, unknown>;
        if (Array.isArray(wrapped.rows)) rows = wrapped.rows;
        else if (Array.isArray(wrapped.data)) rows = wrapped.data;
        else if (Array.isArray(wrapped.batch)) rows = wrapped.batch;
      }

      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { error: "JSON file must contain an array of object rows" },
          { status: 400 }
        );
      }

      for (const row of rows) {
        if (!row || typeof row !== "object") continue;
        await processRow(row as Record<string, unknown>);
      }
      await flush();
    }

    const lineChartData = summaryToArray(dailySummary);
    const pieChartTotals = productSummaryToArray(productTotals, productLabels);
    const pieChartData = getPieChartData(pieChartTotals);

    return NextResponse.json({
      success: true,
      parsedRows,
      insertedRows,
      batchesProcessed,
      batchSize: STREAM_BATCH_SIZE,
      lineChartData,
      pieChartData,
      pieChartTotals,
      // Backward-compatible aliases for existing clients.
      chartSummary: lineChartData,
      productSummary: pieChartData,
      granularity: "daily",
    });
  } catch (err: any) {
    if (isPayloadTooLargeError(err)) {
      return NextResponse.json(
        { error: "File is too large. Please limit uploads to 50MB." },
        { status: 413 }
      );
    }
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
