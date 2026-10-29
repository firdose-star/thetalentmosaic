"use client";

/**
 * "Roles for you!": approved roles from the job feed. Role, Location,
 * Employment type, Sort and search live in the URL and go to the API as
 * filters. Admins get a second tab, Listing management.
 */
import { motion } from "framer-motion";
import { Briefcase, Building2, CheckCircle2, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import Link from "next/link";

import {
  ActiveFilters,
  FilterPanel,
  FilterSelect,
  ResultCount,
  SearchInput,
} from "@/components/shared/filter-bar";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { RoleGuard } from "@/components/shared/role-guard";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { ROUTES } from "@/lib/constants";
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  ROLE_FAMILIES,
  ROLE_FAMILY_LABELS,
  type RoleListing,
} from "@/types/roles";

import {
  JOB_FILTER_KEYS,
  REMOTE,
  SORT_OPTIONS,
  checkedText,
  locationText,
  postedText,
  sourceLabel,
  toApiFilters,
  typeText,
  type JobFilterKey,
} from "../filters";
import { useRoles } from "../hooks/use-opportunities";
import { AddFromUrlDialog } from "./add-from-url-dialog";
import { RoleFormDialog } from "./job-form-dialog";
import { ListingManagement } from "./listing-management";

const LABELS: Record<JobFilterKey, string> = {
  role: "Role",
  location: "Location",
  type: "Employment type",
  sort: "Sort",
  q: "Search",
  page: "Page",
};

const FAMILY_OPTIONS = ROLE_FAMILIES.map((f) => ({ value: f, label: ROLE_FAMILY_LABELS[f] }));
const TYPE_OPTIONS = EMPLOYMENT_TYPES.filter((t) => t !== "unknown").map((t) => ({ value: t, label: EMPLOYMENT_TYPE_LABELS[t] }));

