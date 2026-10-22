/**
 * `/opportunities/[id]` — job detail (spec §8.5).
 */
import { JobDetail } from "@/features/opportunities";

export const metadata = { title: "Role" };

export default async function JobDetailPage({ params }: PageProps<"/opportunities/[id]">) {
  const { id } = await params;
  return <JobDetail id={id} />;
}
