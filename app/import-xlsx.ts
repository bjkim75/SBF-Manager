import * as XLSX from "xlsx";
import {iaHeaders,itemFromRaw,type Item} from "./data";

// MVP client-only Excel importer for the `1. IA` sheet.
// All parsing happens in the browser; nothing is sent to a server/DB. (IMP-C04)

export const IA_SHEET_NAME="1. IA";
export const MAX_FILE_BYTES=10*1024*1024; // 10MB (IMP-C11)

export type ImportErrorCode="EXT"|"SIZE"|"CORRUPT"|"NO_SHEET"|"NO_HEADER"|"NO_DATA";

export type ImportResult=
  |{ok:true;fileName:string;sheetName:string;rowCount:number;items:Item[]}
  |{ok:false;fileName:string;sheetName?:string;rowCount?:number;errorCode:ImportErrorCode;message:string};

const ERROR_MESSAGES:Record<ImportErrorCode,string>={
  EXT:".xlsx 파일만 가져올 수 있습니다. 선택한 파일의 확장자를 확인해 주세요.",
  SIZE:"파일 크기가 10MB를 초과합니다. 더 작은 파일을 선택해 주세요.",
  CORRUPT:"파일을 읽을 수 없습니다. 손상되었거나 올바른 .xlsx 형식이 아닙니다.",
  NO_SHEET:"'1. IA' 시트를 찾을 수 없습니다. SBF 원본 통합문서인지 확인해 주세요.",
  NO_HEADER:"'1. IA' 시트에 헤더 행이 없습니다.",
  NO_DATA:"'1. IA' 시트에 데이터 행이 없습니다.",
};

function fail(fileName:string,errorCode:ImportErrorCode,extra?:{sheetName?:string;rowCount?:number}):ImportResult{
  return {ok:false,fileName,errorCode,message:ERROR_MESSAGES[errorCode],...extra};
}

// Build a column-index -> iaHeaders-index mapping.
// Columns whose header text matches an iaHeaders name are mapped. When a header
// name appears 2+ times, occurrences are mapped in appearance order to the
// matching iaHeaders positions of the same name. (IMP-C07)
export function buildHeaderMapping(headerRow:string[]):number[]{
  // For each iaHeaders name, collect the ordered list of iaHeaders positions.
  const targetsByName=new Map<string,number[]>();
  iaHeaders.forEach((name,idx)=>{
    const key=name;
    const list=targetsByName.get(key);
    if(list)list.push(idx);else targetsByName.set(key,[idx]);
  });
  // Track how many times we've already consumed each header name in the source row.
  const consumed=new Map<string,number>();
  const mapping:number[]=new Array(headerRow.length).fill(-1);
  headerRow.forEach((cell,col)=>{
    const name=String(cell??"");
    const targets=targetsByName.get(name);
    if(!targets||!targets.length)return;
    const used=consumed.get(name)??0;
    if(used>=targets.length)return; // more source columns than iaHeaders slots of this name
    mapping[col]=targets[used];
    consumed.set(name,used+1);
  });
  return mapping;
}

// Convert a single raw sheet row into an iaHeaders-sized raw string[] and normalize. (IMP-C08)
export function rawFromSheetRow(sheetRow:unknown[],mapping:number[]):string[]{
  const raw:string[]=new Array(iaHeaders.length).fill("");
  mapping.forEach((iaIdx,col)=>{
    if(iaIdx<0)return;
    const value=sheetRow[col];
    raw[iaIdx]=value==null?"":String(value);
  });
  // 업무ID (raw[1]): uppercase + trim
  raw[1]=raw[1].trim().toUpperCase();
  // SUB ID (raw[2]): integer, default 1 when empty/non-numeric
  const subNum=parseInt(raw[2].trim(),10);
  raw[2]=String(Number.isFinite(subNum)?subNum:1);
  return raw;
}

function readArrayBuffer(file:File):Promise<ArrayBuffer>{
  if(typeof file.arrayBuffer==="function")return file.arrayBuffer();
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result as ArrayBuffer);
    reader.onerror=()=>reject(reader.error??new Error("read error"));
    reader.readAsArrayBuffer(file);
  });
}

export async function parseSbfWorkbook(file:File):Promise<ImportResult>{
  const fileName=file?.name??"";
  // (1) extension (IMP-C01/C11)
  if(!/\.xlsx$/i.test(fileName))return fail(fileName,"EXT");
  // (2) size before parsing (IMP-C11)
  if(typeof file.size==="number"&&file.size>MAX_FILE_BYTES)return fail(fileName,"SIZE");
  // (3) parse / corrupt (IMP-C11)
  let workbook:XLSX.WorkBook;
  try{
    const buffer=await readArrayBuffer(file);
    workbook=XLSX.read(buffer,{type:"array"});
  }catch{
    return fail(fileName,"CORRUPT");
  }
  if(!workbook||!Array.isArray(workbook.SheetNames)||!workbook.SheetNames.length)return fail(fileName,"CORRUPT");
  // (4) exact sheet name `1. IA` (IMP-C02/C03)
  if(!workbook.SheetNames.includes(IA_SHEET_NAME))return fail(fileName,"NO_SHEET");
  const sheet=workbook.Sheets[IA_SHEET_NAME];
  if(!sheet)return fail(fileName,"NO_SHEET");
  const rows=XLSX.utils.sheet_to_json<unknown[]>(sheet,{header:1,defval:"",blankrows:false});
  // (5) header row (IMP-C11)
  if(!rows.length)return fail(fileName,"NO_HEADER",{sheetName:IA_SHEET_NAME});
  const headerRow=(rows[0]as unknown[]).map(c=>String(c??""));
  const hasHeader=headerRow.some(c=>c.trim()!=="");
  if(!hasHeader)return fail(fileName,"NO_HEADER",{sheetName:IA_SHEET_NAME});
  // (6) at least one data row (IMP-C11)
  const dataRows=(rows.slice(1)as unknown[][]).filter(r=>Array.isArray(r)&&r.some(c=>String(c??"").trim()!==""));
  if(!dataRows.length)return fail(fileName,"NO_DATA",{sheetName:IA_SHEET_NAME,rowCount:0});
  // header mapping + row conversion (IMP-C07/C08/C13)
  const mapping=buildHeaderMapping(headerRow);
  const parsedItems=dataRows.map(sheetRow=>itemFromRaw(rawFromSheetRow(sheetRow,mapping)));
  return {ok:true,fileName,sheetName:IA_SHEET_NAME,rowCount:parsedItems.length,items:parsedItems};
}
