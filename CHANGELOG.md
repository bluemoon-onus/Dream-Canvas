# Changelog

## 2026-04-09

### Added
- Upstash Redis (via Vercel Marketplace) for cross-instance rate limiting; counters survive serverless cold starts and page reloads. Key format `dreamcanvas:rl:{YYYY-MM-DD}:{ip}` with 48h TTL. Falls back to in-memory Map when KV env vars are absent.
- "내일 다시 만나요" / "See you tomorrow" message replaces the usage counter when the daily limit is reached.
- Friendly 429 response mapping for Gemini image quota errors (KO/EN).

### Changed
- `nanoBanana.ts`: `responseModalities` forced to `["IMAGE"]` (previously `["TEXT", "IMAGE"]`) so the model can no longer return text-only responses when persona is empty — fixes the case where unchecking "나를 그림에 포함" resulted in gradient-only cards.
- `DreamRecorder`: profile gate now passes the fresh persona through the Promise instead of relying on a stale prop closure, so profile changes take effect on the first generation after save.
- Voice review button label unified to "드림카드 만들기" / "Create dream card" (was "진행" / "Continue").
- `handleNewCard` preloads the background image before committing state and playing audio, so image and voice appear in sync.
- `lib/storage.ts`: switched `sessionStorage` → `localStorage`, `MAX_CARDS = 2` (current + 1 previous), with heavy fields (`backgroundImage`, `audio`) stripped on `QuotaExceededError` fallback.
- `CardGallery` shows only previous cards (`cards.slice(1)`) with a dashed-border empty placeholder when none exist.
- Removed redundant `NEXT_PUBLIC_DAILY_LIMIT_PER_IP` env var; the client fetches the limit from `/api/usage` on mount. `DAILY_LIMIT_PER_IP` is the single source of truth.

### Fixed
- Profile sheet not appearing on generate after the "don't auto-open on first load" refactor.
- Stale persona sent to `/api/dream` when the user changed profile values mid-session.

## 2026-04-08

### Added
- User profile sheet (gender, age range, skin tone, appearance, selfInDream toggle) with persona injection into nano-banana prompt.
- Sample image placeholder (`public/sample-main.png`) shown before the first card is generated.
- KO/EN i18n with language toggle, persisted to `localStorage`.
- IP-based daily rate limit (in-memory initially), configurable via `DAILY_LIMIT_PER_IP`.
- `/api/usage` GET endpoint returning `{used, limit}` for the caller's IP.
- 10-second auto-stop for voice recording.
- Canvas-based PNG export of the dream card (800×1120, text baked in).
- Server-side Gemini TTS prefetch (`gemini-2.5-flash-preview-tts`) with PCM→WAV wrapping; audio data URL reused through a click-unlocked `<audio>` element to bypass autoplay policy.
- Parallel interpretation + image + TTS pipeline with `Promise.allSettled` and per-stage timeouts.
- Vercel deployment with GitHub auto-deploy.

### Changed
- Recent cards title "최근 7일" → "최근 생성" / "Recent", limited to latest N.
- Generation progress bar with staged labels (interpret → paint → finish → done).
- Nano-banana prompt produces square 512×512 output, cropped to 5:7 on the card.

### Notes
- Project: DreamCanvas — dream-to-illustration card generator
- Stack: Next.js 14 App Router, TypeScript, Tailwind, Gemini API (text/image/TTS/STT)
- Deployment: https://dream-canvas-seven.vercel.app
- Repo: https://github.com/bluemoon-onus/Dream-Canvas
