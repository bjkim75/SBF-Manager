export type Item={id:string;sub:number;domain:string;squad:string;d1:string;d2:string;d3:string;d4:string;l3:string;target:string[];status:string};
export const items:Item[]=[
{id:'B1002',sub:1,domain:'상품(EPC)',squad:'상품(EPC)',d1:'1.탐색',d2:'상품/마케팅프로그램 탐색',d3:'EPC 마케팅 프로그램 조회/찾기',d4:'마케팅프로그램 조회',l3:'Product Offering 검색',target:['MNO','AIR','SKB'],status:'운영'},
{id:'B1002',sub:2,domain:'상품(EPC)',squad:'상품(EPC)',d1:'1.탐색',d2:'상품/마케팅프로그램 탐색',d3:'EPC 마케팅 프로그램 조회/찾기',d4:'버전이력 조회 및 비교',l3:'Product Offering 이력',target:['MNO','AIR','SKB'],status:'변경 예정'},
{id:'B1003',sub:1,domain:'상품(EPC)',squad:'상품(EPC)',d1:'1.탐색',d2:'상품/마케팅프로그램 탐색',d3:'EPC 상품 조회/찾기',d4:'상품(Product Offering) 조회',l3:'상품 조회',target:['MNO','AIR'],status:'운영'},
{id:'B1009',sub:1,domain:'상품(EPC)',squad:'상품(EPC)',d1:'1.탐색',d2:'상품/마케팅프로그램 탐색',d3:'전시 상품/마케팅프로그램 조회/찾기',d4:'—',l3:'전시 상품 탐색',target:['MNO','AIR','SKB'],status:'검토 필요'},
{id:'B2036',sub:1,domain:'빌링',squad:'빌링',d1:'2.회원·계정',d2:'계정 (청구/납부)',d3:'청구계정',d4:'청구계정 정보 관리',l3:'청구계정 관리',target:['MNO','AIR','SKB'],status:'운영'},
{id:'B2039',sub:1,domain:'빌링',squad:'빌링',d1:'2.회원·계정',d2:'계정 (청구/납부)',d3:'납부계정',d4:'선불 납부계정 등록/변경/해지',l3:'납부계정 관리',target:['MNO','AIR','SKB'],status:'변경 예정'},
{id:'B2001',sub:1,domain:'통합회원',squad:'통합회원/Party',d1:'2.회원·계정',d2:'고객인증',d3:'고객인증처리',d4:'고객 인증 · 고객 단위',l3:'고객 인증',target:['MNO','AIR','SKB'],status:'운영'},
{id:'B2051',sub:1,domain:'공통(Shared)',squad:'공통(Shared)',d1:'2.회원·계정',d2:'동의·약관',d3:'동의 관리',d4:'고객 별 동의 이력 조회',l3:'동의 이력',target:['MNO','AIR'],status:'검토 필요'}];
export const requests=[['CR-2026-0812-07','청구계정 업무 Depth 조정','Depth 조정','김서현','검토 중','2026-08-12'],['CR-2026-0811-03','상품 버전이력 조회 업무 추가','신규 등록','박지우','보완 요청','2026-08-11'],['CR-2026-0808-11','통합회원 L3 매핑 변경','IA-L3 변경','정하린','승인','2026-08-08'],['CR-2026-0807-02','동의 관리 담당 분과 변경','담당자 변경','이도윤','작업 중','2026-08-07']];
export const menus=[['업무 관리',['대시보드','SBF 마스터','계층 트리','IA–L3 매핑']],['변경 관리',['변경요청','내 요청','처리 업무','변경이력']],['데이터 운영',['데이터 가져오기','데이터 내보내기','기준정보']],['시스템',['사용자·권한','감사 로그','환경 설정']]] as const;

export const itemsV24:Item[]=items.map(x=>{
 const l3ByKey:Record<string,string>={
  'B1002-1':'PLM 정보 조회','B1002-2':'PLM 정보 조회','B1003-1':'PLM 정보 조회','B1009-1':'L3 미매핑',
  'B2036-1':'청구정보관리 외 4','B2039-1':'정기결제 관리 외 5','B2001-1':'고객인증','B2051-1':'개인정보활용동의 외 1'
 };
 return {...x,l3:l3ByKey[x.id+'-'+x.sub]??x.l3,status:'운영'};
});