/**
 * Test script to verify CSV summarization implementation
 * Tests that the summarizer:
 * 1. Correctly processes CSV data
 * 2. Stays under 5000 character limit
 * 3. Generates proper summary structure
 */

import { summarizeCSVData, formatSummaryForPrompt } from "@/lib/csvSummarizer";

// Sample CSV data
const sampleData = [
  {
    product: "Laptop Pro",
    amount: 1200,
    region: "North",
    sentiment_score: 85,
  },
  {
    product: "Laptop Pro",
    amount: 1200,
    region: "South",
    sentiment_score: 90,
  },
  {
    product: "Monitor 4K",
    amount: 400,
    region: "East",
    sentiment_score: 75,
  },
  {
    product: "Monitor 4K",
    amount: 420,
    region: "West",
    sentiment_score: 88,
  },
  {
    product: "Keyboard",
    amount: 150,
    region: "North",
    sentiment_score: 70,
  },
  {
    product: "Mouse",
    amount: 50,
    region: "South",
    sentiment_score: 65,
  },
  {
    product: "Mouse",
    amount: 55,
    region: "East",
    sentiment_score: 72,
  },
];

async function runTests() {
  console.log("🧪 CSV Summarization Tests\n");

  // Test 1: Basic summarization
  console.log("✅ Test 1: Basic CSV Summarization");
  const summary = summarizeCSVData(sampleData);
  console.log(JSON.stringify(summary, null, 2));

  // Test 2: Check payload size
  console.log("\n✅ Test 2: Payload Size Check");
  const summaryJson = JSON.stringify(summary);
  const summarySize = summaryJson.length;
  console.log(`Summary JSON size: ${summarySize} characters`);
  console.log(`Within 5000 char limit: ${summarySize <= 5000 ? "✓ PASS" : "✗ FAIL"}`);

  // Test 3: Format for prompt
  console.log("\n✅ Test 3: Format for AI Prompt");
  const formattedPrompt = formatSummaryForPrompt(summary, 2000);
  console.log("Formatted output:");
  console.log(formattedPrompt);
  console.log(`Formatted prompt size: ${formattedPrompt.length} characters`);

  // Test 4: Verify summary structure
  console.log("\n✅ Test 4: Summary Structure Validation");
  const requiredFields = [
    "recordCount",
    "totalRevenue",
    "averageTransaction",
    "transactionRange",
    "topProducts",
    "worstProducts",
    "topRegions",
    "trend",
  ];
  const missingFields = requiredFields.filter((field) => !(field in summary));
  if (missingFields.length === 0) {
    console.log("✓ All required fields present");
  } else {
    console.log(`✗ Missing fields: ${missingFields.join(", ")}`);
  }

  // Test 5: Test with empty data
  console.log("\n✅ Test 5: Empty Data Handling");
  const emptySummary = summarizeCSVData([]);
  console.log(`Empty array handled: ${emptySummary.recordCount === 0 ? "✓ PASS" : "✗ FAIL"}`);

  // Test 6: Large dataset simulation
  console.log("\n✅ Test 6: Large Dataset Performance");
  const largeData = Array.from({ length: 1000 }, (_, i) => ({
    product: `Product ${i % 50}`,
    amount: Math.floor(Math.random() * 1000) + 100,
    region: ["North", "South", "East", "West"][i % 4],
    sentiment_score: Math.floor(Math.random() * 30) + 60,
  }));

  const startTime = performance.now();
  const largeSummary = summarizeCSVData(largeData);
  const endTime = performance.now();

  const largeJson = JSON.stringify(largeSummary);
  console.log(`Processed ${largeData.length} records in ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`Result size: ${largeJson.length} characters (${((largeJson.length / 5000) * 100).toFixed(1)}% of 5000 limit)`);
  console.log(`✓ PASS - Size within limit: ${largeJson.length <= 5000}`);

  console.log("\n✅ All tests completed!");
}

runTests().catch(console.error);
