import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
const root=new URL("../",import.meta.url);

test("TC-05 version selection uses distinct data snapshots",async()=>{
 const [page,data]=await Promise.all([readFile(new URL("app/page.tsx",root),"utf8"),readFile(new URL("app/data.ts",root),"utf8")]);
 assert.match(page,/version==='v2\.5'\?items:itemsV24/);
 assert.match(page,/const versionMeta=versionStats/);
 assert.match(page,/const versionTotal=versionMeta\.count/);
 assert.match(data,/export const itemsV24/);
 assert.ok(data.includes('items.map'));
 assert.match(data,/B1002-1/);
 assert.match(data,/B1009-1/);
});

test("TC-06 CSV tracks selected version and filtered rows",async()=>{
 const page=await readFile(new URL("app/page.tsx",root),"utf8");
 assert.ok(page.includes("headers=['SBF \\uBC84\\uC804'"));
 assert.ok(page.includes("exportItems.map(x=>[requestedVersion,...x.raw]"));
 assert.match(page,/link\.download=`SBF_\$\{requestedVersion\}_/);
 assert.match(page,/useFilters&&requestedVersion===version\?filtered/);
});



