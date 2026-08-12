import {desc} from "drizzle-orm";
import {getDb} from "../../../db";
import {auditLogs,sbfVersions} from "../../../db/schema";

const errorResponse=(error:unknown)=>Response.json({error:error instanceof Error?error.message:"처리 중 오류가 발생했습니다."},{status:500});
const versionPattern=/^v\d+\.\d+$/;
export async function GET(){try{const db=getDb();const rows=await db.select().from(sbfVersions).orderBy(desc(sbfVersions.publishedAt)).limit(100);return Response.json({versions:rows});}catch(error){return errorResponse(error)}}
export async function POST(request:Request){
 try{
  const body=await request.json() as {versionNo?:string;publisherName?:string;reason?:string;itemCount?:number;sourceFile?:string;snapshotHash?:string};
  const versionNo=body.versionNo?.trim()??"",reason=body.reason?.trim()??"";
  if(!versionPattern.test(versionNo)||!body.publisherName||!body.itemCount||!body.sourceFile||!body.snapshotHash)return Response.json({error:"유효한 버전, 발행자, 항목 수, 원본 파일과 스냅샷 해시가 필요합니다."},{status:400});
  if(reason.length>500)return Response.json({error:"발행 사유는 500자 이하여야 합니다."},{status:400});
  const db=getDb(),now=new Date().toISOString(),correlationId=`AUD-${crypto.randomUUID()}`;
  const [created]=await db.insert(sbfVersions).values({versionNo,publishedAt:now,publisherName:body.publisherName,reason,itemCount:body.itemCount,sourceFile:body.sourceFile,sourceSheet:"1. IA",snapshotHash:body.snapshotHash}).returning();
  await db.insert(auditLogs).values({occurredAt:now,actorName:body.publisherName,actorRole:"SBF Admin",action:"버전 발행",targetType:"SbfVersion",targetId:versionNo,correlationId,detailJson:JSON.stringify({itemCount:body.itemCount,sourceFile:body.sourceFile})});
  return Response.json({version:created,correlationId},{status:201});
 }catch(error){return errorResponse(error)}
}