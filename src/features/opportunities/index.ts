/**
 * Public surface of the opportunities slice — the job feed.
 */
export { JobBoard } from "./components/job-board";
export { JobDetail } from "./components/job-detail";
export { JobFeedPanel } from "./components/job-feed-panel";
export { opportunitiesService } from "./services/opportunities.service";
export { useAdminRoles, useJobFeed, useRole, useRoles } from "./hooks/use-opportunities";
