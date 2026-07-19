import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { deleteAsset, updateAsset } from "@/lib/actions/assets";
import {
  completeService,
  createMaintenanceSchedule,
  deleteMaintenanceSchedule,
  logServiceRecord,
} from "@/lib/actions/maintenance";
import { createExpense, deleteExpense } from "@/lib/actions/expenses";
import { addAttachment, deleteAttachment } from "@/lib/actions/attachments";
import { assetSpend } from "@/lib/queries";
import { formatCurrency, formatDate, toDateInputValue } from "@/lib/format";
import { Button, Card, EmptyState, Field, Input, SectionHeading, Textarea } from "@/components/ui";
import { FindPartForm } from "@/components/find-part-form";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      maintenanceSchedules: { orderBy: { nextDueDate: "asc" } },
      serviceRecords: { orderBy: { serviceDate: "desc" } },
      expenses: { orderBy: { date: "desc" } },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!asset) notFound();

  const spend = assetSpend(asset);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/assets" className="text-sm text-slate-500 hover:underline dark:text-slate-400">
          ← Asset database
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{asset.name}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {asset.location ?? "No location set"} · {[asset.manufacturer, asset.modelNumber].filter(Boolean).join(" ") || "No manufacturer/model on file"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <SectionHeading title="Details" />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-slate-500 dark:text-slate-400">Serial number</dt>
            <dd>{asset.serialNumber ?? "—"}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Purchased</dt>
            <dd>{formatDate(asset.purchaseDate)}{asset.purchasePrice ? ` · ${formatCurrency(asset.purchasePrice)}` : ""}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Warranty expires</dt>
            <dd>{formatDate(asset.warrantyExpires)}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Total spend</dt>
            <dd>{formatCurrency(spend)}</dd>
          </dl>
          {asset.notes ? <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{asset.notes}</p> : null}
        </Card>
        <Card>
          <SectionHeading title="Find a part" />
          <FindPartForm manufacturer={asset.manufacturer} modelNumber={asset.modelNumber} />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Opens a web search for the manufacturer, model number, and the part you describe.
          </p>
        </Card>
      </div>

      <Card>
        <SectionHeading title={`Maintenance schedules (${asset.maintenanceSchedules.length})`} />
        {asset.maintenanceSchedules.length === 0 ? (
          <EmptyState>No recurring maintenance set up yet.</EmptyState>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {asset.maintenanceSchedules.map((schedule) => (
              <li key={schedule.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-medium">{schedule.serviceType}</span>
                    {schedule.intervalDays ? (
                      <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                        every {schedule.intervalDays} days
                      </span>
                    ) : null}
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Last: {formatDate(schedule.lastServiceDate)} · Next due: {formatDate(schedule.nextDueDate)}
                    </div>
                  </div>
                  <form action={deleteMaintenanceSchedule.bind(null, schedule.id, asset.id)}>
                    <Button type="submit" variant="danger" className="px-2 py-1 text-xs">
                      Remove schedule
                    </Button>
                  </form>
                </div>
                <form
                  action={completeService.bind(null, schedule.id, asset.id)}
                  className="flex flex-wrap items-end gap-2 rounded-md bg-slate-50 p-2 text-sm dark:bg-slate-800/50"
                >
                  <Field label="Service date">
                    <Input name="serviceDate" type="date" defaultValue={toDateInputValue(new Date())} />
                  </Field>
                  <Field label="Cost ($)">
                    <Input name="cost" type="number" step="0.01" min="0" />
                  </Field>
                  <Field label="Part replaced">
                    <Input name="partReplaced" />
                  </Field>
                  <Field label="Notes">
                    <Input name="notes" />
                  </Field>
                  <Button type="submit">Complete service</Button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form
          action={createMaintenanceSchedule.bind(null, asset.id)}
          className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"
        >
          <Field label="Service type">
            <Input name="serviceType" required placeholder="Filter replacement" />
          </Field>
          <Field label="Interval (days)">
            <Input name="intervalDays" type="number" min="1" placeholder="90" />
          </Field>
          <Field label="Last service date">
            <Input name="lastServiceDate" type="date" />
          </Field>
          <Button type="submit">Add schedule</Button>
        </form>
      </Card>

      <Card>
        <SectionHeading title={`Service history (${asset.serviceRecords.length})`} />
        {asset.serviceRecords.length === 0 ? (
          <EmptyState>No service recorded yet.</EmptyState>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {asset.serviceRecords.map((record) => (
              <li key={record.id} className="py-2 text-sm first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{formatDate(record.serviceDate)}</span>
                  {record.cost ? <span>{formatCurrency(record.cost)}</span> : null}
                </div>
                {record.partReplaced ? (
                  <div className="text-xs text-slate-500 dark:text-slate-400">Part: {record.partReplaced}</div>
                ) : null}
                {record.notes ? <div className="text-slate-600 dark:text-slate-300">{record.notes}</div> : null}
              </li>
            ))}
          </ul>
        )}
        <form
          action={logServiceRecord.bind(null, asset.id)}
          className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"
        >
          <Field label="Ad-hoc repair date">
            <Input name="serviceDate" type="date" defaultValue={toDateInputValue(new Date())} />
          </Field>
          <Field label="Cost ($)">
            <Input name="cost" type="number" step="0.01" min="0" />
          </Field>
          <Field label="Part replaced">
            <Input name="partReplaced" />
          </Field>
          <Field label="Notes">
            <Input name="notes" placeholder="Fixed leak at inlet valve" />
          </Field>
          <Button type="submit">Log repair</Button>
        </form>
      </Card>

      <Card>
        <SectionHeading title={`Expenses (${asset.expenses.length})`} />
        {asset.expenses.length === 0 ? (
          <EmptyState>No expenses logged for this asset yet.</EmptyState>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {asset.expenses.map((expense) => (
              <li key={expense.id} className="flex items-center justify-between gap-2 py-2 text-sm first:pt-0 last:pb-0">
                <div>
                  <span className="font-medium">{expense.description}</span>{" "}
                  <span className="text-slate-500 dark:text-slate-400">· {formatDate(expense.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{formatCurrency(expense.amount)}</span>
                  <form action={deleteExpense.bind(null, expense.id, { assetId: asset.id })}>
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
          <input type="hidden" name="assetId" value={asset.id} />
          <Field label="Description">
            <Input name="description" required placeholder="Water filter" />
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
        <SectionHeading title="Manuals, warranties & photos" />
        {asset.attachments.length === 0 ? (
          <EmptyState>No linked documents yet. Store files in Google Drive and link them here.</EmptyState>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {asset.attachments.map((attachment) => (
              <li key={attachment.id} className="flex items-center justify-between gap-2 py-2 text-sm first:pt-0 last:pb-0">
                <a href={attachment.url} target="_blank" rel="noreferrer" className="hover:underline">
                  {attachment.label}
                </a>
                <form action={deleteAttachment.bind(null, attachment.id, { assetId: asset.id })}>
                  <Button type="submit" variant="danger" className="px-2 py-1 text-xs">
                    Remove
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form
          action={addAttachment.bind(null, { assetId: asset.id })}
          className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"
        >
          <Field label="Label">
            <Input name="label" required placeholder="Owner's manual" />
          </Field>
          <Field label="Drive link">
            <Input name="url" type="url" required placeholder="https://drive.google.com/..." />
          </Field>
          <Button type="submit">Add link</Button>
        </form>
      </Card>

      <Card>
        <SectionHeading title="Edit asset" />
        <form action={updateAsset.bind(null, asset.id)} className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <Input name="name" required defaultValue={asset.name} />
          </Field>
          <Field label="Location">
            <Input name="location" defaultValue={asset.location ?? ""} />
          </Field>
          <Field label="Manufacturer">
            <Input name="manufacturer" defaultValue={asset.manufacturer ?? ""} />
          </Field>
          <Field label="Model number">
            <Input name="modelNumber" defaultValue={asset.modelNumber ?? ""} />
          </Field>
          <Field label="Serial number">
            <Input name="serialNumber" defaultValue={asset.serialNumber ?? ""} />
          </Field>
          <Field label="Purchase date">
            <Input name="purchaseDate" type="date" defaultValue={toDateInputValue(asset.purchaseDate)} />
          </Field>
          <Field label="Purchase price ($)">
            <Input name="purchasePrice" type="number" step="0.01" min="0" defaultValue={asset.purchasePrice ?? ""} />
          </Field>
          <Field label="Warranty expires">
            <Input name="warrantyExpires" type="date" defaultValue={toDateInputValue(asset.warrantyExpires)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea name="notes" rows={3} defaultValue={asset.notes ?? ""} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
        <form action={deleteAsset.bind(null, asset.id)} className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button type="submit" variant="danger">
            Delete asset
          </Button>
        </form>
      </Card>
    </div>
  );
}
