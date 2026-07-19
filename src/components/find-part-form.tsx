"use client";

import { useState } from "react";
import { Button, Field, Input } from "@/components/ui";

export function FindPartForm({
  manufacturer,
  modelNumber,
}: {
  manufacturer: string | null;
  modelNumber: string | null;
}) {
  const [part, setPart] = useState("");
  const known = [manufacturer, modelNumber].filter(Boolean).join(" ");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = [known, part].filter(Boolean).join(" ").trim();
    if (!query) return;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <Field label={known ? `Find a part (searches "${known} ...")` : "Find a part"}>
        <Input
          value={part}
          onChange={(e) => setPart(e.target.value)}
          placeholder="water inlet valve"
        />
      </Field>
      <Button type="submit" disabled={!known && !part}>
        Find part
      </Button>
    </form>
  );
}
