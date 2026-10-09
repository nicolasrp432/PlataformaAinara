import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

for (const [name, script] of [
  [
    "Admin routes protect quiz answers and certificate PDF downloads",
    "admin-api",
  ],
  [
    "AI route enforces ownership/access and handles real, empty and failed provider streams",
    "ai-api",
  ],
  [
    "Stripe retries remain processable and late/expired/unpaid bookings are handled safely",
    "stripe-api",
  ],
]) {
  test(name, () => {
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(new URL(`../scripts/qa/${script}.cjs`, import.meta.url))],
      { encoding: "utf8", timeout: 30000 },
    );
    assert.equal(
      result.status,
      0,
      `${result.stdout}\n${result.stderr}\n${result.error ?? ""}`,
    );
  });
}
