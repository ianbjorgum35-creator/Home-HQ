"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseOptionalDate, parseOptionalFloat } from "@/lib/format";
import { asPriority, asProjectStatus } from "@/lib/enums";

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Project name is required");

  const project = await prisma.project.create({
    data: {
      name,
      category: (formData.get("category") as string) || null,
      notes: (formData.get("notes") as string) || null,
      status: asProjectStatus(formData.get("status")),
      priority: asPriority(formData.get("priority")),
      budget: parseOptionalFloat(formData.get("budget")),
      dueDate: parseOptionalDate(formData.get("dueDate")),
    },
  });

  revalidatePath("/projects");
  revalidatePath("/");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(projectId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Project name is required");

  await prisma.project.update({
    where: { id: projectId },
    data: {
      name,
      category: (formData.get("category") as string) || null,
      notes: (formData.get("notes") as string) || null,
      status: asProjectStatus(formData.get("status")),
      priority: asPriority(formData.get("priority")),
      budget: parseOptionalFloat(formData.get("budget")),
      dueDate: parseOptionalDate(formData.get("dueDate")),
    },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
}

export async function deleteProject(projectId: string) {
  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/projects");
  revalidatePath("/");
  redirect("/projects");
}
