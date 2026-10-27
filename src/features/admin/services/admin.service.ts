/**
 * Admin API calls (PRD §7) — admin only.
 *
 * Everything is computed live from the shared community store: the same
 * members, interactions, events, library and queues every other section
 * reads. Approving a registration adds a member everywhere; applying a
 * profile change updates the profile; approving a vendor publishes it in the
 * Library. Every admin action is written to the append-only activity log.
 */
import {
  SAMPLE_AS_OF,
  communityStore,
  communitySource,
  daysUntilBirthday,
  isoDate,
  logAdminAction,
  OWNER_EMAILS,
  type AccessRole,
  type AccessUser,
  type ActivityLogEntry,
  type Automation,
} from "@/lib/sample-data";
import { inferHrFunction } from "@/lib/community-import/parse";
import type { Member, MemberStatus } from "@/types/community";

const store = () => communityStore.admin;
const memberById = (id: string) => communityStore.members.find((m) => m.id === id);
const at = (date: string, hhmm: string) => new Date(`${date}T${hhmm}:00`).toISOString();
const today = () => isoDate(SAMPLE_AS_OF);
const DAY = 86_400_000;

// ── Derived views ────────────────────────────────────────────────────────────

function missingFields(m: Member) {
  const out: string[] = [];
  if (!m.linkedin) out.push("LinkedIn");
  if (m.hobbies.length === 0) out.push("Hobbies");
  if (!m.owner) out.push("Owner");
  if (!m.birthday) out.push("Birthday");
  if (m.yearsOfExperience === null) out.push("Years in HR");
  if (!m.hrFunction) out.push("HR function");
  if (!m.photoUrl) out.push("Photo");
  if (!m.lastLoginAt) out.push("Never logged in");
  return out;
}

function birthdaysToApprove() {
  const overrides = communityStore.birthday.overrides;
  return communityStore.members.filter((m) => {
    if (daysUntilBirthday(m.birthday, SAMPLE_AS_OF) > 10) return false;
    const status = overrides.get(m.id)?.status;
    return !status || status === "needs-approval";
  }).length;
}

function relationshipCoverage() {
  const meaningful = new Set(communityStore.settings.outcomes.filter((o) => o.meaningful).map((o) => o.key));
  const cutoff = isoDate(new Date(SAMPLE_AS_OF.getTime() - 90 * DAY));
  const covered = new Set(
    communityStore.interactions.filter((x) => meaningful.has(x.outcome) && x.date >= cutoff).map((x) => x.memberId),
  );
  return { covered: covered.size, total: communityStore.members.length };
}

/** Users who can sign in: the admin team, relationship owners and every member. */
function users(): AccessUser[] {
  const lastLogged = (owner: string) =>
    communityStore.interactions
      .filter((x) => x.loggedBy === owner)
      .map((x) => x.date)
      .sort()
      .at(-1);
  const base: AccessUser[] = [
    { id: "admin-firdose", name: "Firdose", email: "firdose@mesaschool.co", role: "Admin", status: "Active", lastActiveAt: new Date().toISOString() },
    ...communityStore.settings.owners.map<AccessUser>((owner) => {
      const last = lastLogged(owner);
      return {
        id: `owner-${owner}`,
        name: owner,
        email: OWNER_EMAILS[owner] ?? "",
        role: "Relationship owner",
        status: "Active",
        lastActiveAt: last ? at(last, "11:00") : null,
      };
    }),
    ...communityStore.members.map<AccessUser>((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: "Member",
      status: m.lastLoginAt ? "Active" : "Invited",
      lastActiveAt: m.lastLoginAt,
    })),
    ...store().registrations.map<AccessUser>((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: "Member",
      status: "Invited",
      lastActiveAt: null,
    })),
    ...store().invited,
  ];
  return base.map((u) => ({ ...u, ...store().access.get(u.id) }));
}

/**
 * The activity log: every admin action recorded this session, plus what the
 * records themselves say happened — approvals, logged interactions, event
 * attendance, contributions, sign-ins and sync problems.
 */
