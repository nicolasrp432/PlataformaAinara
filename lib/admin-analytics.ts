export function progressCompletionPercentage(
  completed: number,
  recorded: number,
) {
  if (
    !Number.isFinite(recorded) ||
    recorded <= 0 ||
    !Number.isFinite(completed)
  )
    return 0;
  return Math.round(Math.min(1, Math.max(0, completed / recorded)) * 100);
}
export interface FormationEnrollmentCount {
  id: string;
  title: string;
  is_published: boolean;
  enrollments: { count: number }[];
}
export function rankFormations(rows: FormationEnrollmentCount[]) {
  return rows
    .map((row) => ({
      id: row.id,
      title: row.title,
      published: row.is_published,
      count: row.enrollments[0]?.count ?? 0,
    }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, "es"))
    .slice(0, 5);
}
