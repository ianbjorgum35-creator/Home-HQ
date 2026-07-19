"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { parseOptionalDate, parseOptionalFloat } from "@/lib/format";

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function revalidateAssetPaths(assetId: string) {
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/assets");
  revalidatePath("/maintenance");
  revalidatePath("/expenses");
  revalidatePath("/");
}

export async function createMaintenanceSchedule(assetId: string, formData: FormData) {
  const serviceType = String(formData.get("serviceType") ?? "").trim();
  if (!serviceType) throw new Error("Service type is required");

  const intervalDays = parseOptionalFloat(formData.get("intervalDays"));
  const lastServiceDate = parseOptionalDate(formData.get("lastServiceDate"));
  const nextDueDate =
    lastServiceDate && intervalDays
      ? addDays(lastServiceDate, intervalDays)
      : parseOptionalDate(formData.get("nextDueDate"));

  await prisma.maintenanceSchedule.create({
    data: {
      assetId,
      serviceType,
      intervalDays: intervalDays ? Math.round(intervalDays) : null,
      lastServiceDate,
      nextDueDate,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidateAssetPaths(assetId);
}

export async function deleteMaintenanceSchedule(scheduleId: string, assetId: string) {
  await prisma.maintenanceSchedule.delete({ where: { id: scheduleId } });
  revalidateAssetPaths(assetId);
}

/** Logs a completed service against a maintenance schedule, records history, and
 * rolls the schedule's next due date forward from the completed service date. */
export async function completeService(
  scheduleId: string,
  assetId: string,
  formData: FormData,
) {
  const serviceDate = parseOptionalDate(formData.get("serviceDate")) ?? new Date();
  const cost = parseOptionalFloat(formData.get("cost"));
  const notes = (formData.get("notes") as string) || null;
  const partReplaced = (formData.get("partReplaced") as string) || null;

  const record = await prisma.serviceRecord.create({
    data: {
      assetId,
      maintenanceScheduleId: scheduleId,
      serviceDate,
      cost,
      notes,
      partReplaced,
    },
  });

  if (cost) {
    const schedule = await prisma.maintenanceSchedule.findUnique({
      where: { id: scheduleId },
    });
    await prisma.expense.create({
      data: {
        description: `${schedule?.serviceType ?? "Service"} — asset maintenance`,
        amount: cost,
        date: serviceDate,
        assetId,
        serviceRecordId: record.id,
      },
    });
  }

  const schedule = await prisma.maintenanceSchedule.findUnique({
    where: { id: scheduleId },
  });

  await prisma.maintenanceSchedule.update({
    where: { id: scheduleId },
    data: {
      lastServiceDate: serviceDate,
      nextDueDate: schedule?.intervalDays ? addDays(serviceDate, schedule.intervalDays) : null,
    },
  });

  revalidateAssetPaths(assetId);
}

/** Logs an ad-hoc repair/service against an asset with no recurring schedule. */
export async function logServiceRecord(assetId: string, formData: FormData) {
  const serviceDate = parseOptionalDate(formData.get("serviceDate")) ?? new Date();
  const cost = parseOptionalFloat(formData.get("cost"));
  const notes = (formData.get("notes") as string) || null;
  const partReplaced = (formData.get("partReplaced") as string) || null;

  const record = await prisma.serviceRecord.create({
    data: { assetId, serviceDate, cost, notes, partReplaced },
  });

  if (cost) {
    await prisma.expense.create({
      data: {
        description: partReplaced ? `Repair — ${partReplaced}` : "Repair / service",
        amount: cost,
        date: serviceDate,
        assetId,
        serviceRecordId: record.id,
      },
    });
  }

  revalidateAssetPaths(assetId);
}
