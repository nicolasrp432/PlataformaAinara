import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { extname, join } from "node:path"
import test from "node:test"
import ts from "typescript"

const ROOT = process.cwd()
const SEARCH_ROOTS = ["app", "components"]

type DialogNode = {
  file: string
  line: number
  kind: "DialogContent" | "SheetContent"
  title: boolean
  description: boolean
  deliberatelyUndescribed: boolean
}

function sourceFiles(directory: string): string[] {
  return readdirSync(join(ROOT, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return [".tsx", ".jsx"].includes(extname(entry.name)) ? [path] : []
  })
}

function jsxName(node: ts.JsxTagNameExpression): string {
  return node.getText().split(".").at(-1) ?? ""
}

function hasUndefinedDescribedBy(opening: ts.JsxOpeningLikeElement): boolean {
  return opening.attributes.properties.some((property) => {
    if (!ts.isJsxAttribute(property) || property.name.getText() !== "aria-describedby") return false
    return Boolean(
      property.initializer &&
      ts.isJsxExpression(property.initializer) &&
      property.initializer.expression?.kind === ts.SyntaxKind.Identifier &&
      property.initializer.expression.getText() === "undefined"
    )
  })
}

function auditDialogs(): DialogNode[] {
  const results: DialogNode[] = []

  for (const file of SEARCH_ROOTS.flatMap(sourceFiles)) {
    const text = readFileSync(join(ROOT, file), "utf8")
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

    function visit(node: ts.Node) {
      if (ts.isJsxElement(node)) {
        const kind = jsxName(node.openingElement.tagName)
        if (kind === "DialogContent" || kind === "SheetContent") {
          let title = false
          let description = false

          function inspect(child: ts.Node) {
            if (child !== node && ts.isJsxElement(child)) {
              const name = jsxName(child.openingElement.tagName)
              title ||= name === (kind === "DialogContent" ? "DialogTitle" : "SheetTitle")
              description ||= name === (kind === "DialogContent" ? "DialogDescription" : "SheetDescription")
            }
            ts.forEachChild(child, inspect)
          }
          ts.forEachChild(node, inspect)

          results.push({
            file,
            line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
            kind,
            title,
            description,
            deliberatelyUndescribed: hasUndefinedDescribedBy(node.openingElement),
          })
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  return results
}

const dialogWarning = /`Dialog(Content|Description)`|requires a description|aria-describedby/i

test("todos los DialogContent y las ramas responsive conservan su nombre y descripción", () => {
  const dialogs = auditDialogs()
  assert.ok(dialogs.length > 0, "La auditoría no encontró diálogos")

  for (const dialog of dialogs) {
    const location = `${dialog.file}:${dialog.line}`
    assert.ok(dialog.title, `${location} no contiene su título en el mismo árbol`)
    assert.ok(
      dialog.description || dialog.deliberatelyUndescribed,
      `${location} no contiene su descripción ni documenta que sea deliberadamente inexistente`
    )
  }

  // aria-describedby={undefined} sólo es válido como excepción explícita. En la
  // revisión actual no hay ninguna: los textos visualmente ocultos deben usar sr-only.
  assert.deepEqual(
    dialogs.filter((dialog) => dialog.deliberatelyUndescribed),
    [],
    "Documenta junto al diálogo cualquier excepción deliberadamente sin descripción"
  )
})

test("los flujos que originaron la advertencia quedan cubiertos sucesivamente", () => {
  const dialogs = auditDialogs()
  const scenarios = [
    ["carta natal", "components/profile/NatalChartModal.tsx"],
    ["nuevo mensaje", "app/(platform)/messages/new-message-dialog.tsx"],
    ["reserva (escritorio y responsive)", "components/mentorship/booking-dialog.tsx"],
    ["restablecimiento de contraseña", "app/(admin)/admin/users/users-table.tsx"],
    ["formularios administrativos", "app/(admin)/admin/content/formations/[id]/client-page.tsx"],
  ] as const

  const capturedConsole: string[] = []
  for (const [scenario, file] of scenarios) {
    const opened = dialogs.filter((dialog) => dialog.file === file)
    assert.ok(opened.length > 0, `No se abrió el escenario: ${scenario}`)
    for (const dialog of opened) {
      if (!dialog.title || (!dialog.description && !dialog.deliberatelyUndescribed)) {
        capturedConsole.push(`${scenario}: DialogContent requires a description`)
      }
    }
  }

  assert.equal(
    capturedConsole.some((message) => dialogWarning.test(message)),
    false,
    capturedConsole.join("\n")
  )
})

test("DialogContent no silencia globalmente aria-describedby", () => {
  const primitive = readFileSync(join(ROOT, "components/ui/dialog.tsx"), "utf8")
  assert.doesNotMatch(primitive, /aria-describedby\s*=\s*\{\s*undefined\s*\}/)
})
