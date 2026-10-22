/**
 * `/events/[id]` — event detail.
 */
import { EventDetail } from "@/features/events";

export const metadata = { title: "Event" };

export default async function EventDetailPage({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;
  return <EventDetail id={id} />;
}
