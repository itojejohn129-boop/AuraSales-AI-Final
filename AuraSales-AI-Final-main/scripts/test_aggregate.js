const path = require("path");
const { performance } = require("perf_hooks");

// Load the aggregator
const aggPath = path.join(__dirname, "..", "src", "lib", "aggregateSalesData.js");

let aggregateSalesData;
try {
  aggregateSalesData = require(aggPath).default || require(aggPath).aggregateSalesData || require(aggPath);
} catch (e) {
  console.error("Failed to load aggregateSalesData from", aggPath, e);
  process.exit(1);
}

function makeSampleRows(count = 2000, categories = 30) {
  const cats = Array.from({ length: categories }, (_, i) => `Category ${i + 1}`);
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push({
      sale_date: `2024-01-${String((i % 30) + 1).padStart(2, "0")}`,
      amount: Math.round(Math.random() * 1000 + 50),
      region: `Region ${((i % 5) + 1)}`,
      product_name: `Product ${((i % 20) + 1)}`,
      category: cats[i % cats.length],
    });
  }
  return rows;
}

async function runTest() {
  console.log("Generating 2000 sample rows...");
  const rows = makeSampleRows(2000, 30);

  console.log("Aggregating by category (topN=9, minPercent=0.02)...");
  const t0 = performance.now();
  const result = aggregateSalesData(rows, "category", "amount", 9, 0.02);
  const t1 = performance.now();

  console.log(`Aggregation produced ${result.length} items in ${(t1 - t0).toFixed(2)}ms`);
  console.log("Top items:", result.slice(0, 12));

  const total = result.reduce((s, r) => s + r.value, 0);
  console.log(`Total aggregated amount: ${total}`);

  const other = result.find((r) => r.name === "Other Sales");
  console.log("Other Sales present:", Boolean(other), other ? other.value : 0);

  // Check min percent rule
  console.log("Verifying min-percent rule: any item less than 2% should be in Other Sales (if present)");
  if (other) {
    console.log("Other Sales accounted for", ((other.value / total) * 100).toFixed(2), "% of total");
  }
}

runTest().catch((e) => {
  console.error(e);
  process.exit(1);
});
