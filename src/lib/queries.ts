import { prisma } from "@/lib/db";

/** Sum of all expenses linked to a project, either directly or through its tasks. */
export function projectSpend(project: { expenses: { amount: number }[] }): number {
  return project.expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

export function assetSpend(asset: { expenses: { amount: number }[] }): number {
  return asset.expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

export async function getDashboardData() {
  const now = new Date();
  const weekOut = new Date(now);
  weekOut.setDate(weekOut.getDate() + 7);
  const monthOut = new Date(now);
  monthOut.setDate(monthOut.getDate() + 30);

  const [overdueTasks, dueSoonTasks, highPriorityTasks, upcomingMaintenance, activeProjects] =
    await Promise.all([
      prisma.task.findMany({
        where: { status: { not: "DONE" }, dueDate: { lt: now } },
        include: { project: true },
        orderBy: { dueDate: "asc" },
      }),
      prisma.task.findMany({
        where: {
          status: { not: "DONE" },
          dueDate: { gte: now, lte: weekOut },
        },
        include: { project: true },
        orderBy: { dueDate: "asc" },
      }),
      prisma.task.findMany({
        where: { status: { not: "DONE" }, priority: "HIGH" },
        include: { project: true },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),
      prisma.maintenanceSchedule.findMany({
        where: { nextDueDate: { lte: monthOut } },
        include: { asset: true },
        orderBy: { nextDueDate: "asc" },
        take: 10,
      }),
      prisma.project.findMany({
        where: { status: { in: ["NOT_STARTED", "IN_PROGRESS"] } },
        include: { expenses: true, tasks: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

  const budgetSummary = activeProjects.reduce(
    (acc, project) => {
      acc.budget += project.budget ?? 0;
      acc.spent += projectSpend(project);
      return acc;
    },
    { budget: 0, spent: 0 },
  );

  return {
    overdueTasks,
    dueSoonTasks,
    highPriorityTasks,
    upcomingMaintenance,
    activeProjects,
    budgetSummary: {
      ...budgetSummary,
      remaining: budgetSummary.budget - budgetSummary.spent,
    },
  };
}
