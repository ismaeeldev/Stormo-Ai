import { db } from '@/lib/db';
import { milestones, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendMilestoneEmail } from '@/lib/email/send-templates';
import { getUserById } from '@/lib/db/queries';

const EVENT_TO_MILESTONE: Record<string, string> = {
  action_completed: 'first_action',
  sale_reported: 'first_sale',
  content_viewed: 'first_content_viewed',
  outreach_added: 'first_outreach_added',
  login: 'first_login',
};

export async function checkAndAwardMilestones(userId: string, event: string) {
  try {
    const milestoneKey = EVENT_TO_MILESTONE[event];
    if (!milestoneKey) {
      console.warn(`[Milestones] Unrecognized event: ${event}`);
      return;
    }

    // 1. Check if the milestone is already awarded to the user
    const [existingMilestone] = await db
      .select()
      .from(milestones)
      .where(
        and(
          eq(milestones.userId, userId),
          eq(milestones.milestoneKey, milestoneKey)
        )
      );

    let activeMilestone = existingMilestone;

    // 2. Insert into milestones table if not already there
    if (!activeMilestone) {
      const [newMilestone] = await db
        .insert(milestones)
        .values({
          userId,
          milestoneKey,
          emailSent: false,
        })
        .returning();
      activeMilestone = newMilestone;
      console.log(`[Milestones] Awarded new milestone: ${milestoneKey} for user ${userId}`);
    }

    // 3. Send milestone email if emailSent is false
    if (activeMilestone && !activeMilestone.emailSent) {
      const user = await getUserById(userId);
      if (user && user.email) {
        try {
          await sendMilestoneEmail(user.email, milestoneKey, user.name || 'Founder');
          
          // 4. Set emailSent = true
          await db
            .update(milestones)
            .set({ emailSent: true })
            .where(eq(milestones.id, activeMilestone.id));
            
          console.log(`[Milestones] Email sent successfully for milestone: ${milestoneKey}`);
        } catch (emailErr) {
          console.error(`[Milestones] Failed to send email for milestone ${milestoneKey}:`, emailErr);
        }
      }
    }
    // 5. Special check for ten_sales milestone
    if (event === 'sale_reported') {
      const user = await getUserById(userId);
      if (user && user.totalSales && user.totalSales >= 10) {
        const [existingTen] = await db
          .select()
          .from(milestones)
          .where(
            and(
              eq(milestones.userId, userId),
              eq(milestones.milestoneKey, 'ten_sales')
            )
          );
        if (!existingTen) {
          await db.insert(milestones).values({
            userId,
            milestoneKey: 'ten_sales',
            emailSent: true,
          });
          console.log(`[Milestones] Awarded ten_sales milestone for user ${userId}`);
        }
      }
    }
  } catch (error) {
    console.error('[Milestones] Error in checkAndAwardMilestones:', error);
  }
}
