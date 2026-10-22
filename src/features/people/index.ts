/**
 * Public surface of the people slice (spec §6).
 */
export { MemberProfile } from "./components/member-profile";
export { PeopleDirectory } from "./components/people-directory";
export {
  useMemberProfile,
  useMemberRecords,
  usePeople,
  usePeopleFilterOptions,
  useRequestContact,
} from "./hooks/use-people";
export type { DirectoryMember, MemberProfile as MemberProfileData, PeopleFilters } from "./types";
