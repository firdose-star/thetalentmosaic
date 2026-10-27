"use client";

/**
 * Data & Integrations (PRD §7, §10): where community data comes from and what
 * went wrong. Connected sources with live row counts and manual re-sync,
 * member-sheet updates to apply or skip, file imports (map columns, validate,
 * preview, import, report failed rows) and the error monitor.
 */
import { AlertTriangle, CheckCircle2, CircleAlert, FileUp, RefreshCw, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Section } from "@/components/shared/section";
import { ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAdminActions, useAdminData } from "../hooks/use-admin";
import type { AdminData } from "../services/admin.service";

const STATUS = {
  ok: { label: "Healthy", tone: "bg-accent text-primary", icon: CheckCircle2 },
  warn: { label: "Needs attention", tone: "bg-chart-3/20 text-foreground", icon: AlertTriangle },
  bad: { label: "Failing", tone: "bg-destructive/10 text-destructive", icon: CircleAlert },
};

function syncedText(minutes: number) {
  if (minutes < 1) return "Synced just now";
  if (minutes < 60) return `Synced ${minutes} min ago`;
  return `Synced ${Math.round(minutes / 60)} h ago`;
}

function Sources({ data }: { data: AdminData }) {
  const { resync } = useAdminActions();
  return (
    <div className="grid gap-3 @3xl/main:grid-cols-2 @6xl/main:grid-cols-4">
      {data.sources.map((s) => {
        const st = STATUS[s.status];
        return (
          <Card key={s.id} className="gap-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.type}</p>
              </div>
              <Badge className={st.tone}><st.icon data-icon="inline-start" />{st.label}</Badge>
            </div>
            <p className="text-sm">{s.rows}</p>
            <p className="text-xs text-muted-foreground">{syncedText(s.minutesSinceSync)} · {s.schedule}</p>
            <Button size="sm" variant="outline" className="mt-1 w-fit" onClick={() => resync.mutate({ id: s.id })} disabled={resync.isPending}>
              <RefreshCw data-icon="inline-start" />
              Re-sync now
            </Button>
          </Card>
        );
      })}
    </div>
  );
}

