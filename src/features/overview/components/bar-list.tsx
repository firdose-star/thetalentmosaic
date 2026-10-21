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
    <ul className="flex flex-col gap-1">
      {rows.map((row) => (
        <li key={row.label}>
          <Link
            href={row.href}
            className="group grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3 rounded-md py-1.5 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="truncate">{row.label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-chart-2 transition-colors group-hover:bg-primary"
                style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }}
              />
            </span>
            <span className="text-right font-semibold tabular-nums">{row.value}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
