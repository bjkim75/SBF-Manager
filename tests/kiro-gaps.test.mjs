import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
const root=new URL("../",import.meta.url);
const read=p=>readFile(new URL(p,root),"utf8");

test("TC-07 Kiro gap screens remain wired",async()=>{const [page,data,views]=await Promise.all([read("app/page.tsx"),read("app/data.ts"),read("app/extended-views.tsx")]);assert.doesNotMatch(page,/IA\\u2013L3|IA?L3/);for(const marker of [/ChangeCompare/,/HistoryView/,/VersionView/]){assert.match(page,marker)}assert.doesNotMatch(page,/JiraView/);assert.doesNotMatch(data,/Jira \uBC18\uC601 \uAD00\uB9AC/);assert.doesNotMatch(page,/HierarchyView/);assert.match(views,/export function VersionView/);assert.doesNotMatch(page,/AuditView/);assert.doesNotMatch(views,/export function AuditView/)});

test("TC-08 full-field change request and IA master table are provided",async()=>{const [page,views]=await Promise.all([read("app/page.tsx"),read("app/extended-views.tsx")]);assert.match(views,/setExpanded/);assert.doesNotMatch(page,/className="segments"/);assert.doesNotMatch(page,/column-picker/);assert.match(page,/sktOwner/);assert.match(page,/axOwner/);assert.doesNotMatch(page,/function Mapping/);assert.match(page,/requestFieldIndexes/);assert.match(page,/full-request-table/);assert.match(page,/requestArea/)});

test("TC-09 deployment draft immutable snapshot UI",async()=>{const views=await read("app/extended-views.tsx");assert.ok(views.includes("pendingCount"));assert.ok(views.includes("calculateNextVersion"));assert.ok(views.includes("nextVersion"));assert.ok(views.includes("snapshot")||views.includes("\uC2A4\uB0C5\uC0F7"));assert.ok(views.includes("download(x.version)"));assert.ok(!views.includes("??? ???? 27?"))});


test("TC-10 notifications remain and edit lock is removed",async()=>{const [page,views]=await Promise.all([read("app/page.tsx"),read("app/extended-views.tsx")]);assert.match(page,/NotificationPanel/);assert.match(views,/notice-tabs/);assert.doesNotMatch(page,/className="edit-lock"/);assert.doesNotMatch(page,/29:42/);assert.doesNotMatch(views,/export function JiraView/)});


test("TC-16 removed support menus and dead views stay deleted",async()=>{const [page,views]=await Promise.all([read("app/page.tsx"),read("app/extended-views.tsx")]);for(const name of ["ReferenceDataView","UserAccessView","SettingsView"]){assert.doesNotMatch(page,new RegExp(name));assert.doesNotMatch(views,new RegExp(name))}for(const label of ["\uAE30\uC900\uC815\uBCF4","\uC0AC\uC6A9\uC790\u00B7\uAD8C\uD55C","\uD658\uACBD \uC124\uC815"]){assert.doesNotMatch(page,new RegExp(label));assert.doesNotMatch(views,new RegExp(label))}});



test("TC-17 change request modal supports rich content table attachments and pasted images",async()=>{const page=await read("app/page.tsx");assert.match(page,/contentEditable/);assert.match(page,/onPaste=\{onPaste\}/);assert.match(page,/clipboardData\.items/);assert.match(page,/type="file" multiple/);assert.match(page,/request-table/);assert.match(page,/referenceUrl/);assert.match(page,/attachment-drop/)});


test("TC-18 processing work supports status transitions",async()=>{const page=await read("app/page.tsx");assert.match(page,/function ProcessingWork/);assert.match(page,/updateRequestStatus/);assert.match(page,/rows={workflowRequests}/);assert.match(page,/\\uAC80\\uD1A0 \\uC911/);assert.match(page,/\\uBCF4\\uC644 \\uC694\\uCCAD/);assert.match(page,/\\uC2B9\\uC778/);assert.match(page,/\\uC791\\uC5C5 \\uC644\\uB8CC/);assert.match(page,/jiraSteps/);assert.match(page,/Jira \\uC0B0\\uCD9C\\uBB3C/);assert.ok(page.includes("SBF \\uBC18\\uC601 \\uC911"));assert.match(page,/sbf-apply-actions/)});



test("TC-19 duplicated depth move preview is removed",async()=>{const [views,css]=await Promise.all([read("app/extended-views.tsx"),read("app/globals.css")]);assert.doesNotMatch(views,/className="panel depth-move"/);assert.doesNotMatch(css,/\.depth-move/)});



test("TC-20 data export menu is removed and version menu is deployment",async()=>{const [page,data,views]=await Promise.all([read("app/page.tsx"),read("app/data.ts"),read("app/extended-views.tsx")]);assert.doesNotMatch(data,/\\uB370\\uC774\\uD130 \\uB0B4\\uBCF4\\uB0B4\\uAE30/);assert.doesNotMatch(data,/\\uBC84\\uC804 \\uAD00\\uB9AC/);assert.match(data,/\\uBC30\\uD3EC\\uAD00\\uB9AC/);assert.match(page,/\\uBC30\\uD3EC\\uAD00\\uB9AC/);assert.match(views,/DEPLOYMENT CONTROL/);assert.doesNotMatch(views,/VERSION CONTROL/)});


