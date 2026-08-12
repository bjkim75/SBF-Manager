import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
const root=new URL("../",import.meta.url);
const read=p=>readFile(new URL(p,root),"utf8");

test("TC-07 Kiro 누락 화면이 메뉴와 라우팅에 연결된다",async()=>{const [page,data,views]=await Promise.all([read("app/page.tsx"),read("app/data.ts"),read("app/extended-views.tsx")]);for(const name of ['계층 트리','변경 전후 비교','변경이력','Jira 반영 관리','버전 관리','감사 로그']){assert.match(data,new RegExp(name));assert.match(page,new RegExp(name))}assert.match(views,/export function HierarchyView/);assert.match(views,/export function VersionView/)});

test("TC-08 계층·다중 변경·열 설정 수용 기준을 제공한다",async()=>{const [page,views]=await Promise.all([read("app/page.tsx"),read("app/extended-views.tsx")]);assert.match(views,/Depth 1만 기본 펼침/);assert.match(views,/setExpanded/);assert.match(page,/columnsOpen/);assert.match(page,/열 초기화/);assert.match(page,/changeItems\.map/);assert.match(page,/항목 추가/);assert.match(page,/요청 분야/)});

test("TC-09 버전 발행·Draft·불변 스냅샷 UI를 제공한다",async()=>{const views=await read("app/extended-views.tsx");assert.match(views,/미발행 변경사항 27건/);assert.match(views,/새 버전 발행/);assert.match(views,/자동 증가 · v2\.6/);assert.match(views,/불변 스냅샷 발행/);assert.match(views,/읽기 전용/)});

test("TC-10 알림·감사·편집잠금 요구사항을 제공한다",async()=>{const [page,views]=await Promise.all([read("app/page.tsx"),read("app/extended-views.tsx")]);assert.match(page,/NotificationPanel/);assert.match(views,/안읽음 3/);assert.match(page,/29:42 후 자동 잠금 해제/);assert.match(views,/상관 ID/);assert.match(views,/Jira 반영 관리/)});