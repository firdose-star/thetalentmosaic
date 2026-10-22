"use client";

/**
 * Recommendations (spec §7.6): the latest uploads from the community, shown
 * as suggested reads, plus a form to share something — with a link or an
 * uploaded file — owned by the signed-in member and reviewed before it
 * publishes.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, FileText, Lightbulb, Paperclip, Upload, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { MemberAvatar } from "@/components/shared/member-avatar";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { Section } from "@/components/shared/section";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { formatBytes } from "@/lib/format";
import { shortDate } from "@/lib/community";
import { RESOURCE_CATEGORIES, type Recommendation } from "@/lib/sample-data";
import { useRecommend, useRecommendations } from "../hooks/use-library";
import {
  UPLOAD_ACCEPT,
  UPLOAD_MAX_BYTES,
  recommendationSchema,
  type RecommendationInput,
} from "../schemas";

function SuggestionCard({ rec, isNewest }: { rec: Recommendation; isNewest: boolean }) {
  const inReview = rec.status === "Under review";
  return (
    <Card className="h-full gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
          <FileText className="size-4" aria-hidden />
        </span>
        {inReview ? (
          <Badge variant="outline">Under review</Badge>
        ) : isNewest ? (
          <Badge>New</Badge>
        ) : null}
      </div>
      <h3 className="font-semibold">{rec.title}</h3>
      <p className="text-sm text-muted-foreground">{rec.description}</p>
      {(rec.fileName || rec.link) && (
        <div className="flex flex-wrap gap-1.5">
          {rec.fileName && (
            <Badge variant="secondary" className="gap-1"><Paperclip className="size-3" />{rec.fileName}</Badge>
          )}
          {rec.link && (
            <Button size="xs" variant="outline" nativeButton={false} render={<a href={rec.link} target="_blank" rel="noopener noreferrer" />}>
              <ExternalLink data-icon="inline-start" /> Open
            </Button>
          )}
        </div>
      )}
      <div className="mt-auto flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
        <MemberAvatar name={rec.owner} className="size-6" />
        <span className="flex-1 truncate">Shared by <span className="text-foreground">{rec.owner}</span></span>
        <span>{shortDate(rec.submittedOn)}</span>
      </div>
    </Card>
  );
}

function LatestUploads() {
  const { data, isPending, isError, error, refetch } = useRecommendations();

  return (
    <Section
      title="Latest from the community"
      description="Fresh uploads worth a read — shared by members, for members."
    >
      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <LoadingState className="min-h-40" />
      ) : data.length === 0 ? (
        <EmptyState icon={Lightbulb} title="Nothing shared yet" description="Be the first to share something useful." />
      ) : (
        <Stagger className="grid gap-3 @3xl/main:grid-cols-2 @6xl/main:grid-cols-3">
          {data.map((rec, i) => (
            <StaggerItem key={rec.id}>
              <SuggestionCard rec={rec} isNewest={i < 2} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </Section>
  );
}

function RecommendForm() {
  const { user } = useAuth();
  const recommend = useRecommend();
  // Bumping the key remounts the input, clearing its selection without a ref.
  const [inputKey, setInputKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const form = useForm<RecommendationInput>({
    resolver: zodResolver(recommendationSchema),
    defaultValues: { title: "", category: "", description: "", link: "" },
  });
  const errors = form.formState.errors;

  function pickFile(next: File | undefined) {
    if (!next) return;
    if (next.size > UPLOAD_MAX_BYTES) {
      setFileError(`That file is ${formatBytes(next.size)} — the limit is ${formatBytes(UPLOAD_MAX_BYTES)}.`);
      return;
    }
    setFileError(null);
    setFile(next);
  }

  function clearFile() {
    setFile(null);
    setInputKey((k) => k + 1);
  }

  async function onSubmit(values: RecommendationInput) {
    // The file itself is uploaded once storage exists; the name travels now.
    await recommend.mutateAsync({ ...values, owner: user?.name ?? "A member", fileName: file?.name });
    form.reset();
    clearFile();
  }

  return (
    <Section title="Share with the Community" description="Want to share your learnings with the Community? Drop them here.">
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <div className="grid gap-4 @3xl/main:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="r-title">Title</FieldLabel>
              <Input id="r-title" aria-invalid={!!errors.title} {...form.register("title")} />
              <FieldError errors={[errors.title]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="r-category">Category</FieldLabel>
              <NativeSelect id="r-category" className="w-full" aria-invalid={!!errors.category} {...form.register("category")}>
                <NativeSelectOption value="">Choose a category</NativeSelectOption>
                {RESOURCE_CATEGORIES.map((c) => (
                  <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={[errors.category]} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="r-description">Description</FieldLabel>
            <Textarea id="r-description" rows={3} aria-invalid={!!errors.description} {...form.register("description")} />
            <FieldError errors={[errors.description]} />
          </Field>
          <div className="grid gap-4 @3xl/main:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="r-link">Link (optional)</FieldLabel>
              <Input id="r-link" placeholder="https://" {...form.register("link")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="r-file">Upload a file (optional)</FieldLabel>
              <input
                key={inputKey}
                id="r-file"
                type="file"
                accept={UPLOAD_ACCEPT}
                className="sr-only"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              {file ? (
                <div className="flex h-9 items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm">
                  <Paperclip className="size-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                  <button type="button" onClick={clearFile} aria-label="Remove file" className="rounded p-0.5 hover:bg-foreground/10">
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <label htmlFor="r-file" className={buttonVariants({ variant: "outline", className: "w-full cursor-pointer" })}>
                  <Upload data-icon="inline-start" />
                  Choose a file
                </label>
              )}
              <FieldDescription>PDF, Word, PowerPoint, Excel or text — up to 10 MB.</FieldDescription>
              {fileError && <p className="text-sm text-destructive">{fileError}</p>}
            </Field>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              Owner:
              <MemberAvatar name={user?.name ?? "?"} className="size-6" />
              <span className="text-foreground">{user?.name}</span>
            </span>
            <Button type="submit" disabled={recommend.isPending}>Submit for review</Button>
          </div>
        </FieldGroup>
      </form>
    </Section>
  );
}

export function Recommendations() {
  return (
    <div className="flex flex-col gap-4">
      <LatestUploads />
      <RecommendForm />
    </div>
  );
}
