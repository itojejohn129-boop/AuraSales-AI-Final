/**
 * Validation schemas for AuraSales data
 */

import { z } from "zod";

/**
 * Sales Record Schema
 * Aligns with Supabase sales table schema
 */
export const SalesRecordSchema = z.object({
  sale_date: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    "Invalid date format"
  ),
  product_name: z.string().min(1, "Product name required"),
  amount: z.number().positive("Amount must be positive"),
  quantity: z.number().int().nullish(),
  region: z.string().min(1, "Region required"),
  additional_data: z.record(z.string(), z.any()).nullish(),
  user_id: z.string().uuid().optional(),
});

export type SalesRecord = z.infer<typeof SalesRecordSchema>;

/**
 * CSV Upload Schema
 * Validates the entire dataset
 */
export const SalesDatasetSchema = z.object({
  records: z.array(SalesRecordSchema).min(1, "At least one record required"),
  uploadedAt: z.string().datetime().optional(),
  fileName: z.string().optional(),
});

export type SalesDataset = z.infer<typeof SalesDatasetSchema>;

/**
 * Forecast Request Schema
 */
export const ForecastRequestSchema = z.object({
  method: z.enum(["linear", "exponential"]),
  periods: z.number().int().min(1).max(12),
  alpha: z.number().min(0).max(1).optional(),
});

export type ForecastRequest = z.infer<typeof ForecastRequestSchema>;

/**
 * Parse and validate CSV data
 * Converts raw parsed data to typed records
 */
export function validateSalesData(rawData: Record<string, any>[]): {
  valid: SalesRecord[];
  errors: Array<{ row: number; error: string }>;
} {
  if (!Array.isArray(rawData)) {
    return { valid: [], errors: [{ row: 0, error: "Data is not an array" }] };
  }

  const valid: SalesRecord[] = [];
  const errors: Array<{ row: number; error: string }> = [];

  rawData.forEach((row, index) => {
    try {
      const normalized = sanitizeRecordKeys(row);
      
      const record = SalesRecordSchema.parse({
        sale_date: normalized.sale_date,
        product_name: normalized.product_name,
        amount: normalized.amount,
        quantity: normalized.quantity ? parseInt(String(normalized.quantity)) : null,
        region: normalized.region,
        additional_data: normalized.additional_data || null,
      });

      valid.push(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        errors.push({
          row: index + 1,
          error: err.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "),
        });
      }
    }
  });

  return { valid, errors };
}

/**
 * Sanity Check: Normalize incoming CSV keys to match Supabase schema
 * Maps common variations to the correct field names
 */
export function sanitizeRecordKeys(row: Record<string, any>): Record<string, any> {
  if (!row || typeof row !== "object") {
    return {
      sale_date: new Date().toISOString(),
      product_name: "",
      amount: 0,
      quantity: null,
      region: "",
      additional_data: null,
    };
  }

  const normalized: Record<string, any> = {};
  const additionalData: Record<string, any> = {};

  // Map sale_date (looks for: date, Date, sale_date, sale date, Sale Date)
  normalized.sale_date = row.sale_date || row.Sale_Date || row.date || row.Date || new Date().toISOString();

  // Map product_name (looks for: product, Product, product_name, item, Item)
  normalized.product_name = row.product_name || row.Product_Name || row.product || row.Product || row.item || row.Item || "";

  // Map amount (looks for: amount, Amount, total, Total, price, Price, revenue, Revenue)
  normalized.amount = parseFloat(
    String(row.amount || row.Amount || row.total || row.Total || row.price || row.Price || row.revenue || row.Revenue || "0")
      .replace(/[$€¥£₦,\s]/g, "")
  ) || 0;

  // Map quantity (looks for: quantity, Quantity, qty, Qty, units, Units)
  normalized.quantity = row.quantity || row.Quantity || row.qty || row.Qty || row.units || row.Units || null;

  // Map region (looks for: region, Region, location, Location, territory, Territory)
  normalized.region = row.region || row.Region || row.location || row.Location || row.territory || row.Territory || "";

  // Map feedback/customer review (looks for: feedback, Feedback, customer_review, Customer Review, comments, Comments, remarks, Remarks)
  const feedback = row.feedback || 
    row.Feedback || 
    row.customer_review || 
    row.Customer_Review || 
    row.CustomerReview ||
    row.comments || 
    row.Comments || 
    row.remarks ||
    row.Remarks ||
    row.review ||
    row.Review || 
    null;

  if (feedback) {
    additionalData.feedback = feedback;
  }

  // Collect unmapped fields into additional_data
  const mappedKeys = new Set([
    "sale_date", "Sale_Date", "date", "Date", 
    "product_name", "Product_Name", "product", "Product", "item", "Item",
    "amount", "Amount", "total", "Total", "price", "Price", "revenue", "Revenue",
    "quantity", "Quantity", "qty", "Qty", "units", "Units",
    "region", "Region", "location", "Location", "territory", "Territory",
    "feedback", "Feedback", "customer_review", "Customer_Review", "CustomerReview",
    "comments", "Comments", "remarks", "Remarks", "review", "Review"
  ]);

  Object.entries(row).forEach(([key, value]) => {
    if (!mappedKeys.has(key) && !additionalData.hasOwnProperty(key)) {
      additionalData[key] = value;
    }
  });

  normalized.additional_data = Object.keys(additionalData).length > 0 ? additionalData : null;

  return normalized;
}

/**
 * Map CSV column headers to Supabase schema fields
 * Used by CSV mapper to show correct field mappings
 */
export const CSV_FIELD_MAPPINGS: Record<string, string> = {
  "sale_date": "Date of sale",
  "product_name": "Product name",
  "amount": "Revenue/Price",
  "quantity": "Units sold",
  "region": "Location/Region",
  "additional_data": "Other fields",
};
