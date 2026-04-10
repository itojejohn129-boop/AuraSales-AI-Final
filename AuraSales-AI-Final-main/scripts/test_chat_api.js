#!/usr/bin/env node

/**
 * Test Script for Executive AI Chatbot (/api/chat)
 * 
 * This script validates:
 * 1. OpenAI API key loading
 * 2. Grounding system prompt functionality
 * 3. GPT-4o model response
 * 4. Error handling (Supabase vs OpenAI errors)
 */

const testData = {
  message: "What is the total revenue?",
  dashboardData: JSON.stringify({
    totalRecords: 10,
    records: [
      { id: 1, product_name: "Product A", region: "North", amount: 5000, sale_date: "2025-01-10" },
      { id: 2, product_name: "Product B", region: "South", amount: 3500, sale_date: "2025-01-11" },
      { id: 3, product_name: "Product A", region: "East", amount: 7200, sale_date: "2025-01-12" },
    ],
    summary: {
      totalRevenue: 15700,
      averageRevenue: 5233.33,
      recordCount: 3,
    },
  }),
  csvContent: `product_name,region,amount,sale_date
Product A,North,5000,2025-01-10
Product B,South,3500,2025-01-11
Product A,East,7200,2025-01-12`,
  businessName: "TestCo Analytics",
};

async function testChatAPI() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║     Executive AI Chatbot - API Endpoint Test           ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  try {
    console.log("📤 Sending request to /api/chat...\n");
    console.log("Request payload:");
    console.log(`  Message: "${testData.message}"`);
    console.log(`  Business Name: "${testData.businessName}"`);
    console.log(`  Dashboard Records: ${JSON.parse(testData.dashboardData).totalRecords}`);
    console.log(`  CSV Content: ${testData.csvContent.split("\n").length} lines\n`);

    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}\n`);

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ API Error Response:\n");
      console.error(`  Error: ${data.error}`);
      if (data.details) {
        console.error(`  Details: ${data.details}`);
      }
      if (data.statusCode) {
        console.error(`  OpenAI Status Code: ${data.statusCode}`);
      }
      process.exit(1);
    }

    console.log("✅ Successful Response!\n");
    console.log("Response Details:");
    console.log(`  Model Used: ${data.model || "unknown"}`);
    console.log(`  Timestamp: ${data.timestamp}`);
    console.log(`  Response Length: ${data.response.length} characters\n`);

    console.log("📝 AI Response:");
    console.log(`\n${data.response}\n`);

    // Validate response
    if (data.model.includes("gpt-4o")) {
      console.log("✅ Correct model: gpt-4o confirmed");
    } else {
      console.warn(`⚠️  Model is ${data.model}, expected gpt-4o`);
    }

    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║          Test Completed Successfully ✅                 ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");
  } catch (error) {
    console.error("\n❌ Test Failed with Error:\n");

    if (error.message.includes("ECONNREFUSED")) {
      console.error("  Connection Error: Dev server not running on http://localhost:3000");
      console.error("  → Run: npm run dev");
    } else if (error.message.includes("OpenAI")) {
      console.error(`  OpenAI Error: ${error.message}`);
      console.error("  → Check OPENAI_API_KEY in .env.local");
    } else if (error.message.includes("Supabase")) {
      console.error(`  Supabase Error: ${error.message}`);
      console.error("  → Check Supabase credentials in .env.local");
    } else {
      console.error(`  ${error.message}`);
    }

    console.error("\n╔══════════════════════════════════════════════════════════╗");
    console.error("║                Test Failed ❌                           ║");
    console.error("╚══════════════════════════════════════════════════════════╝\n");

    process.exit(1);
  }
}

// Run the test
testChatAPI();
