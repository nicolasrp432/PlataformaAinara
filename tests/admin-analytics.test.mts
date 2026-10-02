import assert from "node:assert/strict"
import { test } from "node:test"
import { progressCompletionPercentage, rankFormations } from "../lib/admin-analytics.ts"
import { parseAdminFilters, adminPageHref } from "../lib/admin-pagination.ts"

test("progress rate uses progress records and remains valid for empty data", () => {
  assert.equal(progressCompletionPercentage(30, 100), 30)
  assert.equal(progressCompletionPercentage(6, 6), 100)
  assert.equal(progressCompletionPercentage(0, 0), 0)
  assert.equal(progressCompletionPercentage(2, 1), 100)
  assert.equal(progressCompletionPercentage(-1, 10), 0)
})
test("formation ranking respects aggregated enrollment counts beyond the first hundred", () => {
  const rows = Array.from({ length: 120 }, (_, index) => ({ id: String(index), title: `Formación ${index}`, is_published: true, enrollments: [{ count: index === 119 ? 250 : 1 }] }))
  assert.equal(rankFormations(rows)[0].id, "119")
  assert.equal(rankFormations(rows)[0].count, 250)
  assert.equal(rankFormations(rows).length, 5)
  assert.deepEqual(rankFormations([{ id: "empty", title: "Vacía", is_published: false, enrollments: [] }]), [])
})
test("URL filters validate page bounds and remove PostgREST separators", () => {
  for (const page of ["0", "-5", "NaN", "2.5", "99999999999999999999999"]) assert.equal(parseAdminFilters({ page }).page, 1)
  const filters = parseAdminFilters({ page: "2", q: "Ana),role.eq.admin%", role: "unknown", status: "pending" })
  assert.equal(filters.page, 2)
  assert.equal(filters.role, "all")
  assert.equal(filters.status, "pending")
  assert.ok(!/[,%()]/.test(filters.search))
  assert.equal(parseAdminFilters({ q: "x".repeat(100) }).search.length, 80)
})
test("pagination keeps search/status/role without retaining the previous page", () => {
  const filters = parseAdminFilters({ page: "2", q: "Ainara García", status: "approved", role: "student" })
  const url = new URL(adminPageHref("/admin/users", 3, filters), "https://example.com")
  assert.equal(url.searchParams.get("q"), "Ainara García")
  assert.equal(url.searchParams.get("page"), "3")
  assert.equal(url.searchParams.get("status"), "approved")
  assert.equal(url.searchParams.get("role"), "student")
  assert.equal(adminPageHref("/admin/users", 1, parseAdminFilters({})), "/admin/users")
})
