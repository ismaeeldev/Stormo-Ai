import { sql, eq } from 'drizzle-orm';
import { db } from '../db';
import { actions } from '../db/schema';
import { assembleActionContext } from './context-assembler';
import { getModel, getEmbeddingModel } from './model';
import { triggerCompressionIfNeeded } from '../jobs/trigger-compression';
import { SIMILARITY_THRESHOLD } from '@/config/constants';

interface ActionOutput {
  title: string;
  description: string;
  content: string;
  channel: string;
  action_type: string;
}

/**
 * Generates the daily marketing action for a user using LLM and pgvector
 * similarity search for repetition prevention.
 *
 * @param userId - The ID of the user to generate an action for.
 */
export async function generateDailyAction(userId: string) {
  // 1. Assemble the context
  const context = await assembleActionContext(userId);

  let avoidTitleInstruction = '';
  let actionData: ActionOutput | null = null;
  let attempts = 0;

  // We attempt up to 2 times to generate a unique action
  while (attempts < 2) {
    attempts++;

    // 2. Build the LLM prompt
    const prompt = `You are a growth marketing copilot for Stormo.io.
Your task is to generate ONE highly specific, actionable, and optimal daily marketing action for this store.
Ensure it doesn't repeat past concepts, angles, or channels in a repetitive way.

=== CONTEXT ===
${context.systemContext}

${avoidTitleInstruction}

=== INSTRUCTIONS ===
Generate the daily action in JSON format. Output ONLY the raw JSON block. Do not write any other conversational text or markdown other than the JSON block.
JSON structure:
{
  "title": "Short action title",
  "description": "Full action description with step-by-step instructions",
  "content": "Pre-written content ready to paste/use (e.g. outreach templates, social post copy, email layouts)",
  "channel": "reddit|instagram|email|pinterest|seo|etc",
  "action_type": "community|content|outreach|seo|paid_ads"
}`;

    const model = getModel();
    const response = await model.invoke(prompt);
    const text = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    try {
      const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      actionData = JSON.parse(cleanedJson) as ActionOutput;
    } catch (err) {
      console.error('[Action Generator] Failed to parse generated action JSON. Response was:', text);
      throw new Error('AI generated invalid JSON action format');
    }

    // 3. Generate embedding for the action
    const embeddingText = `${actionData.title} ${actionData.description}`;
    const embeddingModel = getEmbeddingModel();
    const newEmbedding = await embeddingModel.embedQuery(embeddingText);
    const serializedEmbedding = JSON.stringify(newEmbedding);

    // 4. Check cosine similarity against past actions using pgvector distance operator <=>
    // Cosine distance = 1 - cosine_similarity. Threshold 0.85 similarity => distance <= 0.15.
    const distanceThreshold = 1 - SIMILARITY_THRESHOLD;
    
    const duplicateQuery = sql`
      SELECT id, title 
      FROM actions 
      WHERE user_id = ${userId}::uuid 
        AND embedding <=> ${serializedEmbedding}::vector <= ${distanceThreshold}
      LIMIT 1
    `;

    const duplicateResult = await db.execute(duplicateQuery);
    const duplicates = duplicateResult.rows || [];

    if (duplicates.length === 0 || attempts >= 2) {
      // Action is unique enough, or we have hit our maximum retry attempt, proceed to save
      const todayStr = new Date().toISOString().split('T')[0];

      // Save to database
      const [savedAction] = await db
        .insert(actions)
        .values({
          userId,
          title: actionData.title,
          description: actionData.description,
          content: actionData.content,
          channel: actionData.channel,
          actionType: actionData.action_type,
          status: 'pending',
          scheduledFor: todayStr,
          embedding: newEmbedding,
        })
        .returning();

      // Trigger action compression job if needed
      await triggerCompressionIfNeeded(userId).catch((err) => {
        console.error('[Action Generator] Failed to trigger action compression job:', err);
      });

      return savedAction;
    } else {
      // Too similar to an existing action, retry generation with instruction to avoid the duplicate title
      const duplicateTitle = duplicates[0].title;
      console.warn(`[Action Generator] Duplicate detected! Action is too similar to past action: "${duplicateTitle}". Retrying...`);
      avoidTitleInstruction = `CRITICAL: The generated action was too similar to: "${duplicateTitle}". You MUST generate a completely different action with a different angle, strategy, or focus. Do not generate anything like: "${duplicateTitle}".`;
    }
  }

  throw new Error('Failed to generate a unique daily action after maximum attempts.');
}
