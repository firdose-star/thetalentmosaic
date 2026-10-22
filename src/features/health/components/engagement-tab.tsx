"use client";

/**
 * Health › Member Engagement: the searchable member list with last contact,
 * status, events and owner. Filters update the live count line.
 */
import { useState } from "react";

import { FilterSelect, SearchInput } from "@/components/shared/filter-bar";
import { Card } from "@/components/ui/card";
import { STATUS_LABELS, status } from "../metrics";
import type { HealthData, HealthMember } from "../services/health.service";
import { MemberTable } from "./health-parts";

const SORTS = [
  { value: "contact", label: "Longest since contact" },
  { value: "name", label: "Name A–Z" },
  { value: "joined", label: "Newest members" },
];

export function EngagementTab({ data, list }: { data: HealthData; list: HealthMember[] }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [sort, setSort] = useState("contact");

  const q = query.trim().toLowerCase();
  const rows = list
    .filter((m) => (!state || status(m, data.settings).label === state) && (!q || `${m.name} ${m.startup} ${m.city}`.toLowerCase().includes(q)))
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "joined"
          ? b.joinedOn.localeCompare(a.joinedOn)
          : (b.daysSinceContact ?? 9999) - (a.daysSinceContact ?? 9999),
    );

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-2 p-4 @3xl/main:flex-row">
        <SearchInput value={query} onChange={setQuery} placeholder="Search name, startup or city" className="flex-1" />
        <div className="grid grid-cols-2 gap-2 @3xl/main:w-[28rem]">
          <FilterSelect label="Status" allLabel="All statuses" value={state} options={STATUS_LABELS} onChange={setState} />
          <FilterSelect label="Sort" allLabel="Sort" value={sort} options={SORTS} onChange={(v) => setSort(v || "contact")} />
        </div>
      </Card>
      <MemberTable members={rows} total={list.length} data={data} title={state || undefined} />
    </div>
  );
}
