import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/state-views";
import { Button } from "@/components/ui/button";
import { Recommendations } from "@/features/library";
import { ROUTES } from "@/lib/constants";

export const metadata = { title: "Recommendations" };

export default function LibraryRecommendationsPage() {
  return (
    <>
      <Button variant="ghost" size="sm" className="w-fit" nativeButton={false} render={<Link href={ROUTES.library} />}>
        <ArrowLeft data-icon="inline-start" />
        Mosaic Library
      </Button>
      <PageHeader title="Recommendations" description="Want to share your learnings with the Community? Drop them here." />
      <Suspense fallback={<LoadingState className="min-h-64" />}>
        <Recommendations />
      </Suspense>
    </>
  );
}
