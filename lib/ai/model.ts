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
  const model = process.env.AI_MODEL || "claude-sonnet-4-20250514";

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

/**
 * Gets the LangChain embedding model for generating vector embeddings.
 * Defaults to text-embedding-3-small.
 * 
 * @returns An instance of OpenAIEmbeddings.
 * @throws Error if OPENAI_API_KEY environment variable is not set.
 */
export function getEmbeddingModel(): OpenAIEmbeddings {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set for embeddings");
  }
  return new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
    openAIApiKey: apiKey,
  });
}
