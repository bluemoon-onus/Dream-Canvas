# Architecture Decision Records (ADR)

## ADR-001: 저장소로 localStorage 채택
- **일자**: 2026-04-08
- **상태**: 수락
- **맥락**: 3일 MVP, 회원가입 없음, 단일 디바이스 사용 가정.
- **결정**: 서버 DB 없이 브라우저 `localStorage`에 카드 배열 저장.
- **결과**: 서버 stateless 유지, 배포 단순. 디바이스 간 동기화 불가 (수용).

## ADR-002: Gemini와 Natural Language API 병렬 호출
- **일자**: 2026-04-08
- **상태**: 수락
- **맥락**: 30초 SLA. 두 API는 입력(텍스트)이 동일하고 서로 의존하지 않음.
- **결정**: `Promise.all`로 동시 호출.
- **결과**: 총 응답 시간이 둘 중 더 느린 쪽으로 수렴 (직렬 대비 ~40% 단축 예상).

## ADR-003: Vercel Fluid Compute + maxDuration 60s
- **일자**: 2026-04-08
- **상태**: 수락
- **맥락**: Hobby 플랜 기본 10초로는 STT+Gemini 처리 불가.
- **결정**: Fluid Compute 활성화, route에 `export const maxDuration = 60`.
- **결과**: 콜드 스타트 영향 감소, 60초 내 응답 보장.

## ADR-004: JSON 스키마 강제 + zod 이중 검증
- **일자**: 2026-04-08
- **상태**: 수락
- **결정**: Gemini `responseSchema`로 1차 강제 + zod로 2차 검증, 실패 시 fallback 카드.
- **결과**: 프롬프트 회귀에도 사용자 경험 보호.

## ADR-005: 다크 테마 단일 (#0a0a1a)
- **일자**: 2026-04-08
- **결정**: 라이트 테마 미지원. 꿈 = 밤 = 어두운 톤이라는 컨셉 일관성.
