import Link from "next/link";
import { prisma } from "@/lib/db";
import { createAsset } from "@/lib/actions/assets";
import { formatDate } from "@/lib/format";
import { Button, Card, EmptyState, Field, Input, SectionHeading, Textarea } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const assets = await prisma.asset.findMany({ orderBy: [{ location: "asc" }, { name: "asc" }] });

  const grouped = new Map<string, typeof assets>();
  for (const asset of assets) {
    const key = asset.location?.trim() || "Unassigned";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(asset);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Home Asset Database</h1>

      {assets.length === 0 ? (
        <Card>
          <EmptyState>No assets yet. Add your first appliance or piece of equipment below.</EmptyState>
        </Card>
      ) : (
        [...grouped.entries()].map(([location, items]) => (
          <Card key={location}>
            <SectionHeading title={`${location} (${items.length})`} />
            <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((asset) => (
                <li key={asset.id} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                  <div>
                    <Link href={`/assets/${asset.id}`} className="font-medium hover:underline">
                      {asset.name}
                    </Link>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {[asset.manufacturer, asset.modelNumber].filter(Boolean).join(" · ") || "No manufacturer/model on file"}
                    </div>
                  </div>
                  {asset.warrantyExpires ? (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Warranty until {formatDate(asset.warrantyExpires)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        ))
      )}

      <Card id="new">
        <SectionHeading title="New asset" />
        <form action={createAsset} className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <Input name="name" required placeholder="Refrigerator" />
          </Field>
          <Field label="Location">
            <Input name="location" placeholder="Kitchen" />
          </Field>
          <Field label="Manufacturer">
            <Input name="manufacturer" placeholder="Samsung" />
          </Field>
          <Field label="Model number">
            <Input name="modelNumber" placeholder="RF28R7351SG" />
          </Field>
          <Field label="Serial number">
            <Input name="serialNumber" />
          </Field>
          <Field label="Purchase date">
            <Input name="purchaseDate" type="date" />
          </Field>
          <Field label="Purchase price ($)">
            <Input name="purchasePrice" type="number" step="0.01" min="0" />
          </Field>
          <Field label="Warranty expires">
            <Input name="warrantyExpires" type="date" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea name="notes" rows={3} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Add asset</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
