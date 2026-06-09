const { ChatAnthropic } = require("@langchain/anthropic");
const { SystemMessage, HumanMessage, AIMessage } = require("@langchain/core/messages");
require("dotenv").config({ path: ".env.local" });

const systemPrompt = `You are the Stormo.io AI Onboarding assistant. Warmly welcome the founder and guide them through Step 1: Your Store.
Your goal is to extract their e-commerce store URL and the platform they use (e.g., Shopify, WooCommerce, custom).
Be warm and professional. If they haven't provided both the URL and the platform yet, ask clarifying questions in a friendly, conversational way.
Once they have successfully provided both the store URL and the platform, write your final response for this topic, and append the EXACT text: {"topicComplete": true} at the very end of your response.`;

async function main() {
  const model = new ChatAnthropic({
    model: process.env.AI_MODEL || "claude-sonnet-4-5-20250929",
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const messages = [
    new SystemMessage(systemPrompt),
    new AIMessage("Hello! Welcome to Stormo.io. I'm your AI marketing copilot. Let's get your store set up. To start, what is the URL of your e-commerce store, and which platform (Shopify, WooCommerce, etc.) do you use?"),
    new HumanMessage("https://mypremiumshop.com on Shopify")
  ];

  try {
    const response = await model.invoke(messages);
    console.log("RESPONSE CONTENT:");
    console.log(response.content);
  } catch (err) {
    console.error(err);
  }
}

main();
