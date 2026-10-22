"use client";

/**
 * The member directory (spec §6.2–6.4): search, five filters held in the URL,
 * visible clearable filter chips, and alphabetical cards. Admins get a second
 * tab with the full member records (spec §6.6).
 */
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import Link from "next/link";

import {
  ActiveFilters,
  FilterPanel,
  FilterSelect,
  ResultCount,
  SearchInput,
} from "@/components/shared/filter-bar";
import { MemberAvatar } from "@/components/shared/member-avatar";
import { MemberSince } from "@/components/shared/member-since";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-views";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { ROUTES } from "@/lib/constants";
import { EXPERIENCE_BANDS, SENIORITY_LEVELS } from "@/types/community";
import { usePeople, usePeopleFilterOptions } from "../hooks/use-people";
import { PEOPLE_FILTER_KEYS, type DirectoryMember, type PeopleFilterKey } from "../types";
import { MemberRecordsTable } from "./member-records-table";

const LABELS: Record<PeopleFilterKey, string> = {
  q: "Search",
  city: "City",
  seniority: "Seniority",
  startup: "Startup",
  experience: "Experience",
  hobby: "Hobby",
};

function MemberCard({ member }: { member: DirectoryMember }) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }} className="h-full">
      <Link
        href={`${ROUTES.people}/${member.id}`}
        className="group block h-full rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Card className="h-full items-center gap-2 p-5 text-center transition-colors group-hover:border-primary/40">
          <MemberAvatar name={member.name} className="size-20" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{member.name}</p>
            <p className="truncate text-sm text-muted-foreground">{member.startup}</p>
            <MemberSince joinedOn={member.joinedOn} className="mt-2" />
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

export function PeopleDirectory() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { values, set, clear, clearAll } = useUrlFilters(PEOPLE_FILTER_KEYS);
  const options = usePeopleFilterOptions();
  const people = usePeople(values);

  const active = PEOPLE_FILTER_KEYS.filter((key) => values[key]).map((key) => ({
    key,
    label: LABELS[key],
    value: values[key],
  }));

  const filters = (
    <FilterPanel>
      <SearchInput
        value={values.q}
        onChange={(v) => set("q", v)}
        placeholder="Search by name, startup, designation or city"
      />
      <div className="grid grid-cols-2 gap-2 @2xl/main:grid-cols-3 @5xl/main:grid-cols-5">
        <FilterSelect label="City" allLabel="All cities" value={values.city} options={options.data?.cities ?? []} onChange={(v) => set("city", v)} />
        <FilterSelect label="Seniority" allLabel="All seniority" value={values.seniority} options={SENIORITY_LEVELS} onChange={(v) => set("seniority", v)} />
        <FilterSelect label="Startup" allLabel="All startups" value={values.startup} options={options.data?.startups ?? []} onChange={(v) => set("startup", v)} />
        <FilterSelect label="Experience" allLabel="Any experience" value={values.experience} options={EXPERIENCE_BANDS} onChange={(v) => set("experience", v)} />
        <FilterSelect label="Hobby" allLabel="All hobbies" value={values.hobby} options={options.data?.hobbies ?? []} onChange={(v) => set("hobby", v)} />
      </div>
      <ActiveFilters
        filters={active}
        onClear={(key) => clear(key as PeopleFilterKey)}
        onClearAll={clearAll}
      />
    </FilterPanel>
  );

  const directory = people.isError ? (
    <ErrorState error={people.error} onRetry={() => void people.refetch()} />
  ) : people.isPending ? (
    <LoadingState className="min-h-64" />
  ) : people.data.length === 0 ? (
    <EmptyState
      icon={Users}
      title="No members match these filters"
      description="Try removing a filter or searching for something broader."
    />
  ) : (
    <div className="flex flex-col gap-3">
      <ResultCount count={people.data.length} noun={["member", "members"]} />
      <Stagger
        key={JSON.stringify(values)}
        className="grid grid-cols-2 gap-3 @2xl/main:grid-cols-3 @4xl/main:grid-cols-4 @6xl/main:grid-cols-6"
      >
        {people.data.map((member) => (
          <StaggerItem key={member.id}>
            <MemberCard member={member} />
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );

  return (
    <div id="filters" className="flex scroll-mt-20 flex-col gap-4">
      {filters}
      {isAdmin ? (
        <Tabs defaultValue="directory">
          <TabsList>
            <TabsTrigger value="directory">Directory</TabsTrigger>
            <TabsTrigger value="records">Member records</TabsTrigger>
          </TabsList>
          <TabsContent value="directory" className="mt-3">
            {directory}
          </TabsContent>
          <TabsContent value="records" className="mt-3">
            <MemberRecordsTable filters={values} />
          </TabsContent>
        </Tabs>
      ) : (
        directory
      )}
    </div>
  );
}
