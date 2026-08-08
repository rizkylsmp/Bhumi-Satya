import {
  ArrowClockwiseIcon,
  CalendarBlankIcon,
  SunIcon,
} from "@phosphor-icons/react";
import Switch from "../../ui/Switch";
import {
  formatShadowMinutes,
  getShadowDayPeriod,
} from "../../../utils/shadowAnalysis";

function AnalogClock({ minutes }) {
  const hourAngle = ((Math.floor(minutes / 60) % 12) * 30) + ((minutes % 60) * 0.5);
  const minuteAngle = (minutes % 60) * 6;

  return (
    <svg
      viewBox="0 0 120 120"
      className="h-24 w-24 text-text-primary"
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="52" className="fill-surface stroke-border" strokeWidth="5" />
      {[0, 90, 180, 270].map((angle) => (
        <line
          key={angle}
          x1="60"
          y1="13"
          x2="60"
          y2="20"
          className="stroke-text-muted"
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${angle} 60 60)`}
        />
      ))}
      <line
        x1="60"
        y1="60"
        x2="60"
        y2="35"
        className="stroke-text-primary"
        strokeWidth="5"
        strokeLinecap="round"
        transform={`rotate(${hourAngle} 60 60)`}
      />
      <line
        x1="60"
        y1="60"
        x2="60"
        y2="25"
        className="stroke-accent"
        strokeWidth="3.5"
        strokeLinecap="round"
        transform={`rotate(${minuteAngle} 60 60)`}
      />
      <circle cx="60" cy="60" r="5" className="fill-accent" />
    </svg>
  );
}

export default function ShadowAnalysisPanel({
  enabled = false,
  date,
  minutes = 12 * 60,
  onEnabledChange,
  onDateChange,
  onMinutesChange,
  onUseCurrentTime,
}) {
  const timeLabel = formatShadowMinutes(minutes);
  const periodLabel = getShadowDayPeriod(minutes);

  return (
    <section
      id="panel-3d-shadow"
      role="tabpanel"
      className="space-y-3"
      aria-label="Pengaturan analisis bayangan"
    >
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border bg-surface-secondary/70 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/12 text-amber-500">
              <SunIcon size={18} weight="fill" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-lg font-black tracking-tight text-text-primary">
                  {timeLabel}
                </span>
                <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-accent">
                  {periodLabel}
                </span>
              </div>
              <p className="text-[8px] font-semibold text-text-muted">
                Waktu Indonesia Barat
              </p>
            </div>
          </div>
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              enabled ? "bg-emerald-500" : "bg-text-muted/40"
            }`}
            title={enabled ? "Analisis aktif" : "Analisis nonaktif"}
          />
        </div>

        <div className="space-y-3 p-3">
          <div className="flex justify-center py-1">
            <AnalogClock minutes={minutes} />
          </div>

          <label className="block">
            <span className="sr-only">Waktu simulasi bayangan</span>
            <input
              type="range"
              min="0"
              max="1439"
              step="1"
              value={minutes}
              onChange={(event) => onMinutesChange?.(Number(event.target.value))}
              className="h-1.5 w-full cursor-pointer accent-accent"
              aria-valuetext={`${timeLabel} WIB`}
            />
          </label>
          <div className="-mt-1 flex justify-between text-[8px] font-bold uppercase tracking-wide text-text-muted">
            <span>00.00</span>
            <span>06.00</span>
            <span>12.00</span>
            <span>18.00</span>
            <span>24.00</span>
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-border bg-surface-secondary px-2.5 py-2">
            <CalendarBlankIcon size={15} weight="bold" className="shrink-0 text-accent" />
            <span className="text-[9px] font-bold text-text-secondary">Tanggal</span>
            <input
              type="date"
              value={date}
              onChange={(event) => onDateChange?.(event.target.value)}
              className="ml-auto min-w-0 bg-transparent text-right text-[9px] font-bold text-text-primary outline-none [color-scheme:light] dark:[color-scheme:dark]"
              aria-label="Tanggal simulasi bayangan"
            />
          </label>

          <button
            type="button"
            onClick={onUseCurrentTime}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 text-[9px] font-extrabold text-surface transition-colors hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <ArrowClockwiseIcon size={14} weight="bold" />
            Gunakan waktu sekarang
          </button>

          <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-surface-secondary px-3 py-2">
            <div>
              <p className="text-[10px] font-extrabold text-text-primary">Bayangan 3D</p>
              <p className="text-[8px] font-semibold text-text-muted">
                {enabled ? "Simulasi aktif" : "Simulasi nonaktif"}
              </p>
            </div>
            <Switch
              size="sm"
              tone="sky"
              checked={enabled}
              onCheckedChange={onEnabledChange}
              aria-label="Aktifkan analisis bayangan 3D"
            />
          </div>
        </div>
      </div>

      <p className="px-2 text-center text-[8px] leading-relaxed text-text-muted">
        Geser waktu atau ubah tanggal untuk melihat arah dan panjang bayangan model secara realtime.
      </p>
    </section>
  );
}

