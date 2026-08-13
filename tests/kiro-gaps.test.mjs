import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
const root=new URL("../",import.meta.url);
const read=p=>readFile(new URL(p,root),"utf8");

test("TC-07 Kiro gap screens remain wired",async()=>{const [page,data,views]=await Promise.all([read("app/page.tsx"),read("app/data.ts"),read("app/extended-views.tsx")]);assert.doesNotMatch(page,/IA\\u2013L3|IA?L3/);for(const marker of [/ChangeCompare/,/HistoryView/,/VersionView/]){assert.match(page,marker)}assert.doesNotMatch(page,/JiraView/);assert.doesNotMatch(data,/Jira \uBC18\uC601 \uAD00\uB9AC/);assert.doesNotMatch(page,/HierarchyView/);assert.match(views,/export function VersionView/);assert.doesNotMatch(page,/AuditView/);assert.doesNotMatch(views,/export function AuditView/)});

test("TC-08 multi-row change and IA master table are provided",async()=>{const [page,views]=await Promise.all([read("app/page.tsx"),read("app/extended-views.tsx")]);assert.match(views,/setExpanded/);assert.doesNotMatch(page,/className="segments"/);assert.doesNotMatch(page,/column-picker/);assert.match(page,/sktOwner/);assert.match(page,/axOwner/);assert.doesNotMatch(page,/function Mapping/);assert.match(page,/rows\.map/);assert.match(page,/addRow/);assert.match(page,/requestArea/)});

test("TC-09 deployment draft immutable snapshot UI",async()=>{const views=await read("app/extended-views.tsx");assert.ok(views.includes("pendingCount"));assert.ok(views.includes("v2.6"));assert.ok(views.includes("snapshot"));assert.ok(views.includes("download(x[0])"));assert.ok(!views.includes("??? ???? 27?"))});


test("TC-10 notifications remain and edit lock is removed",async()=>{const [page,views]=await Promise.all([read("app/page.tsx"),read("app/extended-views.tsx")]);assert.match(page,/NotificationPanel/);assert.match(views,/notice-tabs/);assert.doesNotMatch(page,/className="edit-lock"/);assert.doesNotMatch(page,/29:42/);assert.doesNotMatch(views,/export function JiraView/)});


test("TC-16 removed support menus and dead views stay deleted",async()=>{const [page,data,views]=await Promise.all([read("app/page.tsx"),read("app/data.ts"),read("app/extended-views.tsx")]);for(const name of ["ReferenceDataView","UserAccessView","SettingsView"]){assert.doesNotMatch(page,new RegExp(name));assert.doesNotMatch(views,new RegExp(name))}for(const label of ["\uAE30\uC900\uC815\uBCF4","\uC0AC\uC6A9\uC790\u00B7\uAD8C\uD55C","\uD658\uACBD \uC124\uC815"]){assert.doesNotMatch(data,new RegExp(label));assert.doesNotMatch(page,new RegExp(label))}});



test("TC-17 change request modal supports rich content table attachments and pasted images",async()=>{const page=await read("app/page.tsx");assert.match(page,/contentEditable/);assert.match(page,/onPaste=\{onPaste\}/);assert.match(page,/clipboardData\.items/);assert.match(page,/type="file" multiple/);assert.match(page,/request-table/);assert.match(page,/referenceUrl/);assert.match(page,/attachment-drop/)});


test("TC-18 processing work supports status transitions",async()=>{const page=await read("app/page.tsx");assert.match(page,/function ProcessingWork/);assert.match(page,/updateRequestStatus/);assert.match(page,/rows={workflowRequests}/);assert.match(page,/\\uAC80\\uD1A0 \\uC911/);assert.match(page,/\\uBCF4\\uC644 \\uC694\\uCCAD/);assert.match(page,/\\uC2B9\\uC778/);assert.match(page,/\\uC791\\uC5C5 \\uC644\\uB8CC/);assert.match(page,/jiraSteps/);assert.match(page,/Jira \\uC0B0\\uCD9C\\uBB3C/)});



test("TC-19 duplicated depth move preview is removed",async()=>{const [views,css]=await Promise.all([read("app/extended-views.tsx"),read("app/globals.css")]);assert.doesNotMatch(views,/className="panel depth-move"/);assert.doesNotMatch(css,/\.depth-move/)});



test("TC-20 data export menu is removed and version menu is deployment",async()=>{const [page,data,views]=await Promise.all([read("app/page.tsx"),read("app/data.ts"),read("app/extended-views.tsx")]);assert.doesNotMatch(data,/\\uB370\\uC774\\uD130 \\uB0B4\\uBCF4\\uB0B4\\uAE30/);assert.doesNotMatch(data,/\\uBC84\\uC804 \\uAD00\\uB9AC/);assert.match(data,/\\uBC30\\uD3EC\\uAD00\\uB9AC/);assert.match(page,/\\uBC30\\uD3EC\\uAD00\\uB9AC/);assert.match(views,/DEPLOYMENT CONTROL/);assert.doesNotMatch(views,/VERSION CONTROL/)});


