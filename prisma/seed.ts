import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function daysAgo(days: number): Date {
  return daysFromNow(-days);
}

async function main() {
  const fridge = await prisma.asset.create({
    data: {
      name: "Refrigerator",
      location: "Kitchen",
      manufacturer: "Samsung",
      modelNumber: "RF28R7351SG",
      serialNumber: "SN-482910",
      purchaseDate: new Date("2022-03-15"),
      purchasePrice: 2199,
      warrantyExpires: new Date("2027-03-15"),
      notes: "Water filter reminder every 6 months.",
    },
  });

  const dishwasher = await prisma.asset.create({
    data: {
      name: "Dishwasher",
      location: "Kitchen",
      manufacturer: "Bosch",
      modelNumber: "SHPM65Z55N",
      serialNumber: "SN-119284",
      purchaseDate: new Date("2021-08-01"),
      purchasePrice: 899,
      warrantyExpires: new Date("2023-08-01"),
    },
  });

  const furnace = await prisma.asset.create({
    data: {
      name: "Furnace",
      location: "Basement",
      manufacturer: "Carrier",
      modelNumber: "59SC5A",
      purchaseDate: new Date("2019-11-01"),
      purchasePrice: 3200,
    },
  });

  const mower = await prisma.asset.create({
    data: {
      name: "Riding Mower",
      location: "Garage",
      manufacturer: "John Deere",
      modelNumber: "S130",
      purchaseDate: new Date("2020-05-20"),
      purchasePrice: 2400,
    },
  });

  await prisma.maintenanceSchedule.create({
    data: {
      assetId: furnace.id,
      serviceType: "Filter Replacement",
      intervalDays: 90,
      lastServiceDate: daysAgo(80),
      nextDueDate: daysFromNow(10),
    },
  });

  await prisma.maintenanceSchedule.create({
    data: {
      assetId: furnace.id,
      serviceType: "Annual Inspection",
      intervalDays: 365,
      lastServiceDate: daysAgo(300),
      nextDueDate: daysFromNow(65),
    },
  });

  await prisma.maintenanceSchedule.create({
    data: {
      assetId: mower.id,
      serviceType: "Oil Change",
      intervalDays: 365,
      lastServiceDate: daysAgo(340),
      nextDueDate: daysFromNow(25),
    },
  });

  await prisma.maintenanceSchedule.create({
    data: {
      assetId: fridge.id,
      serviceType: "Water Filter Replacement",
      intervalDays: 180,
      lastServiceDate: daysAgo(3),
      nextDueDate: daysFromNow(177),
    },
  });

  const dishwasherService = await prisma.serviceRecord.create({
    data: {
      assetId: dishwasher.id,
      serviceDate: daysAgo(14),
      cost: 48,
      partReplaced: "Water inlet valve",
      notes: "Fixed leak under the door — inlet valve was cracked.",
    },
  });

  await prisma.expense.create({
    data: {
      description: "Water inlet valve",
      amount: 48,
      date: daysAgo(14),
      assetId: dishwasher.id,
      serviceRecordId: dishwasherService.id,
    },
  });

  const flooringProject = await prisma.project.create({
    data: {
      name: "Replace Basement Flooring",
      category: "Home improvement",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      budget: 5000,
      dueDate: daysFromNow(45),
    },
  });

  await prisma.task.createMany({
    data: [
      { title: "Measure basement", projectId: flooringProject.id, status: "DONE", priority: "MEDIUM", completedAt: daysAgo(20) },
      { title: "Remove old flooring", projectId: flooringProject.id, status: "DONE", priority: "MEDIUM", completedAt: daysAgo(12) },
      { title: "Purchase flooring", projectId: flooringProject.id, status: "OPEN", priority: "HIGH", dueDate: daysFromNow(3) },
      { title: "Install flooring", projectId: flooringProject.id, status: "OPEN", priority: "MEDIUM", dueDate: daysFromNow(14) },
      { title: "Install trim", projectId: flooringProject.id, status: "OPEN", priority: "LOW", dueDate: daysFromNow(21) },
    ],
  });

  await prisma.expense.create({
    data: {
      description: "Flooring materials",
      amount: 1850,
      date: daysAgo(10),
      projectId: flooringProject.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Clean gutters",
      category: "Outdoor",
      priority: "MEDIUM",
      status: "OPEN",
      dueDate: daysFromNow(5),
    },
  });

  await prisma.task.create({
    data: {
      title: "Fix dishwasher leak",
      category: "Repair",
      priority: "HIGH",
      status: "DONE",
      dueDate: daysAgo(14),
      completedAt: daysAgo(14),
    },
  });

  console.log("Seeded Household HQ with sample data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
