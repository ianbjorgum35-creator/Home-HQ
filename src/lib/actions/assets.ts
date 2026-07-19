"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseOptionalDate, parseOptionalFloat } from "@/lib/format";

export async function createAsset(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Asset name is required");

  const asset = await prisma.asset.create({
    data: {
      name,
      location: (formData.get("location") as string) || null,
      manufacturer: (formData.get("manufacturer") as string) || null,
      modelNumber: (formData.get("modelNumber") as string) || null,
      serialNumber: (formData.get("serialNumber") as string) || null,
      purchaseDate: parseOptionalDate(formData.get("purchaseDate")),
      purchasePrice: parseOptionalFloat(formData.get("purchasePrice")),
      warrantyExpires: parseOptionalDate(formData.get("warrantyExpires")),
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/assets");
  revalidatePath("/");
  redirect(`/assets/${asset.id}`);
}

export async function updateAsset(assetId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Asset name is required");

  await prisma.asset.update({
    where: { id: assetId },
    data: {
      name,
      location: (formData.get("location") as string) || null,
      manufacturer: (formData.get("manufacturer") as string) || null,
      modelNumber: (formData.get("modelNumber") as string) || null,
      serialNumber: (formData.get("serialNumber") as string) || null,
      purchaseDate: parseOptionalDate(formData.get("purchaseDate")),
      purchasePrice: parseOptionalFloat(formData.get("purchasePrice")),
      warrantyExpires: parseOptionalDate(formData.get("warrantyExpires")),
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/assets");
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/");
}

export async function deleteAsset(assetId: string) {
  await prisma.asset.delete({ where: { id: assetId } });
  revalidatePath("/assets");
  revalidatePath("/");
  redirect("/assets");
}
