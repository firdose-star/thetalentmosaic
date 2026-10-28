"use client";

/**
 * Event photos, shown in the app (never a link out to Drive):
 *  - EventHero: the Moments picture, large; tap it to browse the photos.
 *    Admins can upload photos and remove any of them, the cover included.
 *  - EventPhotos: the hand-picked best of the day (up to 30); tap to view.
 *  - EventCover: the compact version for timeline cards.
 *
 * Members only ever see the Moments picture and the photos an admin picked —
 * not repeated, sharp, two or three clear faces, easy to read. Admins pick
 * them from the whole folder, best-scored first with burst shots left out.
 */
import { Check, ChevronLeft, ChevronRight, ImageOff, Images, LayoutGrid, Plus, Star, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { BEST_MAX, photoUrl, type EventAlbum, type PhotoSize } from "@/lib/event-photos";
import { cn } from "@/lib/utils";
import type { CommunityEvent } from "@/types/community";
import { useEventAlbum, useSaveHighlights, useUploadPhotos } from "../hooks/use-events";

type PhotoEvent = Pick<CommunityEvent, "title" | "momentsUrl" | "photosUrl">;

/** What the gallery shows: every photo as a grid, one photo full size, or the admin picker. */
type GalleryView = { mode: "grid" } | { mode: "photo"; index: number } | { mode: "pick" } | null;

/** The photos members see, in order: the Moments picture, then the picks. */
const shown = (album: EventAlbum) => [...(album.hero ? [album.hero] : []), ...album.best];

function Photo({ id, size = "thumb", alt = "", className }: { id: string; size?: PhotoSize; alt?: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- served by /api/drive/image, already sized and cached
    <img src={photoUrl(id, size)} alt={alt} loading="lazy" decoding="async" className={cn("bg-muted object-cover", className)} />
  );
}

const tile = "block overflow-hidden rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** A Google Drive photo link (or bare id) → its file id. */
function driveFileId(link: string) {
  const v = link.trim();
  return v.match(/\/file\/d\/([\w-]{10,})/)?.[1] ?? v.match(/[?&]id=([\w-]{10,})/)?.[1] ?? (/^[\w-]{20,}$/.test(v) ? v : null);
}

/** Admin: save a new list of photos for an event (add, remove or reorder), and optionally what's removed. */
function useSavePhotos(event: PhotoEvent) {
  const save = useSaveHighlights();
  return {
    isPending: save.isPending,
    save: (album: EventAlbum, ids: string[], onSuccess?: () => void, hidden?: string[]) => {
      if (album.albumKey) save.mutate({ albumKey: album.albumKey, ids, hidden, title: event.title }, { onSuccess });
    },
  };
}

/** Admin: pick photos from this computer and upload them; hands back the new ids. */
function UploadPhotosButton({ event, room, onUploaded }: { event: PhotoEvent; room: number; onUploaded: (ids: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadPhotos();
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const files = [...(e.target.files ?? [])].slice(0, room);
          e.target.value = "";
          if (files.length) upload.mutate({ files, title: event.title }, { onSuccess: ({ ids }) => ids.length && onUploaded(ids) });
        }}
      />
      <Button size="sm" variant="outline" onClick={() => input.current?.click()} disabled={upload.isPending || room <= 0}>
        <Upload data-icon="inline-start" />
        {upload.isPending ? "Uploading…" : "Upload photos"}
      </Button>
    </>
  );
}

// ── Gallery ─────────────────────────────────────────────────────────────────

