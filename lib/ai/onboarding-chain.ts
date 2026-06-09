import { SystemMessage, HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { getModel } from './model';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const TOPIC_SYSTEM_PROMPTS: Record<number, string> = {
  1: `You are the Stormo.io AI Onboarding assistant. Warmly welcome the founder and guide them through Step 1: Your Store.
Your goal is to extract their e-commerce store URL and the platform they use (e.g., Shopify, WooCommerce, custom).
If they have already provided both the URL and the platform, write a brief friendly confirmation and you MUST append the EXACT text: {"topicComplete": true} at the very end of your response. Do not ask any follow-up questions.`,

  2: `You are the Stormo.io AI Onboarding assistant guiding the founder through Step 2: Products & Pricing.
Your goal is to extract the product types they sell and their average price range.
If they have already provided both the product types and the price range in the chat history, write a brief friendly confirmation and you MUST append the EXACT text: {"topicComplete": true} at the very end of your response. Do not ask any follow-up questions.`,

  3: `You are the Stormo.io AI Onboarding assistant guiding the founder through Step 3: Your Customer.
Your goal is to extract a description of their target or ideal customer (demographics, interests, behaviors).
If they have already provided a target customer description, write a brief friendly confirmation and you MUST append the EXACT text: {"topicComplete": true} at the very end of your response. Do not ask any follow-up questions.`,

  4: `You are the Stormo.io AI Onboarding assistant guiding the founder through Step 4: Your Time.
Your goal is to extract how much time they have available weekly for marketing operations (e.g., 2 hours, 5 hours, 10+ hours).
If they have already stated their weekly time availability, write a brief friendly confirmation and you MUST append the EXACT text: {"topicComplete": true} at the very end of your response. Do not ask any follow-up questions.`,

  5: `You are the Stormo.io AI Onboarding assistant guiding the founder through Step 5: Your Challenges.
Your goal is to extract the biggest challenges they face in scaling their store (e.g., traffic, conversion, retention).
If they have already described their challenges, write a brief friendly confirmation and you MUST append the EXACT text: {"topicComplete": true} at the very end of your response. Do not ask any follow-up questions.`,
};

/**
 * Prepares the message list for the LangChain model call based on topic and history.
 */
export function getOnboardingChain(topicNumber: number, conversationHistory: Message[]) {
  const systemPrompt = TOPIC_SYSTEM_PROMPTS[topicNumber] || TOPIC_SYSTEM_PROMPTS[1];
  const model = getModel();

  // Convert custom messages to LangChain message classes
  const mappedHistory: BaseMessage[] = conversationHistory.map((msg) => {
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
