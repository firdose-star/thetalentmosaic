"use client";

/**
 * Admin controls other pages can drop next to a member — they read and write
 * the same store as Community Health, so a change shows up everywhere.
 * Render inside `<RoleGuard allow={["admin"]}>`.
 */
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useHealthActions, useHealthData } from "../hooks/use-health";
import { EngagementEditor } from "./engagement-editor";

/** Relationship owner dropdown for one member. */
export function MemberOwnerSelect({ memberId, memberName }: { memberId: string; memberName: string }) {
  const { data } = useHealthData();
  const { setOwner } = useHealthActions();
  const member = data?.members.find((m) => m.id === memberId);
  if (!data || !member) return null;

  return (
    <NativeSelect
      size="sm"
      aria-label={`Owner for ${memberName}`}
      value={member.owner ?? ""}
      onChange={(e) => setOwner.mutate({ memberId, owner: e.target.value || null })}
      className="w-36"
    >
      <NativeSelectOption value="">Unassigned</NativeSelectOption>
      {data.settings.owners.map((o) => (
        <NativeSelectOption key={o} value={o}>{o}</NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

/** Opens the events-attended and tags editor for one member. */
export function MemberEngagementButton({ memberId }: { memberId: string }) {
  const { data } = useHealthData();
  const member = data?.members.find((m) => m.id === memberId);
  if (!data || !member) return null;

  return (
    <EngagementEditor
      memberId={member.id}
      memberName={member.name}
      eventsAttended={member.eventsAttended}
      tags={member.tags}
      events={data.events}
    />
  );
}
