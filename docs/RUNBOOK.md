# DreamCanvas Runbook

## 로컬 개발
```bash
pnpm install
cp .env.example .env.local   # 키 입력
pnpm dev                     # http://localhost:3000
```

### 필요한 환경변수
| 키 | 설명 |
|---|---|
| `GEMINI_API_KEY` | Gemini API 키 (텍스트 해석 + 이미지 생성 + STT) |

## 배포 (Vercel)
1. Vercel 프로젝트 생성 → GitHub 연동
2. Settings → Functions → **Fluid Compute: ON**
3. Environment Variables 등록 (위 2개)
4. `app/api/dream/route.ts` 상단 `export const maxDuration = 60` 확인
5. `main` 푸시 → 자동 배포

## 자주 발생하는 장애 대응

### 1) 카드 생성이 30초 이상 걸림
- Vercel 함수 로그 확인 → Gemini 응답 시간 점검
- Natural Language API 지연이 원인이면 graceful degrade 확인 (sentiment=0 fallback)

### 2) "JSON 파싱 실패" 토스트 다발
- Gemini 응답 샘플 로그 수집
- 프롬프트 §4.1 규칙 강화 또는 `responseSchema` 재확인

### 3) 마이크가 잡히지 않음 (iOS Safari)
- HTTPS 여부 확인 (localhost 외 HTTP 불가)
- Safari 설정 → 웹사이트 → 마이크 권한 점검

### 4) localStorage QuotaExceeded
- `lib/storage.ts`의 LRU eviction (오래된 카드 삭제) 동작 확인

## 모니터링
- Vercel Logs (실시간)
- (이후) Sentry 연동 예정

## 롤백
- Vercel Deployments → 이전 성공 빌드 → "Promote to Production"
