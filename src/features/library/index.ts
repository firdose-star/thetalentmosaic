/**
 * Public surface of the library slice (spec §7).
 */
export { LibraryLanding } from "./components/library-landing";
export { Recommendations } from "./components/recommendations";
export { ResourceList } from "./components/resource-list";
export { VendorDirectory } from "./components/vendor-directory";
export {
  useCategoryMutations,
  useRecommend,
  useRecommendations,
  useResources,
  useSuggestVendor,
  useLibraryAdmin,
  useUpdateVendor,
  useVendors,
} from "./hooks/use-library";
