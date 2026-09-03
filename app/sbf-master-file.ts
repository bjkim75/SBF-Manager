import {itemFromRaw,type Item} from "./data";

// File-based persistent SBF master (PER-01~PER-09, design 46).
// Static JSON file `public/sbf-master.json` is the single source of truth for the
// SBF master default value. No server, no DB. The publish flow generates and
// auto-downloads this file; the operator commits it and a static redeploy
// propagates the value to every device.

export const SBF_MASTER_FILENAME="sbf-master.json";
export const SBF_MASTER_URL="/sbf-master.json";
export const SBF_MASTER_SCHEMA_VERSION=1;

export type SbfMasterMeta={
  versionNo:string;
  publishedAt:string;
  publisher:string;
  reason:string;
  itemCount:number;
  sourceFile:string;
  sourceSheet:string;
};

export type SbfMasterSnapshot={
  schemaVersion:number;
  meta:SbfMasterMeta;
  iaHeaders:string[];
  items:Item[];
};

export type SerializeInput={
  meta:SbfMasterMeta;
  iaHeaders:string[];
  items:Item[];
};

// PER-03: serialize active rows + iaHeaders + meta into the snapshot JSON string.
// itemCount is always derived from items to stay consistent.
export function serializeSnapshot(input:SerializeInput):string{
  const snapshot:SbfMasterSnapshot={
    schemaVersion:SBF_MASTER_SCHEMA_VERSION,
    meta:{...input.meta,itemCount:input.items.length},
    iaHeaders:[...input.iaHeaders],
    items:input.items.map(x=>({...x,raw:[...x.raw],target:[...x.target]})),
  };
  return JSON.stringify(snapshot,null,2);
}

export type ParseErrorCode="PARSE"|"SCHEMA";

export type ParseSnapshotResult=
  |{ok:true;iaHeaders:string[];items:Item[];meta:SbfMasterMeta}
  |{ok:false;errorCode:ParseErrorCode;message:string};

const SCHEMA_MESSAGE="sbf-master.json 형식이 올바르지 않습니다. 필수 필드가 누락되었거나 데이터 계약과 호환되지 않습니다.";
const PARSE_MESSAGE="sbf-master.json을 JSON으로 해석할 수 없습니다. 파일이 손상되었을 수 있습니다.";

function isStringArray(value:unknown):value is string[]{
  return Array.isArray(value)&&value.every(v=>typeof v==="string");
}

function normalizeMeta(raw:unknown,itemCount:number):SbfMasterMeta{
  const m=(raw&&typeof raw==="object")?raw as Record<string,unknown>:{};
  const str=(v:unknown)=>typeof v==="string"?v:"";
  return {
    versionNo:str(m.versionNo),
    publishedAt:str(m.publishedAt),
    publisher:str(m.publisher),
    reason:str(m.reason),
    itemCount:typeof m.itemCount==="number"?m.itemCount:itemCount,
    sourceFile:str(m.sourceFile),
    sourceSheet:str(m.sourceSheet),
  };
}

// PER-03: JSON.parse + schema validation. Rebuild Item[] via itemFromRaw so the
// loaded data keeps the exact Item/raw/iaHeaders contract regardless of what the
// file literally holds.
export function parseSnapshot(text:string):ParseSnapshotResult{
  let data:unknown;
  try{
    data=JSON.parse(text);
  }catch{
    return {ok:false,errorCode:"PARSE",message:PARSE_MESSAGE};
  }
  if(!data||typeof data!=="object")return {ok:false,errorCode:"SCHEMA",message:SCHEMA_MESSAGE};
  const obj=data as Record<string,unknown>;
  if(!isStringArray(obj.iaHeaders))return {ok:false,errorCode:"SCHEMA",message:SCHEMA_MESSAGE};
  if(!Array.isArray(obj.items))return {ok:false,errorCode:"SCHEMA",message:SCHEMA_MESSAGE};
  const rawItems=obj.items as unknown[];
  // Every item must carry a raw string[] to be rebuildable via itemFromRaw.
  const invalid=rawItems.some(it=>!it||typeof it!=="object"||!isStringArray((it as Record<string,unknown>).raw));
  if(invalid)return {ok:false,errorCode:"SCHEMA",message:SCHEMA_MESSAGE};
  const items=rawItems.map(it=>{
    const rec=it as Record<string,unknown>;
    const base=(typeof rec.id==="string")?rec as unknown as Item:undefined;
    return itemFromRaw(rec.raw as string[],base);
  });
  return {ok:true,iaHeaders:[...(obj.iaHeaders as string[])],items,meta:normalizeMeta(obj.meta,items.length)};
}

// PER-01, PER-02: trigger a browser download of the snapshot with the fixed
// filename. Guarded so it is a no-op outside the browser (SSR / tests).
export function downloadSnapshot(text:string,filename:string=SBF_MASTER_FILENAME):void{
  if(typeof document==="undefined"||typeof URL==="undefined"||typeof URL.createObjectURL!=="function")return;
  const blob=new Blob([text],{type:"application/json;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download=filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Loader state machine (design 46.3/46.4). Pure mapping so it is unit-testable.
export type LoadErrorCode="NOT_FOUND"|"PARSE"|"SCHEMA";
export type LoadState=
  |{status:"loading"}
  |{status:"ready";iaHeaders:string[];items:Item[];meta:SbfMasterMeta}
  |{status:"error";errorCode:LoadErrorCode;message:string};

// Describes the outcome of a fetch attempt in a transport-agnostic way so the
// mapping can be tested without a real network.
export type FetchOutcome=
  |{kind:"ok";text:string}
  |{kind:"not-found"}      // 404 or non-ok response
  |{kind:"network-error"}; // fetch rejected / offline

const NOT_FOUND_MESSAGE="sbf-master.json 파일을 찾을 수 없거나 조회에 실패했습니다.";

// PER-06: map a fetch outcome to a loader state. Never falls back to seed.
export function mapFetchOutcomeToState(outcome:FetchOutcome):LoadState{
  if(outcome.kind==="not-found"||outcome.kind==="network-error"){
    return {status:"error",errorCode:"NOT_FOUND",message:NOT_FOUND_MESSAGE};
  }
  const parsed=parseSnapshot(outcome.text);
  if(!parsed.ok)return {status:"error",errorCode:parsed.errorCode,message:parsed.message};
  return {status:"ready",iaHeaders:parsed.iaHeaders,items:parsed.items,meta:parsed.meta};
}

// Human-readable cause + operator guidance for the error panel (PER-06).
export function describeLoadError(errorCode:LoadErrorCode):{cause:string;guidance:string}{
  const guidance="배포관리에서 불변 스냅샷 배포(PUBLISH VERSION)를 실행해 sbf-master.json을 내려받은 뒤 public/sbf-master.json 경로에 배치·커밋하고 재배포하세요.";
  const cause=errorCode==="NOT_FOUND"
    ?"데이터 파일(sbf-master.json)이 없거나 조회에 실패했습니다."
    :errorCode==="PARSE"
      ?"데이터 파일을 JSON으로 해석할 수 없습니다(형식 오류)."
      :"데이터 파일의 스키마 검증에 실패했습니다(필수 필드 불일치).";
  return {cause,guidance};
}

// Perform the actual fetch and classify it into a FetchOutcome (browser side).
export async function fetchSnapshot(url:string=SBF_MASTER_URL):Promise<FetchOutcome>{
  try{
    const res=await fetch(url,{cache:"no-store"});
    if(!res.ok)return {kind:"not-found"};
    const text=await res.text();
    return {kind:"ok",text};
  }catch{
    return {kind:"network-error"};
  }
}
