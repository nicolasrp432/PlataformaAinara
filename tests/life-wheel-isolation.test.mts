import assert from "node:assert/strict"
import { after, test } from "node:test"
import { readFile } from "node:fs/promises"
import { PGlite } from "@electric-sql/pglite"

const db = new PGlite()
const A = "10000000-0000-4000-8000-000000000001"
const B = "10000000-0000-4000-8000-000000000002"
const scores = '{"health":8,"relationships":7,"family":6,"work":5,"money":4,"growth":3,"leisure":2,"environment":1}'

await db.exec(`
  CREATE ROLE authenticated; CREATE ROLE anon;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users(id uuid PRIMARY KEY);
  INSERT INTO auth.users VALUES ('${A}'),('${B}');
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  GRANT USAGE ON SCHEMA public,auth TO authenticated,anon;
`)
await db.exec(await readFile(new URL("../migrations/0022_life_wheel.sql", import.meta.url), "utf8"))
await db.exec(`INSERT INTO life_wheel_entries(user_id,scores,focus,intention) VALUES ('${A}','${scores}','health','Dato privado de A'),('${B}','${scores}','money','Dato privado de B')`)

after(async () => db.close())

test("life-wheel history only returns the signed-in account and hides other accounts", async () => {
  await db.exec(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${A}',false)`)
  const rows = await db.query<{ intention: string }>("SELECT intention FROM life_wheel_entries")
  assert.deepEqual(rows.rows.map(row => row.intention), ["Dato privado de A"])
  const foreign = await db.query("SELECT id FROM life_wheel_entries WHERE user_id = $1", [B])
  assert.equal(foreign.rows.length, 0)
  await assert.rejects(db.exec(`INSERT INTO life_wheel_entries(user_id,scores,focus,intention) VALUES ('${B}','${scores}','health','Suplantación')`))
  await db.exec("RESET ROLE; SELECT set_config('request.jwt.claim.sub','',false)")
})