test("TC-21 processing decision and jira completion guard",async()=>{const page=await read("app/page.tsx");assert.match(page,/ReviewRequestModal/);assert.match(page,/review-decisions/);assert.match(page,/decide\('승인'\)/);assert.match(page,/decide\('반려'\)/);assert.match(page,/decide\('보완 요청'\)/);assert.match(page,/complete-actions/);assert.match(page,/window\.confirm/);assert.match(page,/Jira/);assert.match(page,/SBF/);assert.match(page,/note:/);assert.match(page,/note:/)});


test("TC-22 processing supports list card filter sort",async()=>{const [page,css]=await Promise.all([read("app/page.tsx"),read("app/globals.css")]);assert.match(page,/viewMode/);assert.match(page,/setViewMode/);assert.match(page,/statusFilter/);assert.match(page,/sortOrder/);assert.match(page,/visibleRows/);assert.match(page,/processing-toolbar/);assert.match(page,/processing-list/);assert.match(page,/localeCompare/);assert.match(css,/\.processing-toolbar/);assert.match(css,/\.view-toggle/)});


test("TC-23 processing list exposes sbf jira states",async()=>{const [page,css]=await Promise.all([read("app/page.tsx"),read("app/globals.css")]);assert.match(page,/sbfApplyStatus/);assert.match(page,/jiraApplyStatus/);assert.match(page,/sbf-apply/);assert.match(page,/jira-state/);assert.match(page,/jira-open/);assert.match(page,/setViewMode\('card'\)/);assert.match(page,/SBF \\uBC18\\uC601/);assert.match(page,/Jira \\uBC18\\uC601/);assert.ok(page.includes('Jira 산출물 관리')||page.includes('Jira \\uC0B0\\uCD9C\\uBB3C \\uAD00\\uB9AC'));assert.match(css,/\.sbf-apply/);assert.match(css,/\.jira-state/)});


test("TC-24 requester sees sbf jira results and no question mark button",async()=>{const page=await read("app/page.tsx");assert.match(page,/sbfResult/);assert.match(page,/jiraResult/);assert.match(page,/SBF \\uBC18\\uC601\\uACB0\\uACFC/);assert.match(page,/Jira \\uBC18\\uC601\\uACB0\\uACFC/);assert.ok(page.includes("\\uBC18\\uC601 \\uB300\\uAE30"));assert.ok(page.includes("SBF \\uBC18\\uC601 \\uC644\\uB8CC - Jira"));assert.doesNotMatch(page,/>\? \{'\\uC0C8 \\uBCC0\\uACBD\\uC694\\uCCAD'\}/);assert.doesNotMatch(page,/<button>\? \{'\\uD544\\uD130'\}<\/button>/)});


