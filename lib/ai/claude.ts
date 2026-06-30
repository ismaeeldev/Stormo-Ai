import { getModel } from './model';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

/**
 * Calls Claude with a system prompt and a user message.
 * Returns the raw text response.
 *
 * Uses the existing getModel() from model.ts which reads ANTHROPIC_API_KEY,
 * AI_PROVIDER, and AI_MODEL from environment variables.
 *
 * Throws if ANTHROPIC_API_KEY is missing (handled inside getModel).
 */
export async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const model = getModel();
  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(userMessage),
  ]);
  return response.content as string;
}

/**
 * Calls Claude and parses the response as JSON.
 * Returns null if parsing fails — callers must handle this gracefully.
 */
export async function callClaudeJSON<T = any>(systemPrompt: string, userMessage: string): Promise<T | null> {
  try {
    const text = await callClaude(systemPrompt, userMessage);
    const cleaned = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}
