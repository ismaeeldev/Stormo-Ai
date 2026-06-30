import { getModel } from './model';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  modelOverride?: string,
): Promise<string> {
  const model = modelOverride
    ? new ChatAnthropic({ model: modelOverride, apiKey: process.env.ANTHROPIC_API_KEY! })
    : getModel();
  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(userMessage),
  ]);
  return response.content as string;
}

export async function callClaudeJSON<T = any>(
  systemPrompt: string,
  userMessage: string,
  modelOverride?: string,
): Promise<T | null> {
  try {
    const text = await callClaude(systemPrompt, userMessage, modelOverride);
    const cleaned = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}
