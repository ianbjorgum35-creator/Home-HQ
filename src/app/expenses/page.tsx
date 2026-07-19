import Link from "next/link";
import { prisma } from "@/lib/db";
import { createExpense, deleteExpense } from "@/lib/actions/expenses";
import { formatCurrency, formatDate, toDateInputValue } from "@/lib/format";
import { Button, Card, EmptyState, Field, Input, SectionHeading, Select } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const [expenses, projects, assets] = await Promise.all([
    prisma.expense.findMany({
      include: { project: true, task: true, asset: true },
      orderBy: { date: "desc" },
    }),
    prisma.project.findMany({ orderBy: { name: "asc" } }),
    prisma.asset.findMany({ orderBy: { name: "asc" } }),
  ]);

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Costs & Expenses</h1>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total logged</p>
          <p className="text-xl font-semibold">{formatCurrency(total)}</p>
        </div>
      </div>

      <Card>
        <SectionHeading title={`Expense history (${expenses.length})`} />
        {expenses.length === 0 ? (
          <EmptyState>No expenses logged yet.</EmptyState>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {expenses.map((expense) => (
              <li key={expense.id} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0 text-sm">
                <div>
                  <span className="font-medium">{expense.description}</span>{" "}
                  <span className="text-slate-500 dark:text-slate-400">· {formatDate(expense.date)}</span>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {expense.project ? (
                      <Link href={`/projects/${expense.project.id}`} className="hover:underline">
                        {expense.project.name}
                      </Link>
                    ) : null}
                    {expense.asset ? (
                      <Link href={`/assets/${expense.asset.id}`} className="hover:underline">
                        {expense.asset.name}
                      </Link>
                    ) : null}
                    {!expense.project && !expense.asset ? "Unlinked" : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span>{formatCurrency(expense.amount)}</span>
                  <form
                    action={deleteExpense.bind(null, expense.id, {
                      projectId: expense.projectId,
                      taskId: expense.taskId,
                      assetId: expense.assetId,
                    })}
                  >
                    <Button type="submit" variant="danger" className="px-2 py-1 text-xs">
                      Delete
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card id="new">
        <SectionHeading title="New expense" />
        <form action={createExpense} className="grid gap-3 sm:grid-cols-2">
          <Field label="Description">
            <Input name="description" required placeholder="Water inlet valve" />
          </Field>
          <Field label="Amount ($)">
            <Input name="amount" type="number" step="0.01" min="0" required />
          </Field>
          <Field label="Date">
            <Input name="date" type="date" defaultValue={toDateInputValue(new Date())} />
          </Field>
          <Field label="Project (optional)">
            <Select name="projectId" defaultValue="">
              <option value="">None</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Asset (optional)">
            <Select name="assetId" defaultValue="">
              <option value="">None</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit">Add expense</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
