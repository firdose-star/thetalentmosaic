"use client";

/**
 * "Roles for you!" (spec §8.2–8.4): ten filters plus sorting, all in the URL,
 * and cards carrying everything spec §8.3 lists. Admins get a second tab for
 * listing management (spec §8.8).
 */
import { motion } from "framer-motion";
import { Briefcase, Building2, Clock, MapPin, RefreshCw } from "lucide-react";
import Link from "next/link";

import {
  ActiveFilters,
  FilterPanel,
  FilterSelect,
  ResultCount,
  SearchInput,
} from "@/components/shared/filter-bar";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { ROUTES } from "@/lib/constants";
import { HR_FUNCTIONS, SENIORITY_LEVELS, type JobListing } from "@/types/community";
import {
  JOB_FILTER_KEYS,
  POSTED_OPTIONS,
  SALARY_OPTIONS,
  SORT_OPTIONS,
  checkedText,
  filterJobs,
  postedText,
  type JobFilterKey,
} from "../filters";
import { useOpportunities } from "../hooks/use-opportunities";
import { ListingManagement } from "./listing-management";

const LABELS: Record<JobFilterKey, string> = {
  q: "Keyword",
  location: "Location",
  arrangement: "Work arrangement",
  function: "HR function",
  seniority: "Seniority",
  company: "Company",
  type: "Employment type",
  posted: "Date posted",
  source: "Source",
  salary: "Salary",
  sort: "Sort",
};

const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

function JobCard({ job }: { job: JobListing }) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }} className="h-full">
      <Link
        href={`${ROUTES.opportunities}/${job.id}`}
        className="group block h-full rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Card className="h-full gap-3 p-5 transition-colors group-hover:border-primary/40">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
              <Briefcase className="size-4.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold group-hover:text-primary">{job.title}</h3>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Building2 className="size-3.5" />{job.company}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{job.location}</span>
              </p>
            </div>
            {job.salary && <Badge variant="outline" className="shrink-0">{job.salary}</Badge>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{job.hrFunction}</Badge>
            <Badge variant="secondary">{job.seniority}</Badge>
            <Badge variant="outline">{job.arrangement}</Badge>
            <Badge variant="outline">{job.type}</Badge>
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{postedText(job.postedDaysAgo)}</span>
            <span className="inline-flex items-center gap-1"><RefreshCw className="size-3.5" />{checkedText(job.lastCheckedDaysAgo)}</span>
            <span className="ml-auto">via {job.source}</span>
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
  const { data, isPending, isError, error, refetch } = useOpportunities();

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState className="min-h-64" />;

  const active = data.filter((j) => j.status === "active");
  const jobs = filterJobs(active, values);
  const chips = JOB_FILTER_KEYS.filter((key) => key !== "sort" && values[key]).map((key) => ({
    key,
    label: LABELS[key],
    value:
      key === "posted"
        ? (POSTED_OPTIONS.find((o) => o.value === values.posted)?.label ?? values.posted)
        : key === "salary"
          ? "Disclosed"
          : values[key],
  }));

  const board = (
    <div className="flex flex-col gap-4">
      <FilterPanel>
        <div className="flex flex-col gap-2 @2xl/main:flex-row">
          <SearchInput value={values.q} onChange={(v) => set("q", v)} placeholder="Keyword: title, company or function" className="flex-1" />
          <NativeSelect aria-label="Sort" value={values.sort || "newest"} onChange={(e) => set("sort", e.target.value === "newest" ? "" : e.target.value)} className="@2xl/main:w-48">
            {SORT_OPTIONS.map((o) => (
              <NativeSelectOption key={o.value} value={o.value}>{o.label}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="grid grid-cols-2 gap-2 @2xl/main:grid-cols-3 @5xl/main:grid-cols-5">
          <FilterSelect label="Location" allLabel="All locations" value={values.location} options={unique(active.map((j) => j.location))} onChange={(v) => set("location", v)} />
          <FilterSelect label="Work arrangement" allLabel="Remote, hybrid or on-site" value={values.arrangement} options={["Remote", "Hybrid", "On-site"]} onChange={(v) => set("arrangement", v)} />
          <FilterSelect label="HR function" allLabel="All HR functions" value={values.function} options={HR_FUNCTIONS} onChange={(v) => set("function", v)} />
          <FilterSelect label="Seniority" allLabel="All seniority" value={values.seniority} options={SENIORITY_LEVELS} onChange={(v) => set("seniority", v)} />
          <FilterSelect label="Company" allLabel="All companies" value={values.company} options={unique(active.map((j) => j.company))} onChange={(v) => set("company", v)} />
          <FilterSelect label="Employment type" allLabel="All employment types" value={values.type} options={["Full-time", "Contract", "Internship"]} onChange={(v) => set("type", v)} />
          <FilterSelect label="Date posted" allLabel="Any time" value={values.posted} options={POSTED_OPTIONS} onChange={(v) => set("posted", v)} />
          <FilterSelect label="Source" allLabel="All sources" value={values.source} options={unique(active.map((j) => j.source))} onChange={(v) => set("source", v)} />
          <FilterSelect label="Salary" allLabel="Any salary" value={values.salary} options={SALARY_OPTIONS} onChange={(v) => set("salary", v)} />
        </div>
        <ActiveFilters filters={chips} onClear={(key) => clear(key as JobFilterKey)} onClearAll={clearAll} />
      </FilterPanel>

      {jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No roles match these filters" description="Try widening the date range or removing a filter." />
      ) : (
        <>
          <ResultCount count={jobs.length} noun={["role", "roles"]} />
          <Stagger key={JSON.stringify(values)} className="grid gap-4 @3xl/main:grid-cols-2">
            {jobs.map((job) => (
              <StaggerItem key={job.id}>
                <JobCard job={job} />
              </StaggerItem>
            ))}
          </Stagger>
        </>
      )}
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
      <TabsContent value="manage" className="mt-3"><ListingManagement /></TabsContent>
    </Tabs>
  );
}
