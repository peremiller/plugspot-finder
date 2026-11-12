import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});

test("renders public page routes with PlugSpot-branded titles", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `routes-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const environment = {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  };
  const context = { waitUntil() {}, passThroughOnException() {} };

  for (const [path, expectedTitle] of [
    ["/place/common-room", "PlugSpot — Common Room, Alabang"],
    ["/route/common-room", "PlugSpot — Route to Common Room, Alabang"],
    ["/saved", "PlugSpot — Saved Places"],
    ["/community", "PlugSpot — Community Pulse"],
    ["/ai", "PlugSpot — AI Workspace Planner"],
  ]) {
    const response = await worker.fetch(
      new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
      environment,
      context,
    );
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), new RegExp(`<title>${expectedTitle}</title>`), path);
  }
});

test("reports the disabled Workspace Copilot without exposing a secret", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `ai-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/api/ai/status"),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 410);
  const body = await response.json();
  assert.equal(body.configured, false);
  assert.equal(body.disabled, true);
  assert.deepEqual(body.capabilities, []);
  assert.equal("apiKey" in body, false);
});

test("labels workspace sample data and keyboard navigation without claiming a live community feed", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `provenance-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Preview data:/);
  assert.match(html, /illustrative, not live verification/);
  assert.match(html, /Skip to workspace results/);
  assert.match(html, /Open community preview/);
  assert.doesNotMatch(html, /12,540\+/);
  assert.doesNotMatch(html, /LIVE COMMUNITY PULSE/);
});
