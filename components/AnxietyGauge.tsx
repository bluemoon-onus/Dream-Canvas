interface Props {
  /** 0(평온) ~ 100(불안) */
  value: number;
}

export function AnxietyGauge({ value }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-60 select-none">
      <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-white/70">
        <span>평온</span>
        <span>불안</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full animate-gauge-fill rounded-full bg-gradient-to-r from-emerald-300 via-amber-300 to-rose-400"
          style={{ ["--gauge-target" as string]: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
