"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

/** Attachments store a label + link (e.g. a Google Drive URL) rather than the
 * file itself, keeping photos/manuals/receipts in Drive as the source of truth. */
export async function addAttachment(
  context: { projectId?: string | null; taskId?: string | null; assetId?: string | null },
  formData: FormData,
) {
  const label = String(formData.get("label") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!label || !url) throw new Error("Label and URL are required");

  await prisma.attachment.create({
    data: {
      label,
      url,
      projectId: context.projectId ?? null,
      taskId: context.taskId ?? null,
      assetId: context.assetId ?? null,
    },
  });

  if (context.projectId) revalidatePath(`/projects/${context.projectId}`);
  if (context.assetId) revalidatePath(`/assets/${context.assetId}`);
}

export async function deleteAttachment(
  attachmentId: string,
  context: { projectId?: string | null; assetId?: string | null },
) {
  await prisma.attachment.delete({ where: { id: attachmentId } });
  if (context.projectId) revalidatePath(`/projects/${context.projectId}`);
  if (context.assetId) revalidatePath(`/assets/${context.assetId}`);
}
