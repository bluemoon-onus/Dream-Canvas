import type { Lang } from "./types";

type Dict = Record<string, string>;

const ko: Dict = {
  title: "DreamCanvas",
  subtitle: "하루에 {n}개만 그려드려요",
  modeVoice: "음성",
  modeText: "텍스트",
  tapToSpeak: "버튼을 눌러 꿈을 들려주세요",
  recording: "녹음 중",
  transcribing: "음성을 텍스트로 변환 중...",
  reviewLabel: "이렇게 들렸어요. 맞으면 진행하세요.",
  rerecord: "다시 녹음",
  proceed: "진행",
  textPlaceholder: "오늘 꾼 꿈을 적어주세요...",
  createCard: "드림카드 만들기",
  stageInterpret: "꿈을 해석하는 중...",
  stagePaint: "그림을 그리는 중...",
  stageFinish: "마무리하는 중...",
  stageDone: "완성!",
  progressDisclaimer: "실제 진행률은 제공되지 않아 예상치입니다",
  replay: "다시 듣기",
  download: "그림 다운로드",
  recent: "최근 생성",
  speakLonger: "조금 더 길게 말해주세요.",
  micDenied: "마이크 권한이 거부되었어요. 텍스트 모드로 전환할게요.",
  size1024: "1024×1024",
  size512: "512×512",
};

const en: Dict = {
  title: "DreamCanvas",
  subtitle: "Up to {n} dreams a day",
  modeVoice: "Voice",
  modeText: "Text",
  tapToSpeak: "Tap to tell me your dream",
  recording: "Recording",
  transcribing: "Transcribing...",
  reviewLabel: "Here's what I heard. Edit or continue.",
  rerecord: "Re-record",
  proceed: "Continue",
  textPlaceholder: "Describe last night's dream...",
  createCard: "Create dream card",
  stageInterpret: "Interpreting your dream...",
  stagePaint: "Painting...",
  stageFinish: "Finishing...",
  stageDone: "Done!",
  progressDisclaimer: "Progress is estimated — the model gives no real percent",
  replay: "Replay",
  download: "Download image",
  recent: "Recent",
  speakLonger: "Please speak a bit longer.",
  micDenied: "Microphone denied. Switching to text mode.",
  size1024: "1024×1024",
  size512: "512×512",
};

const dicts: Record<Lang, Dict> = { ko, en };

export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let s = dicts[lang][key] ?? dicts.ko[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
