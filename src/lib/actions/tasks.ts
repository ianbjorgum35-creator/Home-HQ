"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseOptionalDate } from "@/lib/format";
import { asPriority, asTaskStatus } from "@/lib/enums";
import type { TaskStatus } from "@/generated/prisma/enums";

function revalidateTaskPaths(projectId: string | null) {
  revalidatePath("/tasks");
  revalidatePath("/");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function createTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Task title is required");

  const projectId = (formData.get("projectId") as string) || null;
  const redirectTo = (formData.get("redirectTo") as string) || null;

  await prisma.task.create({
    data: {
      title,
      category: (formData.get("category") as string) || null,
      notes: (formData.get("notes") as string) || null,
      priority: asPriority(formData.get("priority")),
      status: asTaskStatus(formData.get("status")),
      dueDate: parseOptionalDate(formData.get("dueDate")),
      projectId,
    },
  });

  revalidateTaskPaths(projectId);
  if (redirectTo) redirect(redirectTo);
}

export async function updateTask(taskId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Task title is required");

  const projectId = (formData.get("projectId") as string) || null;
  const status = asTaskStatus(formData.get("status"));

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      category: (formData.get("category") as string) || null,
      notes: (formData.get("notes") as string) || null,
      priority: asPriority(formData.get("priority")),
      status,
      dueDate: parseOptionalDate(formData.get("dueDate")),
      projectId,
      completedAt: status === "DONE" ? new Date() : null,
    },
  });

  revalidateTaskPaths(projectId);
}

export async function setTaskStatus(taskId: string, status: TaskStatus, projectId: string | null) {
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === "DONE" ? new Date() : null,
    },
  });
  revalidateTaskPaths(projectId);
}

export async function deleteTask(taskId: string, projectId: string | null) {
  await prisma.task.delete({ where: { id: taskId } });
  revalidateTaskPaths(projectId);
}
