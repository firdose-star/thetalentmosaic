"use client";

/**
 * Vendor Directory (spec §7.4): alphabetical, filterable by category, and
 * each card opens to every detail — area, phone (copy, WhatsApp, call),
 * website, Instagram and email — each leading to the right app. Only approved
 * vendors appear here. Admins can edit vendors and manage categories.
 */
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Check,
  ChevronDown,
  Copy,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Store,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { FilterPanel, ResultCount, SearchInput } from "@/components/shared/filter-bar";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { RoleGuard } from "@/components/shared/role-guard";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useUrlFilters } from "@/hooks/use-url-filters";
import type { Vendor } from "@/lib/sample-data";
import { cn } from "@/lib/utils";
import { useVendors } from "../hooks/use-library";
import { CategoryManagerDialog } from "./category-manager-dialog";
import { VendorFormDialog } from "./vendor-form-dialog";

const FILTER_KEYS = ["q", "category"] as const;

function DetailRow({ icon: Icon, label, children }: { icon: typeof Globe; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <div className="text-sm wrap-break-word">{children}</div>
      </div>
    </div>
  );
}

function PhoneRow({ phone }: { phone: string }) {
  const { copied, copy } = useCopyToClipboard();
  const display = `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;

  return (
    <DetailRow icon={Phone} label="Phone / WhatsApp">
      <div className="flex flex-wrap items-center gap-1.5">
        <a href={`tel:+91${phone}`} className="font-medium tabular-nums hover:underline">{display}</a>
        <Button size="xs" variant="outline" onClick={() => void copy(`+91${phone}`)} aria-label="Copy number">
          {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button size="xs" nativeButton={false} render={<a href={`https://wa.me/91${phone}`} target="_blank" rel="noopener noreferrer" />}>
          <MessageCircle data-icon="inline-start" />
          WhatsApp
        </Button>
      </div>
    </DetailRow>
  );
}

function VendorCard({ vendor, categories }: { vendor: Vendor; categories: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className={cn("gap-0 overflow-hidden p-0 transition-colors", open && "border-primary/40")}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-5 text-left outline-none hover:bg-accent/40 focus-visible:bg-accent/40"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          <Store className="size-4.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{vendor.name}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{vendor.category}</Badge>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />{vendor.city}
            </span>
          </span>
          {vendor.description && (
            <span className="mt-2 block text-sm text-muted-foreground">{vendor.description}</span>
          )}
        </span>
        <ChevronDown
          className={cn("mt-1 size-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 border-t bg-muted/30 p-5">
              <DetailRow icon={MapPin} label="Location">
                {vendor.city}
                {vendor.area && <span className="block text-muted-foreground">{vendor.area}</span>}
              </DetailRow>
              {vendor.phone && <PhoneRow phone={vendor.phone} />}
              {vendor.website && (
                <DetailRow icon={Globe} label="Website">
                  <a href={`https://${vendor.website}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {vendor.website}
                  </a>
                </DetailRow>
              )}
              {vendor.instagram && (
                <DetailRow icon={Camera} label="Instagram">
                  <a href={`https://instagram.com/${vendor.instagram}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    @{vendor.instagram}
                  </a>
                </DetailRow>
              )}
              {vendor.email && (
                <DetailRow icon={Mail} label="Email">
                  <a href={`mailto:${vendor.email}`} className="font-medium text-primary hover:underline">
                    {vendor.email}
                  </a>
                </DetailRow>
              )}
              {vendor.note && (
                <p className="rounded-lg bg-background px-3 py-2 text-xs text-muted-foreground">{vendor.note}</p>
              )}
              <RoleGuard allow={["admin"]}>
                <div className="flex justify-end">
                  <VendorFormDialog categories={categories} vendor={vendor} />
                </div>
              </RoleGuard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
      (!q || `${v.name} ${v.description} ${v.city} ${v.area}`.toLowerCase().includes(q)),
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
          <VendorFormDialog categories={data.categories} />
        </div>
      </div>

      <FilterPanel>
        <SearchInput value={values.q} onChange={(v) => set("q", v)} placeholder="Search vendors by name, city or area" />
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
          <Stagger key={`${values.category}-${values.q}`} className="grid items-start gap-3 @3xl/main:grid-cols-2">
            {vendors.map((vendor) => (
              <StaggerItem key={vendor.id}>
                <VendorCard vendor={vendor} categories={data.categories} />
              </StaggerItem>
            ))}
          </Stagger>
        </>
      )}
    </div>
  );
}
