// Browser checks use the real React components with isolated server-action
// adapters. No requests are sent to Supabase and no accounts are created.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const assert = require("node:assert/strict");
const esbuild = require("esbuild");
const { chromium, expect } = require("@playwright/test");
const root = path.resolve(__dirname, "../..");
const dir = path.join(root, ".next", `qa-admin-${process.pid}`);
fs.mkdirSync(dir, { recursive: true });
const actionStub = `
const capture=(name,args)=>{window.__calls.push({name,args});return args};
export async function saveCurriculum(...args){capture('order',args);return window.__failSave?{error:'Fallo de prueba'}:{success:true}}
export async function addCurriculumLesson(...args){capture('lesson',args);return {data:{id:'new-lesson'}}}
export async function editCurriculumModule(...args){capture('module',args);return {success:true}}
export async function removeCurriculumLesson(...args){capture('delete-lesson',args);return {success:true}}
export async function createModuleAction(...args){capture('new-module',args);return {success:true,data:{id:'new-module',...args[0]}}}
export async function deleteModuleAction(...args){capture('delete-module',args);return {success:true}}
export async function saveMentor(...args){capture('mentor',args);return {success:true}}
export async function moderateTestimonial(...args){capture('testimonial',args);return {success:true}}
export async function sendCampaignAction(form){capture('campaign',Object.fromEntries(form));return {success:true,recipientCount:2}}
`;
const fixture = `
import React from 'react';import {createRoot} from 'react-dom/client';import {Toaster} from 'sonner';
import {CurriculumEditor} from '@/components/admin/curriculum-editor';
import {QuizPlayer} from '@/components/exercises/quiz-player';
import {MentorSettings} from '@/app/(admin)/admin/mentorship/settings';
import {ModerationList} from '@/app/(admin)/admin/testimonials/moderation-list';
import {NotificationsAdminClient} from '@/app/(admin)/admin/notifications/notifications-client';
window.__calls=[];window.__failSave=false;
const lessons=[{id:'l1',module_id:'m1',title:'Una primera mirada',content_type:'video',is_published:true,sort_order:0},{id:'l2',module_id:'m1',title:'Pausa de integración',content_type:'text',is_published:true,sort_order:1}];
const modules=[{id:'m1',title:'Reconocer tu punto de partida',description:'Observa, practica e integra.',sort_order:0,is_published:true,lessons},{id:'m2',title:'Integración cotidiana',description:null,sort_order:1,is_published:false,lessons:[]}];
const quiz={id:'q1',title:'Observar sin juzgar',description:'Comprueba lo aprendido.',passing_score:100,xp_reward:50,questions:[{id:'question',question:'¿Qué frase describe una observación?',type:'multiple_choice',explanation:'Una observación describe un hecho concreto.',sort_order:0,options:[{id:'a',option_text:'Hoy cambié de tarea tres veces.',sort_order:0,is_correct:true},{id:'b',option_text:'Nunca soy capaz de concentrarme.',sort_order:1,is_correct:false}]}]};
createRoot(document.getElementById('root')).render(<main className="mx-auto max-w-6xl space-y-12 p-5 sm:p-8">
<h1 className="font-display text-3xl">Administración · Emulsión Energética</h1>
<section id="curriculum"><CurriculumEditor formationId="formation" initialModules={modules}/></section>
<section id="quiz"><h2 className="text-2xl">Vista previa del alumno</h2><QuizPlayer lessonId="quiz-lesson" formationId="formation" formationSlug="emulsion" previewQuiz={quiz}/></section>
<section id="mentor"><MentorSettings mentors={[]} staff={[{id:'admin',full_name:'Equipo Mitra'}]}/></section>
<section id="testimonials"><ModerationList testimonials={[{id:'testimonial',subject_name:'Ana',caption:'Un espacio para aprender.',testimonial_text:null,playback_url:null,status:'pending_review',audience:'private_review',consent_granted_at:'2026-10-07',consent_version:'v1',consent_method:'uploader_checkbox',third_party_authorization_evidence:null,rejection_reason:null,created_at:'2026-10-07',community_testimonial_reports:[]}]}/></section>
<section id="notifications"><NotificationsAdminClient campaigns={[]} formations={[]}/></section>
<Toaster/></main>);
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
          name: "isolated-server-boundaries",
          setup(build) {
            build.onResolve({ filter: /next\/(navigation|link)$/ }, (args) => ({
              path: args.path,
              namespace: "mock-next",
            }));
            build.onLoad({ filter: /.*/, namespace: "mock-next" }, (args) => ({
              contents: args.path.endsWith("link")
                ? `import React from 'react';export default function Link({children,...props}){return React.createElement('a',props,children)}`
                : `export function useRouter(){return {push:(url)=>window.__calls.push({name:'navigate',url}),refresh:()=>{}}}`,
              resolveDir: root,
            }));
            build.onResolve(
              {
                filter:
                  /(curriculum-actions|formations\/actions|mentorship\/actions|testimonials\/actions|notifications\/actions)$/,
              },
              (args) => ({ path: args.path, namespace: "mock-actions" }),
            );
            build.onResolve({ filter: /^\.\/actions$/ }, (args) =>
              args.importer.includes("/admin/")
                ? { path: args.path, namespace: "mock-actions" }
                : undefined,
            );
            build.onLoad({ filter: /.*/, namespace: "mock-actions" }, () => ({
              contents: actionStub,
              loader: "js",
            }));
          },
        },
      ],
    });
    const cssDir = path.join(root, ".next/static/css");
    const css = fs.existsSync(cssDir)
      ? fs
          .readdirSync(cssDir)
          .filter((f) => f.endsWith(".css"))
          .map((f) => fs.readFileSync(path.join(cssDir, f), "utf8"))
          .join("\n")
      : "";
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
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByText("Diseña el recorrido").waitFor();
    const curriculum = page.locator("#curriculum");
    await curriculum
      .getByRole("button", { name: "Bajar lección", exact: true })
      .first()
      .click();
    await curriculum
      .getByRole("button", { name: "Guardar orden", exact: true })
      .click();
    let call = await page.evaluate(() =>
      window.__calls.find((c) => c.name === "order"),
    );
    assert.deepEqual(call.args[1][0].lessons, ["l2", "l1"]);
    console.log("Button reorder passed");
    // Actual pointer drag from the second lesson onto the first.
    const firstHandle = curriculum.getByRole("button", {
      name: "Mover Pausa de integración",
      exact: true,
    });
    const secondHandle = curriculum.getByRole("button", {
      name: "Mover Una primera mirada",
      exact: true,
    });
    await expect(secondHandle).toBeEnabled();
    await secondHandle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const firstBox = await firstHandle.boundingBox(),
      secondBox = await secondHandle.boundingBox();
    await page.mouse.move(secondBox.x + 10, secondBox.y + 10);
    await page.mouse.down();
    await page.mouse.move(secondBox.x + 10, secondBox.y + 25, { steps: 3 });
    await page.mouse.move(firstBox.x + 10, firstBox.y + 5, { steps: 15 });
    await page.mouse.up();
    await page.screenshot({
      path: "/tmp/ainara-drag-check.png",
      fullPage: true,
    });
    console.log(
      "Pointer drag ended",
      await curriculum
        .getByRole("button", { name: "Guardar orden", exact: true })
        .isEnabled(),
    );
    await curriculum
      .getByRole("button", { name: "Guardar orden", exact: true })
      .click();
    call = await page.evaluate(() =>
      window.__calls.filter((c) => c.name === "order").at(-1),
    );
    assert.deepEqual(call.args[1][0].lessons, ["l1", "l2"]);
    await curriculum
      .getByRole("combobox", {
        name: "Mover Pausa de integración a otro módulo",
      })
      .selectOption("m2");
    await curriculum
      .getByRole("button", { name: "Guardar orden", exact: true })
      .click();
    call = await page.evaluate(() =>
      window.__calls.filter((c) => c.name === "order").at(-1),
    );
    assert.deepEqual(call.args[1][1].lessons, ["l2"]);
    await page.evaluate(() => (window.__failSave = true));
    await curriculum
      .getByRole("button", { name: "Bajar módulo", exact: true })
      .first()
      .click();
    await curriculum
      .getByRole("button", { name: "Guardar orden", exact: true })
      .click();
    assert.equal(
      await curriculum
        .getByRole("button", { name: "Guardar orden", exact: true })
        .isEnabled(),
      true,
    );
    await page.evaluate(() => (window.__failSave = false));
    await curriculum
      .getByRole("button", { name: "Guardar orden", exact: true })
      .click();
    await curriculum
      .getByRole("button", {
        name: "Editar Integración cotidiana",
        exact: true,
      })
      .click();
    await page.getByRole("checkbox", { name: "Publicar módulo" }).check();
    await page
      .getByRole("button", { name: "Guardar módulo", exact: true })
      .click();
    assert.equal(
      (
        await page.evaluate(() =>
          window.__calls.find((c) => c.name === "module"),
        )
      ).args[1].is_published,
      true,
    );
    await page
      .locator("#quiz")
      .getByRole("button", { name: /Comenzar/ })
      .click();
    await page
      .getByRole("button", {
        name: "Hoy cambié de tarea tres veces.",
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: /Finalizar Quiz/ }).click();
    await page.getByText("¡Aprobado!", { exact: true }).waitFor();
    await page
      .locator("#mentor")
      .getByRole("button", { name: "Nueva agenda" })
      .click();
    await page.getByRole("button", { name: "Añadir franja" }).click();
    await page
      .getByRole("button", { name: "Guardar calendario", exact: true })
      .click();
    call = await page.evaluate(() =>
      window.__calls.find((c) => c.name === "mentor"),
    );
    assert.equal(call.args[1].availability.length, 1);
    assert.equal(call.args[1].timezone, "Europe/Madrid");
    assert.equal(
      await page
        .locator("#testimonials")
        .getByRole("button", { name: "Publicar", exact: true })
        .isDisabled(),
      true,
    );
    const notifications = page.locator("#notifications");
    await notifications
      .getByLabel("Título *", { exact: true })
      .fill("Nueva lectura");
    await notifications
      .getByLabel("Mensaje *", { exact: true })
      .fill("Ya está disponible.");
    await notifications.getByLabel("Enlace (opcional)").fill("/library");
    await notifications
      .getByRole("button", { name: "Enviar notificación", exact: true })
      .click();
    call = await page.evaluate(() =>
      window.__calls.find((c) => c.name === "campaign"),
    );
    assert.equal(call.args.link, "/library");
    assert.ok(call.args.requestId);
    await page.screenshot({
      path: "/tmp/ainara-admin-desktop.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "/tmp/ainara-admin-mobile.png",
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
      "Mobile horizontal overflow",
    );
    assert.deepEqual(errors, []);
    console.log(
      "Admin UI: pointer drag, reordering, cross-module moves, failed saves, publishing, quiz preview, calendar, moderation, internal notification links and mobile layout passed.",
    );
  } finally {
    await browser?.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
