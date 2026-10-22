/**
 * `/people/[id]` — a member's profile (spec §6.3, §6.5).
 */
import { MemberProfile } from "@/features/people";

export const metadata = { title: "Profile" };

export default async function MemberProfilePage({ params }: PageProps<"/people/[id]">) {
  const { id } = await params;
  return <MemberProfile id={id} />;
}
