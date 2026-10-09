import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import {
  INITIAL_SCORES,
  lifeWheelHighlights,
  scoreChange,
  selectLifeWheelEntry,
  wheelAverage,
  type LifeWheelEntry,
} from "../lib/life-wheel.ts";
import { lifeWheelSchema } from "../lib/validations/life-wheel.ts";
const valid = {
  scores: { ...INITIAL_SCORES },
  focus: "health",
  intention: "Caminar veinte minutos",
};
test("validates all eight ratings and trims the intention", () => {
  assert.equal(
    lifeWheelSchema.parse({ ...valid, intention: "  Caminar  " }).intention,
    "Caminar",
  );
  assert.equal(wheelAverage(INITIAL_SCORES), 5);
});
test("rejects omitted, invalid and unexpected ratings", () => {
  for (const value of [0, 11, 2.5, "5", null, Number.NaN]) {
    assert.equal(
      lifeWheelSchema.safeParse({
        ...valid,
        scores: { ...valid.scores, health: value },
      }).success,
      false,
    );
  }
  const { health, ...incomplete } = valid.scores;
  assert.equal(
    lifeWheelSchema.safeParse({ ...valid, scores: incomplete }).success,
    false,
  );
  assert.equal(
    lifeWheelSchema.safeParse({
      ...valid,
      scores: { ...valid.scores, extra: health },
    }).success,
    false,
  );
});
test("rejects unknown priorities, empty/oversized intentions and injected user ids", () => {
  for (const input of [
    { ...valid, focus: "unknown" },
    { ...valid, intention: "  " },
    { ...valid, intention: "x".repeat(501) },
    { ...valid, user_id: "someone-else" },
  ]) {
    assert.equal(lifeWheelSchema.safeParse(input).success, false);
  }
});
test("selects an immutable history snapshot without copying it into editable state", () => {
  const entry: LifeWheelEntry = {
    id: "own-entry",
    created_at: "2026-10-02T10:00:00.000Z",
    ...valid,
  };
  assert.equal(selectLifeWheelEntry([entry], "own-entry"), entry);
  assert.equal(selectLifeWheelEntry([entry], "another-account-entry"), null);
});
test("the printable report contains every requested field and no interactive controls", async () => {
  const report = await readFile(
    new URL("../components/life-wheel/life-wheel-report.tsx", import.meta.url),
    "utf8",
  );
  for (const content of [
    "BrandLockup",
    "Rueda de la vida",
    "created_at",
    "WheelChart",
    "LIFE_AREAS.map",
    "wheelAverage",
    "Área de foco",
    "Mi intención",
  ])
    assert.match(report, new RegExp(content));
  assert.doesNotMatch(report, /<(button|Button|Select|input|Textarea)\b/);
  const client = await readFile(
    new URL(
      "../app/(platform)/rueda-de-la-vida/wheel-client.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(client, /setReportEntry\(entry\)/);
  assert.match(client, /Descargar PDF/);
  assert.match(
    client,
    /mitra-rueda-de-la-vida-\$\{reportEntry\.created_at\.slice\(0, 10\)\}\.pdf/,
  );
});

test("personal comparisons preserve decreases, ties and priorities without judging the user", () => {
  const scores = { ...INITIAL_SCORES, health: 2, relationships: 9 };
  const highlights = lifeWheelHighlights(scores);
  assert.equal(highlights.attention.key, "health");
  assert.equal(highlights.strength.key, "relationships");
  assert.equal(scoreChange(4, 6), "−2 puntos");
  assert.equal(scoreChange(7, 6), "+1 punto");
  assert.equal(scoreChange(6, 6), "Sin cambio");
  assert.equal(scores.health, 2);
});
