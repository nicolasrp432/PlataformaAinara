import assert from "node:assert/strict"
import { resolveFormationCover } from "../lib/formation-covers.ts"

let pass = 0
const t = (n: string, f: () => void) => { try { f(); pass++ } catch (e) { console.log("FAIL:", n, (e as Error).message); process.exitCode = 1 } }

t("la portada de la BD manda siempre", () =>
  assert.equal(resolveFormationCover("emulsion-energetica", "https://x/y.png"), "https://x/y.png"))
t("emulsion-energetica cae al asset local", () =>
  assert.equal(resolveFormationCover("emulsion-energetica", null), "/emulsion-energetica.png"))
t("con tildes en el slug también", () =>
  assert.equal(resolveFormationCover("emulsión-energética", null), "/emulsion-energetica.png"))
t("en mayúsculas también", () =>
  assert.equal(resolveFormationCover("Emulsion-Energetica", null), "/emulsion-energetica.png"))
t("re-conecta sigue funcionando", () =>
  assert.equal(resolveFormationCover("re-conecta", null), "/re-conectate-portada.png"))
t("slug desconocido → null (portada generada)", () =>
  assert.equal(resolveFormationCover("otra-formacion", null), null))
t("sin slug → null", () =>
  assert.equal(resolveFormationCover(null, null), null))
t("cadena vacía en la BD no cuenta como portada", () =>
  assert.equal(resolveFormationCover("emulsion-energetica", ""), "/emulsion-energetica.png"))

console.log(`${pass} comprobaciones de portada superadas${process.exitCode ? " (con fallos)" : ", 0 fallos"}`)
