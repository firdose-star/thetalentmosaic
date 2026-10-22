export type SearchCategory = "People" | "Vendors" | "Resources" | "Roles" | "Events";

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export interface SearchGroup {
  category: SearchCategory;
  /** Matches in this category before truncation. */
  total?: number;
  results: SearchResult[];
}
