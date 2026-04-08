"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Type, Loader2, Square, RotateCcw, Check } from "lucide-react";
import type { DreamCard } from "@/lib/types";
import { unlockAudio } from "@/lib/tts";
import { useLanguage } from "@/components/LanguageProvider";

interface Props {
  onCard: (card: DreamCard, usage?: { used: number; limit: number }) => void;
  usage?: { used: number; limit: number } | null;
  persona?: string;
  /** 생성 직전에 호출. false 반환 시 생성 중단 (프로필 시트 등) */
  beforeGenerate?: () => Promise<boolean>;
}

type Mode = "voice" | "text";
type Phase =
  | "idle"
  | "recording"
  | "transcribing"
  | "review"
  | "generating"
  | "error";

export function DreamRecorder({ onCard, usage, persona, beforeGenerate }: Props) {
  const { lang, t } = useLanguage();
  const dailyLimit = usage?.limit ?? Number(process.env.NEXT_PUBLIC_DAILY_LIMIT_PER_IP ?? "2");
  const used = usage?.used ?? 0;
  const limitReached = used >= dailyLimit;
  const [mode, setMode] = useState<Mode>("voice");
  const [phase, setPhase] = useState<Phase>("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recSeconds, setRecSeconds] = useState(0);
  const [genElapsed, setGenElapsed] = useState(0);
  const [progress, setProgress] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const genTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    recTimerRef.current && clearInterval(recTimerRef.current);
    genTimerRef.current && clearInterval(genTimerRef.current);
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  // ── 녹음 ──────────────────────────────────────────
  async function startRecording() {
    if (limitReached) {
      setError(
        lang === "en"
          ? `Daily limit (${dailyLimit}) reached. Please try again tomorrow.`
          : `오늘 생성 한도(${dailyLimit}회)를 초과했어요. 내일 다시 시도해주세요.`,
      );
      return;
    }
    setError(null);
    unlockAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 1000) {
          setPhase("idle");
          setError(t("speakLonger"));
          return;
        }
        await transcribe(blob);
      };
      rec.start();
      recorderRef.current = rec;
      setPhase("recording");
      setRecSeconds(0);
      recTimerRef.current = setInterval(() => {
        setRecSeconds((s) => {
          const next = s + 1;
          if (next >= 10) {
            // 10초 도달 → 자동 종료
            recorderRef.current?.stop();
            if (recTimerRef.current) {
              clearInterval(recTimerRef.current);
              recTimerRef.current = null;
            }
          }
          return next;
        });
      }, 1000);
    } catch {
      setError(t("micDenied"));
      setMode("text");
      setPhase("idle");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recTimerRef.current && clearInterval(recTimerRef.current);
  }

  async function transcribe(blob: Blob) {
    setPhase("transcribing");
    try {
      const fd = new FormData();
      fd.append("audio", blob, "dream.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "전사 실패");
      setText(json.text);
      setPhase("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "전사 실패");
      setPhase("error");
    }
  }

  function resetToRecord() {
    setText("");
    setError(null);
    setPhase("idle");
  }

  // ── 카드 생성 ──────────────────────────────────────
  async function generateCard() {
    if (!text.trim()) return;
    if (limitReached) {
      setError(
        lang === "en"
          ? `Daily limit (${dailyLimit}) reached. Please try again tomorrow.`
          : `오늘 생성 한도(${dailyLimit}회)를 초과했어요. 내일 다시 시도해주세요.`,
      );
      return;
    }
    unlockAudio(); // 사용자 제스처 중에 오디오 정책 unlock
    if (beforeGenerate) {
      const ok = await beforeGenerate();
      if (!ok) return;
    }
    setPhase("generating");
    setError(null);
    setGenElapsed(0);
    setProgress(0);

    // fake 진행바: 0 → 95% 까지 이징, 그 이후는 응답 대기
    // 실제 Gemini 이미지 API는 진행률을 제공하지 않음
    const started = Date.now();
    const ESTIMATED_MS = 35_000; // 평균 체감 시간
    genTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - started;
      setGenElapsed(Math.floor(elapsed / 1000));
      // easeOutQuad: 빠르게 시작해서 점점 느려짐
      const ratio = Math.min(1, elapsed / ESTIMATED_MS);
      const eased = 1 - Math.pow(1 - ratio, 2);
      setProgress(Math.min(95, Math.floor(eased * 95)));
    }, 200);

    try {
      const res = await fetch("/api/dream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, lang, persona }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "생성 실패");
      setProgress(100);
      onCard(json.card as DreamCard, json.usage);
      setPhase("idle");
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "생성 실패");
      setPhase("error");
    } finally {
      genTimerRef.current && clearInterval(genTimerRef.current);
    }
  }

  // ── 단계 라벨 ──────────────────────────────────────
  const genStage =
    progress < 40
      ? t("stageInterpret")
      : progress < 80
        ? t("stagePaint")
        : progress < 100
          ? t("stageFinish")
          : t("stageDone");

  // ── 렌더 ──────────────────────────────────────────
  return (
    <div className="w-full max-w-md">
      {/* 모드 토글: 녹음/생성 중에는 숨김 */}
      {(phase === "idle" || phase === "error") && (
        <div className="mb-4 flex justify-center gap-2">
          <button
            onClick={() => setMode("voice")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs ${
              mode === "voice" ? "bg-accent text-white" : "bg-bg-elev text-text-muted"
            }`}
          >
            <Mic size={14} /> {t("modeVoice")}
          </button>
          <button
            onClick={() => setMode("text")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs ${
              mode === "text" ? "bg-accent text-white" : "bg-bg-elev text-text-muted"
            }`}
          >
            <Type size={14} /> {t("modeText")}
          </button>
        </div>
      )}

      {(phase === "idle" || phase === "error") && (
        <p className="mb-4 text-center text-[14px] text-text-muted">
          {t("subtitle", { n: dailyLimit })}{" "}
          <span className="text-text-primary">
            ({used}/{dailyLimit})
          </span>
        </p>
      )}

      {/* idle/recording: 음성 버튼 */}
      {mode === "voice" && (phase === "idle" || phase === "recording" || phase === "transcribing" || phase === "error") && (
        <div className="flex flex-col items-center">
          <button
            onClick={phase === "recording" ? stopRecording : startRecording}
            disabled={phase === "transcribing" || (limitReached && phase !== "recording")}
            className="relative flex h-24 w-24 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 disabled:opacity-40"
          >
            {phase === "recording" && (
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-accent" />
            )}
            {phase === "transcribing" ? (
              <Loader2 size={32} className="animate-spin" />
            ) : phase === "recording" ? (
              <Square size={28} fill="currentColor" />
            ) : (
              <Mic size={32} />
            )}
          </button>
          <p className="mt-3 text-xs text-text-muted">
            {phase === "transcribing"
              ? t("transcribing")
              : phase === "recording"
                ? `${t("recording")} · ${recSeconds}s / 10s`
                : t("tapToSpeak")}
          </p>
        </div>
      )}

      {/* 텍스트 모드 */}
      {mode === "text" && (phase === "idle" || phase === "error") && (
        <div className="flex flex-col gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            rows={5}
            placeholder={t("textPlaceholder")}
            className="w-full resize-none rounded-2xl border border-white/10 bg-bg-elev p-4 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
          <button
            onClick={generateCard}
            disabled={!text.trim() || limitReached}
            className="flex items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {t("createCard")}
          </button>
        </div>
      )}

      {/* review: 전사된 텍스트 확인 */}
      {phase === "review" && (
        <div className="flex flex-col gap-3">
          <label className="text-xs text-text-muted">{t("reviewLabel")}</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="w-full resize-none rounded-2xl border border-white/10 bg-bg-elev p-4 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={resetToRecord}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-bg-elev py-3 text-sm text-text-muted"
            >
              <RotateCcw size={14} /> {t("rerecord")}
            </button>
            <button
              onClick={generateCard}
              className="flex flex-[2] items-center justify-center gap-1.5 rounded-full bg-accent py-3 text-sm font-medium text-white"
            >
              <Check size={16} /> {t("proceed")}
            </button>
          </div>
        </div>
      )}

      {/* generating: 단계 라벨 + fake 진행바 */}
      {phase === "generating" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <Loader2 size={48} className="animate-spin text-accent" />
          <div className="w-full">
            <div className="mb-2 flex justify-between text-xs">
              <span className="text-text-primary">{genStage}</span>
              <span className="text-text-muted">{progress}% · {genElapsed}s</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-bg-elev">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-pink-400 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-center text-[10px] text-text-muted">
              {t("progressDisclaimer")}
            </p>
          </div>
        </div>
      )}

      {error && phase !== "generating" && (
        <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-center text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
