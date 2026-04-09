// cspell:disable-file
import assert from "node:assert/strict";
import { buildDashboardSalesRefocusMessage, isDashboardSalesIntent } from "../src/lib/chatIntent.js";

const cases = [
  ["narrate my dashboard", true],
  ["summarize my dashboard", true],
  ["how is my business doing", true],
  ["show growth trends", true],
  ["how are my sales performing", true],
  ["give me insights from my metrics", true],
  ["how is the growth of my business", true],
  ["please narrate my dashboard", true],
  ["narrate it", true],
  ["summarize it", true],
  ["how is it doing", true],
  ["hi", true],
  ["good morning", true],
  ["bonjour", true, "French"],
  ["résume mon tableau de bord", true, "French"],
  ["hola", true, "Spanish"],
  ["muéstrame mi panel de control", true, "Spanish"],
  ["what strategy can i employ regarding the result from dashboard to boost my customers and get more profit", true],
  ["tell me a joke", false],
  ["racontes une blague", false, "French"],
  ["what is the weather today", false],
  ["who won the game last night", false],
];

for (const [input, expected, language] of cases) {
  assert.equal(
    isDashboardSalesIntent(input, language),
    expected,
    `Unexpected intent result for: ${input}${language ? ` (${language})` : ""}`
  );
}

assert.equal(
  buildDashboardSalesRefocusMessage(),
  "I'm Aura, your business dashboard assistant. I can only help with dashboard and sales-related questions. What would you like to review?",
  "Refocus message mismatch"
);

console.log(`chat intent checks passed: ${cases.length + 1}`);
