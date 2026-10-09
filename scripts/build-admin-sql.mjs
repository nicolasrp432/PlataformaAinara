import { readFile, writeFile } from "node:fs/promises";
const readMigration = async (name) =>
  (await readFile(new URL(`../migrations/${name}`, import.meta.url), "utf8"))
    .replace(/^BEGIN;\s*$/gm, "")
    .replace(/^COMMIT;\s*$/gm, "")
    .trim();
const conditional = (sql, condition, tag) =>
  `DO $${tag}$\nBEGIN\n IF ${condition} THEN\n  EXECUTE $migration$\n${sql}\n$migration$;\n END IF;\nEND $${tag}$;`;
const parts = [
  `-- MITRA: activación del admin y rueda de la vida.
-- Ejecutar TODO en SQL Editor del proyecto suseccacxdfozgsxkmxx.
-- Una sola transacción. Se puede repetir: conserva datos y ejemplos editados.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('mitra:admin-migrations',0));
DO $check$ BEGIN
 IF to_regprocedure('public.is_platform_admin()') IS NULL
 OR to_regprocedure('public.mentorship_workspace()') IS NULL
 OR to_regclass('public.notification_campaigns') IS NULL
 OR to_regprocedure('public.has_community_access()') IS NULL
 OR to_regprocedure('public.complete_lesson(uuid)') IS NULL THEN
 RAISE EXCEPTION 'Faltan requisitos de la plataforma (0023–0026 o 009_notifications). No se ha aplicado ningún cambio.';
 END IF;
END $check$;`,
  await readMigration("0022_life_wheel.sql"),
  conditional(
    await readMigration("0027_community_testimonials.sql"),
    "to_regclass('public.community_testimonials') IS NULL",
    "testimonials",
  ),
  await readMigration("0028_testimonial_admin_consent.sql"),
];
for (const name of [
  "0030_admin_content.sql",
  "0031_emulsion_learning_examples.sql",
  "0032_admin_operations.sql",
  "0033_testimonial_audience.sql",
])
  parts.push(`-- ${name}\n${await readMigration(name)}`);
parts.push(`NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT 'Activación completada' AS resultado,
 (SELECT count(*) FROM public.lessons WHERE slug LIKE 'emulsion-ejemplo-%') AS lecciones_de_ejemplo,
 to_regclass('public.life_wheel_entries') IS NOT NULL AS rueda_disponible,
 to_regclass('public.community_testimonials') IS NOT NULL AS testimonios_disponibles;`);
await writeFile(
  new URL("./sql/ACTIVAR_ADMIN_Y_RUEDA.sql", import.meta.url),
  parts.join("\n\n") + "\n",
);
console.log("SQL preparado: scripts/sql/ACTIVAR_ADMIN_Y_RUEDA.sql");
