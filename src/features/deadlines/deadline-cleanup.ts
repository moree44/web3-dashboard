import "server-only";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, lte } from "drizzle-orm";

import { recordActivity } from "@/features/activity/activity-log";
import { getDeadlineAutoDeleteCutoffDate, getJakartaDateValue } from "@/features/deadlines/deadline-utils";
import { db } from "@/lib/db/client";
import { deadlines } from "@/lib/db/schema";

export async function deleteExpiredDeadlines(today = getJakartaDateValue()) {
  const cutoffDate = getDeadlineAutoDeleteCutoffDate(today);
  const deleted = await db
    .delete(deadlines)
    .where(and(
      eq(deadlines.status, "upcoming"),
      lte(deadlines.dueDate, cutoffDate),
      isNull(deadlines.linkedProjectId),
      isNull(deadlines.linkedTaskId),
    ))
    .returning({
      id: deadlines.id,
      workspaceId: deadlines.workspaceId,
      title: deadlines.title,
      linkedNftCampaignId: deadlines.linkedNftCampaignId,
    });

  await Promise.all(deleted.map((deadline) => recordActivity(
    deadline.workspaceId,
    "deadline.deleted",
    {},
    {
      title: deadline.title,
      reason: "Automatically removed after one full overdue day",
      linkedNftCampaignId: deadline.linkedNftCampaignId,
    },
  )));

  if (deleted.length > 0) {
    revalidatePath("/");
    revalidatePath("/deadlines");
    revalidatePath("/nfts");
  }

  return { deletedCount: deleted.length, cutoffDate };
}
