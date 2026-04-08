export type Gender = "male" | "female" | "unspecified";
export type AgeRange = "teens" | "20_30" | "40_50" | "60_plus";
export type SkinTone = "light" | "medium" | "dark";

export interface UserProfile {
  gender: Gender;
  ageRange: AgeRange;
  skinTone: SkinTone;
  appearance?: string;
  selfInDream: boolean;
}

const KEY = "dreamcanvas:profile:v1";

export function loadProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as UserProfile;
    if (!p.gender || !p.ageRange || !p.skinTone) return null;
    return p;
  } catch {
    return null;
  }
}

export function saveProfile(p: UserProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(p));
}

/** 프로필을 nano-banana 프롬프트용 영어 문구로 변환 */
export function profileToPersona(p: UserProfile): string {
  if (!p.selfInDream) return "";
  const genderText =
    p.gender === "male" ? "man" : p.gender === "female" ? "woman" : "person";
  const ageText =
    p.ageRange === "teens"
      ? "in their teens"
      : p.ageRange === "20_30"
        ? "in their 20s or 30s"
        : p.ageRange === "40_50"
          ? "in their 40s or 50s"
          : "in their 60s or older";
  const skin = `${p.skinTone}-skinned`;
  const extras = p.appearance?.trim() ? `, ${p.appearance.trim()}` : "";
  return `a Korean ${skin} ${genderText} ${ageText}${extras}`;
}
