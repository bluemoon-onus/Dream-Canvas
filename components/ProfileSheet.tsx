"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { UserProfile, Gender, AgeRange, SkinTone } from "@/lib/profile";
import { useLanguage } from "./LanguageProvider";

interface Props {
  initial: UserProfile | null;
  onSave: (p: UserProfile) => void;
  onClose?: () => void;
  canClose: boolean;
  /** true면 저장 버튼을 "확인"으로 표시 (재확인 모드) */
  reconfirm?: boolean;
}

const GENDERS: Gender[] = ["male", "female", "unspecified"];
const AGES: AgeRange[] = ["teens", "20_30", "40_50", "60_plus"];
const SKINS: SkinTone[] = ["light", "medium", "dark"];

export function ProfileSheet({ initial, onSave, onClose, canClose, reconfirm }: Props) {
  const { t } = useLanguage();
  const [gender, setGender] = useState<Gender>(initial?.gender ?? "unspecified");
  const [ageRange, setAgeRange] = useState<AgeRange>(initial?.ageRange ?? "20_30");
  const [skinTone, setSkinTone] = useState<SkinTone>(initial?.skinTone ?? "medium");
  const [appearance, setAppearance] = useState(initial?.appearance ?? "");
  const [selfInDream, setSelfInDream] = useState(initial?.selfInDream ?? true);

  function submit() {
    onSave({ gender, ageRange, skinTone, appearance: appearance.trim() || undefined, selfInDream });
  }

  const genderLabel: Record<Gender, string> = {
    male: t("genderMale"),
    female: t("genderFemale"),
    unspecified: t("genderUnspecified"),
  };
  const ageLabel: Record<AgeRange, string> = {
    teens: t("age_teens"),
    "20_30": t("age_20_30"),
    "40_50": t("age_40_50"),
    "60_plus": t("age_60_plus"),
  };
  const skinLabel: Record<SkinTone, string> = {
    light: t("skinLight"),
    medium: t("skinMedium"),
    dark: t("skinDark"),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-bg-elev p-6 sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{t("profileTitle")}</h2>
            <p className="text-xs text-text-muted">{t("profileSubtitle")}</p>
          </div>
          {canClose && onClose && (
            <button onClick={onClose} className="text-text-muted hover:text-text-primary">
              <X size={20} />
            </button>
          )}
        </div>

        <Section label={t("fieldGender")} required>
          <ChipGroup
            options={GENDERS.map((g) => ({ value: g, label: genderLabel[g] }))}
            value={gender}
            onChange={(v) => setGender(v as Gender)}
          />
        </Section>

        <Section label={t("fieldAge")} required>
          <ChipGroup
            options={AGES.map((a) => ({ value: a, label: ageLabel[a] }))}
            value={ageRange}
            onChange={(v) => setAgeRange(v as AgeRange)}
          />
        </Section>

        <Section label={t("fieldSkin")} required>
          <ChipGroup
            options={SKINS.map((s) => ({ value: s, label: skinLabel[s] }))}
            value={skinTone}
            onChange={(v) => setSkinTone(v as SkinTone)}
          />
        </Section>

        <Section label={t("fieldAppearance")}>
          <input
            value={appearance}
            onChange={(e) => setAppearance(e.target.value)}
            maxLength={60}
            placeholder={t("appearancePlaceholder")}
            className="w-full rounded-xl border border-white/10 bg-bg-base p-3 text-sm focus:border-accent focus:outline-none"
          />
        </Section>

        <label className="mb-5 flex items-center justify-between rounded-xl bg-bg-base px-4 py-3 text-sm">
          <span>{t("fieldSelfInDream")}</span>
          <input
            type="checkbox"
            checked={selfInDream}
            onChange={(e) => setSelfInDream(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
        </label>

        <button
          onClick={submit}
          className="w-full rounded-full bg-accent py-3 text-sm font-medium text-white"
        >
          {reconfirm ? t("confirm") : t("save")}
        </button>
      </div>
    </div>
  );
}

function Section({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        {required && (
          <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[9px] text-accent">
            {t("required")}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3 py-1.5 text-xs ${
            value === o.value
              ? "bg-accent text-white"
              : "bg-bg-base text-text-muted hover:text-text-primary"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
