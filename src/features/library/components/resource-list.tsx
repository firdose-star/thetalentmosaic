"use client";

/**
 * HR Resources — "Some Interesting Reads" (spec §7.5). Each resource shows
 * title, category, description, source, date added and access level. The type
 * filter defaults to "Show All"; admin-only resources never reach members.
 */
import { BookOpen, Lock } from "lucide-react";

import { FilterPanel, FilterSelect, ResultCount, SearchInput } from "@/components/shared/filter-bar";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { shortDate } from "@/lib/community";
import { RESOURCE_CATEGORIES, type Resource } from "@/lib/sample-data";
import { useResources } from "../hooks/use-library";

const FILTER_KEYS = ["q", "type"] as const;

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Card className="h-full gap-3 p-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary">{resource.category}</Badge>
        <Badge variant="outline" className="gap-1">
          {resource.access !== "All members" && <Lock className="size-3" aria-hidden />}
          {resource.access}
        </Badge>
      </div>
      <h3 className="font-semibold">{resource.title}</h3>
      <p className="text-sm text-muted-foreground">{resource.description}</p>
      <div className="mt-auto flex flex-wrap justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
        <span>{resource.source}</span>
        <span>Added {shortDate(resource.addedOn, true)}</span>
      </div>
    </Card>
  );
}

export function ResourceList() {
  const { values, set } = useUrlFilters(FILTER_KEYS);
  const { data, isPending, isError, error, refetch } = useResources();

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState className="min-h-64" />;

  const q = values.q.trim().toLowerCase();
  const resources = data.filter(
    (r) =>
      (!values.type || r.category === values.type) &&
      (!q || `${r.title} ${r.description} ${r.source}`.toLowerCase().includes(q)),
  );

  return (
    <div className="flex flex-col gap-4">
      <FilterPanel className="@2xl/main:flex-row">
        <SearchInput value={values.q} onChange={(v) => set("q", v)} placeholder="Search resources" className="flex-1" />
        <div className="@2xl/main:w-72">
          <FilterSelect label="Type" allLabel="Show All" value={values.type} options={RESOURCE_CATEGORIES} onChange={(v) => set("type", v)} />
        </div>
      </FilterPanel>

      {resources.length === 0 ? (
        <EmptyState icon={BookOpen} title="No resources match" description="Try another type or search." />
      ) : (
        <>
          <ResultCount count={resources.length} noun={["resource", "resources"]} />
          <Stagger key={`${values.type}-${values.q}`} className="grid gap-4 @2xl/main:grid-cols-2 @5xl/main:grid-cols-3">
            {resources.map((resource) => (
              <StaggerItem key={resource.id}>
                <ResourceCard resource={resource} />
              </StaggerItem>
            ))}
          </Stagger>
        </>
      )}
    </div>
  );
}
