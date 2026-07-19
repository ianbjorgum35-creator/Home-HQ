import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { Card, EmptyState, SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const schedules = await prisma.maintenanceSchedule.findMany({
    include: { asset: true, serviceRecords: { orderBy: { serviceDate: "desc" }, take: 1 } },
    orderBy: { nextDueDate: "asc" },
  });

  const now = new Date();
  const overdue = schedules.filter((s) => s.nextDueDate && s.nextDueDate < now);
  const upcoming = schedules.filter((s) => !s.nextDueDate || s.nextDueDate >= now);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Maintenance</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Recurring service schedules across every asset. Complete a service from the asset&apos;s page to log
        history and roll the next due date forward automatically.
      </p>

      <Card>
        <SectionHeading title={`Overdue (${overdue.length})`} />
        {overdue.length === 0 ? (
          <EmptyState>Nothing overdue.</EmptyState>
        ) : (
          <ScheduleList schedules={overdue} />
        )}
      </Card>

      <Card>
        <SectionHeading title={`Upcoming (${upcoming.length})`} />
        {upcoming.length === 0 ? (
          <EmptyState>No maintenance schedules yet. Add one from an asset&apos;s page.</EmptyState>
        ) : (
          <ScheduleList schedules={upcoming} />
        )}
      </Card>
    </div>
  );
}

function ScheduleList({
  schedules,
}: {
  schedules: {
    id: string;
    serviceType: string;
    nextDueDate: Date | null;
    intervalDays: number | null;
    asset: { id: string; name: string; location: string | null };
    serviceRecords: { serviceDate: Date }[];
  }[];
}) {
  return (
    <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
      {schedules.map((schedule) => (
        <li key={schedule.id} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0 text-sm">
          <div>
            <Link href={`/assets/${schedule.asset.id}`} className="font-medium hover:underline">
              {schedule.serviceType} — {schedule.asset.name}
            </Link>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {schedule.asset.location ?? "No location"}
              {schedule.intervalDays ? ` · every ${schedule.intervalDays} days` : ""}
              {schedule.serviceRecords[0] ? ` · last done ${formatDate(schedule.serviceRecords[0].serviceDate)}` : ""}
            </div>
          </div>
          <span className="shrink-0 text-slate-500 dark:text-slate-400">{formatDate(schedule.nextDueDate)}</span>
        </li>
      ))}
    </ul>
  );
}