function activityLog(): ActivityLogEntry[] {
  const since = isoDate(new Date(SAMPLE_AS_OF.getTime() - 30 * DAY));
  const name = (id: string) => memberById(id)?.name ?? "A member";
  const entries: ActivityLogEntry[] = [];

  communityStore.members
    .filter((m) => m.joinedOn >= since)
    .forEach((m) =>
      entries.push({ id: `join-${m.id}`, at: at(m.joinedOn, "10:00"), actor: m.owner ?? "Admin team", actorType: "Admin", action: "Approved a registration", object: m.name }),
    );

  communityStore.interactions
    .filter((x) => x.date >= since)
    .forEach((x) =>
      entries.push({ id: `int-${x.id}`, at: at(x.date, "12:00"), actor: x.loggedBy, actorType: "Admin", action: `Logged ${x.type.toLowerCase()}`, object: name(x.memberId) }),
    );

  communityStore.members
    .filter((m) => m.lastLoginAt && m.lastLoginAt.slice(0, 10) >= isoDate(new Date(SAMPLE_AS_OF.getTime() - 2 * DAY)))
    .forEach((m) =>
      entries.push({ id: `login-${m.id}`, at: m.lastLoginAt!, actor: m.name, actorType: "Member", action: "Signed in", object: "The Talent Mosaic" }),
    );

  communityStore.events
    .filter((e) => e.date >= isoDate(new Date(SAMPLE_AS_OF.getTime() - 60 * DAY)) && e.date < today())
    .forEach((e) => {
      const n = communityStore.members.filter((m) => m.eventsAttended.includes(e.id)).length;
      entries.push({ id: `ev-${e.id}`, at: at(e.date, "21:00"), actor: "Events", actorType: "System", action: "Recorded attendance", object: `${e.title} · ${n} members` });
    });

  communityStore.library.recommendations
    .filter((r) => r.submittedOn >= since)
    .forEach((r) =>
      entries.push({ id: `rec-${r.id}`, at: at(r.submittedOn, "09:30"), actor: r.owner, actorType: "Member", action: "Recommended a resource", object: r.title }),
    );

  communityStore.vendorSuggestions.forEach((s) =>
    entries.push({ id: `vs-${s.id}`, at: at(s.submittedOn, "09:45"), actor: s.submittedBy, actorType: "Member", action: "Recommended a vendor", object: s.vendor.name }),
  );

  communityStore.hostedSubmissions.forEach((s) =>
    entries.push({ id: `hs-${s.id}`, at: at(s.submittedOn, "16:00"), actor: s.hostName, actorType: "Member", action: "Submitted a hosted session", object: s.title }),
  );

  store().profileChanges.forEach((c) =>
    entries.push({ id: `pc-${c.id}`, at: at(today(), "08:30"), actor: name(c.memberId), actorType: "Member", action: "Requested a profile change", object: c.field }),
  );

  store().issues.forEach((i) =>
    entries.push({ id: `iss-${i.id}`, at: at(today(), /^\d\d:\d\d$/.test(i.at) ? i.at : "07:00"), actor: i.source, actorType: "System", action: i.severity === "error" ? "Sync failed" : "Sync warning", object: i.message }),
  );

  return [...store().log, ...entries].sort((a, b) => b.at.localeCompare(a.at));
}

function automationTimes(a: Automation) {
  if (!a.enabled) return { lastRun: "—", nextRun: "Paused" };
  if (!a.time) {
    const nextEvent = communityStore.events.filter((e) => e.date >= today()).sort((x, y) => x.date.localeCompare(y.date))[0];
    return {
      lastRun: a.frequency === "On approval" ? "On the last approval" : "Before the last event",
      nextRun: a.frequency === "On approval" ? "On the next approval" : nextEvent ? `Before ${nextEvent.title}` : "No upcoming events",
    };
  }
  const now = new Date();
  const [h, m] = a.time.split(":").map(Number);
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  const stepDays = a.frequency === "Weekly" ? 7 : a.frequency === "Twice weekly" ? 3 : 1;
  if (a.frequency === "Weekly" && a.weekday !== undefined) {
    next.setDate(next.getDate() + ((a.weekday - next.getDay() + 7) % 7));
  }
  while (next <= now) next.setDate(next.getDate() + stepDays);
  const last = new Date(next);
  last.setDate(last.getDate() - stepDays);
  const fmt = (d: Date) => d.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  return { lastRun: fmt(last), nextRun: fmt(next) };
}

