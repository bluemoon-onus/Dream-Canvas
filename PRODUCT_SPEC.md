# DreamCanvas — Product Requirements Document (PRD)

> 버전: v1.0 · 작성일: 2026-04-08 · 작성자: Product Team
> 대상 릴리스: MVP (3일 스프린트)

---

## 1. 프로젝트 개요

### 1.1 한 줄 설명
**DreamCanvas는 아침에 말한 꿈을 AI가 해석해 한 장의 시각적 "드림카드"로 만들어주고, 매일의 감정 흐름을 주간 타임라인으로 보여주는 모바일 우선 웹앱이다.**

### 1.2 배경 / 문제 정의
- 사람들은 잠에서 깬 직후 꿈을 빠르게 잊어버린다 (5분 내 50% 망각).
- 기존 꿈 일기 앱은 텍스트 중심이고, 시각적/감정적 회고 경험이 부족하다.
- "오늘의 꿈"을 SNS 공유 가능한 카드 한 장으로 만들면 기록 동기와 바이럴 모두 확보할 수 있다.

### 1.3 목표 (MVP Success Metrics)
| 지표 | 목표값 |
|---|---|
| 음성 입력 → 카드 생성 응답 시간 | **≤ 30초 (P95)** |
| 모바일 Lighthouse Performance | ≥ 85 |
| 카드 생성 성공률 | ≥ 95% |
| 7일 재방문 (정성 테스트, n=10) | 5명 이상 |

### 1.4 타겟 유저
- **1차**: 20–35세, 자기 성찰/명상/저널링에 관심 있는 모바일 헤비 유저
- **2차**: SNS(인스타 스토리)에 감각적 콘텐츠를 공유하는 크리에이터
- **사용 맥락**: 기상 직후 5분, 침대 위, 한 손 모바일 조작

### 1.5 Non-Goals (MVP 제외)
- 회원가입/로그인, 서버 DB
- 다국어 (한국어만)
- 결제, 카드 무제한 보관 (localStorage 한도까지)
- 친구/팔로우, 댓글

---

## 2. 기술 스택 및 아키텍처

### 2.1 기술 스택
| 레이어 | 기술 |
|---|---|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| AI 해석 | Google Gemini API (멀티모달, JSON mode) |
| 음성 전사 | Google Speech-to-Text API |
| 감정 분석 | Google Natural Language API (Sentiment) |
| 시각화 | Recharts, Lucide React |
| 저장 | Browser localStorage |
| 배포 | Vercel Hobby (Fluid Compute, `maxDuration = 60`) |

### 2.2 아키텍처 / API 호출 흐름

```
┌─────────────┐         ┌──────────────────┐         ┌───────────────────┐
│  User (모바일)│         │ Next.js Frontend │         │ Next.js Route API │
│             │         │  (App Router)    │         │  /api/dream       │
└──────┬──────┘         └────────┬─────────┘         └─────────┬─────────┘
       │ 1. 음성 녹음 (MediaRecorder)                          │
       │──────────────────────────▶                            │
       │                          │ 2. POST /api/dream         │
       │                          │   { audioBlob | text }     │
       │                          │───────────────────────────▶│
       │                          │                            │
       │                          │   3. Speech-to-Text        │
       │                          │      (음성일 경우만)        │
       │                          │      ─────────────▶ Google STT
       │                          │                            │
       │                          │   4. Promise.all([         │
       │                          │       Gemini.interpret(),  │  ─▶ Gemini API
       │                          │       NaturalLang.sentiment│  ─▶ NL API
       │                          │      ])                    │
       │                          │                            │
       │                          │   5. merge → DreamCard JSON│
       │                          │◀───────────────────────────│
       │ 6. 카드 렌더 + 애니메이션 │                            │
       │◀─────────────────────────│                            │
       │ 7. localStorage 저장      │                            │
```

핵심 원칙:
- **Gemini + Natural Language는 반드시 `Promise.all` 병렬 호출** (총 시간 단축).
- Speech-to-Text는 음성 입력 시에만 선행 (텍스트 직접 입력은 스킵).
- API Route는 Edge가 아닌 Node 런타임 (Google SDK 호환), `export const maxDuration = 60`.

---

## 3. 기능 명세

### F1. 꿈 입력 (음성 + 텍스트)
- **입력**: 마이크 음성 (최대 60초) 또는 텍스트 (최대 500자)
- **동작**:
  - 마이크 버튼 길게 누르면 녹음 시작, 떼면 종료 (`MediaRecorder`).
  - 텍스트 모드 토글 시 textarea 노출.
  - 녹음 중 파형 애니메이션 + 타이머.
- **출력**: `DreamInput { type: 'audio'|'text', payload: Blob|string }`
- **에러**: 마이크 권한 거부 → 텍스트 모드로 자동 전환 + 안내.

### F2. AI 해석 + 감정 분석 (병렬)
- **입력**: 전사된 텍스트
- **동작**:
  ```ts
  const [interpretation, sentiment] = await Promise.all([
    callGemini(text),
    callNaturalLanguage(text),
  ]);
  ```
