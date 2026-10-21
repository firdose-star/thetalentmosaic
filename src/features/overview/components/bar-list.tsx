/**
 * A ranked horizontal bar list — label, bar, value. Each row links to the
 * filtered list behind it, so every number stays clickable (PRD §7).
 */
import Link from "next/link";

export interface BarListRow {
  label: string;
  value: number;
  href: string;
}

export function BarList({ rows }: { rows: BarListRow[] }) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <li key={row.label}>
          <Link
            href={row.href}
            className="group block rounded-md text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate group-hover:text-primary">{row.label}</span>
              <span className="font-semibold tabular-nums">{row.value}</span>
            </span>
            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-chart-2 transition-colors group-hover:bg-primary"
                style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }}
              />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
