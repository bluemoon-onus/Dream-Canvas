/**
 * Gemini TTS(서버 /api/tts)로 자연스러운 한국어 낭독.
 * 브라우저 speechSynthesis 대비 훨씬 자연스러움.
 */
let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let unlockedAudio: HTMLAudioElement | null = null;

/**
 * 사용자 제스처(클릭) 도중에 호출. 빈 오디오를 한 번 play()해서
 * 자동재생 정책을 풀어두고, 같은 엘리먼트를 나중에 src 교체해 재사용.
 */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (unlockedAudio) return;
  const a = new Audio();
  // 1프레임짜리 무음 wav (44바이트 헤더 + 0 data)
  a.src =
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
  a.play().catch(() => {});
  unlockedAudio = a;
}

export async function playPrefetched(dataUrl: string) {
  if (typeof window === "undefined") return;
  stopSpeaking();
  try {
    // unlock된 오디오 엘리먼트 재사용 → autoplay 정책 우회
    const audio = unlockedAudio ?? new Audio();
    audio.src = dataUrl;
    currentAudio = audio;
    await audio.play();
  } catch (e) {
    console.error("[tts] prefetched 재생 실패:", e);
  }
}

export async function speakKorean(text: string) {
  if (typeof window === "undefined") return;
  stopSpeaking();
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`TTS ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    currentUrl = url;
    audio.onended = () => {
      if (currentUrl === url) {
        URL.revokeObjectURL(url);
        currentUrl = null;
        currentAudio = null;
      }
    };
    await audio.play();
  } catch (e) {
    console.error("[tts] 재생 실패:", e);
  }
}

export function stopSpeaking() {
  if (typeof window === "undefined") return;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
}