test("TC-21 processing decision and jira completion guard",async()=>{const page=await read("app/page.tsx");assert.match(page,/decision-actions/);assert.match(page,/complete-actions/);assert.match(page,/className=\{r\.status===a\?'active decision':''\}/);assert.doesNotMatch(page,/a==='\\uC2B9\\uC778'\|\|a==='\\uC791\\uC5C5 \\uC644\\uB8CC'\?'primary':''/);assert.match(page,/window\.confirm/);assert.match(page,/Jira/);assert.match(page,/SBF/);assert.match(page,/note:/);assert.match(page,/note:/)});


test("TC-22 processing supports list card filter sort",async()=>{const [page,css]=await Promise.all([read("app/page.tsx"),read("app/globals.css")]);assert.match(page,/viewMode/);assert.match(page,/setViewMode/);assert.match(page,/statusFilter/);assert.match(page,/sortOrder/);assert.match(page,/visibleRows/);assert.match(page,/processing-toolbar/);assert.match(page,/processing-list/);assert.match(page,/localeCompare/);assert.match(css,/\.processing-toolbar/);assert.match(css,/\.view-toggle/)});


test("TC-23 processing list exposes sbf jira states",async()=>{const [page,css]=await Promise.all([read("app/page.tsx"),read("app/globals.css")]);assert.match(page,/sbfApplyStatus/);assert.match(page,/jiraApplyStatus/);assert.match(page,/sbf-apply/);assert.match(page,/jira-state/);assert.match(page,/jira-open/);assert.match(page,/setViewMode\('card'\)/);assert.match(page,/SBF \\uBC18\\uC601/);assert.match(page,/Jira \\uBC18\\uC601/);assert.match(page,/Jira \\uC0B0\\uCD9C\\uBB3C \\uAD00\\uB9AC/);assert.match(css,/\.sbf-apply/);assert.match(css,/\.jira-state/)});


test("TC-24 requester sees sbf jira results and no question mark button",async()=>{const page=await read("app/page.tsx");assert.match(page,/sbfResult/);assert.match(page,/jiraResult/);assert.match(page,/SBF \\uBC18\\uC601\\uACB0\\uACFC/);assert.match(page,/Jira \\uBC18\\uC601\\uACB0\\uACFC/);assert.match(page,/SBF \\uBC18\\uC601 \\uC644\\uB8CC, Jira \\uBBF8\\uBC18\\uC601/);assert.doesNotMatch(page,/>\? \{'\\uC0C8 \\uBCC0\\uACBD\\uC694\\uCCAD'\}/);assert.doesNotMatch(page,/<button>\? \{'\\uD544\\uD130'\}<\/button>/)});


test("TC-25 import view is trusted sbf loading",async()=>{const [page,css]=await Promise.all([read("app/page.tsx"),read("app/globals.css")]);const block=page.match(/function ImportView[\s\S]*?function RequestModal/)?.[0]??"";assert.match(block,/title=\{'\\u0053\\u0042\\u0046/);assert.match(block,/sbf-import-grid/);assert.match(block,/import-file-button/);assert.doesNotMatch(block,/<span>\?<\/span>/);assert.doesNotMatch(block,/className="panel rules"/);assert.doesNotMatch(block,/className="error"/);assert.match(block,/Badge text=\{'\\uC801\\uC7AC \\uC644\\uB8CC'\}/);assert.match(css,/\.import-file-button/);assert.match(css,/margin-top:18px/)});


test("TC-26 history has no csv download",async()=>{const views=await read("app/extended-views.tsx");const block=views.match(/export function HistoryView[\s\S]*?export function VersionView/)?.[0]??"";assert.doesNotMatch(block,/CSV/)});


test("TC-27 deployment pending count is wired",async()=>{const [page,views]=await Promise.all([read("app/page.tsx"),read("app/extended-views.tsx")]);assert.ok(page.includes("pendingCount={workflowRequests.filter"));assert.ok(views.includes("pendingCount:number"));assert.ok(views.includes("1172+pendingCount"));assert.ok(views.includes("disabled={pendingCount===0}"));assert.ok(views.includes("itemCount:1172+pendingCount"));assert.ok(!views.includes("27?"));assert.ok(!views.includes("? ? ?? ??"))});


test("TC-28 processing badge and received count",async()=>{const [page,data]=await Promise.all([read("app/page.tsx"),read("app/data.ts")]);assert.ok(page.includes("<em>{workflowRequests.length}</em>"));assert.ok(!page.includes("<em>7</em>"));assert.ok(data.includes("\\uC694\\uCCAD \\uC811\\uC218","2026-08-07"));assert.ok(!data.includes("\\uC791\\uC5C5 \\uC911","2026-08-07"))});
