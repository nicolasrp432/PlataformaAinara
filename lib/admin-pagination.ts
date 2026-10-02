export const ADMIN_PAGE_SIZE = 50;
export type AdminSearchParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;
export function parseAdminFilters(params: AdminSearchParams) {
  const rawPage = first(params.page) ?? "1";
  const page =
    /^\d+$/.test(rawPage) && Number(rawPage) > 0 && Number(rawPage) <= 10000
      ? Number(rawPage)
      : 1;
  // Remove PostgREST expression separators and wildcard characters from user input.
  const search = (first(params.q) ?? "")
    .replace(/[,()%_\\"']/g, " ")
    .trim()
    .slice(0, 80);
  const rawStatus = first(params.status);
  const rawRole = first(params.role);
  const status = ["approved", "pending", "suspended"].includes(rawStatus ?? "")
    ? rawStatus!
    : "all";
  const role = ["student", "mentor", "admin"].includes(rawRole ?? "")
    ? rawRole!
    : "all";
  return { page, search, status, role };
}
export function adminPageHref(
  path: string,
  page: number,
  filters: ReturnType<typeof parseAdminFilters>,
) {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.role !== "all") params.set("role", filters.role);
  if (page > 1) params.set("page", String(page));
  return path + (params.size ? `?${params.toString()}` : "");
}