function PhotoGallery({
  event,
  album,
  view,
  onViewChange,
}: {
  event: PhotoEvent;
  album: EventAlbum;
  view: GalleryView;
  onViewChange: (view: GalleryView) => void;
}) {
  const isAdmin = useAuth().user?.role === "admin";
  const save = useSavePhotos(event);
  const [picks, setPicks] = useState<string[]>(album.best);
  const [link, setLink] = useState("");
  const linkId = driveFileId(link);
  const photos = shown(album);
  const index = view?.mode === "photo" ? view.index : -1;
  const step = (by: number) => onViewChange({ mode: "photo", index: (index + by + photos.length) % photos.length });

  useEffect(() => {
    if (index < 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onViewChange({ mode: "photo", index: (index + 1) % photos.length });
      if (e.key === "ArrowLeft") onViewChange({ mode: "photo", index: (index - 1 + photos.length) % photos.length });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, onViewChange]);

  const toggle = (id: string) =>
    setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < BEST_MAX ? [...p, id] : p));

  function savePicks() {
    // Picking a removed photo again brings it back.
    save.save(album, picks, () => onViewChange({ mode: "grid" }), album.hidden.filter((id) => !picks.includes(id)));
  }

  function addLink() {
    if (!linkId) return;
    setPicks((p) => (p.includes(linkId) || p.length >= BEST_MAX ? p : [...p, linkId]));
    setLink("");
  }

  /** The current photo, removed straight away — the Moments picture included. */
  function removeShown() {
    const id = photos[index];
    const rest = album.best.filter((x) => x !== id);
    const left = photos.length - 1;
    setPicks(rest);
    save.save(
      album,
      rest,
      () => onViewChange(left ? { mode: "photo", index: Math.min(index, left - 1) } : null),
      id === album.hero ? [...album.hidden, id] : undefined,
    );
  }

  // Picker order: photos added by link first, then the folder best-first.
  const pickable = [...picks.filter((id) => !album.candidates.includes(id)), ...album.candidates];

  const description =
    view?.mode === "photo"
      ? `Photo ${index + 1} of ${photos.length}`
      : view?.mode === "pick"
        ? `${picks.length} of ${BEST_MAX} picked · best-scored first, repeats left out`
        : `${photos.length} photos`;

  return (
    <Dialog open={view !== null} onOpenChange={(open) => !open && onViewChange(null)}>
      <DialogContent className="flex h-[92svh] w-[96vw] max-w-none flex-col gap-3 p-4 sm:max-w-6xl">
        <DialogHeader className="pr-10">
          <DialogTitle>{view?.mode === "pick" ? `Pick the photos for ${event.title}` : event.title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {view?.mode === "photo" ? (
          <div className="relative flex min-h-0 flex-1 items-center justify-center rounded-lg bg-black">
            <Photo key={photos[index]} id={photos[index]} size="large" alt={`${event.title}, photo ${index + 1}`} className="max-h-full max-w-full bg-transparent object-contain" />
            {photos.length > 1 && (
              <>
                <Button size="icon" variant="secondary" className="absolute left-2 rounded-full opacity-90" onClick={() => step(-1)} aria-label="Previous photo">
                  <ChevronLeft />
                </Button>
                <Button size="icon" variant="secondary" className="absolute right-2 rounded-full opacity-90" onClick={() => step(1)} aria-label="Next photo">
                  <ChevronRight />
                </Button>
                <Button size="sm" variant="secondary" className="absolute top-2 left-2 opacity-90" onClick={() => onViewChange({ mode: "grid" })}>
                  <LayoutGrid data-icon="inline-start" />
                  All photos
                </Button>
              </>
            )}
            {isAdmin && album.albumKey && (
              <Button size="sm" variant="destructive" className="absolute top-2 right-2" onClick={removeShown} disabled={save.isPending}>
                <Trash2 data-icon="inline-start" />
                Remove from event
              </Button>
            )}
          </div>
        ) : view?.mode === "pick" ? (
          <>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addLink();
              }}
            >
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Add a photo by Google Drive link (shared as 'Anyone with the link')" aria-label="Google Drive photo link" />
              <Button type="submit" variant="outline" disabled={!linkId || picks.length >= BEST_MAX}>
                <Plus data-icon="inline-start" />
                Add
              </Button>
              <UploadPhotosButton
                event={event}
                room={BEST_MAX - picks.length}
                onUploaded={(ids) => setPicks((p) => [...p, ...ids.filter((id) => !p.includes(id))].slice(0, BEST_MAX))}
              />
            </form>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {pickable.map((id, i) => {
                  const picked = picks.includes(id);
                  return (
                    <li key={id} className="relative">
                      <button
                        type="button"
                        onClick={() => toggle(id)}
                        className={cn(tile, "aspect-4/3 w-full", picked ? "ring-3 ring-primary" : "opacity-80 hover:opacity-100")}
                        aria-pressed={picked}
                        aria-label={`${picked ? "Remove" : "Pick"} photo ${i + 1}`}
                      >
                        <Photo id={id} className="size-full" />
                      </button>
                      {picked && (
                        <span className="pointer-events-none absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-4" />
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
              <span className="mr-auto text-xs text-muted-foreground">
                Pick 20–30: not repeated, sharp, two or three clear faces, easy to understand.
                {album.ranking === "scoring" && " Still ranking this folder — the order improves in a minute."}
              </span>
              <Button variant="ghost" size="sm" onClick={() => { setPicks(album.best); onViewChange({ mode: "grid" }); }}>Cancel</Button>
              <Button size="sm" onClick={savePicks} disabled={save.isPending}>
                Save {picks.length} photos
              </Button>
            </div>
          </>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {photos.map((id, i) => (
                <li key={id}>
                  <button type="button" onClick={() => onViewChange({ mode: "photo", index: i })} className={cn(tile, "aspect-4/3 w-full")} aria-label={`Open photo ${i + 1}`}>
                    <Photo id={id} className="size-full transition-transform hover:scale-[1.03]" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Hero, photos, cover ─────────────────────────────────────────────────────

function HeroImage({ album, title, onOpen, className }: { album: EventAlbum; title: string; onOpen: () => void; className?: string }) {
  if (!album.hero) return null;
  const count = shown(album).length;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn("group relative block w-full overflow-hidden rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", className)}
      aria-label={`See the photos from ${title}`}
    >
      <Photo id={album.hero} size="large" alt={`${title} — moments`} className="size-full transition-transform duration-500 group-hover:scale-[1.02]" />
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/60 to-transparent" />
      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
        <Images className="size-4" />
        {count > 1 ? `View ${count} photos` : "View photo"}
      </span>
    </button>
  );
}

function PhotosUnavailable() {
  return (
    <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <ImageOff className="size-4" />
      Photos couldn&apos;t load — check the Drive folder is shared as &ldquo;Anyone with the link&rdquo;.
    </p>
  );
}

/** Event page: the Moments picture, large. */
export function EventHero({ event }: { event: PhotoEvent }) {
  const { data: album, isPending, isError } = useEventAlbum(event);
  const photos = useSavePhotos(event);
  const isAdmin = useAuth().user?.role === "admin";
  const [view, setView] = useState<GalleryView>(null);
  if (!event.momentsUrl && !event.photosUrl) return null;
  if (isError) return <PhotosUnavailable />;
  if (isPending) return <Skeleton className="aspect-21/9 w-full rounded-xl" />;
  if (!album.hero) return null;
  const hero = album.hero;
  return (
    <>
      <div className="relative">
        <HeroImage album={album} title={event.title} onOpen={() => setView({ mode: "grid" })} className="aspect-video max-h-[28rem] @4xl/main:aspect-21/9" />
        {isAdmin && album.albumKey && (
          <Button
            size="sm"
            variant="destructive"
            className="absolute top-3 right-3 opacity-90 shadow hover:opacity-100"
            // Removing the cover hides it; the next photo becomes the cover.
            onClick={() => photos.save(album, album.best.filter((id) => id !== hero), undefined, [...album.hidden, hero])}
            disabled={photos.isPending}
          >
            <Trash2 data-icon="inline-start" />
            Remove cover photo
          </Button>
        )}
      </div>
      <PhotoGallery event={event} album={album} view={view} onViewChange={setView} />
    </>
  );
}

/** Event page: the hand-picked best photos of the day. */
export function EventPhotos({ event }: { event: PhotoEvent }) {
  const { data: album, isPending, isError } = useEventAlbum(event);
  const photos = useSavePhotos(event);
  const [view, setView] = useState<GalleryView>(null);
  const isAdmin = useAuth().user?.role === "admin";
  if (isError) return <PhotosUnavailable />;
  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-4/3 rounded-lg" />)}
      </div>
    );
  }

  const canPick = isAdmin && album.albumKey !== null;
  const pickButton = canPick && (
    <Button size="sm" variant="outline" onClick={() => setView({ mode: "pick" })}>
      <Star data-icon="inline-start" />
      {album.best.length ? "Add or remove photos" : "Add photos"}
    </Button>
  );
  const offset = album.hero ? 1 : 0;

  return (
    <div className="flex flex-col gap-3">
      {album.best.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {canPick ? "No photos added yet — members only see the Moments picture until you add the best 20–30." : "More photos from this catchup are coming soon."}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 @4xl/main:grid-cols-4">
          {album.best.map((id, i) => (
            <li key={id} className="group relative">
              <button type="button" onClick={() => setView({ mode: "photo", index: i + offset })} className={cn(tile, "aspect-4/3 w-full rounded-lg")} aria-label={`Open photo ${i + 1}`}>
                <Photo id={id} className="size-full transition-transform duration-300 group-hover:scale-[1.04]" />
              </button>
              {canPick && (
                <Button
                  size="icon-xs"
                  variant="destructive"
                  className="absolute top-1.5 right-1.5 rounded-full opacity-90 shadow hover:opacity-100"
                  onClick={() => photos.save(album, album.best.filter((x) => x !== id))}
                  disabled={photos.isPending}
                  aria-label={`Remove photo ${i + 1} from this event`}
                >
                  <X />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canPick && (
        <div className="flex flex-wrap justify-end gap-2">
          <UploadPhotosButton
            event={event}
            room={BEST_MAX - album.best.length}
            onUploaded={(ids) => photos.save(album, [...album.best, ...ids].slice(0, BEST_MAX))}
          />
          {pickButton}
        </div>
      )}
      <PhotoGallery key={album.best.join()} event={event} album={album} view={view} onViewChange={setView} />
    </div>
  );
}

/** Timeline card: the Moments picture plus a strip of the picked photos. */
export function EventCover({ event }: { event: PhotoEvent }) {
  const { data: album, isPending, isError } = useEventAlbum(event);
  const [view, setView] = useState<GalleryView>(null);
  if (!event.momentsUrl && !event.photosUrl) return null;
  if (isError) return <PhotosUnavailable />;
  if (isPending) return <Skeleton className="aspect-video max-h-72 w-full rounded-xl" />;
  if (!album.hero) return null;
  const strip = album.best.slice(0, 5);
  return (
    <div className="flex flex-col gap-2">
      <HeroImage album={album} title={event.title} onOpen={() => setView({ mode: "grid" })} className="aspect-video max-h-72" />
      {strip.length > 0 && (
        <ul className="grid grid-cols-5 gap-2">
          {strip.map((id, i) => (
            <li key={id}>
              <button type="button" onClick={() => setView({ mode: "photo", index: i + 1 })} className={cn(tile, "aspect-4/3 w-full")} aria-label={`Open photo ${i + 1}`}>
                <Photo id={id} className="size-full transition-transform hover:scale-[1.05]" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <PhotoGallery event={event} album={album} view={view} onViewChange={setView} />
    </div>
  );
}
