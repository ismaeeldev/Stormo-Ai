import { SystemMessage, HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { getModel } from './model';
import { getStoreProfile, getUserById } from '../db/queries';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function createAskStormoChain(userId: string, messageHistory: Message[]) {
  const [profile, user] = await Promise.all([
    getStoreProfile(userId),
    getUserById(userId),
  ]);

  const name = user?.name || 'Founder';
  const productType = profile?.productType || 'e-commerce';
  const storeUrl = profile?.storeUrl || 'your store';
  const targetCustomer = profile?.targetCustomer || 'general audience';
  const weeklyTimeAvailable = profile?.weeklyTimeAvailable || 'a few';
  const nicheSummary = profile?.nicheSummary || 'e-commerce growth';

  const systemPrompt = `You are Stormo, a friendly expert marketing advisor for ${name}'s ${productType} store at ${storeUrl}. Target customer: ${targetCustomer}. Available time: ${weeklyTimeAvailable} hours/week. Store niche: ${nicheSummary}. Always give specific, actionable advice tailored to their exact store and situation. Be encouraging, concise, and practical.`;

  const model = getModel();

  // Convert custom messages to LangChain message classes
  const mappedHistory: BaseMessage[] = messageHistory.map((msg) => {
    if (msg.role === 'user') {
      return new HumanMessage(msg.content);
    } else {
      return new AIMessage(msg.content);
    }
  });

  const messages = [new SystemMessage(systemPrompt), ...mappedHistory];

  return {
    model,
    messages,
  };
}
