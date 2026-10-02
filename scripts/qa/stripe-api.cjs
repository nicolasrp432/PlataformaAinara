// Executes the actual API handler with isolated provider/database adapters.
const esbuild = require("esbuild"),
  assert = require("assert/strict"),
  root = require("node:path").resolve(__dirname, "../..");
const fs = require("node:fs");
const outputDir = root + "/.next/qa-" + process.pid;
fs.mkdirSync(outputDir, { recursive: true });
let state;
const client = {
  from(table) {
    let action = "read",
      value;
    const q = {
      select() {
        return q;
      },
      eq() {
        return q;
      },
      maybeSingle() {
        return Promise.resolve({
          data: state.processed ? { event_id: "evt_qa" } : null,
          error: null,
        });
      },
      insert(v) {
        action = "insert";
        value = v;
        return q;
      },
      update(v) {
        action = "update";
        value = v;
        return q;
      },
      then(ok, bad) {
        if (action === "insert") {
          state.processed = true;
          state.recorded++;
        }
        if (action === "update") state.updates.push(value);
        return Promise.resolve({ data: null, error: null }).then(ok, bad);
      },
    };
    return q;
  },
  rpc: async () => ({
    data: state.confirm,
    error: state.rpcFail ? { message: "unavailable" } : null,
  }),
};
async function main() {
  global.__stripe = {
    webhooks: { constructEvent: () => state.event },
    refunds: {
      create: async () => {
        state.refunds++;
        return { id: "refund" };
      },
    },
    subscriptions: {
      retrieve: async () => ({
        id: "sub_qa",
        metadata: { supabase_user_id: "user" },
        customer: "cus",
        items: { data: [] },
      }),
    },
  };
  global.__admin = client;
  global.__resolve = async () => "user";
  global.__grant = async () => {
    state.grants++;
    if (state.fail) throw Error("transient");
  };
  global.__sync = async () => {
    if (state.fail) throw Error("transient");
  };
  await esbuild.build({
    entryPoints: [root + "/app/api/webhooks/stripe/route.ts"],
    outfile: outputDir + "/webhook-route.cjs",
    bundle: true,
    platform: "node",
    format: "cjs",
    packages: "external",
    tsconfig: root + "/tsconfig.json",
    plugins: [
      {
        name: "stubs",
        setup(b) {
          b.onResolve(
            {
              filter:
                /^@\/lib\/(stripe|supabase\/admin|services\/subscription)$/,
            },
            (a) => ({ path: a.path, namespace: "stub" }),
          );
          b.onLoad({ filter: /.*/, namespace: "stub" }, (a) => ({
            contents: a.path.endsWith("stripe")
              ? 'export function getStripe(){return global.__stripe};export const STRIPE_WEBHOOK_SECRET="qa";'
              : a.path.endsWith("admin")
                ? "export function supabaseAdmin(){return global.__admin}"
                : "export const resolveUserId=(v)=>global.__resolve(v);export const grantLifetimeAccess=(v)=>global.__grant(v);export const syncSubscription=(v)=>global.__sync(v);",
            loader: "js",
          }));
        },
      },
    ],
  });
  const { POST } = require(outputDir + "/webhook-route.cjs"),
    { NextRequest } = require(root + "/node_modules/next/server");
  const req = () =>
    new NextRequest("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: "event",
      headers: { "stripe-signature": "qa" },
    });
  function reset(type, object) {
    state = {
      event: { id: "evt_qa", type, data: { object } },
      processed: false,
      fail: false,
      confirm: true,
      recorded: 0,
      grants: 0,
      refunds: 0,
      updates: [],
    };
  }
  global.__stripe.checkout = {
    sessions: { retrieve: async () => ({ id: "cs" }) },
  };
  reset("checkout.session.completed", {
    mode: "payment",
    payment_status: "paid",
    id: "cs",
    metadata: { supabase_user_id: "user" },
  });
  state.fail = true;
  assert.equal((await POST(req())).status, 500);
  assert.equal(state.processed, false);
  state.fail = false;
  assert.equal((await POST(req())).status, 200);
  assert.equal(state.recorded, 1);
  assert.equal((await POST(req())).status, 200);
  assert.equal(state.grants, 2);
  reset("checkout.session.completed", {
    mode: "payment",
    payment_status: "unpaid",
    id: "cs",
    metadata: { supabase_user_id: "user" },
  });
  await POST(req());
  assert.equal(state.grants, 0);
  reset("checkout.session.completed", {
    mode: "payment",
    payment_status: "paid",
    id: "cs",
    payment_intent: "pi",
    metadata: { mentorship_session_id: "session" },
  });
  state.confirm = false;
  await POST(req());
  assert.equal(state.refunds, 1);
  assert.equal(state.updates[0].status, "cancelled");
  reset("checkout.session.expired", {
    id: "cs",
    metadata: { mentorship_session_id: "session" },
  });
  await POST(req());
  assert.equal(state.updates[0].status, "cancelled");
  console.log(
    "Stripe route with simulated Stripe/Supabase: a failure remains retryable, a success is idempotent, unpaid checkout grants no access, conflicting late payment refunds, expired booking releases hold.",
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => fs.rmSync(outputDir, { recursive: true, force: true }));
