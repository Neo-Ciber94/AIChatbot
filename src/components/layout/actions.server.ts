"use server";

import { db } from "@/lib/database";
import { getRequiredSession } from "@/lib/auth/utils";
import { InferSelectModel, and, eq } from "drizzle-orm";
import { conversations } from "@/lib/database/schema";
import { action } from "@/lib/action";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type Conversation = InferSelectModel<typeof conversations>;

export const getConversations = async () => {
  const session = await getRequiredSession();
  const result = await db.query.conversations.findMany({
    where: eq(conversations.userId, session.user.userId),
  });

  return result;
};

export const createConversation = action(z.undefined(), async () => {
  const session = await getRequiredSession();
  const result = await db
    .insert(conversations)
    .values({
      title: "New Chat",
      userId: session.user.userId,
    })
    .returning();

  revalidatePath("/");
  revalidatePath("/chat");
  return result[0]!;
});

export const deleteConversation = async (conversationId: string) => {
  const session = await getRequiredSession();
  await db
    .delete(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, session.user.userId),
      ),
    );
};
