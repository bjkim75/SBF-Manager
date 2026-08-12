import {and,desc,eq} from "drizzle-orm";
import {getDb} from "../../../db";
import {changeRequestItems,changeRequests} from "../../../db/schema";

const errorResponse=(error:unknown)=>Response.json({error:error instanceof Error?error.message:"처리 중 오류가 발생했습니다."},{status:500});
export async function GET(){try{const db=getDb();const rows=await db.select().from(changeRequests).orderBy(desc(changeRequests.createdAt)).limit(100);return Response.json({changeRequests:rows});}catch(error){return errorResponse(error)}}
export async function POST(request:Request){
 try{
  const body=await request.json() as {title?:string;requestArea?:string;requesterName?:string;requesterOrganization?:string;submit?:boolean;items?:Array<{targetBusinessId?:string;changeType?:string;beforeValue?:string;afterValue?:string;reason?:string}>};
  const title=body.title?.trim()??"",area=body.requestArea?.trim()??"",items=body.items??[];
  if(!title||!area||!body.requesterName||!body.requesterOrganization||items.length===0)return Response.json({error:"제목, 요청 분야, 요청자와 변경 항목은 필수입니다."},{status:400});
  if(items.some(x=>!x.targetBusinessId?.trim()||!x.changeType?.trim()||!x.afterValue?.trim()||!x.reason?.trim()))return Response.json({error:"모든 변경 항목의 대상, 유형, 변경 후 값과 사유를 입력해 주세요."},{status:400});
  const db=getDb(),now=new Date().toISOString(),requestNo=`CR-${now.slice(0,10).replaceAll('-','')}-${crypto.randomUUID().slice(0,6).toUpperCase()}`;
  const [created]=await db.insert(changeRequests).values({requestNo,title,requestArea:area,requesterName:body.requesterName,requesterOrganization:body.requesterOrganization,status:body.submit?"요청 접수":"임시 저장",createdAt:now,updatedAt:now}).returning();
  await db.insert(changeRequestItems).values(items.map((x,i)=>({requestId:created.id,targetBusinessId:x.targetBusinessId!.trim(),changeType:x.changeType!.trim(),beforeValue:x.beforeValue?.trim()??"",afterValue:x.afterValue!.trim(),reason:x.reason!.trim(),sortOrder:i+1})));
  return Response.json({changeRequest:created},{status:201});
 }catch(error){return errorResponse(error)}
}
export async function PATCH(request:Request){try{const body=await request.json() as {id?:number;rowVersion?:number;status?:string};if(!body.id||!body.rowVersion||!body.status)return Response.json({error:"id, rowVersion, status가 필요합니다."},{status:400});const db=getDb();const result=await db.update(changeRequests).set({status:body.status,rowVersion:body.rowVersion+1,updatedAt:new Date().toISOString()}).where(and(eq(changeRequests.id,body.id),eq(changeRequests.rowVersion,body.rowVersion))).returning();if(result.length===0)return Response.json({error:"다른 사용자가 먼저 변경했습니다. 최신 정보를 확인해 주세요."},{status:409});return Response.json({changeRequest:result[0]});}catch(error){return errorResponse(error)}}