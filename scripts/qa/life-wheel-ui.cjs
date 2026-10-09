// Exercise the actual client with isolated persistence: no remote accounts or data.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const assert = require("node:assert/strict");
const esbuild = require("esbuild");
const { chromium, expect } = require("@playwright/test");
const root = path.resolve(__dirname, "../..");
const dir = path.join(root, ".next", `qa-wheel-${process.pid}`);
fs.mkdirSync(dir, { recursive: true });
const fixture = `
import React from 'react';import {createRoot} from 'react-dom/client';import {Toaster} from 'sonner';
import {LifeWheelClient} from '@/app/(platform)/rueda-de-la-vida/wheel-client';
const scores={health:3,relationships:6,family:7,work:4,money:5,growth:6,leisure:2,environment:7};
const baseline={id:'first',scores,focus:'health',intention:'Salir a caminar tres días.',created_at:'2025-01-01T12:00:00Z'};
const recent={...baseline,id:'recent',scores:{...scores,health:7,work:3,leisure:5},created_at:'2026-10-09T12:00:00Z'};
const fresh=location.search.includes('new');
window.__saved=[];window.__fail=false;
createRoot(document.getElementById('root')).render(<main className="mx-auto max-w-6xl p-5 sm:p-8"><LifeWheelClient entries={fresh?[]:[recent]} baseline={fresh?null:baseline} unavailable={location.search.includes('unavailable')}/><Toaster/></main>);
`;
(async () => {
  let browser, server;
  try {
    await esbuild.build({
      stdin: { contents: fixture, loader: "tsx", resolveDir: root },
      outfile: path.join(dir, "app.js"),
      bundle: true,
      platform: "browser",
      jsx: "automatic",
      define: { "process.env.NODE_ENV": '"production"' },
      plugins: [
        {
          name: "isolated-boundaries",
          setup(build) {
            build.onResolve({ filter: /^\.\/actions$/ }, (args) =>
              args.importer.includes("/rueda-de-la-vida/")
                ? { path: args.path, namespace: "mock-action" }
                : undefined,
            );
            build.onLoad({ filter: /.*/, namespace: "mock-action" }, () => ({
              contents: `export async function saveLifeWheel(input){if(window.__fail)throw Error('offline');window.__saved.push(input);return {entry:{...input,id:'new',created_at:'2026-10-10T12:00:00Z'}}}`,
            }));
            build.onResolve({ filter: /next\/(link|image)$/ }, (args) => ({
              path: args.path,
              namespace: "mock-next",
            }));
            build.onLoad({ filter: /.*/, namespace: "mock-next" }, (args) => ({
              contents: args.path.endsWith("link")
                ? `import React from 'react';export default function Link({children,...p}){return React.createElement('a',p,children)}`
                : `import React from 'react';export default function Image({fill,priority,...p}){return React.createElement('img',p)}`,
              resolveDir: root,
            }));
          },
        },
      ],
    });
    const css = fs
      .readdirSync(path.join(root, ".next/static/css"))
      .filter((f) => f.endsWith(".css"))
      .map((f) =>
        fs.readFileSync(path.join(root, ".next/static/css", f), "utf8"),
      )
      .join("\n");
    server = http.createServer((req, res) => {
      if (req.url === "/app.js") {
        res.setHeader("Content-Type", "text/javascript");
        res.end(fs.readFileSync(path.join(dir, "app.js")));
      } else if (req.url === "/style.css") {
        res.setHeader("Content-Type", "text/css");
        res.end(css);
      } else {
        res.setHeader("Content-Type", "text/html");
        res.end(
          '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body class="bg-background text-foreground"><div id="root"></div><script src="/app.js"></script></body></html>',
        );
      }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url);
    await expect(
      page.getByRole("heading", { name: "Todo empieza por escucharte." }),
    ).toBeVisible();
    await expect(page.getByText("+4 puntos", { exact: true })).toBeVisible();
    await expect(page.getByText("−1 punto", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Ver mi punto de partida" }).click();
    await expect(
      page.getByRole("heading", { name: "Rueda de la vida", exact: true }),
    ).toBeVisible();
    await expect(
      page
        .locator(".life-wheel-report-scores")
        .getByText("3/10", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Volver a mi rueda" }).click();
    const input = page.getByRole("slider", { name: "Salud y energía" });
    await input.focus();
    await page.keyboard.press("ArrowRight");
    await expect(input).toHaveValue("6");
    await expect(
      page.getByRole("progressbar", { name: "Áreas valoradas" }),
    ).toHaveAttribute("aria-valuenow", "1");
    await page.getByRole("button", { name: "Confirmar 6 y seguir" }).click();
    await expect(
      page.getByRole("slider", { name: "Amor y vínculos" }),
    ).toBeFocused();
    for (let i = 0; i < 7; i++)
      await page
        .getByRole("button", { name: /Confirmar 5 y (seguir|continuar)/ })
        .click();
    await expect(
      page.getByRole("progressbar", { name: "Áreas valoradas" }),
    ).toHaveAttribute("aria-valuenow", "8");
    await page
      .getByLabel("Mi pequeño paso esta semana", { exact: true })
      .fill("Pasear veinte minutos los lunes y los miércoles.");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: "/tmp/ainara-wheel-desktop.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "/tmp/ainara-wheel-mobile.png",
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      "Mobile overflow",
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => {
      window.__fail = true;
    });
    await page
      .getByRole("button", { name: "Guardar mi nueva evaluación" })
      .click();
    await expect(
      page.getByText(
        "No se pudo conectar. Tus respuestas siguen aquí; vuelve a intentarlo.",
      ),
    ).toBeVisible();
    await expect(
      page.getByLabel("Mi pequeño paso esta semana", { exact: true }),
    ).toHaveValue("Pasear veinte minutos los lunes y los miércoles.");
    await page.evaluate(() => {
      window.__fail = false;
    });
    await page
      .getByRole("button", { name: "Guardar mi nueva evaluación" })
      .click();
    await expect(
      page.getByRole("button", { name: "Descargar PDF" }),
    ).toBeVisible();
    assert.equal(await page.evaluate(() => window.__saved[0].scores.health), 6);
    await page.getByRole("button", { name: "Volver a mi rueda" }).click();
    await page.getByRole("button", { name: "Empezar otra evaluación" }).click();
    await expect(
      page.getByRole("progressbar", { name: "Áreas valoradas" }),
    ).toHaveAttribute("aria-valuenow", "0");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url + "?new");
    await expect(
      page.getByText("Este es tu punto de partida", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Guardar mi punto de partida" }),
    ).toBeDisabled();
    await expect(page.locator("svg[role=img] desc")).toContainText(
      "Salud y energía: por valorar",
    );
    for (let i = 0; i < 8; i++)
      await page
        .getByRole("button", { name: /Confirmar 5 y (seguir|continuar)/ })
        .click();
    await page
      .getByLabel("Mi pequeño paso esta semana", { exact: true })
      .fill("Descansar sin pantalla el domingo.");
    await page
      .getByRole("button", { name: "Guardar mi punto de partida" })
      .click();
    await page.getByRole("button", { name: "Volver a mi rueda" }).click();
    await expect(
      page.getByRole("button", { name: "Ver mi punto de partida" }),
    ).toBeVisible();
    await page.goto(url + "?new&unavailable");
    for (let i = 0; i < 8; i++)
      await page
        .getByRole("button", { name: /Confirmar 5 y (seguir|continuar)/ })
        .click();
    await page
      .getByLabel("Mi pequeño paso esta semana", { exact: true })
      .fill("Mi intención");
    await expect(
      page.getByRole("button", { name: "Guardar mi punto de partida" }),
    ).toBeDisabled();
    assert.deepEqual(errors, []);
    console.log(
      "Life wheel UI passed: keyboard, eight-area journey, first/most recent comparison, failed-save recovery, private snapshot, new evaluation and mobile layout.",
    );
  } finally {
    await browser?.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
