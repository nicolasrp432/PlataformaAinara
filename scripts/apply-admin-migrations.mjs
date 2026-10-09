/** Applies admin completion plus missing testimonial prerequisites; credentials never enter logs. */
import { readFile } from "node:fs/promises";
import { Client } from "pg";
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "Configura DATABASE_URL para aplicar las migraciones 0030–0033.",
  );
  process.exit(1);
}
const ca = process.env.DATABASE_SSL_CA
  ? await readFile(process.env.DATABASE_SSL_CA, "utf8")
  : undefined;
const db = new Client({
  connectionString,
  ssl: ca ? { ca, rejectUnauthorized: true } : undefined,
  connectionTimeoutMillis: 10000,
  statement_timeout: 60000,
});
const files = [
  "0030_admin_content.sql",
  "0031_emulsion_learning_examples.sql",
  "0032_admin_operations.sql",
  "0033_testimonial_audience.sql",
];
try {
  await db.connect();
  const prerequisites = await db.query(
    "SELECT to_regprocedure('public.is_platform_admin()') IS NOT NULL AND to_regprocedure('public.mentorship_workspace()') IS NOT NULL AND to_regclass('public.notification_campaigns') IS NOT NULL AND to_regprocedure('public.has_community_access()') IS NOT NULL AND to_regprocedure('public.complete_lesson(uuid)') IS NOT NULL AS ready",
  );
  if (!prerequisites.rows[0].ready) throw new Error("PREREQUISITES");
  // One transaction for the complete release. Individual SQL files retain their
  // own BEGIN/COMMIT for SQL Editor use; remove only their outer boundaries here.
  await db.query("BEGIN");
  await db.query(
    "SELECT pg_advisory_xact_lock(hashtextextended('mitra:admin-migrations',0))",
  );
  const testimonialState =
    await db.query(`SELECT to_regclass('public.community_testimonials') IS NOT NULL AS present,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_testimonials' AND column_name='subject_name') AS extended`);
  const prerequisitesToApply = [];
  if (!testimonialState.rows[0].present)
    prerequisitesToApply.push("0027_community_testimonials.sql");
  if (!testimonialState.rows[0].extended)
    prerequisitesToApply.push("0028_testimonial_admin_consent.sql");
  for (const file of [...prerequisitesToApply, ...files]) {
    const sql = (
      await readFile(new URL(`../migrations/${file}`, import.meta.url), "utf8")
    )
      .replace(/^BEGIN;\s*/, "")
      .replace(/COMMIT;\s*$/, "");
    await db.query(sql);
    console.log(`Validada: ${file}`);
  }
  await db.query("NOTIFY pgrst, 'reload schema'");
  await db.query("COMMIT");
  console.log(
    "Migraciones aplicadas. Reinicia la aplicación con la configuración real de Supabase.",
  );
} catch (error) {
  await db.query("ROLLBACK").catch(() => {});
  console.error(
    error.message === "PREREQUISITES"
      ? "Faltan las migraciones de acceso/aprendizaje/comunidad (0023–0026) o scripts/009_notifications.sql."
      : `No se aplicaron los cambios. Comprueba conexión, certificado SSL y esquema. Código: ${error.code ?? "CONNECTION"}`,
  );
  process.exitCode = 1;
} finally {
  await db.end().catch(() => {});
}
