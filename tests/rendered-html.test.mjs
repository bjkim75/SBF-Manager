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

test("TC-02 버전 선택 CSV 다운로드 계약을 제공한다",async()=>{
 const page=await read("app/page.tsx");
 assert.match(page,/aria-label="다운로드할 SBF 버전"/);
 assert.match(page,/<option value="v2\.5">/);
 assert.match(page,/<option value="v2\.4">/);
 assert.match(page,/headers=\['SBF 버전','업무ID','SUB ID'/);
 assert.match(page,/new Blob\(\['\\uFEFF'/);
 assert.match(page,/text\/csv;charset=utf-8/);
 assert.match(page,/SBF_master_\$\{version\}_2026-08-12\.csv/);
 assert.match(page,/replaceAll\('"','""'\)/);
 assert.match(page,/filtered\.map/);
});

test("TC-03 검색·필터·접근성·변경요청 UI가 존재한다",async()=>{
 const [page,layout]=await Promise.all([read("app/page.tsx"),read("app/layout.tsx")]);
 assert.match(page,/aria-label="SBF 통합 검색"/);
 assert.match(page,/aria-label="도메인 필터"/);
 assert.match(page,/aria-label="1Depth 필터"/);
 assert.match(page,/role="dialog"/);
 assert.match(page,/aria-modal="true"/);
 assert.match(page,/새 변경요청/);
 assert.match(layout,/<html lang="ko">/);
});

test("TC-04 분석된 1. IA 샘플은 복합키와 필수 계층을 가진다",async()=>{
 const data=await read("app/data.ts");
 const keys=[...data.matchAll(/id:'([^']+)',sub:(\d+)/g)].map(m=>m[1]+"-"+m[2]);
 assert.ok(keys.length>=8);
 assert.equal(new Set(keys).size,keys.length);
 assert.match(data,/d1:'1\.탐색'/);
 assert.match(data,/d1:'2\.회원·계정'/);
 assert.match(data,/l3:'Product Offering 검색'/);
});