test("TC-25 import view is trusted sbf loading",async()=>{const [page,css]=await Promise.all([read("app/page.tsx"),read("app/globals.css")]);const block=page.match(/function ImportView[\s\S]*?function RequestModal/)?.[0]??"";assert.match(block,/title=\{'\\u0053\\u0042\\u0046/);assert.match(block,/sbf-import-grid/);assert.match(block,/import-file-button/);assert.doesNotMatch(block,/<span>\?<\/span>/);assert.doesNotMatch(block,/className="panel rules"/);assert.doesNotMatch(block,/className="error"/);assert.match(block,/Badge text=\{'\\uC801\\uC7AC \\uC644\\uB8CC'\}/);assert.match(css,/\.import-file-button/);assert.match(css,/margin-top:18px/)});


test("TC-26 history has no csv download",async()=>{const views=await read("app/extended-views.tsx");const block=views.match(/export function HistoryView[\s\S]*?export function VersionView/)?.[0]??"";assert.doesNotMatch(block,/CSV/)});


test("TC-27 deployment pending count is wired",async()=>{const [page,views]=await Promise.all([read("app/page.tsx"),read("app/extended-views.tsx")]);assert.ok(page.includes("pendingPublishCount"));assert.ok(page.includes("!publishedRequestIds.includes"));assert.ok(views.includes("pendingCount:number"));assert.ok(views.includes("pendingCount"));assert.ok(views.includes("disabled={pendingCount===0}"));assert.doesNotMatch(views,/\{'\+ 새 배포'\}/);assert.ok(views.includes("pendingCount"));assert.ok(!views.includes("27?"));assert.ok(!views.includes("? ? ?? ??"))});


test("TC-28 processing badge and received count",async()=>{const [page,data]=await Promise.all([read("app/page.tsx"),read("app/data.ts")]);assert.ok(page.includes("<em>{workflowRequests.length}</em>"));assert.ok(!page.includes("<em>7</em>"));assert.ok(data.includes("\\uC694\\uCCAD \\uC811\\uC218","2026-08-07"));assert.ok(!data.includes("\\uC791\\uC5C5 \\uC911","2026-08-07"))});



test("TC-29 SBF apply work is linked from processing",async()=>{const [page,data,views]=await Promise.all([read("app/page.tsx"),read("app/data.ts"),read("app/extended-views.tsx")]);assert.ok(data.includes("SBF \\uBC18\\uC601 \\uC791\\uC5C5"));assert.ok(page.includes("openApply"));assert.ok(page.includes("setApplyRequestId"));assert.ok(page.includes("<ChangeCompare request="));assert.match(views,/title=\"SBF 반영 작업\"/);assert.match(views,/SBF APPLY WORK/);});

test("TC-30 SBF apply values are editable and returns to processing",async()=>{const [page,views]=await Promise.all([read("app/page.tsx"),read("app/extended-views.tsx")]);assert.doesNotMatch(views,/반영 메모/);assert.match(views,/afterRaw/);assert.match(views,/editRaw/);assert.match(views,/full-field-compare/);assert.match(views,/iaHeaders\.map/);assert.match(views,/변경 후 · 작업본\/template/);assert.ok(page.includes("setView('처리 업무')")||page.includes("setView('\\uCC98\\uB9AC \\uC5C5\\uBB34')"));});

test("TC-31 SBF master has milestone sort freeze and completion detail",async()=>{const [page,css]=await Promise.all([read("app/page.tsx"),read("app/globals.css")]);assert.match(page,/milestone/);assert.match(page,/sortKey/);assert.match(page,/sortDir/);assert.match(page,/freezePreset/);assert.match(page,/stickyClass/);assert.match(page,/requestBadge/);assert.match(page,/request-state/);assert.match(page,/CompleteDetail/);assert.match(page,/openComplete/);assert.match(page,/completeDetail/);assert.match(css,/\.view-options/);assert.match(css,/\.sticky-col/);assert.match(css,/\.request-state/);assert.match(css,/\.complete-detail/)});

test("TC-32 SBF master request badges come from registered target business id",async()=>{const page=await read("app/page.tsx");assert.match(page,/linkedTargets=\['B2036','B1003','B2001','B2051'\]/);assert.match(page,/targetBusinessId/);assert.match(page,/targetSubId/);assert.match(page,/requestMatchesItem/);assert.doesNotMatch(page,/item\.id==='B2036'/);assert.doesNotMatch(page,/item\.id==='B1002'/);assert.doesNotMatch(page,/return '\\uC0AD\\uC81C \\uB300\\uAE30';const hit/)});
test("TC-33 SBF apply work shows full IA fields before after",async()=>{const [views,css]=await Promise.all([read("app/extended-views.tsx"),read("app/globals.css")]);assert.match(views,/iaHeaders/);assert.match(views,/beforeRaw/);assert.match(views,/afterRaw/);assert.match(views,/full-field-table/);assert.match(views,/업무ID별 전체 필드 변경 전\/후/);assert.doesNotMatch(views,/SBF 수정 업무ID/);assert.match(css,/\.full-field-table/);});

test("TC-34 SBF master can show only registered change requests",async()=>{const [page,css]=await Promise.all([read("app/page.tsx"),read("app/globals.css")]);assert.match(page,/changeOnly/);assert.match(page,/setChangeOnly/);assert.match(page,/changedBusinessIds/);assert.match(page,/workflowRequests\.some\(r=>requestMatchesItem\(r,x\)\)/);assert.match(page,/type="radio" name="changeOnly"/);assert.match(page,/변경접수 보기/);assert.match(page,/setChangeOnly\(false\)/);assert.match(css,/\.change-only-toggle/);});
test("TC-35 SBF master badges are matched by business id and sub id",async()=>{const page=await read("app/page.tsx");assert.match(page,/targetSubId:1/);assert.match(page,/r\.targetBusinessId===item\.id&&\(r\.targetSubId\?\?1\)===item\.sub/);assert.doesNotMatch(page,/changedBusinessIds\.has\(x\.id\)/);assert.doesNotMatch(page,/!\('targetSubId' in r\)/);});


test("TC-36 change request captures sub id per target row",async()=>{const page=await read("app/page.tsx");assert.match(page,/targetSubId,setTargetSubId/);assert.match(page,/targetSubId,beforeRaw,afterRaw/);assert.match(page,/업무ID/);assert.match(page,/SUB ID/);assert.match(page,/type="number"/);assert.match(page,/value=\{targetSubId\}/);});

test("TC-37 processing review starts from detail modal",async()=>{const [page,css]=await Promise.all([read("app/page.tsx"),read("app/globals.css")]);assert.match(page,/ReviewRequestModal/);assert.match(page,/reviewTarget/);assert.match(page,/setReviewTarget/);assert.match(page,/변경요청 상세 검토/);assert.match(page,/검토자 기본정보 보정/);assert.match(page,/요청 원문/);assert.match(page,/보완 요청/);assert.match(page,/decide\('승인'\)/);assert.match(page,/decide\('반려'\)/);assert.match(page,/SBF 반영 작업/);assert.match(css,/\.review-modal/);assert.match(css,/\.review-correction-grid/);});


test("TC-38 SBF master hides sort column and defaults to business id sort",async()=>{const page=await read("app/page.tsx");assert.match(page,/\[sortKey,setSortKey\]=useState\('\\uC5C5\\uBB34ID'\)/);assert.match(page,/filter\(c=>c\.i!==0\)/);assert.match(page,/filter\(ci=>ci!==0\)/);assert.match(page,/ci===0\|\|ci>limit/);assert.doesNotMatch(page,/\['sort','\\uC5C5\\uBB34ID'/);});

test("TC-39 SBF master request badges reuse status colors",async()=>{const [page,css]=await Promise.all([read("app/page.tsx"),read("app/globals.css")]);assert.match(page,/requestBadgeTone/);assert.match(page,/request-state '\+requestBadgeTone/);assert.match(page,/label\.includes\('보완'\)\?'orange'/);assert.match(page,/label\.includes\('승인'\)\|\|label\.includes\('반영 완료'\)\?'green'/);assert.match(css,/\.request-state\.blue/);assert.match(css,/\.request-state\.orange/);assert.match(css,/\.request-state\.green/);assert.match(css,/\.request-state\.violet/);});


test("TC-40 change request uses full IA field editor",async()=>{const [page,css]=await Promise.all([read("app/page.tsx"),read("app/globals.css")]);assert.match(page,/requestFieldIndexes/);assert.match(page,/full-request-table/);assert.match(page,/기준값 불러오기/);assert.match(page,/loadTarget/);assert.match(page,/beforeRaw/);assert.match(page,/afterRaw/);assert.match(page,/JSON\.stringify\(afterRaw\)/);assert.match(page,/신규 업무는 전체 컬럼의 요청값을 새로 입력합니다/);assert.match(page,/현재 SBF 값/);assert.match(page,/요청 변경값/);assert.match(css,/\.target-loader/);assert.match(css,/\.full-request-table/);});


test("TC-41 change request load target uses latest official SBF master data",async()=>{const page=await read("app/page.tsx");assert.match(page,/currentMasterRows=masterRows/);assert.match(page,/currentMasterRows\.find\(x=>normalizeBusinessId/);assert.match(page,/x\.raw\[1\]/);assert.match(page,/x\.raw\[2\]/);assert.match(page,/setTargetSubId\(normalizedSubId\)/);assert.match(page,/const loadedRaw=found\.raw\.map\(v=>String\(v\?\?''\)\)/);assert.match(page,/setBeforeRaw\(loadedRaw\)/);assert.match(page,/setAfterRaw\(loadedRaw\)/);assert.match(page,/version\+' SBF 마스터에서 업무ID와 SUB ID/);});
test("TC-42 change request load target can find B2036 SUB 1 from master seed",async()=>{const data=await read("app/data.ts");assert.match(data,/\{"id":"B2036","sub":1/);const page=await read("app/page.tsx");assert.match(page,/normalizeBusinessId\(x\.id\|\|x\.raw\[1\]\)===normalized/);assert.match(page,/Number\(String\(x\.sub\?\?x\.raw\[2\]\)\.trim\(\)\)===normalizedSubId/);});
test("TC-43 SBF master search keeps focus by avoiding nested component remount",async()=>{const page=await read("app/page.tsx");assert.match(page,/:Master\(\)\}<\/div><\/section>/);assert.doesNotMatch(page,/:<Master\/>\}<\/div><\/section>/);assert.match(page,/aria-label="SBF \\uD1B5\\uD569 \\uAC80\\uC0C9" value=\{q\} onChange=\{e=>setQ\(e\.target\.value\)\}/);});
test("TC-44 change request business id placeholder is clearly an example",async()=>{const page=await read("app/page.tsx");assert.match(page,/placeholder=\{isNew\?'신규 업무ID 입력':'ex: B2036'\}/);assert.doesNotMatch(page,/placeholder=\{isNew\?'신규 업무ID 입력':'B2036'\}/);});
test("TC-45 SBF master detail drawer shows full IA fields",async()=>{const [page,css]=await Promise.all([read("app/page.tsx"),read("app/globals.css")]);assert.match(page,/detail-drawer/);assert.match(page,/전체 IA 열 정보/);assert.match(page,/iaHeaders\.map\(\(header,i\)=>/);assert.match(page,/excelColumnName\(i\)/);assert.match(page,/String\(detail\.raw\[i\]\?\?''\)\|\|'-'/);assert.doesNotMatch(page,/<h3>업무 계층<\/h3>/);assert.match(css,/\.detail-table-scroll\{[^}]*overflow:auto/);assert.match(css,/\.detail-value\{[^}]*white-space:pre-wrap/);});
test("TC-46 SBF master detail drawer hides placeholder status badge",async()=>{const page=await read("app/page.tsx");assert.match(page,/detail-drawer/);assert.doesNotMatch(page,/detail-title"[\s\S]*?<Badge text=\{detail\.status\}/);assert.match(page,/전체 IA 열 정보/);});
test("TC-47 processing default view is list",async()=>{const page=await read("app/page.tsx");assert.match(page,/useState<'card'\|'list'>\('list'\)/);assert.match(page,/setViewMode\('card'\)/);assert.match(page,/setViewMode\('list'\)/);});
test("TC-48 my requests filters current user while change request shows all",async()=>{const page=await read("app/page.tsx");assert.match(page,/const currentUserName='김서현'/);assert.match(page,/myRequests=useMemo\(\(\)=>workflowRequests\.filter\(r=>r\.requester===currentUserName\)/);assert.match(page,/view==='\\uBCC0\\uACBD\\uC694\\uCCAD'\?<Requests title=\{view\} open=\{\(\)=>openRequestModal\(null\)\} rows=\{workflowRequests\}/);assert.match(page,/view==='\\uB0B4 \\uC694\\uCCAD'\?<Requests title=\{view\} open=\{\(\)=>openRequestModal\(null\)\} rows=\{myRequests\}/);});
test("TC-49 change request domain options come from master data",async()=>{const page=await read("app/page.tsx");const block=page.match(/function RequestModal[\s\S]*$/)?.[0]??"";assert.match(block,/domainOptions=useMemo\(\(\)=>\[\.\.\.new Set\(currentMasterRows\.map\(x=>x\.domain\)\.filter\(Boolean\)\)\]/);assert.match(block,/<select name="requestArea" required value=\{requestDomain\} onChange=\{e=>setRequestDomain\(e\.target\.value\)\}>\{domainOptions\.map\(x=><option key=\{x\}>\{x\}<\/option>\)\}<\/select>/);assert.doesNotMatch(block,/<option>EPC<\/option><option>\{'공통'\}<\/option><option>\{'빌링'\}<\/option><option>CRM<\/option><option>\{'오더'\}<\/option><option>CJM&C360<\/option>/);});
test("TC-50 change request from detail prefills selected IA row",async()=>{const page=await read("app/page.tsx");assert.match(page,/requestPrefillItem,setRequestPrefillItem/);assert.match(page,/openRequestModal=\(item\?:Item\|null\)=>\{setRequestPrefillItem\(item\?\?null\);setModal\(true\)\}/);assert.match(page,/openRequestModal\(item\)\}\}>\{'변경요청 작성'\}/);assert.match(page,/initialItem\?:Item\|null/);assert.match(page,/initialRaw=initialItem\?initialItem\.raw\.map\(v=>String\(v\?\?''\)\):blankRaw\(\)/);assert.match(page,/setTargetBusinessId\]=useState\(initialItem\?\.id\?\?''\)/);assert.match(page,/setTargetSubId\]=useState\(initialItem\?\.sub\?\?1\)/);assert.match(page,/setRequestDomain\]=useState\(initialItem\?\.domain\?\?domainOptions\[0\]\?\?''\)/);assert.match(page,/onClick=\{\(\)=>openRequestModal\(null\)\}>\{'새 변경요청'\}<\/button>/);});
test("TC-51 generic change request buttons use the same label",async()=>{const page=await read("app/page.tsx");assert.match(page,/>\{'새 변경요청'\}<\/button>/);assert.doesNotMatch(page,/＋ 변경요청/);assert.doesNotMatch(page,/>\\+ 변경요청<\/button>/);assert.match(page,/>\{'변경요청 작성'\}<\/button>/);});




test("TC-52 processing workflow gates actions by current step",async()=>{const [page,css,req,design]=await Promise.all([read("app/page.tsx"),read("app/globals.css"),read(".kiro/specs/sbf-management/requirements.md"),read(".kiro/specs/sbf-management/design.md")]);assert.match(req,/REV-07/);assert.match(req,/REV-08/);assert.match(req,/REV-09/);assert.match(req,/REV-10/);assert.match(design,/처리 업무 단계별 활성화 UX/);assert.match(page,/getProcessStep/);assert.match(page,/reviewButtonLabel/);assert.match(page,/'process-actions current-'\+step/);assert.match(page,/step==='review'/);assert.match(page,/step==='apply'/);assert.match(page,/step==='jira'/);assert.match(page,/disabled=\{!isReview\}/);assert.match(page,/disabled=\{!isApply\}/);assert.match(page,/disabled=\{!isJira\}/);assert.match(page,/검토 계속/);assert.match(page,/재검토/);assert.doesNotMatch(page,/onClick=\{\(\)=>changeStatus\(r,ri,'SBF 반영 완료'\)\}/);assert.match(css,/\.process-actions \.action-group\.active-step/);assert.match(css,/\.process-actions \.action-group\.locked-step/);});


test("TC-53 request number opens request detail drawer for all statuses",async()=>{const [page,css,req,design]=await Promise.all([read("app/page.tsx"),read("app/globals.css"),read(".kiro/specs/sbf-management/requirements.md"),read(".kiro/specs/sbf-management/design.md")]);assert.match(req,/CR-26/);assert.match(req,/CR-27/);assert.match(design,/요청번호 상세 drawer UX/);assert.match(page,/requestDetail,setRequestDetail/);assert.match(page,/REQUEST DETAIL/);assert.match(page,/request-detail-title/);assert.match(page,/요청 기본정보/);assert.match(page,/요청 내용/);assert.match(page,/처리 및 반영 결과/);assert.match(page,/onClick=\{\(\)=>\{setRequestDetail\(x\);setRevisionMemo\(''\)\}\}/);assert.doesNotMatch(page,/onClick=\{\(\)=>x\.status==='\\uC791\\uC5C5 \\uC644\\uB8CC'&&openComplete\(x\)\}/);assert.match(page,/완료 결과 보기/);assert.match(css,/\.request-detail-drawer/);assert.match(css,/\.request-result-grid/);});

test("TC-54 rejected or supplement my request can be revised and resubmitted",async()=>{const [page,css,req,design,tasks]=await Promise.all([read("app/page.tsx"),read("app/globals.css"),read(".kiro/specs/sbf-management/requirements.md"),read(".kiro/specs/sbf-management/design.md"),read(".kiro/specs/sbf-management/tasks.md")]);assert.match(req,/CR-28/);assert.match(req,/CR-29/);assert.match(design,/반려\/보완 요청 재요청 UX/);assert.match(tasks,/반려\/보완 요청 수정 후 재요청/);assert.match(page,/resubmitRevisionRequest/);assert.match(page,/resubmitRevision\?:/);assert.match(page,/isRequesterView=\{true\}/);assert.match(page,/isRequesterView=\{false\}/);assert.match(page,/revisionMemo,setRevisionMemo/);assert.match(page,/\['반려','보완 요청'\]\.includes\(requestDetail\.status\)/);assert.match(page,/보완 내용 수정 후 재요청/);assert.match(page,/반려 내용 수정 후 재요청/);assert.match(page,/aria-label="수정 후 재요청 내용"/);assert.match(page,/수정 후 재요청/);assert.match(page,/status:'요청 접수'/);assert.match(page,/보완 수정 후 재요청/);assert.match(page,/반려 수정 후 재요청/);assert.match(css,/\.rejected-resubmit/);});

test("TC-55 request detail drawer gives basic info enough height and full scroll",async()=>{const [css,design,tasks,gap]=await Promise.all([read("app/globals.css"),read(".kiro/specs/sbf-management/design.md"),read(".kiro/specs/sbf-management/tasks.md"),read("docs/kiro-gap-analysis.md")]);assert.match(design,/요청 기본정보 영역은 drawer 화면 높이의 약 30%/);assert.match(tasks,/요청 기본정보 표 영역은 화면 높이의 약 30%/);assert.match(gap,/요청 상세 재요청 drawer 높이 보완/);assert.match(css,/\.request-detail-drawer\{[^}]*max-height:100vh[^}]*overflow-y:auto/);assert.match(css,/\.request-detail-drawer \.full-detail-section\{[^}]*flex:0 0 30vh[^}]*min-height:260px/);assert.match(css,/\.request-detail-drawer \.request-detail-scroll\{[^}]*height:30vh[^}]*min-height:220px[^}]*max-height:30vh/);});

test("TC-56 review start modal reproduces request document and mock attachments",async()=>{const [page,css,design,tasks,gap]=await Promise.all([read("app/page.tsx"),read("app/globals.css"),read(".kiro/specs/sbf-management/design.md"),read(".kiro/specs/sbf-management/tasks.md"),read("docs/kiro-gap-analysis.md")]);assert.match(design,/검토 시작 신청서 원문 재현 UX/);assert.match(tasks,/검토 시작 신청서 원문 재현/);assert.match(gap,/검토 시작 신청서 원문 재현/);assert.match(page,/review-document-modal/);assert.match(page,/review-modal-body/);assert.match(page,/첨부 이미지 확인/);assert.match(page,/현재는 UI-Mockup이기 때문에 첨부된 이미지는 보이지 않습니다/);assert.match(page,/첨부 파일 확인/);assert.match(page,/현재는 UI-Mockup이기 때문에 첨부된 파일은 보이지 않습니다/);assert.match(page,/전체 IA 필드 변경요청/);assert.match(page,/reviewFieldIndexes/);assert.match(page,/review-opinion/);assert.match(page,/sticky-review-footer/);assert.match(css,/\.review-modal-body\{[^}]*overflow-y:auto/);assert.match(css,/\.review-mockup-box/);assert.match(css,/\.review-ia-table\{[^}]*overflow:auto/);assert.match(css,/\.sticky-review-footer\{[^}]*position:sticky/);});

test("TC-57 deployment draft template promotes to new official version spec",async()=>{const [req,design,tasks,gap]=await Promise.all([read(".kiro/specs/sbf-management/requirements.md"),read(".kiro/specs/sbf-management/design.md"),read(".kiro/specs/sbf-management/tasks.md"),read("docs/kiro-gap-analysis.md")]);assert.match(req,/VER-05/);assert.match(req,/VER-06/);assert.match(req,/VER-07/);assert.match(req,/VER-08/);assert.match(req,/VER-09/);assert.match(req,/VER-10/);assert.match(design,/공식 버전과 작업본\/template 분리/);assert.match(design,/작업본 보기` 옵션은 제공하지 않는다/);assert.match(design,/baseVersion/);assert.match(design,/targetBusinessId/);assert.match(design,/beforeRaw/);assert.match(design,/afterRaw/);assert.match(design,/v2\.5 → v2\.6/);assert.match(design,/SBF 마스터의 기본 대상 버전은 v2\.6/);assert.match(design,/v2\.5는 변경하지 않고/);assert.match(design,/DB\/Turso 도입 후 영속 저장/);assert.match(tasks,/공식 버전-작업본 배포 로직/);assert.match(gap,/공식 버전과 작업본\/template 배포 모델/);});

test("TC-58 deployment next version increments repeatedly spec",async()=>{const [req,design,tasks,gap]=await Promise.all([read(".kiro/specs/sbf-management/requirements.md"),read(".kiro/specs/sbf-management/design.md"),read(".kiro/specs/sbf-management/tasks.md"),read("docs/kiro-gap-analysis.md")]);assert.match(req,/VER-11/);assert.match(req,/VER-12/);assert.match(req,/v2\.5 → v2\.6 → v2\.7 → v2\.8/);assert.match(design,/반복 배포 버전 증가 규칙/);assert.match(design,/minor만 1씩 증가/);assert.match(design,/계산된 nextVersion/);assert.match(design,/하드코딩된 v2\.6/);assert.match(tasks,/반복 배포 version 증가/);assert.match(tasks,/v2\.5 이후 첫 배포는 v2\.6, 두 번째 배포는 v2\.7, 세 번째 배포는 v2\.8/);assert.match(gap,/반복 배포 버전 증가/);});

test("TC-59 deployment version rolls major after minor 9 spec",async()=>{const [req,design,tasks,gap]=await Promise.all([read(".kiro/specs/sbf-management/requirements.md"),read(".kiro/specs/sbf-management/design.md"),read(".kiro/specs/sbf-management/tasks.md"),read("docs/kiro-gap-analysis.md")]);assert.match(req,/VER-13/);assert.match(req,/VER-14/);assert.match(req,/v2\.9 → v3\.0 → v3\.1 → v3\.2/);assert.match(design,/minor 9 이후 major 증가 규칙/);assert.match(design,/minor는 0부터 9까지만 사용/);assert.match(design,/v2\.8이면 다음 배포는 v2\.9/);assert.match(design,/v2\.9이면 다음 배포는 v3\.0/);assert.match(design,/하드코딩된 문구를 두지 않는다/);assert.match(tasks,/minor 9 이후 major 증가/);assert.match(tasks,/v2\.9 다음 배포는 v3\.0/);assert.match(gap,/minor 9 이후 major 증가/);});

test("TC-60 apply work back button and dynamic next deployment version are implemented",async()=>{
  const [page,views,design,tasks]=await Promise.all([read("app/page.tsx"),read("app/extended-views.tsx"),read(".kiro/specs/sbf-management/design.md"),read(".kiro/specs/sbf-management/tasks.md")]);
  assert.match(design,/SBF 반영 작업 돌아가기 UX/);
  assert.match(tasks,/SBF 반영 작업 돌아가기/);
  assert.match(views,/calculateNextVersion/);
  assert.match(views,/minor>=9\?/);
  assert.match(views,/nextVersion\} \{'배포 준비'\}/);
  assert.match(views,/name="versionNo" value=\{nextVersion\} readOnly/);
  assert.doesNotMatch(views,/>v2\.6 \{'배포 준비'\}/);
  assert.match(views,/onBack\?:\(\)=>void/);
  assert.match(views,/돌아가기/);
  assert.match(views,/현재 작업된 내용은 저장되지 않습니다\. 처리 업무 화면으로 돌아가시겠습니까\?/);
  assert.match(page,/onBack=\{\(\)=>setView\('처리 업무'\)\}/);
});

test("TC-61 SBF apply completion stores working copy and deployment promotes official version",async()=>{
  const [page,views]=await Promise.all([read("app/page.tsx"),read("app/extended-views.tsx")]);
  assert.match(page,/officialVersions/);
  assert.match(page,/workingRows/);
  assert.match(page,/applySbfToWorkingCopy/);
  assert.match(page,/setWorkingRows/);
  assert.match(page,/itemFromRaw\(afterRaw/);
  assert.match(page,/publishedRequestIds/);
  assert.match(page,/pendingPublishCount/);
  assert.match(page,/publishOfficialVersion/);
  assert.match(page,/setOfficialVersions/);
  assert.match(page,/const version=activeOfficialVersion/);
  assert.match(page,/masterRows=\{workingRows\}/);
  assert.match(page,/SBF 반영 완료 - 작업본\/template에 저장되었습니다/);
  assert.match(views,/onPublish:\(reason:string\)=>void/);
  assert.match(views,/작업본\/template 전체 데이터를/);
  assert.match(views,/공식 SBF 버전을 배포했습니다/);
});



test("TC-62 v2.4 master seed is generated from the local Excel snapshot",async()=>{const data=await read("app/data.ts");const block=data.match(/export const itemsV24:Item\[\]=([\s\S]*?)\nexport const versionStats/)?.[1]??"";assert.ok(block.length>1000);assert.doesNotMatch(block,/items\.map/);assert.match(block,/"id":"B1002","sub":1/);assert.match(block,/"id":"BC190","sub":2/);assert.match(data,/'v2\.4':\{count:1180,monthlyChanges:0,monthlyNote:'2026-07-18 배포 기준'\}/);});

test("TC-63 import history shows the actual v2.4 Excel row count",async()=>{const page=await read("app/page.tsx");assert.match(page,/SKT_Business_Framework_v2\.4\.xlsx[\s\S]*<td>1,180<\/td><td>1,180<\/td>/);});





test("TC-64 v2.4 seed maps Excel columns by header name",async()=>{const [data,req,design,tasks,gap]=await Promise.all([read("app/data.ts"),read(".kiro/specs/sbf-management/requirements.md"),read(".kiro/specs/sbf-management/design.md"),read(".kiro/specs/sbf-management/tasks.md"),read("docs/kiro-gap-analysis.md")]);const block=data.match(/export const itemsV24:Item\[\]=([\s\S]*?)\nexport const versionStats/)?.[1]??"";const marker='"id":"B2002","sub":1';const start=block.indexOf(marker);assert.ok(start>0);const row=block.slice(start,start+2500);assert.match(row,/"raw":\[[^\]]*"","","BZ-SHRTMFC020-0003\\nBZ-SHRTMFC020-0004/);assert.match(row,/MYPIN인증\\nPASS인증/);assert.match(req,/헤더명과 동일 헤더의 출현 순서 기준/);assert.match(design,/Excel 헤더명을 매칭/);assert.match(tasks,/단순 column index가 아니라/);assert.match(gap,/헤더명\/동일 헤더 출현 순서 기준/);});

test("TC-65 SBF master uses latest official version without version selector",async()=>{const [page,req,design,gap]=await Promise.all([read("app/page.tsx"),read(".kiro/specs/sbf-management/requirements.md"),read(".kiro/specs/sbf-management/design.md"),read("docs/kiro-gap-analysis.md")]);assert.doesNotMatch(page,/className="version-select"/);assert.doesNotMatch(page,/aria-label="다운로드할 SBF 버전"/);assert.match(page,/className="version-chip"/);assert.match(page,/const version=activeOfficialVersion/);assert.match(page,/최신 공식본 <b>\{version\} · 1\. IA<\/b> 기준/);assert.match(req,/항상 최신 공식 버전 snapshot/);assert.match(design,/SBF 마스터는 항상 최신 공식 snapshot/);assert.match(gap,/SBF 마스터는 최신 공식 snapshot만 표시/);});

test("TC-66 request list search status type filters are wired",async()=>{const [page,req,design,tasks,gap]=await Promise.all([read("app/page.tsx"),read(".kiro/specs/sbf-management/requirements.md"),read(".kiro/specs/sbf-management/design.md"),read(".kiro/specs/sbf-management/tasks.md"),read("docs/kiro-gap-analysis.md")]);assert.match(req,/CR-30/);assert.match(design,/변경요청 목록 필터 UX/);assert.match(tasks,/변경요청\/내 요청 목록 필터 동작화/);assert.match(gap,/변경요청 목록 필터 보완/);assert.match(page,/requestSearch,setRequestSearch/);assert.match(page,/requestStatusFilter,setRequestStatusFilter/);assert.match(page,/requestTypeFilter,setRequestTypeFilter/);assert.match(page,/const filteredRows=rows\.filter/);assert.match(page,/matchesStatus=requestStatusFilter==='전체 상태'\|\|x\.status===requestStatusFilter/);assert.match(page,/matchesType=requestTypeFilter==='전체 유형'\|\|x\.type===requestTypeFilter/);assert.match(page,/value=\{requestSearch\} onChange=\{e=>setRequestSearch\(e\.target\.value\)\}/);assert.match(page,/value=\{requestStatusFilter\} onChange=\{e=>setRequestStatusFilter\(e\.target\.value\)\}/);assert.match(page,/value=\{requestTypeFilter\} onChange=\{e=>setRequestTypeFilter\(e\.target\.value\)\}/);assert.match(page,/resetRequestFilters/);assert.match(page,/필터 초기화/);assert.match(page,/filteredRows\.map\(x=><tr key=\{x\.id\}/);});
