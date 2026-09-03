# 파일 기반 영속 SBF 마스터 배포 가이드 (PER-07, PER-09)

SBF 마스터의 기본값은 서버/DB 없이 리포지토리에 포함된 정적 JSON 파일
`public/sbf-master.json` 하나로 영속화한다. 어느 기기에서 접속하든 이 파일의
값을 동일하게 보게 되며, 다음 접속에도 유지된다.

## 동작 개요

- 앱 시작 시 `/sbf-master.json`(빌드 시 `public/`가 사이트 루트로 서빙됨)을
  조회해 SBF 마스터 기본 데이터로 사용한다. (PER-04)
- 데이터 출처는 이 파일로 일원화한다. 파일 로딩이 실패하면 seed로 조용히
  폴백하지 않고 명시적 오류 상태(원인 + 조치 안내 + 재시도)를 표시한다.
  (PER-05, PER-06)
- 데이터 가져오기(ImportView, IMP-C)는 발행 전 브라우저 세션 미리보기 계층으로만
  유지한다. 실제 영속 반영은 아래 발행·배치·배포 흐름으로만 이루어진다. (PER-08)

## 반영 절차

1. 배포관리 화면에서 `불변 스냅샷 배포`(PUBLISH VERSION)를 실행한다.
2. 현재 활성 공식 버전 전체가 `sbf-master.json`(고정 파일명)으로 자동
   다운로드된다. (PER-01, PER-02)
3. 다운로드된 파일을 리포지토리 고정 경로 `public/sbf-master.json`에 배치한다.
4. 변경 사항을 커밋하고 푸시한다.
5. Netlify가 정적 사이트를 재배포하면 모든 기기가 다음 접속 시 새 값을 본다.
   (PER-07)

## 스냅샷 파일 형식 (PER-03)

```json
{
  "schemaVersion": 1,
  "meta": {
    "versionNo": "v2.6",
    "publishedAt": "2026-08-10T00:00:00.000Z",
    "publisher": "김서현",
    "reason": "발행 사유",
    "itemCount": 1172,
    "sourceFile": "SKT_Business_Framework.xlsx",
    "sourceSheet": "1. IA"
  },
  "iaHeaders": ["sort", "업무ID", "SUB ID", "..."],
  "items": [{ "id": "B1002", "sub": 1, "raw": ["..."], "...": "..." }]
}
```

`items`는 `raw:string[]`를 포함해 기존 데이터 계약(`Item`/`raw`/`iaHeaders`)과
호환된다. 로더는 `raw`로부터 `itemFromRaw`로 각 항목을 재구성하므로 조회·검색·
필터·정렬·상세·CSV가 seed와 동일하게 동작한다.

## 초기 seed 파일 재생성

리포지토리에는 seed(`app/data.ts`의 `items`)에서 생성한 초기
`public/sbf-master.json`이 포함되어 있어 개발/빌드/렌더 테스트가 실제 데이터로
동작한다. 필요 시 다음 명령으로 재생성한다.

```
npm run gen:sbf-master
```

## 범위 밖 (PER-09)

- 완전 자동 커밋(GitHub API / 서버리스 함수)은 본 범위에서 제외한다. 브라우저는
  원격 파일을 직접 쓰지 않으며, 다운로드 → 배치 → 커밋 → 재배포 절차로만
  반영한다. 운영/DB 단계에서 별도 확장 전제로만 참조한다.
