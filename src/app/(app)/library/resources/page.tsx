import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/state-views";
import { Button } from "@/components/ui/button";
import { ResourceList } from "@/features/library";
import { ROUTES } from "@/lib/constants";

export const metadata = { title: "Resources" };

export default function LibraryResourceListPage() {
  return (
    <>
      <Button variant="ghost" size="sm" className="w-fit" nativeButton={false} render={<Link href={ROUTES.library} />}>
        <ArrowLeft data-icon="inline-start" />
        Mosaic Library
      </Button>
      <PageHeader title="Some Interesting Reads" description="Learning materials that might be of help" />
      <Suspense fallback={<LoadingState className="min-h-64" />}>
        <ResourceList />
      </Suspense>
    </>
  );
}
