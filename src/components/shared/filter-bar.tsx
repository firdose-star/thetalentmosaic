"use client";

/**
 * Building blocks for every filtered list: a search box, labelled selects,
 * and the active-filter chips that make selections "visible and easy to
 * clear" (spec §6.4). Pair with `useUrlFilters`.
 */
import { Search, X } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

export function FilterPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <Card className={cn("gap-3 p-4", className)}>{children}</Card>;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 pl-9"
      />
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  allLabel,
}: {
  label: string;
  value: string;
  options: readonly string[] | { value: string; label: string }[];
  onChange: (value: string) => void;
  /** First option text, e.g. "All cities". Defaults to the label. */
  allLabel?: string;
}) {
  const normalised = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );

  return (
    <NativeSelect
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full"
    >
      <NativeSelectOption value="">{allLabel ?? label}</NativeSelectOption>
      {normalised.map((option) => (
        <NativeSelectOption key={option.value} value={option.value}>
          {option.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

export function ActiveFilters({
  filters,
  onClear,
  onClearAll,
}: {
  filters: ActiveFilter[];
  onClear: (key: string) => void;
  onClearAll: () => void;
}) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <Badge key={filter.key} variant="secondary" className="h-6 gap-1 pr-1">
          <span className="text-muted-foreground">{filter.label}:</span>
          {filter.value}
          <button
            type="button"
            onClick={() => onClear(filter.key)}
            aria-label={`Clear ${filter.label} filter`}
            className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <Button variant="ghost" size="xs" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
  );
}

/** "12 members" — the live count line above every filtered list. */
export function ResultCount({ count, noun }: { count: number; noun: [string, string] }) {
  return (
    <p className="text-sm text-muted-foreground">
      <span className="font-semibold text-foreground tabular-nums">{count}</span>{" "}
      {count === 1 ? noun[0] : noun[1]}
    </p>
  );
}
