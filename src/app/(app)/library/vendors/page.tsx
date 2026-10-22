import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/state-views";
import { Button } from "@/components/ui/button";
import { VendorDirectory } from "@/features/library";
import { ROUTES } from "@/lib/constants";

export const metadata = { title: "Vendors" };

export default function LibraryVendorDirectoryPage() {
  return (
    <>
      <Button variant="ghost" size="sm" className="w-fit" nativeButton={false} render={<Link href={ROUTES.library} />}>
        <ArrowLeft data-icon="inline-start" />
        Mosaic Library
      </Button>
      <PageHeader title="Vendors" description="A Curated list of vendors that people in the Talent Mosaic Community have already worked with and can vouch for." />
      <Suspense fallback={<LoadingState className="min-h-64" />}>
        <VendorDirectory />
      </Suspense>
    </>
  );
}