export const adminService = {
  data: async () => {
    const s = store();
    const members = communityStore.members;
    const coverage = relationshipCoverage();
    const recommendationsPending = communityStore.library.recommendations.filter((r) => r.status === "Under review");

    return {
      asOf: today(),
      /** Where the members came from, and the import report when it was the Community Form. */
      source: communitySource,
      overview: {
        registrations: s.registrations.length,
        memberRequests: s.profileChanges.length + s.contactRequests.length,
        submissions:
          communityStore.vendorSuggestions.filter((v) => v.status === "pending").length +
          recommendationsPending.length +
          communityStore.hostedSubmissions.filter((h) => h.status === "pending").length,
        duplicates: s.duplicates.length,
        missingData: members.filter((m) => missingFields(m).length > 0).length,
        dataIssues: s.issues.length,
        coverage,
        birthdaysToApprove: birthdaysToApprove(),
        automationsOn: s.automations.filter((a) => a.enabled).length,
        automationsTotal: s.automations.length,
        activeRoles: communityStore.jobs.filter((j) => j.status === "active").length,
        importUpdates: s.importUpdates.length,
      },
      members: members.map((m) => ({ ...m, missing: missingFields(m) })),
      /** Every event, newest first — for tagging attendees. */
      events: [...communityStore.events]
        .sort((x, y) => y.date.localeCompare(x.date))
        .map((e) => ({ id: e.id, title: e.title, date: e.date, city: e.city })),
      /** Every tag in use, plus the usual ones. */
      tags: [...new Set(["Speaker", "Volunteer", "Community champion", "Resource contributor", "Vendor contributor", ...members.flatMap((m) => m.tags)])],
      owners: [...communityStore.settings.owners],
      registrations: s.registrations,
      profileChanges: s.profileChanges.map((c) => {
        const m = memberById(c.memberId);
        const key = c.field === "City" ? "city" : c.field === "Startup" ? "startup" : "designation";
        return { ...c, memberName: m?.name ?? "Unknown", current: m ? m[key] : c.from };
      }),
      contactRequests: s.contactRequests.map((r) => ({ ...r, memberName: memberById(r.memberId)?.name ?? "Unknown" })),
      duplicates: s.duplicates.map((d) => {
        const m = memberById(d.memberId);
        return {
          ...d,
          a: m ? { name: m.name, email: m.email, startup: m.startup, city: m.city } : null,
          b: d.other,
        };
      }),
      vendorSuggestions: communityStore.vendorSuggestions,
      recommendations: communityStore.library.recommendations.filter((r) => r.status !== "Published"),
      hostedSubmissions: communityStore.hostedSubmissions,
      importUpdates: s.importUpdates.map((u) => {
        const m = memberById(u.memberId);
        return { ...u, memberName: m?.name ?? "Unknown", current: m ? m[u.field] : "" };
      }),
      sources: s.sources.map((src) => ({
        ...src,
        rows:
          src.id === "members"
            ? `${members.length} members`
            : src.id === "vendors"
              ? `${communityStore.library.vendors.length} vendors`
              : src.id === "jobs"
                ? `${communityStore.jobs.filter((j) => j.status === "active").length} active listings`
                : `${communityStore.events.length} catchups`,
      })),
      issues: s.issues,
      automations: s.automations.map((a) => ({ ...a, ...automationTimes(a) })),
      users: users(),
      permissions: s.permissions,
      log: activityLog(),
    };
  },

  // ── Member Management ─────────────────────────────────────────────────────
  approveRegistration: async ({ id, by }: { id: string; by: string }) => {
    const r = store().registrations.find((x) => x.id === id);
    if (!r) throw new Error("Registration not found");
    const owners = communityStore.settings.owners;
    // New members go to the owner holding the fewest members.
    const owner = owners.length
      ? owners.map((o) => ({ o, n: communityStore.members.filter((m) => m.owner === o).length })).sort((a, b) => a.n - b.n)[0].o
      : null;
    const member: Member = {
      id: `m-${id}-${Date.now()}`,
      name: r.name,
      designation: r.designation,
      startup: r.startup,
      city: r.city,
      seniority: /chro|chief|cxo/i.test(r.designation) ? "SVP / CXO" : /head|vp|director/i.test(r.designation) ? "Head / Director / VP" : /lead/i.test(r.designation) ? "Senior Manager / Lead" : /manager/i.test(r.designation) ? "Manager" : "Associate",
      hrFunction: inferHrFunction(r.designation),
      yearsOfExperience: null,
      hobbies: [],
      linkedin: "",
      email: r.email,
      whatsapp: "",
      joinedOn: today(),
      birthday: null,
      status: "Active",
      tags: [],
      eventsAttended: [],
      owner,
      lastLoginAt: null,
      loginCount: 0,
    };
    communityStore.members = [...communityStore.members, member];
    store().registrations = store().registrations.filter((x) => x.id !== id);
    logAdminAction({ actor: by, action: "Approved a registration", object: `${r.name} · owner ${owner ?? "unassigned"}` });
  },

  rejectRegistration: async ({ id, reason, by }: { id: string; reason: string; by: string }) => {
    const r = store().registrations.find((x) => x.id === id);
    store().registrations = store().registrations.filter((x) => x.id !== id);
    logAdminAction({ actor: by, action: "Declined a registration", object: `${r?.name ?? id}${reason ? ` — ${reason}` : ""}` });
  },

  applyProfileChange: async ({ id, by }: { id: string; by: string }) => {
    const c = store().profileChanges.find((x) => x.id === id);
    if (!c) throw new Error("Request not found");
    const key = c.field === "City" ? "city" : c.field === "Startup" ? "startup" : "designation";
    const m = memberById(c.memberId);
    communityStore.members = communityStore.members.map((x) => (x.id === c.memberId ? { ...x, [key]: c.to } : x));
    store().profileChanges = store().profileChanges.filter((x) => x.id !== id);
    logAdminAction({ actor: by, action: "Applied a profile change", object: `${m?.name} · ${c.field}`, change: `${m?.[key] ?? c.from} → ${c.to}` });
  },

  declineProfileChange: async ({ id, reason, by }: { id: string; reason: string; by: string }) => {
    const c = store().profileChanges.find((x) => x.id === id);
    store().profileChanges = store().profileChanges.filter((x) => x.id !== id);
    logAdminAction({ actor: by, action: "Declined a profile change", object: `${memberById(c?.memberId ?? "")?.name ?? ""} · ${c?.field ?? ""}${reason ? ` — ${reason}` : ""}` });
  },

  resolveContactRequest: async ({ id, share, by }: { id: string; share: boolean; by: string }) => {
    const r = store().contactRequests.find((x) => x.id === id);
    store().contactRequests = store().contactRequests.filter((x) => x.id !== id);
    logAdminAction({ actor: by, action: share ? "Shared contact details" : "Declined a contact request", object: `${memberById(r?.memberId ?? "")?.name ?? ""} → ${r?.requestedBy ?? ""}` });
  },

  resolveDuplicate: async ({ id, merge, by }: { id: string; merge: boolean; by: string }) => {
    const d = store().duplicates.find((x) => x.id === id);
    store().duplicates = store().duplicates.filter((x) => x.id !== id);
    logAdminAction({ actor: by, action: merge ? "Merged duplicate profiles" : "Kept both profiles", object: memberById(d?.memberId ?? "")?.name ?? id });
  },

  editMember: async ({ id, patch, by }: { id: string; patch: Partial<Member>; by: string }) => {
    const before = memberById(id);
    if (!before) throw new Error("Member not found");
    communityStore.members = communityStore.members.map((m) => (m.id === id ? { ...m, ...patch } : m));
    const changes = (Object.keys(patch) as (keyof Member)[])
      .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(patch[k]))
      .map((k) => `${k}: ${String(before[k]) || "—"} → ${String(patch[k]) || "—"}`);
    if (changes.length) logAdminAction({ actor: by, action: "Edited a member record", object: before.name, change: changes.join("; ") });
  },

  setMemberStatus: async ({ id, status, by }: { id: string; status: MemberStatus; by: string }) => {
    const m = memberById(id);
    communityStore.members = communityStore.members.map((x) => (x.id === id ? { ...x, status } : x));
    logAdminAction({ actor: by, action: "Changed member status", object: m?.name ?? id, change: `${m?.status} → ${status}` });
  },

  // ── Submissions & Approvals ───────────────────────────────────────────────
  approveVendor: async ({ id, by }: { id: string; by: string }) => {
    const s = communityStore.vendorSuggestions.find((x) => x.id === id);
    if (!s) throw new Error("Suggestion not found");
    communityStore.library.vendors = [...communityStore.library.vendors, { ...s.vendor, id: `v-${id}` }];
    communityStore.vendorSuggestions = communityStore.vendorSuggestions.filter((x) => x.id !== id);
    logAdminAction({ actor: by, action: "Published a vendor", object: `${s.vendor.name} · suggested by ${s.submittedBy}` });
  },

  editVendorSuggestion: async ({ id, patch }: { id: string; patch: Partial<Omit<import("@/lib/sample-data").Vendor, "id">> }) => {
    communityStore.vendorSuggestions = communityStore.vendorSuggestions.map((x) => (x.id === id ? { ...x, vendor: { ...x.vendor, ...patch } } : x));
  },

  rejectVendor: async ({ id, reason, by }: { id: string; reason: string; by: string }) => {
    const s = communityStore.vendorSuggestions.find((x) => x.id === id);
    communityStore.vendorSuggestions = communityStore.vendorSuggestions.map((x) => (x.id === id ? { ...x, status: "rejected", reason } : x));
    logAdminAction({ actor: by, action: "Declined a vendor", object: `${s?.vendor.name ?? id}${reason ? ` — ${reason}` : ""}` });
  },

  approveRecommendation: async ({ id, by }: { id: string; by: string }) => {
    const r = communityStore.library.recommendations.find((x) => x.id === id);
    if (!r) throw new Error("Recommendation not found");
    communityStore.library.recommendations = communityStore.library.recommendations.map((x) => (x.id === id ? { ...x, status: "Published", reason: undefined } : x));
    communityStore.library.resources = [
      {
        id: `res-${id}`,
        title: r.title,
        category: r.category ?? "Guides and playbooks",
        description: r.description,
        source: `Contributed by ${r.owner}`,
        addedOn: today(),
        access: "All members",
      },
      ...communityStore.library.resources,
    ];
    logAdminAction({ actor: by, action: "Published a resource", object: `${r.title} · by ${r.owner}` });
  },

  rejectRecommendation: async ({ id, reason, by }: { id: string; reason: string; by: string }) => {
    const r = communityStore.library.recommendations.find((x) => x.id === id);
    communityStore.library.recommendations = communityStore.library.recommendations.map((x) => (x.id === id ? { ...x, status: "Not approved", reason } : x));
    logAdminAction({ actor: by, action: "Declined a resource", object: `${r?.title ?? id}${reason ? ` — ${reason}` : ""}` });
  },

  // ── Data & Integrations ───────────────────────────────────────────────────
  applyImport: async ({ ids, by }: { ids: string[]; by: string }) => {
    const updates = store().importUpdates.filter((u) => ids.includes(u.id));
    updates.forEach((u) => {
      const before = memberById(u.memberId);
      communityStore.members = communityStore.members.map((m) => (m.id === u.memberId ? { ...m, [u.field]: u.to } : m));
      logAdminAction({ actor: by, action: "Applied a sheet update", object: `${before?.name} · ${u.label}`, change: `${before?.[u.field]} → ${u.to}` });
    });
    store().importUpdates = store().importUpdates.filter((u) => !ids.includes(u.id));
  },

  skipImport: async ({ id, by }: { id: string; by: string }) => {
    const u = store().importUpdates.find((x) => x.id === id);
    store().importUpdates = store().importUpdates.filter((x) => x.id !== id);
    logAdminAction({ actor: by, action: "Skipped a sheet update", object: `${memberById(u?.memberId ?? "")?.name ?? ""} · ${u?.label ?? ""}` });
  },

  resync: async ({ id, by }: { id: string; by: string }) => {
    store().sources = store().sources.map((s) => (s.id === id ? { ...s, minutesSinceSync: 0 } : s));
    const s = store().sources.find((x) => x.id === id);
    logAdminAction({ actor: by, action: "Ran a manual re-sync", object: s?.name ?? id });
  },

  resolveIssue: async ({ id, by }: { id: string; by: string }) => {
    const i = store().issues.find((x) => x.id === id);
    store().issues = store().issues.filter((x) => x.id !== id);
    logAdminAction({ actor: by, action: "Resolved a data issue", object: i?.message ?? id });
  },

  /** Rows from an uploaded file, already validated, become members. */
  importMembers: async ({ rows, fileName, by }: { rows: { name: string; email: string; startup: string; city: string; designation: string }[]; fileName: string; by: string }) => {
    const created = rows.map<Member>((r, i) => ({
      id: `m-imp-${Date.now()}-${i}`,
      name: r.name,
      designation: r.designation || "HR professional",
      startup: r.startup || "Not listed",
      city: r.city || "Not listed",
      seniority: "Associate",
      hrFunction: null,
      yearsOfExperience: null,
      hobbies: [],
      linkedin: "",
      email: r.email,
      whatsapp: "",
      joinedOn: today(),
      birthday: null,
      status: "Active",
      tags: [],
      eventsAttended: [],
      owner: null,
      lastLoginAt: null,
      loginCount: 0,
    }));
    communityStore.members = [...communityStore.members, ...created];
    logAdminAction({ actor: by, action: "Imported members from a file", object: `${fileName} · ${created.length} rows` });
    return created.length;
  },

  // ── Automations ───────────────────────────────────────────────────────────
  updateAutomation: async ({ id, patch, by }: { id: string; patch: Partial<Automation>; by: string }) => {
    const a = store().automations.find((x) => x.id === id);
    store().automations = store().automations.map((x) => (x.id === id ? { ...x, ...patch } : x));
    const what = "enabled" in patch ? (patch.enabled ? "Resumed an automation" : "Paused an automation") : "Changed an automation schedule";
    logAdminAction({ actor: by, action: what, object: a?.name ?? id });
  },

  runAutomation: async ({ id, by }: { id: string; by: string }) => {
    const a = store().automations.find((x) => x.id === id);
    store().automations = store().automations.map((x) => (x.id === id ? { ...x, status: "succeeded" } : x));
    logAdminAction({ actor: by, action: "Ran an automation now", object: a?.name ?? id });
  },

  // ── User Access ───────────────────────────────────────────────────────────
  setUserAccess: async ({ id, patch, by }: { id: string; patch: Partial<Pick<AccessUser, "role" | "status">>; by: string }) => {
    const user = users().find((u) => u.id === id);
    store().access.set(id, { ...store().access.get(id), ...patch });
    const change = patch.role ? `${user?.role} → ${patch.role}` : `${user?.status} → ${patch.status}`;
    logAdminAction({ actor: by, action: patch.role ? "Changed a role" : "Changed access", object: user?.name ?? id, change });
  },

  invite: async ({ name, email, role, by }: { name: string; email: string; role: AccessRole; by: string }) => {
    if (users().some((u) => u.email.toLowerCase() === email.toLowerCase())) throw new Error("Someone with that email already has access");
    store().invited = [...store().invited, { id: `inv-${Date.now()}`, name, email, role, status: "Invited", lastActiveAt: null }];
    logAdminAction({ actor: by, action: "Sent an invitation", object: `${name} · ${role}` });
  },

  togglePermission: async ({ id, role, by }: { id: string; role: AccessRole; by: string }) => {
    const p = store().permissions.find((x) => x.id === id);
    if (!p || (p.locked && role === "Admin")) return;
    p.roles[role] = !p.roles[role];
    logAdminAction({ actor: by, action: p.roles[role] ? "Granted a permission" : "Removed a permission", object: `${role} · ${p.label}` });
  },
};

export type AdminData = Awaited<ReturnType<typeof adminService.data>>;
export type AdminMember = AdminData["members"][number];
