import assert from "node:assert/strict"
import { test } from "node:test"
import { INITIAL_SCORES, lifeWheelSchema, wheelAverage } from "../lib/life-wheel.ts"
const valid = { scores: { ...INITIAL_SCORES }, focus: "health", intention: "Caminar veinte minutos" }
test("validates all eight ratings and trims the intention", () => {
  assert.equal(lifeWheelSchema.parse({ ...valid, intention: "  Caminar  " }).intention, "Caminar")
  assert.equal(wheelAverage(INITIAL_SCORES), 5)
})
test("rejects omitted, invalid and unexpected ratings", () => {
  for (const value of [0, 11, 2.5, "5", null, Number.NaN]) {
    assert.equal(lifeWheelSchema.safeParse({ ...valid, scores: { ...valid.scores, health: value } }).success, false)
  }
  const { health, ...incomplete } = valid.scores
  assert.equal(lifeWheelSchema.safeParse({ ...valid, scores: incomplete }).success, false)
  assert.equal(lifeWheelSchema.safeParse({ ...valid, scores: { ...valid.scores, extra: health } }).success, false)
})
test("rejects unknown priorities, empty/oversized intentions and injected user ids", () => {
  for (const input of [{ ...valid, focus: "unknown" }, { ...valid, intention: "  " }, { ...valid, intention: "x".repeat(501) }, { ...valid, user_id: "someone-else" }]) {
    assert.equal(lifeWheelSchema.safeParse(input).success, false)
  }
})