- **출력**: `DreamCard` JSON (스키마는 §4 참조)
- **응답 시간 SLA**: 30초 이내

### F3. 드림카드 렌더링
- **입력**: `DreamCard` 객체
- **동작**: 400×560 카드 컴포넌트가 그라데이션, 아이콘, 텍스트, 감정 게이지를 표시하며 fade-in + scale 애니메이션 (600ms).
- **출력**: 화면에 카드 표시, 공유/저장 버튼

### F4. 주간 감정 타임라인
- **입력**: localStorage에 저장된 최근 7일 카드 배열
- **동작**: Recharts `LineChart`로 일자별 sentiment score (-1~+1) 표시, 카드별 점 클릭 시 해당 카드로 스크롤.
- **출력**: 라인 차트 + 평균 감정 라벨

### F5. 미니 카드 갤러리
- **입력**: 최근 7일 카드
- **동작**: 가로 스크롤 (snap), 카드 탭 시 상세 모달.
- **출력**: 썸네일 카드 리스트

### F6. 카드 공유/내보내기
- **입력**: 현재 카드 DOM
- **동작**: `html-to-image`로 PNG 변환 → Web Share API (모바일) 또는 다운로드 (데스크탑).
- **출력**: 400×560 PNG

---

## 4. Gemini API 프롬프트 설계

### 4.1 시스템 프롬프트
```
당신은 시적이고 따뜻한 "꿈 해석가"입니다. 사용자가 들려준 꿈 내용을 바탕으로
상징을 해석하고, 한 장의 시각적 카드로 표현할 수 있도록 구조화된 JSON을 반환합니다.

규칙:
1. 반드시 아래 JSON 스키마만 반환합니다. 추가 설명, 마크다운 금지.
2. 모든 문자열은 한국어.
3. interpretation은 1문장(최대 60자)의 시적인 해석.
4. theme는 카드 상단에 표시될 2~6자의 키워드.
5. symbols는 꿈 속 핵심 상징 3개 (각 1~5자).
6. gradient는 꿈의 분위기에 어울리는 hex 색상 3개 (어두운 → 밝은 순).
7. icon은 Lucide React 아이콘 이름 중 하나 (예: "moon","cloud","star","feather","waves","flame","eye","heart").
8. anxietyLevel은 0(평온)~100(불안) 정수.
```

### 4.2 응답 JSON 스키마
```json
{
  "theme": "string (2-6자)",
  "interpretation": "string (≤60자)",
  "symbols": ["string", "string", "string"],
  "gradient": ["#RRGGBB", "#RRGGBB", "#RRGGBB"],
  "icon": "moon | cloud | star | feather | waves | flame | eye | heart",
  "anxietyLevel": 0
}
```

### 4.3 호출 옵션
- `responseMimeType: "application/json"`
- `responseSchema`로 위 스키마 강제
- `temperature: 0.85` (시적 다양성)

### 4.4 최종 DreamCard (서버에서 머지)
```ts
type DreamCard = GeminiResponse & {
  id: string;
  createdAt: string;       // ISO
  rawText: string;
  sentimentScore: number;  // -1 ~ +1 (Natural Language)
  sentimentMagnitude: number;
};
```

---

## 5. 페이지 및 컴포넌트 구조

```
DreamCanva2/
├── app/
│   ├── layout.tsx              # 다크 테마, 폰트, 메타
│   ├── page.tsx                # 홈: 입력 + 최신 카드 + 갤러리
│   ├── globals.css             # Tailwind base + #0a0a1a
│   ├── timeline/
│   │   └── page.tsx            # 주간 감정 타임라인 페이지
│   └── api/
│       └── dream/
│           └── route.ts        # POST: STT → Promise.all(Gemini, NL)
├── components/
│   ├── DreamRecorder.tsx       # F1: 음성/텍스트 입력 토글
│   ├── DreamCard.tsx           # F3: 400×560 카드 렌더
│   ├── AnxietyGauge.tsx        # 불안↔평온 게이지 바
│   ├── CardGallery.tsx         # F5: 가로 스크롤 미니 갤러리
│   ├── EmotionTimeline.tsx     # F4: Recharts 라인 차트
│   ├── ShareButton.tsx         # F6: PNG 내보내기
│   └── ui/                     # Button, Modal, Spinner 등
├── lib/
│   ├── gemini.ts               # Gemini 클라이언트 + 프롬프트
│   ├── speechToText.ts         # Google STT 래퍼
│   ├── naturalLanguage.ts      # 감정 분석 래퍼
│   ├── storage.ts              # localStorage CRUD (DreamCard[])
│   └── types.ts                # DreamCard, DreamInput 등
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CHANGELOG.md
│   ├── DECISIONS.md
│   └── RUNBOOK.md
├── PRODUCT_SPEC.md
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## 6. UI/UX 상세

### 6.1 색상 (Dark Theme)
| 토큰 | Hex | 용도 |
|---|---|---|
| `--bg-base` | `#0a0a1a` | 페이지 배경 |
| `--bg-elev` | `#15152b` | 카드 컨테이너 |
| `--text-primary` | `#f5f5ff` | 본문 |
| `--text-muted` | `#8a8aa8` | 보조 |
| `--accent` | `#a78bfa` | 액션 (보라) |
| `--danger` | `#f87171` | 에러 |

