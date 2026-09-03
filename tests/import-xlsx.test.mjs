// Unit tests for the MVP client Excel importer (app/import-xlsx.ts).
// Run with: node --import tsx --test tests/import-xlsx.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import * as XLSX from "xlsx";

import {parseSbfWorkbook,buildHeaderMapping,rawFromSheetRow} from "../app/import-xlsx.ts";
import {iaHeaders} from "../app/data.ts";

// Minimal File polyfill backed by an ArrayBuffer (Node has no File before v20 globally
// in every runtime; provide arrayBuffer() which the parser prefers).
class FakeFile{
  constructor(buffer,name,size){
    this._buffer=buffer;
    this.name=name;
    this.size=typeof size==="number"?size:(buffer?buffer.byteLength:0);
  }
  async arrayBuffer(){return this._buffer}
}

// Build an .xlsx ArrayBuffer from an array-of-arrays for a named sheet.
function makeWorkbookBuffer(sheets){
  const wb=XLSX.utils.book_new();
  for(const {name,aoa} of sheets){
    const ws=XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb,ws,name);
  }
  const out=XLSX.write(wb,{type:"array",bookType:"xlsx"});
  // XLSX.write with type:'array' returns an ArrayBuffer; normalize either form.
  if(out instanceof ArrayBuffer)return out;
  return out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength);
}

function fileFromSheets(sheets,name="SBF.xlsx",size){
  return new FakeFile(makeWorkbookBuffer(sheets),name,size);
}

function buildAoa(dataRows){
  return [ [...iaHeaders], ...dataRows ];
}

test("valid '1. IA' workbook parses into items", async()=>{
  const r1=iaHeaders.map((_,i)=>`a${i}`);r1[1]="b1002";r1[2]="1";r1[3]="상품";r1[10]="Y";r1[11]="Y";r1[12]="";r1[13]="";
  const r2=iaHeaders.map((_,i)=>`d${i}`);r2[1]="B2036";r2[2]="3";r2[3]="빌링";r2[10]="Y";r2[11]="Y";r2[12]="Y";r2[13]="Y";
  const file=fileFromSheets([{name:"1. IA",aoa:buildAoa([r1,r2])}]);
  const result=await parseSbfWorkbook(file);
  assert.equal(result.ok,true);
  assert.equal(result.sheetName,"1. IA");
  assert.equal(result.rowCount,2);
  assert.equal(result.items.length,2);
  // itemFromRaw contract: id/sub/domain/target populated so downstream views work
  assert.equal(result.items[0].id,"B1002");
  assert.equal(result.items[0].sub,1);
  assert.equal(result.items[0].domain,"상품");
  assert.deepEqual(result.items[0].target,["MNO","AIR"]);
  assert.deepEqual(result.items[1].target,["MNO","AIR","SKB","MVNO"]);
  assert.equal(result.items[0].raw.length,iaHeaders.length);
});

test("missing '1. IA' sheet returns NO_SHEET", async()=>{
  const r=iaHeaders.map((_,i)=>`a${i}`);r[1]="B1";r[2]="1";
  const file=fileFromSheets([{name:"2. Other",aoa:buildAoa([r])}]);
  const result=await parseSbfWorkbook(file);
  assert.equal(result.ok,false);
  assert.equal(result.errorCode,"NO_SHEET");
});

test("only the '1. IA' sheet is parsed even when other sheets exist", async()=>{
  const ia=iaHeaders.map((_,i)=>`a${i}`);ia[1]="B1";ia[2]="1";
  const other=[["x","y"],["1","2"],["3","4"]];
  const file=fileFromSheets([
    {name:"cover",aoa:other},
    {name:"1. IA",aoa:buildAoa([ia])},
    {name:"2. extra",aoa:other},
  ]);
  const result=await parseSbfWorkbook(file);
  assert.equal(result.ok,true);
  assert.equal(result.rowCount,1); // only IA sheet's single data row
});

test("non-.xlsx extension returns EXT before parsing", async()=>{
  const ia=iaHeaders.map((_,i)=>`a${i}`);ia[1]="B1";ia[2]="1";
  const file=fileFromSheets([{name:"1. IA",aoa:buildAoa([ia])}],"SBF.csv");
  const result=await parseSbfWorkbook(file);
  assert.equal(result.ok,false);
  assert.equal(result.errorCode,"EXT");
});

test("files over 10MB return SIZE without parsing", async()=>{
  const ia=iaHeaders.map((_,i)=>`a${i}`);ia[1]="B1";ia[2]="1";
  const file=fileFromSheets([{name:"1. IA",aoa:buildAoa([ia])}],"SBF.xlsx",10*1024*1024+1);
  const result=await parseSbfWorkbook(file);
  assert.equal(result.ok,false);
  assert.equal(result.errorCode,"SIZE");
});

test("header row with zero data rows returns NO_DATA", async()=>{
  const file=fileFromSheets([{name:"1. IA",aoa:[ [...iaHeaders] ]}]);
  const result=await parseSbfWorkbook(file);
  assert.equal(result.ok,false);
  assert.equal(result.errorCode,"NO_DATA");
});

test("header mapping handles duplicate header names in appearance order", ()=>{
  // iaHeaders contains "구분" twice (indices 5 and 45) and "담당자" twice (38, 47).
  const dupName="구분";
  const positions=iaHeaders.map((n,i)=>n===dupName?i:-1).filter(i=>i>=0);
  assert.ok(positions.length>=2,"expected '구분' to appear at least twice in iaHeaders");
  // Source header row: place the duplicate name twice, plus 업무ID and SUB ID.
  const header=["업무ID","SUB ID",dupName,dupName];
  const mapping=buildHeaderMapping(header);
  assert.equal(mapping[0],1,"업무ID → iaHeaders[1]");
  assert.equal(mapping[1],2,"SUB ID → iaHeaders[2]");
  assert.equal(mapping[2],positions[0],"first 구분 → first iaHeaders 구분 slot");
  assert.equal(mapping[3],positions[1],"second 구분 → second iaHeaders 구분 slot");
});

test("업무ID is uppercased/trimmed and SUB ID defaults to 1", ()=>{
  const header=["업무ID","SUB ID"];
  const mapping=buildHeaderMapping(header);
  // empty SUB ID → default 1
  const raw1=rawFromSheetRow(["  b1002  ",""],mapping);
  assert.equal(raw1[1],"B1002");
  assert.equal(raw1[2],"1");
  // non-numeric SUB ID → default 1
  const raw2=rawFromSheetRow([" x2036 ","abc"],mapping);
  assert.equal(raw2[1],"X2036");
  assert.equal(raw2[2],"1");
  // numeric SUB ID preserved as integer
  const raw3=rawFromSheetRow(["b1"," 4 "],mapping);
  assert.equal(raw3[2],"4");
});

test("업무ID/SUB ID normalization applies end-to-end through parseSbfWorkbook", async()=>{
  const r=iaHeaders.map(()=>"");
  r[1]="  b9999 ";r[2]="";r[3]="도메인X";
  const file=fileFromSheets([{name:"1. IA",aoa:buildAoa([r])}]);
  const result=await parseSbfWorkbook(file);
  assert.equal(result.ok,true);
  assert.equal(result.items[0].id,"B9999");
  assert.equal(result.items[0].sub,1);
  assert.equal(result.items[0].raw[1],"B9999");
  assert.equal(result.items[0].raw[2],"1");
});
