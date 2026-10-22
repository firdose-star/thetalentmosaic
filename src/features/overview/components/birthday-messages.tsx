"use client";

/**
 * Admin-only birthday message approval. Each upcoming birthday gets a drafted
 * message; the admin can edit it, choose the day and time, and approve. Once
 * approved, "Send on WhatsApp" opens the chat with the message pre-filled.
 * Render inside `<RoleGuard allow={["admin"]}>`.
 */
import { Check, MessageCircle, RotateCcw, X } from "lucide-react";
import { useState } from "react";

import { MemberAvatar } from "@/components/shared/member-avatar";
import { Section } from "@/components/shared/section";
import { ErrorState, LoadingState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { addDays, parseDay, shortDate } from "@/lib/community";
import { useBirthdayDefaults, useBirthdayMessageActions, useBirthdayMessages } from "../hooks/use-birthday-messages";
import {
  SEND_OFFSETS,
  SEND_TIMES,
  time12,
  whatsappLink,
  type BirthdayMessage,
} from "../services/birthday-messages.service";

const STATUS: Record<BirthdayMessage["status"], { label: string; className: string }> = {
  "needs-approval": { label: "Needs approval", className: "bg-chart-3/20 text-foreground" },
  approved: { label: "Approved", className: "bg-accent text-primary" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive" },
  sent: { label: "Sent", className: "bg-muted text-muted-foreground" },
};

function when(message: BirthdayMessage) {
  const sendOn = addDays(parseDay(message.birthdayOn), -message.offsetDays);
  return `${sendOn.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}, ${time12(message.time)}`;
}

function MessageRow({ message }: { message: BirthdayMessage }) {
  const { update, reset } = useBirthdayMessageActions();
  const [text, setText] = useState(message.text);
  const locked = message.status !== "needs-approval";
  const status = STATUS[message.status];
  const dayLabel =
    message.inDays === 0 ? "Today" : message.inDays === 1 ? "Tomorrow" : `In ${message.inDays} days`;

  return (
    <li className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <MemberAvatar name={message.name} />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{message.name}</p>
          <p className="text-xs text-muted-foreground">
            {dayLabel} · {shortDate(message.birthdayOn)} · WhatsApp +91 {message.whatsapp}
          </p>
        </div>
        <Badge className={status.className}>{status.label}</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Send</span>
        <NativeSelect
          size="sm"
          aria-label="Send day"
          value={message.offsetDays}
          disabled={locked}
          onChange={(e) => update.mutate({ memberId: message.memberId, offsetDays: Number(e.target.value) })}
        >
          {SEND_OFFSETS.map((o) => (
            <NativeSelectOption key={o.value} value={o.value}>{o.label}</NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          size="sm"
          aria-label="Send time"
          value={message.time}
          disabled={locked}
          onChange={(e) => update.mutate({ memberId: message.memberId, time: e.target.value })}
        >
          {SEND_TIMES.map((t) => (
            <NativeSelectOption key={t} value={t}>{time12(t)}</NativeSelectOption>
          ))}
        </NativeSelect>
        <span className="text-xs text-muted-foreground">Scheduled: {when(message)}</span>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        readOnly={locked}
        rows={3}
        aria-label={`Birthday message for ${message.name}`}
      />

      <div className="flex flex-wrap gap-2">
        {message.status === "needs-approval" && (
          <>
            <Button size="sm" onClick={() => update.mutate({ memberId: message.memberId, text, status: "approved" })}>
              <Check data-icon="inline-start" />
              Approve message
            </Button>
            <Button size="sm" variant="outline" onClick={() => update.mutate({ memberId: message.memberId, status: "rejected" })}>
              <X data-icon="inline-start" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                reset.mutate(message.memberId);
                setText(message.text);
              }}
            >
              <RotateCcw data-icon="inline-start" />
              Reset to default
            </Button>
          </>
        )}
        {message.status === "approved" && (
          <>
            <Button
              size="sm"
              nativeButton={false}
              render={<a href={whatsappLink(message.whatsapp, message.text)} target="_blank" rel="noopener noreferrer" />}
              onClick={() => update.mutate({ memberId: message.memberId, status: "sent", sentAt: new Date().toISOString() })}
            >
              <MessageCircle data-icon="inline-start" />
              Send on WhatsApp
            </Button>
            <Button size="sm" variant="outline" onClick={() => update.mutate({ memberId: message.memberId, status: "needs-approval" })}>
              Edit message
            </Button>
          </>
        )}
        {message.status === "rejected" && (
          <Button size="sm" variant="outline" onClick={() => update.mutate({ memberId: message.memberId, status: "needs-approval" })}>
            Reconsider
          </Button>
        )}
        {message.status === "sent" && (
          <span className="text-xs text-muted-foreground">Already sent — it won’t be sent twice.</span>
        )}
      </div>
    </li>
  );
}

/** Default send day and time for every message without its own. */
function DefaultSchedule() {
  const { data } = useBirthdayDefaults();
  const { setDefaults } = useBirthdayMessageActions();
  if (!data) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-accent/60 p-3 text-sm">
      <span className="font-medium">Default for all messages:</span>
      <NativeSelect
        size="sm"
        aria-label="Default send day"
        value={data.offsetDays}
        onChange={(e) => setDefaults.mutate({ ...data, offsetDays: Number(e.target.value) })}
      >
        {SEND_OFFSETS.map((o) => (
          <NativeSelectOption key={o.value} value={o.value}>{o.label}</NativeSelectOption>
        ))}
      </NativeSelect>
      <span className="text-muted-foreground">at</span>
      <NativeSelect
        size="sm"
        aria-label="Default send time"
        value={data.time}
        onChange={(e) => setDefaults.mutate({ ...data, time: e.target.value })}
      >
        {SEND_TIMES.map((t) => (
          <NativeSelectOption key={t} value={t}>{time12(t)}</NativeSelectOption>
        ))}
      </NativeSelect>
      <span className="text-xs text-muted-foreground">Change any single message below to override it.</span>
    </div>
  );
}

export function BirthdayMessages() {
  const { data, isPending, isError, error, refetch } = useBirthdayMessages();

  return (
    <Section
      title="Birthday messages"
      description="Edit if you like, then approve. Approved messages go out on WhatsApp at the day and time you choose."
      actions={<Badge variant="secondary">Admin only</Badge>}
    >
      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <LoadingState className="min-h-40" />
      ) : (
        <>
          <DefaultSchedule />
          <ul className="grid gap-3 @4xl/main:grid-cols-2">
            {data.map((message) => (
              <MessageRow key={`${message.memberId}-${message.status}`} message={message} />
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}
