# DreamCanvas 아키텍처

> 최종 업데이트: 2026-04-08

## 1. 시스템 개요
DreamCanvas는 단일 Next.js 14 (App Router) 애플리케이션으로 구성된 서버리스 웹앱이다.
서버 컴포넌트와 단일 API Route(`/api/dream`)만으로 동작하며, 영속화는 클라이언트 `localStorage`에 위임한다.

## 2. 런타임 구조
```
[Browser]
  ├─ React Client Components (DreamRecorder, DreamCard, ...)
  ├─ localStorage  ──── 카드 영속
  └─ MediaRecorder ──── 마이크 캡처
        │
        ▼  HTTPS (multipart or JSON)
[Vercel Fluid Compute · Node Runtime, maxDuration=60]
  └─ /api/dream/route.ts
        ├─ (옵션) Google Speech-to-Text
        └─ Promise.all
             ├─ Google Gemini (해석, JSON mode)
             └─ Google Natural Language (감정)
```

## 3. 데이터 모델
```ts
type DreamCard = {
  id: string;              // uuid
  createdAt: string;       // ISO
  rawText: string;
  theme: string;
  interpretation: string;
  symbols: [string, string, string];
  gradient: [string, string, string];
  icon: LucideName;
  anxietyLevel: number;        // 0~100 (Gemini)
  sentimentScore: number;      // -1~+1 (Google NL)
  sentimentMagnitude: number;  // 0~∞   (Google NL)
};
```
저장 키: `dreamcanvas:cards:v1` (배열, 최신순, 최대 30개)

## 4. 모듈 경계
| 모듈 | 책임 | 의존 |
|---|---|---|
| `app/api/dream/route.ts` | 오케스트레이션, 타임아웃, 에러 매핑 | lib/* |
| `lib/gemini.ts` | 프롬프트, JSON 스키마 강제, zod 검증 | @google/generative-ai |
| `lib/speechToText.ts` | 오디오 → 한국어 텍스트 | @google-cloud/speech |
| `lib/naturalLanguage.ts` | 감정 점수/강도 | @google-cloud/language |
| `lib/storage.ts` | localStorage CRUD, quota 관리 | - |
| `components/*` | 표시/상호작용 (서버 의존 없음) | lib/types |

## 5. 핵심 원칙
1. **병렬화**: Gemini + NL은 반드시 `Promise.all`. 직렬 호출 금지.
2. **Graceful Degrade**: NL 실패 시 sentiment=0 으로 진행. Gemini 실패만 사용자에게 노출.
3. **No Server State**: 모든 영속 데이터는 클라이언트. 서버는 stateless.
4. **30초 SLA**: 라우트 내부에 `AbortController` 25초 설정.
5. **모바일 우선**: 모든 컴포넌트는 360px 폭 기준 1차 설계.

## 6. 보안 / 비밀
- Google 키는 서버 환경변수로만 보유, 클라이언트 노출 금지.
- `/api/dream`은 단순 rate-limit (IP 기준 분당 10회, in-memory) 권장 — MVP 이후.

## 7. 미해결 / 향후
- 사용자 계정 + 서버 DB 마이그레이션 경로
- i18n
- 카드 이미지 서버 측 OG 렌더
