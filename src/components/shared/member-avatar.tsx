"use client";

/**
 * A member's face. Shows their real photograph (from the Community Form) when
 * there is one and it loads; otherwise an illustrated portrait generated from
 * the name, so the same person always looks the same.
 *
 * Photos are Google Drive uploads. They only display if the files are shared
 * as "Anyone with the link" — when they aren't, the illustration shows.
 */
import { useState } from "react";

import { memberPhoto } from "@/lib/sample-data";
import { cn } from "@/lib/utils";

const SKIN = ["#F1C9A5", "#E3A982", "#C98B62", "#A8683F", "#7A4A2B", "#F6D9BF"];
const HAIR = ["#1F1A17", "#3A2418", "#6B4423", "#B5651D", "#8C8C8C", "#0B0B0B"];
const SHIRT = ["#11403B", "#6ED190", "#F6AF65", "#0B2E2A", "#4C9A78", "#D4E86F"];
const BACKGROUND = ["#E4F3E7", "#C9EBD3", "#FDF0DE", "#EEF3C8", "#D4E9DD"];

/** FNV-1a, salted per feature so skin, hair and shirt vary independently. */
function hash(name: string, salt: number) {
  let h = 2166136261 + salt * 977;
  for (const char of name) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hairPath(style: number, colour: string) {
  switch (style) {
    case 0:
      return <path d="M19 30c-1-13 6-20 13-20s14 7 13 20c-2-6-5-9-13-9s-11 3-13 9z" fill={colour} />;
    case 1:
      return <path d="M17 38c-3-18 5-28 15-28s18 10 15 28c0 5-1 9-3 12-1-9-2-19-12-19s-11 10-12 19c-2-3-3-7-3-12z" fill={colour} />;
    case 2:
      return (
        <>
          <circle cx="32" cy="9" r="6" fill={colour} />
          <path d="M19 29c0-11 6-17 13-17s13 6 13 17c-3-6-6-8-13-8s-10 2-13 8z" fill={colour} />
        </>
      );
    case 3:
      return <path d="M20 27c1-9 6-14 12-14s11 5 12 14c-4-4-8-5-12-5s-8 1-12 5z" fill={colour} />;
    default:
      return <path d="M19 28c1-10 6-16 13-16 8 0 13 6 13 16-2-3-4-4-6-4-3 2-9 2-14-1-2 0-5 2-6 5z" fill={colour} />;
  }
}

function Illustration({ name }: { name: string }) {
  const skin = SKIN[hash(name, 1) % SKIN.length];
  const hair = HAIR[hash(name, 2) % HAIR.length];
  const shirt = SHIRT[hash(name, 3) % SHIRT.length];
  const background = BACKGROUND[hash(name, 4) % BACKGROUND.length];
  return (
    <svg viewBox="0 0 64 64" className="size-full">
      <rect width="64" height="64" fill={background} />
      <path d="M6 66c2-13 12-19 26-19s24 6 26 19z" fill={shirt} />
      <rect x="27" y="40" width="10" height="12" rx="3" fill={skin} />
      <ellipse cx="32" cy="30" rx="12" ry="14" fill={skin} />
      {hairPath(hash(name, 5) % 5, hair)}
      <circle cx="27.5" cy="33" r="1.5" fill="#2B2B2B" />
      <circle cx="36.5" cy="33" r="1.5" fill="#2B2B2B" />
      <path d="M27.5 39q4.5 4 9 0" stroke="#7A3E2B" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function MemberAvatar({
  name,
  src,
  className,
}: {
  name: string;
  /** Explicit photo; defaults to the member's Community Form photo. */
  src?: string | null;
  className?: string;
}) {
  const photo = src === undefined ? memberPhoto(name) : src;
  const [failed, setFailed] = useState<string | null>(null);
  const showPhoto = photo && failed !== photo;

  return (
    <span className={cn("relative inline-flex size-9 shrink-0 overflow-hidden rounded-full bg-muted", className)} aria-hidden>
      <Illustration name={name} />
      {showPhoto && (
        // eslint-disable-next-line @next/next/no-img-element -- member photos come from Google Drive, not our domain
        <img
          src={photo}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(photo)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </span>
  );
}
