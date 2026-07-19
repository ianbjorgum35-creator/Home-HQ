import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { deleteProject, updateProject } from "@/lib/actions/projects";
import { createTask, deleteTask, setTaskStatus } from "@/lib/actions/tasks";
import { createExpense, deleteExpense } from "@/lib/actions/expenses";
import { addAttachment, deleteAttachment } from "@/lib/actions/attachments";
import { projectSpend } from "@/lib/queries";
import { formatCurrency, formatDate, toDateInputValue } from "@/lib/format";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PriorityBadge,
  SectionHeading,
  Select,
  StatusBadge,
  Textarea,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: { orderBy: [{ status: "asc" }, { dueDate: "asc" }] },
      expenses: { orderBy: { date: "desc" } },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!project) notFound();

  const spent = projectSpend(project);
  const remaining = (project.budget ?? 0) - spent;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/projects" className="text-sm text-slate-500 hover:underline dark:text-slate-400">
            ← All projects
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{project.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={project.status} label={project.status.replace("_", " ")} />
          <PriorityBadge priority={project.priority} />
        </div>
      </div>

      {project.budget ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Budget</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(project.budget)}</p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Spent</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(spent)}</p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Remaining</p>
            <p className={`mt-1 text-xl font-semibold ${remaining < 0 ? "text-rose-600 dark:text-rose-400" : ""}`}>
              {formatCurrency(remaining)}
            </p>
          </Card>
        </div>
      ) : null}

      <Card>
        <SectionHeading title={`Tasks (${project.tasks.length})`} />
        {project.tasks.length === 0 ? (
          <EmptyState>No tasks yet.</EmptyState>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {project.tasks.map((task) => (
              <li key={task.id} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <form action={setTaskStatus.bind(null, task.id, task.status === "DONE" ? "OPEN" : "DONE", project.id)}>
                    <button
                      type="submit"
                      aria-label="Toggle done"
                      className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                        task.status === "DONE"
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {task.status === "DONE" ? "✓" : ""}
                    </button>
                  </form>
                  <span className={task.status === "DONE" ? "text-slate-400 line-through" : ""}>{task.title}</span>
                  <PriorityBadge priority={task.priority} />
                  {task.dueDate ? (
                    <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(task.dueDate)}</span>
                  ) : null}
                </div>
                <form action={deleteTask.bind(null, task.id, project.id)}>
                  <Button type="submit" variant="danger" className="px-2 py-1 text-xs">
                    Delete
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={createTask} className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="redirectTo" value={`/projects/${project.id}`} />
          <Field label="New task">
            <Input name="title" required placeholder="Purchase flooring" />
          </Field>
          <Field label="Priority">
            <Select name="priority" defaultValue="MEDIUM">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
          </Field>
          <Field label="Due date">
            <Input name="dueDate" type="date" />
          </Field>
          <Button type="submit">Add task</Button>
        </form>
      </Card>

      <Card>
        <SectionHeading title={`Expenses (${project.expenses.length})`} />
        {project.expenses.length === 0 ? (
          <EmptyState>No expenses logged yet.</EmptyState>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {project.expenses.map((expense) => (
              <li key={expense.id} className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0 text-sm">
                <div>
                  <span className="font-medium">{expense.description}</span>{" "}
                  <span className="text-slate-500 dark:text-slate-400">· {formatDate(expense.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{formatCurrency(expense.amount)}</span>
                  <form action={deleteExpense.bind(null, expense.id, { projectId: project.id })}>
                    <Button type="submit" variant="danger" className="px-2 py-1 text-xs">
                      Delete
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        <form action={createExpense} className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <input type="hidden" name="projectId" value={project.id} />
          <Field label="Description">
            <Input name="description" required placeholder="Flooring materials" />
          </Field>
          <Field label="Amount ($)">
            <Input name="amount" type="number" step="0.01" min="0" required />
          </Field>
          <Field label="Date">
            <Input name="date" type="date" defaultValue={toDateInputValue(new Date())} />
          </Field>
          <Button type="submit">Add expense</Button>
        </form>
      </Card>

      <Card>
        <SectionHeading title="Documents & photos" />
        {project.attachments.length === 0 ? (
          <EmptyState>No linked documents yet. Store files in Google Drive and link them here.</EmptyState>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {project.attachments.map((attachment) => (
              <li key={attachment.id} className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0 text-sm">
                <a href={attachment.url} target="_blank" rel="noreferrer" className="hover:underline">
                  {attachment.label}
                </a>
                <form action={deleteAttachment.bind(null, attachment.id, { projectId: project.id })}>
                  <Button type="submit" variant="danger" className="px-2 py-1 text-xs">
                    Remove
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form
          action={addAttachment.bind(null, { projectId: project.id })}
          className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"
        >
          <Field label="Label">
            <Input name="label" required placeholder="Before photos" />
          </Field>
          <Field label="Drive link">
            <Input name="url" type="url" required placeholder="https://drive.google.com/..." />
          </Field>
          <Button type="submit">Add link</Button>
        </form>
      </Card>

      <Card>
        <SectionHeading title="Edit project" />
        <form action={updateProject.bind(null, project.id)} className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <Input name="name" required defaultValue={project.name} />
          </Field>
          <Field label="Category">
            <Input name="category" defaultValue={project.category ?? ""} />
          </Field>
          <Field label="Priority">
            <Select name="priority" defaultValue={project.priority}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={project.status}>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETE">Complete</option>
            </Select>
          </Field>
          <Field label="Budget ($)">
            <Input name="budget" type="number" step="0.01" min="0" defaultValue={project.budget ?? ""} />
          </Field>
          <Field label="Due date">
            <Input name="dueDate" type="date" defaultValue={toDateInputValue(project.dueDate)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea name="notes" rows={3} defaultValue={project.notes ?? ""} />
            </Field>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
        <form action={deleteProject.bind(null, project.id)} className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button type="submit" variant="danger">
            Delete project
          </Button>
        </form>
      </Card>
    </div>
  );
}