function SheetUpdates({ data }: { data: AdminData }) {
  const { applyImport, skipImport } = useAdminActions();
  return (
    <Section
      title="Updates from the member sheet"
      description="The sheet has changed these fields. Nothing changes in the CRM until you apply it."
      actions={
        data.importUpdates.length > 1 ? (
          <Button size="sm" onClick={() => applyImport.mutate({ ids: data.importUpdates.map((u) => u.id) })}>Apply all {data.importUpdates.length}</Button>
        ) : null
      }
    >
      {data.importUpdates.length === 0 ? (
        <p className="text-sm text-muted-foreground">The CRM matches the sheet. ✨</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {data.importUpdates.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
              <p className="min-w-0 flex-1 text-sm">
                <span className="font-medium">{u.memberName}</span> · {u.label}:{" "}
                <span className="text-muted-foreground line-through">{u.current}</span> → <span className="font-medium">{u.to}</span>
              </p>
              <Button size="sm" onClick={() => applyImport.mutate({ ids: [u.id] })}>Apply</Button>
              <Button size="sm" variant="ghost" onClick={() => skipImport.mutate({ id: u.id })}>Skip</Button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

const TARGETS = [
  { key: "name", label: "Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "startup", label: "Startup", required: false },
  { key: "city", label: "City", required: false },
  { key: "designation", label: "Designation", required: false },
] as const;
type Target = (typeof TARGETS)[number]["key"];

/** Minimal CSV parser — handles quoted fields with commas. */
function parseCsv(text: string) {
  const rows = text.trim().split(/\r?\n/).map((line) => {
    const cells: string[] = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"' && line[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = !quoted;
      else if (c === "," && !quoted) { cells.push(cell.trim()); cell = ""; }
      else cell += c;
    }
    cells.push(cell.trim());
    return cells;
  });
  return { header: rows[0] ?? [], body: rows.slice(1).filter((r) => r.some(Boolean)) };
}

function FileImport({ data }: { data: AdminData }) {
  const { importMembers } = useAdminActions();
  const [file, setFile] = useState<{ name: string; header: string[]; body: string[][] } | null>(null);
  const [map, setMap] = useState<Record<Target, string>>({ name: "", email: "", startup: "", city: "", designation: "" });
  const [inputKey, setInputKey] = useState(0);

  async function pick(f: File | undefined) {
    if (!f) return;
    const { header, body } = parseCsv(await f.text());
    // Auto-map columns whose header matches a field name.
    const guess = Object.fromEntries(
      TARGETS.map((t) => [t.key, String(header.findIndex((h) => h.toLowerCase().includes(t.key === "designation" ? "design" : t.key)))]),
    ) as Record<Target, string>;
    setMap(Object.fromEntries(Object.entries(guess).map(([k, v]) => [k, v === "-1" ? "" : v])) as Record<Target, string>);
    setFile({ name: f.name, header, body });
  }

  const existing = new Set(data.members.map((m) => m.email.toLowerCase()));
  const rows = (file?.body ?? []).map((cells, i) => {
    const get = (k: Target) => (map[k] === "" ? "" : (cells[Number(map[k])] ?? ""));
    const row = { name: get("name"), email: get("email"), startup: get("startup"), city: get("city"), designation: get("designation") };
    const errors: string[] = [];
    if (!row.name) errors.push("Missing name");
    if (!/^\S+@\S+\.\S+$/.test(row.email)) errors.push("Invalid email");
    else if (existing.has(row.email.toLowerCase())) errors.push("Already a member");
    return { line: i + 2, row, errors };
  });
  const valid = rows.filter((r) => r.errors.length === 0);
  const failed = rows.filter((r) => r.errors.length > 0);
  const reset = () => { setFile(null); setInputKey((k) => k + 1); };

  return (
    <Section title="Import members from a file" description="CSV from Google Sheets or Excel. Map the columns, check the preview, then import the valid rows.">
      <input key={inputKey} id="import-file" type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => void pick(e.target.files?.[0])} />
      {!file ? (
        <label htmlFor="import-file" className={cn(buttonVariants({ variant: "outline" }), "w-fit cursor-pointer")}>
          <FileUp data-icon="inline-start" />
          Choose a CSV file
        </label>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm"><span className="font-medium">{file.name}</span> · {file.body.length} rows · {file.header.length} columns</p>
          <div className="grid grid-cols-2 gap-2 @3xl/main:grid-cols-5">
            {TARGETS.map((t) => (
              <label key={t.key} className="flex flex-col gap-1 text-xs">
                <span className="font-medium">{t.label}{t.required && " *"}</span>
                <NativeSelect size="sm" value={map[t.key]} onChange={(e) => setMap({ ...map, [t.key]: e.target.value })} className="w-full">
                  <NativeSelectOption value="">Not in file</NativeSelectOption>
                  {file.header.map((h, i) => <NativeSelectOption key={`${h}-${i}`} value={String(i)}>{h || `Column ${i + 1}`}</NativeSelectOption>)}
                </NativeSelect>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <Badge className="bg-accent text-primary">{valid.length} ready to import</Badge>
            {failed.length > 0 && <Badge className="bg-destructive/10 text-destructive">{failed.length} failed rows</Badge>}
          </div>

          <Card className="max-h-72 overflow-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Row</TableHead>
                  {TARGETS.map((t) => <TableHead key={t.key}>{t.label}</TableHead>)}
                  <TableHead>Check</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 50).map((r) => (
                  <TableRow key={r.line} className={cn(r.errors.length && "bg-destructive/5")}>
                    <TableCell className="text-xs text-muted-foreground">{r.line}</TableCell>
                    {TARGETS.map((t) => <TableCell key={t.key} className="text-xs">{r.row[t.key] || "—"}</TableCell>)}
                    <TableCell className="text-xs">{r.errors.length ? <span className="text-destructive">{r.errors.join(", ")}</span> : <span className="text-primary">OK</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="flex gap-2">
            <Button
              disabled={valid.length === 0 || importMembers.isPending}
              onClick={() => importMembers.mutate({ rows: valid.map((r) => r.row), fileName: file.name }, { onSuccess: reset })}
            >
              <Upload data-icon="inline-start" />
              Import {valid.length} members
            </Button>
            <Button variant="ghost" onClick={reset}>Cancel</Button>
          </div>
        </div>
      )}
    </Section>
  );
}

function ErrorMonitor({ data }: { data: AdminData }) {
  const { resolveIssue } = useAdminActions();
  return (
    <Section
      title="Error monitor"
      description="Sync failures and warnings from every source."
      actions={<Button size="sm" variant="ghost" nativeButton={false} render={<Link href={ROUTES.opportunities} />}>Job feed details</Button>}
    >
      {data.issues.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open issues. ✨</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.issues.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-muted px-3 py-2 text-sm">
              {i.severity === "error" ? <CircleAlert className="size-4 text-destructive" /> : <AlertTriangle className="size-4 text-chart-3" />}
              <span className="min-w-0 flex-1">
                <span className="font-medium">{i.source}</span> <span className="text-muted-foreground">· {i.at}</span>
                <span className="block text-muted-foreground">{i.message}</span>
              </span>
              <Button size="sm" variant="outline" onClick={() => resolveIssue.mutate({ id: i.id })}>Mark resolved</Button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** What the Community Form import did, and what still needs fixing. */
function CommunityFormReport({ data }: { data: AdminData }) {
  const r = data.source.report;
  if (data.source.kind !== "community-form" || !r) {
    return (
      <Section title="Community Form" description="Not connected — the dashboard is showing sample members.">
        <p className="text-sm text-muted-foreground">
          Put the form export at <code className="rounded bg-muted px-1">data/community-form.csv</code> and reload to see the real community.
        </p>
      </Section>
    );
  }
  const list = (names: string[]) => (names.length ? names.join(", ") : "None");
  const rows: [string, string | number, string][] = [
    ["Form responses", r.fileRows, "Rows in the export"],
    ["Members imported", r.imported, `${r.merged.length} people submitted more than once — merged, keeping their first joining date`],
    ["Merged submissions", r.merged.length, list(r.merged.map((m) => `${m.name} (${m.submissions})`))],
    ["Birthdays not usable", r.invalid.birthday.length, list(r.invalid.birthday)],
    ["LinkedIn not a profile link", r.invalid.linkedin.length, list(r.invalid.linkedin)],
    ["WhatsApp missing", r.missingWhatsapp, `${r.invalid.whatsapp.length} more not a valid mobile: ${list(r.invalid.whatsapp)}`],
    ["Years in HR missing", r.missingYoe, "The form column is empty for everyone"],
    ["Opted out of the directory", r.directoryConsentNo.length, `Hidden from members, visible to admins: ${list(r.directoryConsentNo)}`],
    ["Events named in the form", r.events.length, list(r.events)],
  ];

  return (
    <Section
      title="Community Form"
      description={`Live source for members · imported ${new Date(data.source.importedAt ?? "").toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`}
      actions={<Badge className="bg-accent text-primary">Connected</Badge>}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 text-sm">
          {Object.entries(r.addedToCommunity).map(([k, v]) => (
            <Badge key={k} variant="outline">Added to community: {k} · {v}</Badge>
          ))}
        </div>
        <ul className="flex flex-col divide-y">
          {rows.map(([label, n, detail]) => (
            <li key={label} className="grid gap-1 py-2 text-sm first:pt-0 last:pb-0 @3xl/main:grid-cols-[14rem_4rem_1fr]">
              <span className="font-medium">{label}</span>
              <span className="tabular-nums">{n}</span>
              <span className="text-muted-foreground">{detail}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Fix any of these in Member Management › Missing data; the form itself stays untouched. Re-export the form and reload to pick up new responses.
        </p>
      </div>
    </Section>
  );
}

export function DataIntegrations() {
  const { data, isPending, isError, error, refetch } = useAdminData();
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState className="min-h-64" />;

  return (
    <div className="flex flex-col gap-4">
      <CommunityFormReport data={data} />
      <Sources data={data} />
      <div className="grid items-start gap-4 @5xl/main:grid-cols-2">
        <SheetUpdates data={data} />
        <ErrorMonitor data={data} />
      </div>
      <FileImport data={data} />
    </div>
  );
}
