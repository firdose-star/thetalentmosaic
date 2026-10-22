"use client";

/**
 * Vendor Directory (spec §7.4): category chips, search, and cards with name,
 * category, description, coverage and contact actions. Only approved vendors
 * appear here. Admins can manage the category list.
 */
import { Camera, Globe, Mail, MapPin, MessageCircle, Store } from "lucide-react";

import { FilterPanel, ResultCount, SearchInput } from "@/components/shared/filter-bar";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { RoleGuard } from "@/components/shared/role-guard";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUrlFilters } from "@/hooks/use-url-filters";
import type { Vendor } from "@/lib/sample-data";
import { cn } from "@/lib/utils";
import { useVendors } from "../hooks/use-library";
import { CategoryManagerDialog } from "./category-manager-dialog";
import { VendorSuggestionDialog } from "./vendor-suggestion-dialog";

const FILTER_KEYS = ["q", "category"] as const;

function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Card className="h-full gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold">{vendor.name}</h3>
          <Badge variant="secondary" className="mt-1">{vendor.category}</Badge>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          <Store className="size-4" aria-hidden />
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{vendor.description}</p>
      <p className="flex items-start gap-1.5 text-sm">
        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        {vendor.coverage}
      </p>
      {vendor.note && (
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{vendor.note}</p>
      )}
      <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
        {vendor.website && (
          <Button size="sm" variant="outline" nativeButton={false} render={<a href={`https://${vendor.website}`} target="_blank" rel="noopener noreferrer" />}>
            <Globe data-icon="inline-start" /> Website
          </Button>
        )}
        {vendor.whatsapp && (
          <Button size="sm" variant="outline" nativeButton={false} render={<a href={`https://wa.me/91${vendor.whatsapp}`} target="_blank" rel="noopener noreferrer" />}>
            <MessageCircle data-icon="inline-start" /> WhatsApp
          </Button>
        )}
        {vendor.email && (
          <Button size="icon-sm" variant="outline" aria-label={`Email ${vendor.name}`} nativeButton={false} render={<a href={`mailto:${vendor.email}`} />}>
            <Mail />
          </Button>
        )}
        {vendor.instagram && (
          <Button size="icon-sm" variant="outline" aria-label={`${vendor.name} on Instagram`} nativeButton={false} render={<a href={`https://instagram.com/${vendor.instagram}`} target="_blank" rel="noopener noreferrer" />}>
            <Camera />
          </Button>
        )}
      </div>
    </Card>
  );
}

export function VendorDirectory() {
  const { values, set } = useUrlFilters(FILTER_KEYS);
  const { data, isPending, isError, error, refetch } = useVendors();

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState className="min-h-64" />;

  const q = values.q.trim().toLowerCase();
  const vendors = data.vendors.filter(
    (v) =>
      (!values.category || v.category === values.category) &&
      (!q || `${v.name} ${v.description} ${v.coverage}`.toLowerCase().includes(q)),
  );
  const chips = ["", ...data.categories];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-accent/60 p-4">
        <p className="text-sm">Know a vendor you’d vouch for? Fill in their details!</p>
        <div className="flex gap-2">
          <RoleGuard allow={["admin"]}>
            <CategoryManagerDialog categories={data.categories} />
          </RoleGuard>
          <VendorSuggestionDialog categories={data.categories} />
        </div>
      </div>

      <FilterPanel>
        <SearchInput value={values.q} onChange={(v) => set("q", v)} placeholder="Search vendors" />
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Vendor category">
          {chips.map((category) => {
            const active = values.category === category;
            return (
              <button
                key={category || "all"}
                type="button"
                onClick={() => set("category", category)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
                )}
              >
                {category || "All"}
              </button>
            );
          })}
        </div>
      </FilterPanel>

      {vendors.length === 0 ? (
        <EmptyState icon={Store} title="No vendors here yet" description="Recommend one you have worked with." />
      ) : (
        <>
          <ResultCount count={vendors.length} noun={["vendor", "vendors"]} />
          <Stagger key={`${values.category}-${values.q}`} className="grid gap-4 @2xl/main:grid-cols-2 @5xl/main:grid-cols-3">
            {vendors.map((vendor) => (
              <StaggerItem key={vendor.id}>
                <VendorCard vendor={vendor} />
              </StaggerItem>
            ))}
          </Stagger>
        </>
      )}
    </div>
  );
}
