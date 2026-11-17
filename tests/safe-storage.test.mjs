import assert from "node:assert/strict";
import test from "node:test";
import { readStoredIds, readStoredCount, writeStoredValue } from "../lib/safe-storage.ts";

function mockedStorage(map, options = {}) {
  globalThis.window = { localStorage: {
    getItem(key) { if (options.denyRead) throw new Error("blocked"); return map.get(key) ?? null; },
    setItem(key, value) { if (options.denyWrite) throw new Error("blocked"); map.set(key, String(value)); },
  }};
}

test("reads existing saved IDs and report count unchanged", () => {
  const data = new Map([["plugspot:saved","[1,4,6]"],["plugspot:alerts","[2]"],["plugspot:reports","5"]]);
  mockedStorage(data);
  assert.deepEqual(readStoredIds("plugspot:saved"), [1,4,6]);
  assert.deepEqual(readStoredIds("plugspot:alerts"), [2]);
  assert.equal(readStoredCount("plugspot:reports"), 5);
  assert.equal(data.get("plugspot:saved"), "[1,4,6]");
});

test("invalid records do not crash or overwrite original values when reading", () => {
  const data = new Map([["plugspot:saved",'{"oops":1}'],["plugspot:alerts",'[1,"2",-1,null,2]'],["plugspot:reports","NaN"]]);
  mockedStorage(data);
  assert.deepEqual(readStoredIds("plugspot:saved"), []);
  assert.deepEqual(readStoredIds("plugspot:alerts"), [1,2]);
  assert.equal(readStoredCount("plugspot:reports"), 0);
  assert.equal(data.get("plugspot:saved"), '{"oops":1}');
});

test("malformed data or denied browser storage remains nonfatal", () => {
  const data = new Map([["plugspot:saved","["]]);
  mockedStorage(data);
  assert.deepEqual(readStoredIds("plugspot:saved"), []);
  mockedStorage(data, {denyRead: true, denyWrite: true});
  assert.deepEqual(readStoredIds("plugspot:saved"), []);
  assert.equal(readStoredCount("plugspot:reports"), 0);
  assert.equal(writeStoredValue("plugspot:alerts","[4]"), false);
  assert.equal(data.has("plugspot:alerts"), false);
});

test("valid data still persists normally; SSR works without window", () => {
  const data = new Map(); mockedStorage(data);
  assert.equal(writeStoredValue("plugspot:alerts","[3]"), true);
  assert.equal(data.get("plugspot:alerts"), "[3]");
  delete globalThis.window;
  assert.deepEqual(readStoredIds("plugspot:saved"), []);
  assert.equal(readStoredCount("plugspot:reports"), 0);
  assert.equal(writeStoredValue("plugspot:saved","[1]"), false);
});
