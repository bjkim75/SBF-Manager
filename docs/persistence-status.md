# MVP 영속화 구현 상태

## 이번 단계에서 구현됨

- Cloudflare D1 논리 바인딩 `DB`와 로컬 개발 설정
- `change_requests`, `change_request_items`, `sbf_versions`, `audit_logs` 스키마
- 업무번호·버전번호·스냅샷 해시·감사 상관 ID 고유 제약
- 변경요청의 복수 변경항목 저장, 임시저장/요청접수 구분
- 변경요청 row version 기반 낙관적 동시수정 충돌(HTTP 409)
- 버전 발행 메타데이터·원본 `1. IA` 출처·스냅샷 해시 저장
- 변경요청·버전 발행 시 감사로그 자동 생성
- 감사로그 수행자·행위·대상 검색 API
- UI 변경요청과 버전 발행 폼의 실제 API 연결

## 실제 검증

로컬 D1 마이그레이션 15개 명령 적용 성공. API를 통해 변경요청 1건과 버전 1건을 생성하고 각각의 감사 상관 ID가 발급되는 것을 확인한 뒤 테스트 데이터만 삭제했다.

## 다음 구현 후보

1. 사내 SSO와 역할 기반 서버 권한 검사
2. 전체 SBF 마스터·Revision·IA-L3 데이터베이스 테이블
3. 인증된 Excel `1. IA` staging/검증/commit pipeline
4. 버전 스냅샷의 전체 데이터 hash 및 서버 스트리밍 CSV
5. 알림과 편집 잠금 heartbeat 영속화