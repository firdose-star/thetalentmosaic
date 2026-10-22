/**
 * `/library` — Mosaic Library landing (spec §7.2).
 */
import { PageHeader } from "@/components/shared/page-header";
import { LibraryLanding } from "@/features/library";

export const metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <>
      <PageHeader
        title="Mosaic Library"
        description="Practical resources and recommendations from the Talent Mosaic Community."
      />
      <LibraryLanding />
    </>
  );
}
