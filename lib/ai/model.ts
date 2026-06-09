import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

/**
 * Gets the configured LangChain chat model based on environment variables.
 * 
 * @returns An instance of ChatAnthropic or ChatOpenAI.
 * @throws Error if an invalid AI provider is specified or missing required API keys.
 */
export function getModel() {
  const provider = process.env.AI_PROVIDER || "anthropic";
  const model = process.env.AI_MODEL || "claude-sonnet-4-5-20250929";

  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }
    return new ChatAnthropic({
      model,
      apiKey,
    });
  } else if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    return new ChatOpenAI({
      modelName: model,
      openAIApiKey: apiKey,
    });
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

class MockEmbeddings {
  async embedQuery(text: string): Promise<number[]> {
    // Generate a deterministic 1536-dimensional vector based on the text hash
    const vector = new Array(1536).fill(0);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    // Set a few dimensions to reflect the hash value deterministically
    for (let i = 0; i < 10; i++) {
      vector[i] = Math.sin(hash + i);
    }
    return vector;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(t => this.embedQuery(t)));
  }
}

/**
 * Gets the LangChain embedding model for generating vector embeddings.
 * Defaults to text-embedding-3-small or falls back to MockEmbeddings if key is missing.
 * 
 * @returns An instance of OpenAIEmbeddings or MockEmbeddings.
 */
export function getEmbeddingModel(): OpenAIEmbeddings {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey.includes("YOUR_VALUE_HERE")) {
    console.warn("[Embedding Model] OPENAI_API_KEY not configured. Falling back to deterministic MockEmbeddings client.");
    return new MockEmbeddings() as any;
  }
  return new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
    openAIApiKey: apiKey,
  });
}
