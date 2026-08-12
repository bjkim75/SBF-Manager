import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
const root=new URL("../",import.meta.url);

test("TC-05 버전 선택은 서로 다른 데이터 스냅샷을 사용한다",async()=>{
 const [page,data]=await Promise.all([readFile(new URL("app/page.tsx",root),"utf8"),readFile(new URL("app/data.ts",root),"utf8")]);
 assert.match(page,/version==='v2\.5'\?items:itemsV24/);
 assert.match(page,/version==='v2\.5'\?1172:1182/);
 assert.match(data,/export const itemsV24/);
 assert.match(data,/B1002-1':'PLM 정보 조회/);
 assert.match(data,/B1009-1':'L3 미매핑/);
});

test("TC-06 CSV는 선택 버전과 필터 결과를 추적한다",async()=>{
 const page=await readFile(new URL("app/page.tsx",root),"utf8");
 assert.match(page,/headers=\['SBF 버전'/);
 assert.match(page,/exportItems\.map\(x=>\[requestedVersion,x\.id/);
 assert.match(page,/link\.download=`SBF_\$\{requestedVersion\}_/);
 assert.match(page,/useFilters&&requestedVersion===version\?filtered/);
});