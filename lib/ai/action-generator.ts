import { sql, eq, desc, and, gte, sum } from 'drizzle-orm';
import { db } from '../db';
import { actions, strategyPerformance } from '../db/schema';
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

const WEEKLY_CHANNEL_PREFERENCE: Record<number, string> = {
  1: 'instagram',   // Monday
  2: 'reddit',      // Tuesday
  3: 'email',       // Wednesday
  4: 'seo',         // Thursday
  5: 'influencer',  // Friday
  6: 'optimize',    // Saturday
  0: 'planning',    // Sunday
};

/**
 * Generates the daily marketing action for a user using LLM and pgvector
 * similarity search for repetition prevention.
 *
 * @param userId - The ID of the user to generate an action for.
 * @param scheduledForDate - Optional YYYY-MM-DD date in the user's local timezone.
 *                           Defaults to current UTC date when called on-demand.
 */
export async function generateDailyAction(userId: string, scheduledForDate?: string) {
  const todayStr = scheduledForDate ?? new Date().toISOString().split('T')[0];

  // 1. Assemble the context
  const context = await assembleActionContext(userId);

  // 2. Build channel rotation context from recent actions
  const recentActions = await db
    .select({ channel: actions.channel, actionType: actions.actionType })
    .from(actions)
    .where(eq(actions.userId, userId))
    .orderBy(desc(actions.scheduledFor))
    .limit(7);

  const todayPreference = WEEKLY_CHANNEL_PREFERENCE[new Date().getDay()];

  let rotationContext: string;
  if (recentActions.length > 0) {
    const historyLines = recentActions
      .map((a, i) => `- ${i + 1} day${i === 0 ? '' : 's'} ago: ${a.channel ?? 'unknown'} (${a.actionType ?? 'general'})`)
      .join('\n');
    rotationContext = `Recent channel history (do not repeat the same channel as the last action):\n${historyLines}\n\nToday's preferred channel: ${todayPreference}`;
  } else {
    rotationContext = `Today's preferred channel: ${todayPreference}`;
  }

  // 3. Query strategy_performance — only include if user has enough data
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86_400_000);
  const perfRows = await db
    .select()
    .from(strategyPerformance)
    .where(
      and(
        eq(strategyPerformance.userId, userId),
        gte(strategyPerformance.lastUpdated, sixtyDaysAgo)
      )
    );

  const totalActions = perfRows.reduce((s, r) => s + (r.actionCount ?? 0), 0);
  let performanceContext = '';

  if (totalActions >= 20) {
    const qualified = perfRows.filter((r) => (r.actionCount ?? 0) >= 3);
    if (qualified.length > 0) {
      // Sort by conversionRate descending (strip the % and parse)
      const parseRate = (s: string | null) => parseFloat((s ?? '0').replace('%', '')) || 0;
      const sorted = [...qualified].sort((a, b) => parseRate(b.avgConversionRate) - parseRate(a.avgConversionRate));
      const top2 = sorted.slice(0, 2).map((r) => r.platform);
      const bottom = sorted.filter((r) => parseRate(r.avgConversionRate) < 0.5).map((r) => r.platform);

      const lines = qualified.map((r) => {
        const tag = top2.includes(r.platform ?? '') ? '— PRIORITIZE' :
          bottom.includes(r.platform ?? '') ? '— AVOID (low conversion)' : '';
        return `- ${r.platform} (${r.actionType}): ${r.avgEngagementRate} engagement, ${r.avgConversionRate} conversion ${tag}`;
      });

      performanceContext = `\n=== PERFORMANCE HISTORY (past 60 days, ${totalActions} actions logged) ===\n${lines.join('\n')}\n${
        top2.length > 0 ? `\nFocus on ${top2.join(' or ')} today.` : ''
      }${bottom.length > 0 ? ` Do not suggest ${bottom.join(' or ')}.` : ''}`;
    }
  }

  if (performanceContext) {
    console.log('[action-generator] Performance context injected:\n', performanceContext);
  }

  let avoidTitleInstruction = '';
  let actionData: ActionOutput | null = null;
  let attempts = 0;

  // We attempt up to 2 times to generate a unique action
  while (attempts < 2) {
    attempts++;

    // 4. Build the LLM prompt
    const prompt = `You are a growth marketing copilot for Stormo.io.
Your task is to generate ONE highly specific, actionable, and optimal daily marketing action for this store.
Ensure it doesn't repeat past concepts, angles, or channels in a repetitive way.

=== CONTEXT ===
${context.systemContext}

=== CHANNEL ROTATION ===
${rotationContext}
${performanceContext}
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

    // 4. Generate embedding for the action
    const embeddingText = `${actionData.title} ${actionData.description}`;
    const embeddingModel = getEmbeddingModel();
    const newEmbedding = await embeddingModel.embedQuery(embeddingText);
    const serializedEmbedding = JSON.stringify(newEmbedding);

    // 5. Check cosine similarity against past actions using pgvector distance operator <=>
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
      // Action is unique enough, or we have hit our maximum retry attempt — proceed to save
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
      // Too similar to an existing action — retry with instruction to avoid the duplicate
      const duplicateTitle = duplicates[0].title;
      console.warn(`[Action Generator] Duplicate detected! Action is too similar to past action: "${duplicateTitle}". Retrying...`);
      avoidTitleInstruction = `CRITICAL: The generated action was too similar to: "${duplicateTitle}". You MUST generate a completely different action with a different angle, strategy, or focus. Do not generate anything like: "${duplicateTitle}".`;
    }
  }

  throw new Error('Failed to generate a unique daily action after maximum attempts.');
}
