import {
  Droplet,
  Activity,
  AlertTriangle,
  Gauge,
  CheckCircle,
} from "lucide-react";
import type { Tank } from "../types";

interface TankCardProps {
  tank: Tank | any;
}

function toNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const EMPTY_LEVEL = 15;
const SPIKE_LEVEL = 40;
const MAX_JUMP = 30;

function sanitizeLevel(current: number, last: number | null) {
  if (last === null) return current;
  if (last < EMPTY_LEVEL && current > SPIKE_LEVEL) return last;
  if (Math.abs(current - last) > MAX_JUMP) return last;
  const ALPHA = 0.3;
  return last + ALPHA * (current - last);
}


/* Show same digits as raw UTC string (Option B) */
function formatDateTime(v: string | null): string {
  if (!v) return "--";

  const d = new Date(v);

  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();

  let hours = d.getUTCHours();
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");

  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;

  return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
}

function formatLitresFixed(val: number | null, digits = 0) {
  if (val == null) return "--";
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatPct(val: number | null, digits = 1) {
  if (val == null) return "--";
  return `${val.toFixed(digits)}%`;
}

function formatNow(): string {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");

  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;

  return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
}

type TooltipProps = {
  title: string;
  lines: string[];
  tone?: "green" | "red" | "slate";
  align?: "left" | "right";
};

/**
 * Hover tooltip tag
 * - Always stays on top (z-[9999])
 * - align="left" places tooltip to LEFT of indicator
 */
function HoverTag({
  title,
  lines,
  tone = "slate",
  align = "left",
}: TooltipProps) {
  const toneClasses =
    tone === "green"
      ? "border-emerald-300 bg-emerald-50 text-base text-emerald-900"
      : tone === "red"
        ? "border-red-300 bg-red-50 text-red-900 text-base"
        : "border-slate-300 bg-white text-slate-900 text-base";

  // ✅ LEFT = show tooltip to the LEFT side of the indicator line
  const alignClasses = align === "left" ? "right-[60px]" : "left-[60px]";

  return (
    <div
      className={[
        "pointer-events-none absolute z-[9999]",
        "top-1/2 -translate-y-1/2",
        alignClasses,
        "opacity-0 scale-95",
        "group-hover:opacity-100 group-hover:scale-100",
        "transition-all duration-150 ease-out",
      ].join(" ")}
    >
      <div
        className={[
          "min-w-[190px] max-w-[240px] rounded-lg border px-2 py-2 shadow-md",
          toneClasses,
        ].join(" ")}
      >

        <div className="space-y-[2px] text-[17px] leading-snug opacity-90">
          {lines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TankCard({ tank }: TankCardProps) {
  
  const t: any = tank || {};

  // ---- Data mapping ----
  const tankNo: string = t.tankNo || t.tank_no || t.tank || "Unknown Tank";
  const location: string = t.location || t.place || "Unknown Location";
  const deviceId: string = t.device_id || t.deviceId || t.id || "";

  const currentLevelRaw =
    toNumber(t.currentLevel) ??
    toNumber(t.current_level) ??
    toNumber(t.current_level_l) ??
    toNumber(t.effective?.volume_l) ??
    toNumber(t.rawVolume) ??
    toNumber(t.volumeLitres);

  const tankVolumeRaw =
    toNumber(t.tank_volume) ??
    toNumber(t.capacity_litre) ??
    toNumber(t.capacityLitres) ??
    toNumber(t.capacity) ??
    toNumber(t.geometry?.capacity_l);

  const fillPctFromApi =
    toNumber(t.fillPercentage) ??
    toNumber(t.fill_percentage) ??
    toNumber(t.fillPct) ??
    toNumber(t.effective?.fill_percentage);

  const fillPctCalculated =
    tankVolumeRaw && currentLevelRaw != null
      ? (currentLevelRaw / tankVolumeRaw) * 100
      : null;

  const fillPercentage = Math.max(
    0,
    Math.min(100, fillPctFromApi ?? fillPctCalculated ?? 0)
  );

  const flowStatusRaw: string =
    t.flow_status || t.flowStatus || t.flow || (t.stale ? "Inactive" : "Normal");
  const flowStatus = flowStatusRaw.toString();

  const tankStatusRaw: string = t.tank_status || t.status || "OK";
  const tankStatus = tankStatusRaw.toString();

  const updatedAt: string =
    t.current_time || t.last_updated || t.timestamp || t.date_time || "";

  const underMaintenance: boolean = !!(
    t.under_maintenance || t.underMaintenance
  );
  const alertEnabled: boolean =
    t.disable_alert != null ? !t.disable_alert : t.alert_enabled ?? true;
  const isStale: boolean = !!t.stale;

  const freeVolume =
    tankVolumeRaw != null && currentLevelRaw != null
      ? tankVolumeRaw - currentLevelRaw
      : null;

  // --- Safe high & low from backend (in litres) ---
  const safeMaxLitres =
    toNumber(t.upper_safe_limit_pct) ?? toNumber(t.limits_l?.max_l);
  const safeMinLitres =
    toNumber(t.lower_safe_limit_pct) ?? toNumber(t.limits_l?.min_l);

  const hasSafeLimits =
    safeMinLitres != null &&
    safeMaxLitres != null &&
    safeMaxLitres > safeMinLitres;

  // ---------------- HIGH / LOW / NORMAL STATUS ----------------
  let highLowStatus: "High level" | "Low level" | "Normal" = "Normal";

  if (
    safeMaxLitres != null &&
    currentLevelRaw != null &&
    currentLevelRaw >= safeMaxLitres
  ) {
    highLowStatus = "High level";
  } else if (
    safeMinLitres != null &&
    currentLevelRaw != null &&
    currentLevelRaw <= safeMinLitres
  ) {
    highLowStatus = "Low level";
  }

  // ---- Flow pill styles ----
  let flowPillClass = "bg-emerald-50 text-emerald-700 border-emerald-200";

  if (flowStatus.toLowerCase() === "inactive")
    flowPillClass = "bg-slate-100 text-slate-600 border-slate-200";
  else if (flowStatus.toLowerCase() === "warning")
    flowPillClass = "bg-amber-50 text-amber-700 border-amber-200";
  else if (flowStatus.toLowerCase() === "fault")
    flowPillClass = "bg-rose-50 text-rose-700 border-rose-200";

  const fillHeight = `${Math.max(0, Math.min(100, fillPercentage))}%`;

  // ---------------- SAFE RANGE (used for logic + scale display) ----------------
  let safeMinPct: number | null = null;
  let safeMaxPct: number | null = null;

  if (tankVolumeRaw && hasSafeLimits) {
    safeMinPct = (safeMinLitres! / tankVolumeRaw) * 100;
    safeMaxPct = (safeMaxLitres! / tankVolumeRaw) * 100;
  }

  const inSafeBand =
    hasSafeLimits &&
    safeMinPct != null &&
    safeMaxPct != null &&
    fillPercentage >= safeMinPct &&
    fillPercentage <= safeMaxPct;

  const isBelowRange =
    hasSafeLimits && currentLevelRaw != null && currentLevelRaw < safeMinLitres!;
  const isAboveRange =
    hasSafeLimits && currentLevelRaw != null && currentLevelRaw > safeMaxLitres!;
  const isOutOfRange = hasSafeLimits ? isBelowRange || isAboveRange : false;

  const indicatorColorClass = hasSafeLimits
    ? inSafeBand
      ? "bg-emerald-500"
      : "bg-red-500"
    : "bg-slate-400";

  const valueColorClass = hasSafeLimits
    ? inSafeBand
      ? "text-emerald-600"
      : "text-red-600"
    : "text-slate-900";

  // ---------------- SCALE TICKS ----------------
  const maxCapacity = tankVolumeRaw && tankVolumeRaw > 0 ? tankVolumeRaw : 1;
  const tickValues =
    tankVolumeRaw != null
      ? [
        0,
        tankVolumeRaw * 0.25,
        tankVolumeRaw * 0.5,
        tankVolumeRaw * 0.75,
        tankVolumeRaw,
      ]
      : [];

  const formatLitres = (val: number | null) =>
    val != null
      ? val.toLocaleString("en-IN", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
      : "--";

  // ---------------- Time difference calculation ----------------
  let timeDiffMinutes: string | null = null;

  if (updatedAt) {
    const last = new Date(updatedAt);
    const now = new Date();

    const diffMs = now.getTime() - last.getTime();

    if (!isNaN(diffMs)) {
      const minutes = diffMs / 60000;
      timeDiffMinutes = minutes.toFixed(1);
    }
  }

  // ---------------- BORDER RULES (UPDATED) ----------------
  // RED border when:
  // 1) No volume data
  // 2) No timestamp
  // 3) No update for >= 60 minutes (1 hour)
  // 4) backend stale
  // 5) flow_status inactive
  const STALE_THRESHOLD_MIN = 60;

  const isNoVolumeData = currentLevelRaw == null;

  const isTimeStale =
    timeDiffMinutes != null && Number(timeDiffMinutes) >= STALE_THRESHOLD_MIN;

  const isInactiveTank =
    isStale ||
    !updatedAt ||
    isTimeStale ||
    isNoVolumeData ||
    flowStatus.toLowerCase() === "inactive";

  const cardBorderClass = isInactiveTank
    ? "border-[3px] border-red-500"
    : "border-[3px] border-emerald-500";

  // ---------- Tooltip lines ----------
  const currentPct =
    tankVolumeRaw && currentLevelRaw != null
      ? (currentLevelRaw / tankVolumeRaw) * 100
      : null;

  const safeMinLines =
    hasSafeLimits && tankVolumeRaw
      ? [`Lower Limit: ${formatLitresFixed(safeMinLitres, 0)} L`]
      : [`Tank: ${tankNo}`, `Lower Limit not configured`];

  const safeMaxLines =
    hasSafeLimits && tankVolumeRaw
      ? [`Upper Limit: ${formatLitresFixed(safeMaxLitres, 0)} L`]
      : [`Tank: ${tankNo}`, `Upper Limit not configured`];

  const currentLines =
    tankVolumeRaw && currentLevelRaw != null
      ? [
        `Tank: ${tankNo}${deviceId ? ` (${deviceId})` : ""}`,
        `Current: ${formatLitresFixed(currentLevelRaw, 0)} L`,
        `Fill %: ${formatPct(currentPct, 1)}`,
        hasSafeLimits
          ? `Safe Band: ${formatLitresFixed(safeMinLitres, 0)}–${formatLitresFixed(
            safeMaxLitres,
            0
          )} L`
          : `Safe Band: not configured`,
      ]
      : [`Tank: ${tankNo}`, `Current reading not available`];

  return (
    <div
      className={`relative z-0 flex flex-col rounded-2xl ${cardBorderClass} bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-900/70`}
    >
      {/* ====================== HEADER ====================== */}
      <div className="mb-3 flex justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-base text-xl font-semibold text-slate-900 dark:text-slate-50">
              {location} : {tankNo}
            </h3>
          </div>
        </div>
      </div>

      {/* ============= 3D CYLINDER + SCALE ============= */}
      <div className="mt-1 flex justify-center">
        <div className="flex items-end gap-6">
          {/* LEFT: 3D CYLINDRICAL TANK */}
          <div className="flex flex-col items-center relative left-23 gap-2">
            <div className="relative h-[240px] w-[160px]">
              <div
                className="absolute inset-0"
                style={{
                  borderRadius: "120px / 38px",
                  background:
                    "linear-gradient(to right, rgba(255,255,255,0.20), rgba(220,220,220,0.65), rgba(255,255,255,0.20))",
                  borderLeft: "3px solid rgba(0,0,0,0.75)",
                  borderRight: "3px solid rgba(0,0,0,0.75)",
                  boxShadow:
                    "inset 0 0 14px rgba(0,0,0,0.25), 0 0 10px rgba(0,0,0,0.15)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 28,
                    top: 28,
                    bottom: 38,
                    width: 60,
                    borderRadius: 26,
                    background:
                      "linear-gradient(to right, rgba(255,255,255,0.9), rgba(255,255,255,0))",
                    opacity: 0.75,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: 6,
                    top: 24,
                    bottom: 35,
                    width: 22,
                    borderRadius: 28,
                    background:
                      "linear-gradient(to right, rgba(0,0,0,0.06), rgba(0,0,0,0.35))",
                    opacity: 0.9,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: "20px 8px 15px 8px",
                    borderRadius: "95px / 28px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    className="absolute left-0 right-0 bottom-0 transition-[height] duration-700 ease-out"
                    style={{
                      height: fillHeight,
                      background: "linear-gradient(to right, #5fb8cf, #7ecfe3, #6bc3da)",
                      boxShadow: "inset 0 0 16px rgba(0,0,0,0.25)",
                      opacity: 0.95,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: -10,
                        right: -10,
                        top: -20,
                        height: 36,
                        borderRadius: "50%",
                        background:
                          "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.9), rgba(200,240,250,0.9) 35%, rgba(126,207,227,0.85) 65%, rgba(126,207,227,0) 100%)",
                        borderTop: "1px solid rgba(255,255,255,0.95)",
                        borderBottom: "1px solid rgba(0,0,40,0.4)",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: 20,
                    right: 20,
                    top: 3,
                    height: 40,
                    borderRadius: "50%",
                    border: "3px solid rgba(0,0,0,0.75)",
                    background:
                      "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.7), rgba(230,230,230,0.4))",
                    zIndex: 4,
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    left: 24,
                    right: 24,
                    bottom: 5,
                    height: 22,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle at 50% 60%, rgba(0,0,0,0.32), transparent 70%)",
                    opacity: 0.32,
                  }}
                />
              </div>

              <div
                className="mx-auto mt-2"
                style={{
                  width: 150,
                  height: 12,
                  background:
                    "radial-gradient(ellipse at center, rgba(0,0,0,0.22), transparent 70%)",
                  borderRadius: "50%",
                  opacity: 0.32,
                  filter: "blur(1px)",
                }}
              />
            </div>

            <div
              className={`text-center text-[24px] font-bold ${valueColorClass}`}
            >
              {currentLevelRaw != null
                ? `${formatLitres(currentLevelRaw)} ltrs`
                : "--"}
            </div>
          </div>

          {/* RIGHT: SCALE / RULER */}
          <div className="relative z-20 top-[-50px] left-22 h-[200px] w-[150px] text-[11px]">
            <div className="absolute left-[-14px] top-5 bottom-4 border-l-2 border-dotted border-slate-700" />

            {tickValues.map((val, idx) => {
              const pct = val / maxCapacity;
              const bottom = `${pct * 100}%`;

              const isCritical =
                (!!safeMaxLitres && val >= safeMaxLitres * 0.99) ||
                idx === tickValues.length - 1;

              return (
                <div
                  key={idx}
                  className={`absolute left-[-14px] flex translate-y-1/3 items-center gap-3 ${isCritical ? "font-semibold text-red-700" : ""
                    }`}
                  style={{ bottom }}
                >
                  <div className="h-[2px] w-[9px] bg-slate-900" />
                  <span className="whitespace-nowrap">
                    {val.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}{" "}
                    ltrs
                  </span>
                </div>
              );
            })}

            {/* LOWER LIMIT marker + HOVER TAG (LEFT) */}
            {safeMinPct != null && safeMinLitres != null && (
              <div
                className="group absolute left-[-20px]"
                style={{ bottom: `${safeMinPct}%` }}
              >
                <div className="flex items-center">
                  <div className="h-[4px] w-[14px] bg-red-500" />
                </div>

                <div className="absolute left-[-12px] top-1/2 h-7 w-[90px] -translate-y-1/2 bg-transparent" />

                <HoverTag
                  title="Lower Limit"
                  lines={safeMinLines}
                  tone="green"
                  align="left"
                />
              </div>
            )}

            {/* UPPER LIMIT marker + HOVER TAG (LEFT) */}
            {safeMaxPct != null && safeMaxLitres != null && (
              <div
                className="group absolute left-[-20px]"
                style={{ bottom: `${safeMaxPct}%` }}
              >
                <div className="flex items-center">
                  <div className="h-[5px] w-[14px] bg-red-500" />
                </div>

                <div className="absolute left-[-12px] top-1/2 h-7 w-[90px] -translate-y-1/2 bg-transparent" />

                <HoverTag
                  title="Upper Limit"
                  lines={safeMaxLines}
                  tone="green"
                  align="left"
                />
              </div>
            )}

            {/* CURRENT INDICATOR line + HOVER TAG (LEFT) */}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between text-lg">
        <div className="flex-1">
          {highLowStatus === "High level" && (
            <p className="flex items-center gap-1 text-[15px] font-bold text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-lg">High Level</span>
            </p>
          )}

          {highLowStatus === "Low level" && (
            <p className="flex items-center gap-1 text-[15px] font-bold text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-lg">Low Level</span>
            </p>
          )}

          {highLowStatus === "Normal" && (
            <p className="flex items-center gap-1 text-[15px] font-bold text-emerald-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-lg">Normal</span>
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-700">
        <span>
          <span className="text-lg">Flow - <span className="text-emerald-600 font-bold"> No Leakage </span></span>
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-700">
        <span className="text-lg">Last Update: {formatNow()}</span>
        <Droplet className="h-3 w-3 text-slate-300" />
      </div>
    </div>
  );
}
