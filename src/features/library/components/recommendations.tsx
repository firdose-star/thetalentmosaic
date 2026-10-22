"use client";

/**
 * Recommendations (spec §7.6): a form to share learnings — owned by the
 * signed-in member — and the list of recent recommendations with their review
 * status.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { Lightbulb } from "lucide-react";
import { useForm } from "react-hook-form";

import { MemberAvatar } from "@/components/shared/member-avatar";
import { Section } from "@/components/shared/section";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { shortDate } from "@/lib/community";
import { RESOURCE_CATEGORIES } from "@/lib/sample-data";
import { useRecommend, useRecommendations } from "../hooks/use-library";
import { recommendationSchema, type RecommendationInput } from "../schemas";

function RecommendForm() {
  const { user } = useAuth();
  const recommend = useRecommend();
  const form = useForm<RecommendationInput>({
    resolver: zodResolver(recommendationSchema),
    defaultValues: { title: "", category: "", description: "", link: "" },
  });
  const errors = form.formState.errors;

  async function onSubmit(values: RecommendationInput) {
    await recommend.mutateAsync({ ...values, owner: user?.name ?? "A member" });
    form.reset();
  }

  return (
    <Section title="Share a resource" description="Want to share your learnings with the Community? Drop them here.">
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
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
          <Field>
            <FieldLabel htmlFor="r-description">Description</FieldLabel>
            <Textarea id="r-description" rows={4} aria-invalid={!!errors.description} {...form.register("description")} />
            <FieldError errors={[errors.description]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="r-link">Link (optional)</FieldLabel>
            <Input id="r-link" placeholder="https://" {...form.register("link")} />
          </Field>
          <Field>
            <FieldLabel>Owner</FieldLabel>
            <div className="flex items-center gap-2 text-sm">
              <MemberAvatar name={user?.name ?? "?"} className="size-7" />
              {user?.name}
            </div>
            <FieldDescription>Reviewed by the admins before it is published.</FieldDescription>
          </Field>
          <Button type="submit" disabled={recommend.isPending} className="w-fit">
            Submit recommendation
          </Button>
        </FieldGroup>
      </form>
    </Section>
  );
}

function RecentRecommendations() {
  const { data, isPending, isError, error, refetch } = useRecommendations();

  return (
    <Section title="Recent recommendations" description="What the community has shared lately.">
      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <LoadingState className="min-h-40" />
      ) : data.length === 0 ? (
        <EmptyState icon={Lightbulb} title="Nothing shared yet" />
      ) : (
        <ul className="flex flex-col divide-y">
          {data.map((rec) => (
            <li key={rec.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{rec.title}</p>
                <Badge variant={rec.status === "Published" ? "secondary" : "outline"} className="shrink-0">
                  {rec.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{rec.description}</p>
              <p className="text-xs text-muted-foreground">
                Owner: <span className="text-foreground">{rec.owner}</span> · {shortDate(rec.submittedOn, true)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export function Recommendations() {
  return (
    <div className="grid items-start gap-4 @4xl/main:grid-cols-2">
      <RecommendForm />
      <RecentRecommendations />
    </div>
  );
}
