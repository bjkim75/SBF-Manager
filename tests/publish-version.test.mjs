// Unit tests for Task 58 (VPUB-01~07): publish version control + import-linked deploy.
// Run with: node --import tsx --test tests/publish-version.test.mjs
import assert from "node:assert/strict";
import test from "node:test";

import {validatePublishVersion,calculateNextVersion} from "../app/extended-views.tsx";
import {serializeSnapshot} from "../app/sbf-master-file.ts";
import {items,iaHeaders} from "../app/data.ts";

test("VPUB-05 empty version is invalid", ()=>{
  const r=validatePublishVersion("",["v2.5","v2.4"]);
  assert.equal(r.ok,false);
  assert.match(r.message,/버전 번호/);
});

test("VPUB-05 whitespace-only version is invalid", ()=>{
  const r=validatePublishVersion("   ",["v2.5"]);
  assert.equal(r.ok,false);
});

test("VPUB-05 duplicate version is invalid (case-insensitive)", ()=>{
  assert.equal(validatePublishVersion("v2.5",["v2.5","v2.4"]).ok,false);
  assert.equal(validatePublishVersion("V2.5",["v2.5"]).ok,false);
});

test("VPUB-04 free-form 3-part version is valid", ()=>{
  const r=validatePublishVersion("2.7.1",["v2.5","v2.4"]);
  assert.equal(r.ok,true);
  assert.equal(r.value,"2.7.1");
});

test("VPUB-05 trims surrounding whitespace on the accepted value", ()=>{
  const r=validatePublishVersion("  v2.6  ",["v2.5"]);
  assert.equal(r.ok,true);
  assert.equal(r.value,"v2.6");
});

test("calculateNextVersion still used as fallback default", ()=>{
  assert.equal(calculateNextVersion("v2.5"),"v2.6");
  assert.equal(calculateNextVersion("v2.9"),"v3.0");
});

test("VPUB-07 serializeSnapshot records the user-controlled versionNo", ()=>{
  const meta={versionNo:"2.7.1",publishedAt:"2026-08-10T00:00:00.000Z",publisher:"김서현",reason:"import publish",itemCount:0,sourceFile:"SKT_Business_Framework.xlsx",sourceSheet:"1. IA"};
  const json=serializeSnapshot({meta,iaHeaders,items});
  const obj=JSON.parse(json);
  assert.equal(obj.meta.versionNo,"2.7.1");
  assert.equal(obj.meta.itemCount,items.length);
});