### 6.2 드림카드 스펙
- 크기: **400 × 560px** (9:12.6, SNS 스토리 친화)
- 라운드: `rounded-3xl` (24px)
- 배경: AI 제공 3색 `linear-gradient(160deg, c1, c2, c3)`
- 레이어 (top → bottom):
  1. Lucide 아이콘 (96px, opacity 0.9)
  2. Theme 텍스트 (Bold 28px)
  3. Interpretation (Regular 16px, 1.6 line-height)
  4. 상징 태그 3개 (pill, bg-white/10)
  5. AnxietyGauge (가로 바, 240px)
  6. 우하단 날짜 (12px, opacity 0.6)

### 6.3 애니메이션
- 카드 등장: `opacity 0→1, scale 0.92→1, translateY 12→0`, 600ms `cubic-bezier(.2,.8,.2,1)`
- 게이지: width 0 → target, 800ms ease-out, 200ms 지연
- 녹음 중: 마이크 ring pulse 1.2s infinite

### 6.4 반응형 브레이크포인트
| 디바이스 | 폭 | 레이아웃 |
|---|---|---|
| Mobile (default) | `< 640px` | 1열, 카드 중앙, 갤러리 가로 스크롤 |
| Tablet `sm` | `≥ 640px` | 카드 + 사이드 갤러리 |
| Desktop `lg` | `≥ 1024px` | 카드 / 타임라인 2열 |

---

## 7. 에러 처리 시나리오

| # | 상황 | 처리 |
|---|---|---|
| E1 | 마이크 권한 거부 | 토스트 안내 + 텍스트 모드 자동 전환 |
| E2 | 녹음 0초/너무 짧음 (<1s) | "조금 더 말해주세요" 안내, 재시도 |
| E3 | Speech-to-Text 실패 | 텍스트 입력 폴백 + 원본 음성 다시 듣기 |
| E4 | Gemini API 5xx/타임아웃 | 1회 재시도 후 실패 시 "별이 잠시 흐려졌어요" 모달 |
| E5 | Gemini JSON 파싱 실패 | zod 검증 실패 → fallback DreamCard (기본 그라데이션 + 원문 표시) |
| E6 | Natural Language API 실패 | sentimentScore=0 으로 카드 생성은 진행 (graceful degrade) |
| E7 | 30초 초과 | AbortController로 취소 + 재시도 버튼 |
| E8 | localStorage QuotaExceeded | 가장 오래된 카드 자동 삭제 후 재시도 |
| E9 | 오프라인 | navigator.onLine 감지 → "연결을 확인해주세요" |

---

## 8. 3일 스프린트 계획

### Day 1 — 기반 + 입력 파이프라인
- [ ] Next.js 14 프로젝트 셋업, Tailwind, 다크 테마 토큰
- [ ] `lib/types.ts`, `lib/storage.ts` (localStorage CRUD)
- [ ] `DreamRecorder` 컴포넌트 (음성 + 텍스트 토글, 권한 처리)
- [ ] `/api/dream` route 스켈레톤 + Google SDK 키 환경변수
- [ ] Speech-to-Text 연동 + 로컬 테스트

### Day 2 — AI 해석 + 카드 렌더
- [ ] `lib/gemini.ts` 프롬프트 + zod 스키마 검증
- [ ] `lib/naturalLanguage.ts` 감정 분석
- [ ] `/api/dream` 에서 `Promise.all` 병렬 호출, 머지, 30s 타임아웃
- [ ] `DreamCard`, `AnxietyGauge` 컴포넌트 + 등장 애니메이션
- [ ] 에러 시나리오 E1~E6 처리 + fallback 카드

### Day 3 — 갤러리/타임라인 + 마무리
- [ ] `CardGallery` (가로 스크롤 snap)
- [ ] `EmotionTimeline` (Recharts)
- [ ] `ShareButton` (html-to-image + Web Share API)
- [ ] 모바일 QA, Lighthouse, 로딩 스켈레톤
- [ ] Vercel 배포 (Fluid Compute, `maxDuration=60`), 환경변수 설정
- [ ] `docs/CHANGELOG.md` v1.0 기록

---

## 부록 A. 환경 변수
```
GEMINI_API_KEY=  # 텍스트 해석 + 감정 분석 + STT + 이미지 생성 모두 단일 키
```

## 부록 B. 외부 의존성
`@google/generative-ai`, `@google-cloud/speech`, `@google-cloud/language`, `recharts`, `lucide-react`, `html-to-image`, `zod`, `tailwindcss`
