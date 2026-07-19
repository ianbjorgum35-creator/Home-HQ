"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { parseOptionalDate, parseRequiredFloat } from "@/lib/format";

function revalidateExpensePaths(opts: {
  projectId?: string | null;
  taskId?: string | null;
  assetId?: string | null;
}) {
  revalidatePath("/expenses");
  revalidatePath("/");
  if (opts.projectId) revalidatePath(`/projects/${opts.projectId}`);
  if (opts.assetId) revalidatePath(`/assets/${opts.assetId}`);
}

export async function createExpense(formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  if (!description) throw new Error("Expense description is required");

  const projectId = (formData.get("projectId") as string) || null;
  const taskId = (formData.get("taskId") as string) || null;
  const assetId = (formData.get("assetId") as string) || null;

  await prisma.expense.create({
    data: {
      description,
      amount: parseRequiredFloat(formData.get("amount")),
      date: parseOptionalDate(formData.get("date")) ?? new Date(),
      notes: (formData.get("notes") as string) || null,
      projectId,
      taskId,
      assetId,
    },
  });

  revalidateExpensePaths({ projectId, taskId, assetId });
}

export async function deleteExpense(
  expenseId: string,
  context: { projectId?: string | null; taskId?: string | null; assetId?: string | null },
) {
  await prisma.expense.delete({ where: { id: expenseId } });
  revalidateExpensePaths(context);
}