function RoleCard({ role }: { role: RoleListing }) {
  const type = typeText(role);
  const checked = checkedText(role);
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }} className="h-full">
      <Link
        href={`${ROUTES.opportunities}/${role.id}`}
        className="group block h-full rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Card className="h-full gap-3 p-5 transition-colors group-hover:border-primary/40">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent text-primary">
              {role.company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- logos come from many hosts
                <img src={role.company.logoUrl} alt="" className="size-full object-contain" />
              ) : (
                <Briefcase className="size-4.5" aria-hidden />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold group-hover:text-primary">{role.title}</h3>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="size-3.5" />
                  {role.company.name}
                  {role.company.ycBatch && <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">YC {role.company.ycBatch}</Badge>}
                </span>
                <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{locationText(role)}</span>
              </p>
            </div>
            {role.salary.text && <Badge variant="outline" className="max-w-40 shrink-0 truncate">{role.salary.text}</Badge>}
          </div>
          {role.description && <p className="line-clamp-2 text-sm text-muted-foreground">{role.description}</p>}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{ROLE_FAMILY_LABELS[role.roleFamily]}</Badge>
            {role.location.remoteMode === "remote" && <Badge variant="secondary">Remote</Badge>}
            {type && <Badge variant="outline">{type}</Badge>}
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{postedText(role)}</span>
            {checked && <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3.5 text-primary" />{checked}</span>}
            <Badge variant="outline" className="ml-auto">{sourceLabel(role)}</Badge>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

export function JobBoard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { values, set, clear, clearAll } = useUrlFilters(JOB_FILTER_KEYS);
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useRoles(toApiFilters(values));

  const filtering = JOB_FILTER_KEYS.some((key) => key !== "sort" && key !== "page" && values[key]);
  const chips = JOB_FILTER_KEYS.filter((key) => key !== "sort" && key !== "page" && values[key]).map((key) => ({
    key,
    label: LABELS[key],
    value:
      key === "role" ? ROLE_FAMILY_LABELS[values.role as keyof typeof ROLE_FAMILY_LABELS] ?? values.role
      : key === "type" ? EMPLOYMENT_TYPE_LABELS[values.type as keyof typeof EMPLOYMENT_TYPE_LABELS] ?? values.type
      : values[key],
  }));
  // Any filter change goes back to page 1.
  const setFilter = (key: JobFilterKey, value: string) => {
    if (values.page) clear("page");
    set(key, value);
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const page = data?.page ?? 1;

  let results;
  if (isError) results = <ErrorState error={error} onRetry={() => void refetch()} />;
  else if (isPending) results = <LoadingState className="min-h-64" />;
  else if (data.roles.length === 0)
    results = (
      <EmptyState
        icon={Briefcase}
        title={filtering ? "No roles match these filters" : "No roles posted yet"}
        description={filtering ? "Try removing a filter." : "Roles appear here once the team has checked them."}
      />
    );
  else
    results = (
      <div className={isPlaceholderData ? "opacity-60 transition-opacity" : undefined}>
        <ResultCount count={data.total} noun={["role", "roles"]} />
        <Stagger key={JSON.stringify(values)} className="mt-3 grid gap-4 @3xl/main:grid-cols-2">
          {data.roles.map((role) => (
            <StaggerItem key={role.id}>
              <RoleCard role={role} />
            </StaggerItem>
          ))}
        </Stagger>
        {pages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => set("page", page - 1 > 1 ? String(page - 1) : "")}>
              <ChevronLeft data-icon="inline-start" />Previous
            </Button>
            <span className="text-muted-foreground">Page {page} of {pages}</span>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => set("page", String(page + 1))}>
              Next<ChevronRight data-icon="inline-end" />
            </Button>
          </div>
        )}
      </div>
    );

  const board = (
    <div className="flex flex-col gap-4">
      {/* Until the first role is approved, point admins at the queue. */}
      {isAdmin && data && data.total === 0 && !filtering && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-accent/60 p-3 text-sm">
          <span>No approved roles yet — approve collected roles under Listing management, or add one yourself.</span>
          <div className="flex gap-2">
            <AddFromUrlDialog />
            <RoleFormDialog />
          </div>
        </div>
      )}
      <FilterPanel>
        <SearchInput value={values.q} onChange={(v) => setFilter("q", v)} placeholder="Search by title or company" />
        <div className="grid grid-cols-2 gap-2 @3xl/main:grid-cols-4">
          <FilterSelect label="Role" allLabel="All roles" value={values.role} options={FAMILY_OPTIONS} onChange={(v) => setFilter("role", v)} />
          <FilterSelect label="Location" allLabel="All locations" value={values.location} options={[REMOTE, ...(data?.cities ?? [])]} onChange={(v) => setFilter("location", v)} />
          <FilterSelect label="Employment type" allLabel="All employment types" value={values.type} options={TYPE_OPTIONS} onChange={(v) => setFilter("type", v)} />
          <NativeSelect aria-label="Sort" value={values.sort || "newest"} onChange={(e) => setFilter("sort", e.target.value === "newest" ? "" : e.target.value)} className="w-full">
            {SORT_OPTIONS.map((o) => (
              <NativeSelectOption key={o.value} value={o.value}>{`Sort: ${o.label}`}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <ActiveFilters filters={chips} onClear={(key) => clear(key as JobFilterKey)} onClearAll={clearAll} />
      </FilterPanel>
      {results}
    </div>
  );

  if (!isAdmin) return board;

  return (
    <Tabs defaultValue="board">
      <TabsList>
        <TabsTrigger value="board">Roles</TabsTrigger>
        <TabsTrigger value="manage">Listing management</TabsTrigger>
      </TabsList>
      <TabsContent value="board" className="mt-3">{board}</TabsContent>
      <TabsContent value="manage" className="mt-3">
        <RoleGuard allow={["admin"]}><ListingManagement /></RoleGuard>
      </TabsContent>
    </Tabs>
  );
}
