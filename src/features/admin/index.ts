/**
 * Public surface of the admin slice (PRD §7) — admin only.
 */
export { ActivityLogs } from "./components/activity-logs";
export { AdminGate } from "./components/admin-gate";
export { AdminOverview } from "./components/admin-overview";
export { EditMemberButton } from "./components/member-editor";
export { Automations } from "./components/automations";
export { DataIntegrations } from "./components/data-integrations";
export { MemberManagement } from "./components/member-management";
export { Submissions } from "./components/submissions";
export { UserAccess } from "./components/user-access";
export { useAdminActions, useAdminData } from "./hooks/use-admin";
