// Unit tests for the file-based persistent SBF master (app/sbf-master-file.ts).
// Run with: node --import tsx --test tests/sbf-master-file.test.mjs
import assert from "node:assert/strict";
import test from "node:test";

import {
  serializeSnapshot,
  parseSnapshot,
  mapFetchOutcomeToState,
  describeLoadError,
  SBF_MASTER_SCHEMA_VERSION,
} from "../app/sbf-master-file.ts";
import {items,iaHeaders,itemFromRaw} from "../app/data.ts";

const sampleMeta={
  versionNo:"v2.6",
  publishedAt:"2026-08-10T00:00:00.000Z",
  publisher:"김서현",
  reason:"round-trip 테스트",
  itemCount:0,
  sourceFile:"SKT_Business_Framework.xlsx",
  sourceSheet:"1. IA",
};

function sampleItems(){
  // Build a couple of items purely from raw so we exercise the itemFromRaw contract.
  const r1=iaHeaders.map(()=>"");r1[1]="B1002";r1[2]="1";r1[3]="상품";r1[10]="Y";r1[11]="Y";
  const r2=iaHeaders.map(()=>"");r2[1]="B2036";r2[2]="3";r2[3]="빌링";r2[10]="Y";r2[12]="Y";
  return [itemFromRaw(r1),itemFromRaw(r2)];
}

test("serialize → parse round-trip preserves iaHeaders and items(raw)", ()=>{
  const input={meta:sampleMeta,iaHeaders,items:sampleItems()};
  const json=serializeSnapshot(input);
  const parsed=parseSnapshot(json);
  assert.equal(parsed.ok,true);
  assert.deepEqual(parsed.iaHeaders,iaHeaders);
  assert.equal(parsed.items.length,2);
  assert.deepEqual(parsed.items[0].raw,input.items[0].raw);
  assert.deepEqual(parsed.items[1].raw,input.items[1].raw);
  // Structured fields survive because parseSnapshot rebuilds via itemFromRaw.
  assert.equal(parsed.items[0].id,"B1002");
  assert.equal(parsed.items[0].sub,1);
  assert.equal(parsed.items[1].id,"B2036");
  assert.equal(parsed.items[1].sub,3);
  // meta.itemCount is derived from items on serialize.
  assert.equal(parsed.meta.itemCount,2);
  assert.equal(parsed.meta.versionNo,"v2.6");
});

test("serializeSnapshot embeds schemaVersion", ()=>{
  const json=serializeSnapshot({meta:sampleMeta,iaHeaders,items:sampleItems()});
  const obj=JSON.parse(json);
  assert.equal(obj.schemaVersion,SBF_MASTER_SCHEMA_VERSION);
});

test("round-trip works for the full seed items set", ()=>{
  const json=serializeSnapshot({meta:sampleMeta,iaHeaders,items});
  const parsed=parseSnapshot(json);
  assert.equal(parsed.ok,true);
  assert.equal(parsed.items.length,items.length);
  assert.deepEqual(parsed.items[0].raw,items[0].raw);
});

test("parseSnapshot returns PARSE for invalid JSON", ()=>{
  const parsed=parseSnapshot("{not valid json");
  assert.equal(parsed.ok,false);
  assert.equal(parsed.errorCode,"PARSE");
});

test("parseSnapshot returns SCHEMA when iaHeaders is missing", ()=>{
  const parsed=parseSnapshot(JSON.stringify({meta:sampleMeta,items:[]}));
  assert.equal(parsed.ok,false);
  assert.equal(parsed.errorCode,"SCHEMA");
});

test("parseSnapshot returns SCHEMA when items is not an array", ()=>{
  const parsed=parseSnapshot(JSON.stringify({iaHeaders,items:"nope"}));
  assert.equal(parsed.ok,false);
  assert.equal(parsed.errorCode,"SCHEMA");
});

test("parseSnapshot returns SCHEMA when an item lacks a raw string[]", ()=>{
  const parsed=parseSnapshot(JSON.stringify({iaHeaders,items:[{id:"B1"}]}));
  assert.equal(parsed.ok,false);
  assert.equal(parsed.errorCode,"SCHEMA");
});

test("loader state machine: ok outcome → ready with data", ()=>{
  const json=serializeSnapshot({meta:sampleMeta,iaHeaders,items:sampleItems()});
  const state=mapFetchOutcomeToState({kind:"ok",text:json});
  assert.equal(state.status,"ready");
  assert.equal(state.items.length,2);
  assert.deepEqual(state.iaHeaders,iaHeaders);
});

test("loader state machine: not-found → error NOT_FOUND", ()=>{
  const state=mapFetchOutcomeToState({kind:"not-found"});
  assert.equal(state.status,"error");
  assert.equal(state.errorCode,"NOT_FOUND");
});

test("loader state machine: network-error → error NOT_FOUND", ()=>{
  const state=mapFetchOutcomeToState({kind:"network-error"});
  assert.equal(state.status,"error");
  assert.equal(state.errorCode,"NOT_FOUND");
});

test("loader state machine: ok with bad JSON → error PARSE", ()=>{
  const state=mapFetchOutcomeToState({kind:"ok",text:"{broken"});
  assert.equal(state.status,"error");
  assert.equal(state.errorCode,"PARSE");
});

test("loader state machine: ok with invalid schema → error SCHEMA", ()=>{
  const state=mapFetchOutcomeToState({kind:"ok",text:JSON.stringify({items:[]})});
  assert.equal(state.status,"error");
  assert.equal(state.errorCode,"SCHEMA");
});

test("describeLoadError gives a cause and guidance per error code", ()=>{
  for(const code of ["NOT_FOUND","PARSE","SCHEMA"]){
    const {cause,guidance}=describeLoadError(code);
    assert.ok(cause.length>0);
    assert.ok(guidance.includes("public/sbf-master.json"));
  }
});
