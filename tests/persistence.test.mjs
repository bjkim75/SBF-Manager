import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
const root=new URL("../",import.meta.url);const read=p=>readFile(new URL(p,root),"utf8");

test("TC-11 D1 스키마는 업무 영속성과 무결성 제약을 가진다",async()=>{const [schema,hosting,migration]=await Promise.all([read('db/schema.ts'),read('.openai/hosting.json'),read('drizzle/0000_easy_wilson_fisk.sql')]);assert.match(hosting,/"d1":\s*"DB"/);for(const table of ['change_requests','change_request_items','sbf_versions','audit_logs'])assert.ok(migration.includes('CREATE TABLE `'+table+'`'));assert.match(schema,/uq_change_requests_request_no/);assert.match(schema,/uq_sbf_versions_no/);assert.match(schema,/uq_sbf_versions_hash/);assert.match(migration,/FOREIGN KEY.*change_requests/)});

test("TC-12 변경요청 API는 복수 항목·감사로그·낙관적 잠금을 적용한다",async()=>{const route=await read('app/api/change-requests/route.ts');assert.match(route,/items\.length===0/);assert.match(route,/changeRequestItems/);assert.match(route,/auditLogs/);assert.match(route,/eq\(changeRequests\.rowVersion,body\.rowVersion\)/);assert.match(route,/status:409/);assert.match(route,/요청 접수/);assert.match(route,/임시 저장/)});

test("TC-13 버전 API는 불변 메타데이터와 감사 추적을 저장한다",async()=>{const route=await read('app/api/versions/route.ts');assert.match(route,/versionPattern/);assert.match(route,/reason\.length>500/);assert.match(route,/snapshotHash/);assert.match(route,/sourceSheet:"1\. IA"/);assert.match(route,/action:"버전 발행"/);assert.match(route,/correlationId/)});

test("TC-14 UI는 변경요청과 버전 발행 API를 호출한다",async()=>{const [page,views]=await Promise.all([read('app/page.tsx'),read('app/extended-views.tsx')]);assert.match(page,/fetch\('\/api\/change-requests'/);assert.match(page,/new FormData\(form\)/);assert.match(page,/data\.getAll\('changeType'\)/);assert.match(views,/fetch\('\/api\/versions'/);assert.match(views,/불변 스냅샷을 발행했습니다/)});