import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const root=new URL("../",import.meta.url);
const read=(path)=>readFile(new URL(path,root),"utf8");

test("TC-01 Netlify SPA build emits root index and SBF source",async()=>{
 const [html,page]=await Promise.all([read("dist/index.html"),read("app/page.tsx")]);
 assert.match(html,/<div id="root"><\/div>/);
 assert.match(html,/type="module"/);
 assert.match(html,/assets\//);
 assert.match(page,/title="SBF \uC5C5\uBB34 \uB9C8\uC2A4\uD130"/);
 assert.match(page,/title="SBF \uC5C5\uBB34 \uB9C8\uC2A4\uD130"/);
 assert.match(page,/title="SBF \uC5C5\uBB34 \uB9C8\uC2A4\uD130"/);
 assert.match(page,/title="SBF \uC5C5\uBB34 \uB9C8\uC2A4\uD130"/);
 assert.doesNotMatch(html,/codex-preview|Your site is taking shape/);
});

test("TC-02 CSV export uses IA headers and raw Excel rows",async()=>{
 const page=await read("app/page.tsx");
 assert.doesNotMatch(page,/version-select/);
 assert.doesNotMatch(page,/aria-label="다운로드할 SBF 버전"/);
 assert.match(page,/version-chip/);
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
 assert.match(page,/title="SBF \uC5C5\uBB34 \uB9C8\uC2A4\uD130"/);
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
