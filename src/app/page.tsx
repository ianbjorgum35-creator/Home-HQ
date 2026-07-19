import Link from "next/link";
import { getDashboardData, projectSpend } from "@/lib/queries";
import { formatCurrency, formatDate, PROJECT_STATUS_LABELS, TASK_STATUS_LABELS } from "@/lib/format";
import { Card, EmptyState, PriorityBadge, SectionHeading, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { overdueTasks, dueSoonTasks, highPriorityTasks, upcomingMaintenance, activeProjects, budgetSummary } =
    await getDashboardData();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Household HQ</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            What needs doing, what&apos;s coming up, and what it&apos;s costing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/tasks#new" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
            + Task
          </Link>
          <Link href="/projects#new" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            + Project
          </Link>
          <Link href="/assets#new" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            + Asset
          </Link>
          <Link href="/expenses#new" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            + Expense
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Active project budget
          </p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(budgetSummary.budget)}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Spent so far
          </p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(budgetSummary.spent)}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Remaining
          </p>
          <p
            className={`mt-1 text-2xl font-semibold ${
              budgetSummary.remaining < 0 ? "text-rose-600 dark:text-rose-400" : ""
            }`}
          >
            {formatCurrency(budgetSummary.remaining)}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeading title={`Overdue (${overdueTasks.length})`} />
          {overdueTasks.length === 0 ? (
            <EmptyState>Nothing overdue. Nice.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {overdueTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionHeading title={`Due in the next 7 days (${dueSoonTasks.length})`} />
          {dueSoonTasks.length === 0 ? (
            <EmptyState>Nothing due soon.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {dueSoonTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionHeading title={`High priority (${highPriorityTasks.length})`} />
          {highPriorityTasks.length === 0 ? (
            <EmptyState>No open high-priority tasks.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {highPriorityTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionHeading
            title={`Upcoming maintenance (${upcomingMaintenance.length})`}
            action={
              <Link href="/maintenance" className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100">
                View all →
              </Link>
            }
          />
          {upcomingMaintenance.length === 0 ? (
            <EmptyState>No maintenance due in the next 30 days.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {upcomingMaintenance.map((schedule) => (
                <li key={schedule.id} className="flex items-center justify-between gap-2 text-sm">
                  <Link href={`/assets/${schedule.assetId}`} className="truncate hover:underline">
                    {schedule.serviceType} — {schedule.asset.name}
                  </Link>
                  <span className="shrink-0 text-slate-500 dark:text-slate-400">
                    {formatDate(schedule.nextDueDate)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <SectionHeading
          title={`Active projects (${activeProjects.length})`}
          action={
            <Link href="/projects" className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100">
              View all →
            </Link>
          }
        />
        {activeProjects.length === 0 ? (
          <EmptyState>No active projects yet.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {activeProjects.map((project) => {
              const spent = projectSpend(project);
              const remaining = (project.budget ?? 0) - spent;
              const openTasks = project.tasks.filter((t) => t.status !== "DONE").length;
              return (
                <li key={project.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 first:border-none first:pt-0 dark:border-slate-800">
                  <div className="flex flex-col gap-1">
                    <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                      {project.name}
                    </Link>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={project.status} label={PROJECT_STATUS_LABELS[project.status]} />
                      <PriorityBadge priority={project.priority} />
                      <span className="text-xs text-slate-500 dark:text-slate-400">{openTasks} open tasks</span>
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
    </div>
  );
}

function TaskRow({
  task,
}: {
  task: {
    id: string;
    title: string;
    priority: string;
    status: string;
    dueDate: Date | null;
    project: { id: string; name: string } | null;
  };
}) {
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <div className="flex min-w-0 items-center gap-2">
        <PriorityBadge priority={task.priority} />
        <Link href="/tasks" className="truncate hover:underline">
          {task.title}
        </Link>
        {task.project ? (
          <span className="hidden shrink-0 text-xs text-slate-500 sm:inline dark:text-slate-400">
            {task.project.name}
          </span>
        ) : null}
      </div>
      <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
        {task.dueDate ? formatDate(task.dueDate) : TASK_STATUS_LABELS[task.status]}
      </span>
    </li>
  );
}
