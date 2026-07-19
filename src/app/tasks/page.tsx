import Link from "next/link";
import { prisma } from "@/lib/db";
import { createTask, deleteTask, setTaskStatus } from "@/lib/actions/tasks";
import { formatDate } from "@/lib/format";
import { asOptionalPriority, asOptionalTaskStatus } from "@/lib/enums";
import { Button, Card, EmptyState, Field, Input, PriorityBadge, SectionHeading, Select } from "@/components/ui";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "DONE"];
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH"];

export const dynamic = "force-dynamic";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string }>;
}) {
  const { status, priority } = await searchParams;
  const statusFilter = asOptionalTaskStatus(status);
  const priorityFilter = asOptionalPriority(priority);

  const [tasks, projects] = await Promise.all([
    prisma.task.findMany({
      where: {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(priorityFilter ? { priority: priorityFilter } : {}),
      },
      include: { project: true },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    }),
    prisma.project.findMany({ orderBy: { name: "asc" } }),
  ]);

  const filterLink = (key: "status" | "priority", value?: string) => {
    const params = new URLSearchParams();
    if (key === "status" && value) params.set("status", value);
    else if (status) params.set("status", status);
    if (key === "priority" && value) params.set("priority", value);
    else if (priority) params.set("priority", priority);
    const query = params.toString();
    return `/tasks${query ? `?${query}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Tasks</h1>

      <Card>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-slate-500 dark:text-slate-400">Status:</span>
            <Link href={filterLink("status", undefined)} className={!status ? "font-semibold underline" : "hover:underline"}>
              All
            </Link>
            {STATUS_OPTIONS.map((s) => (
              <Link key={s} href={filterLink("status", s)} className={status === s ? "font-semibold underline" : "hover:underline"}>
                {s.replace("_", " ")}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-500 dark:text-slate-400">Priority:</span>
            <Link href={filterLink("priority", undefined)} className={!priority ? "font-semibold underline" : "hover:underline"}>
              All
            </Link>
            {PRIORITY_OPTIONS.map((p) => (
              <Link key={p} href={filterLink("priority", p)} className={priority === p ? "font-semibold underline" : "hover:underline"}>
                {p}
              </Link>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeading title={`Tasks (${tasks.length})`} />
        {tasks.length === 0 ? (
          <EmptyState>No tasks match these filters.</EmptyState>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {tasks.map((task) => (
              <li key={task.id} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <form action={setTaskStatus.bind(null, task.id, task.status === "DONE" ? "OPEN" : "DONE", task.projectId)}>
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
                  {task.project ? (
                    <Link href={`/projects/${task.project.id}`} className="text-xs text-slate-500 hover:underline dark:text-slate-400">
                      {task.project.name}
                    </Link>
                  ) : null}
                  {task.dueDate ? (
                    <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(task.dueDate)}</span>
                  ) : null}
                </div>
                <form action={deleteTask.bind(null, task.id, task.projectId)}>
                  <Button type="submit" variant="danger" className="px-2 py-1 text-xs">
                    Delete
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card id="new">
        <SectionHeading title="New task" />
        <form action={createTask} className="flex flex-wrap items-end gap-3">
          <Field label="Title">
            <Input name="title" required placeholder="Clean gutters" />
          </Field>
          <Field label="Project (optional)">
            <Select name="projectId" defaultValue="">
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Category">
            <Input name="category" placeholder="Outdoor" />
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
          <input type="hidden" name="redirectTo" value="/tasks" />
          <Button type="submit">Add task</Button>
        </form>
      </Card>
    </div>
  );
}
