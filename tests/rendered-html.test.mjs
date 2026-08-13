import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const root=new URL("../",import.meta.url);
const read=(path)=>readFile(new URL(path,root),"utf8");

async function render(){
 const workerUrl=new URL("../dist/server/index.js",import.meta.url);
 workerUrl.searchParams.set("tc",String(Date.now()));
 const {default:worker}=await import(workerUrl.href);
 return worker.fetch(new Request("http://localhost/",{headers:{accept:"text/html"}}),{ASSETS:{fetch:async()=>new Response("Not found",{status:404})}},{waitUntil(){},passThroughOnException(){}});
}

test("TC-01 SBF 마스터와 원본 버전 정보를 렌더링한다",async()=>{
 const response=await render();
 assert.equal(response.status,200);
 const html=await response.text();
 assert.match(html,/SBF Workbench/);
 assert.match(html,/SBF 업무 마스터/);
 assert.match(html,/SBF v2\.5/);
 assert.match(html,/SBF v2\.4/);
 assert.doesNotMatch(html,/codex-preview|Your site is taking shape/);
});

test("TC-02 CSV export uses IA headers and raw Excel rows",async()=>{
 const page=await read("app/page.tsx");
 assert.match(page,/version-select/);
 assert.match(page,/<option value="v2\.5">/);
 assert.match(page,/<option value="v2\.4">/);
 assert.match(page,/iaHeaders/);
 assert.match(page,/\.\.\.x\.raw/);
 assert.match(page,/new Blob\(\['\\uFEFF'/);
 assert.match(page,/text\/csv;charset=utf-8/);
 assert.match(page,/exportItems\.map/);
});

test("TC-03 검색·필터·접근성·변경요청 UI가 존재한다",async()=>{
 const [page,layout]=await Promise.all([read("app/page.tsx"),read("app/layout.tsx")]);
 assert.match(page,/aria-label="SBF \\uD1B5\\uD569 \\uAC80\\uC0C9"/);
 assert.match(page,/aria-label=\{'\\uB3C4\\uBA54\\uC778 \\uD544\\uD130'\}/);
 assert.doesNotMatch(page,/aria-label="1Depth \\uD544\\uD130"/);
 assert.match(page,/squad,setSquad/);
 assert.match(page,/sktOwner,setSktOwner/);
 assert.match(page,/role="dialog"/);
 assert.match(page,/aria-modal="true"/);
 assert.match(page,/SBF Change Request|contentEditable|request-table/);
 assert.match(layout,/<html lang="ko">/);
});

test("TC-04 IA full data is loaded from Excel A to AX",async()=>{
 const data=await read("app/data.ts");
 const keys=[...data.matchAll(/"id":"([^\"]+)","sub":(\d+)/g)].map(m=>m[1]+"-"+m[2]);
 assert.ok(keys.length>=1172);
 assert.ok(new Set(keys).size>=1171);
 assert.match(data,/export const iaHeaders:string\[\]=/);
 assert.match(data,/"raw":\[/);
 assert.match(data,/"1Depth \(old\)"/);
 assert.match(data,/"d1":"1\.\\ud0d0\\uc0c9"/);
 assert.match(data,/"d1":"2\.\\ud68c/);
 assert.match(data,/"sktOwner":/);
 assert.match(data,/"axOwner":/);
});

test("TC-05 SBF master description uses decoded korean",async()=>{const page=await read("app/page.tsx");assert.match(page,/desc=\{'Business Framework\\uC758/);assert.doesNotMatch(page,/desc="Business Framework\\uC758/);assert.doesNotMatch(page,/Business Framework\? \?\?\?/)});
