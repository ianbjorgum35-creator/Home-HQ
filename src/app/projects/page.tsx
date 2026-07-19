import Link from "next/link";
import { prisma } from "@/lib/db";
import { createProject } from "@/lib/actions/projects";
import { projectSpend } from "@/lib/queries";
import { formatCurrency, formatDate, PROJECT_STATUS_LABELS } from "@/lib/format";
import { Button, Card, EmptyState, Field, Input, PriorityBadge, SectionHeading, Select, StatusBadge, Textarea } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: { expenses: true, tasks: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Projects</h1>

      <Card>
        <SectionHeading title={`All projects (${projects.length})`} />
        {projects.length === 0 ? (
          <EmptyState>No projects yet. Add your first one below.</EmptyState>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {projects.map((project) => {
              const spent = projectSpend(project);
              const remaining = (project.budget ?? 0) - spent;
              const openTasks = project.tasks.filter((t) => t.status !== "DONE").length;
              return (
                <li key={project.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-1">
                    <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                      {project.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={project.status} label={PROJECT_STATUS_LABELS[project.status]} />
                      <PriorityBadge priority={project.priority} />
                      {project.category ? (
                        <span className="text-xs text-slate-500 dark:text-slate-400">{project.category}</span>
                      ) : null}
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {openTasks}/{project.tasks.length} tasks open
                      </span>
                      {project.dueDate ? (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Due {formatDate(project.dueDate)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {project.budget ? (
                    <div className="text-right text-sm">
                      <div>{formatCurrency(spent)} / {formatCurrency(project.budget)}</div>
                      <div className={`text-xs ${remaining < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}`}>
                        {formatCurrency(remaining)} remaining
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card id="new">
        <SectionHeading title="New project" />
        <form action={createProject} className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <Input name="name" required placeholder="Replace basement flooring" />
          </Field>
          <Field label="Category">
            <Input name="category" placeholder="Home improvement" />
          </Field>
          <Field label="Priority">
            <Select name="priority" defaultValue="MEDIUM">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue="NOT_STARTED">
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETE">Complete</option>
            </Select>
          </Field>
          <Field label="Budget ($)">
            <Input name="budget" type="number" step="0.01" min="0" placeholder="5000" />
          </Field>
          <Field label="Due date">
            <Input name="dueDate" type="date" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea name="notes" rows={3} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Create project</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
