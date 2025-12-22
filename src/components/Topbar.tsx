import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Menu,
  Bell,
  RefreshCw,
  Search,
  X,
  AlertTriangle,
  Clock,
} from "lucide-react";

import sailLogo from "../assets/1.jpg";
import plumuleLogo from "../assets/2.jpg";

interface Props {
  onMenuClick: () => void;
}

type TankCurrentRow = Record<string, any>;

type IssueRow = {
  id: string;
  name: string;
  status: string;
  whenText: string;
  issueText: string;
  raw: TankCurrentRow;
};

// NOTE: You currently use IP API. Kept same as your file. :contentReference[oaicite:1]{index=1}
// Strongly recommended later: "/api/tank-current/all"
const API_URL = "https://api.plumuleresearch.co.in/api/tank-current/all";

/* ------------------------ safe JSON fetch ------------------------ */
async function fetchJsonSafe(url: string) {
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`API failed: ${res.status} ${res.statusText} — ${text.slice(0, 160)}`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Expected JSON but got "${contentType || "unknown"}". First chars: ${text.trim().slice(0, 80)}`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON. First chars: ${text.trim().slice(0, 80)}`);
  }
}

/* ------------------------ helpers ------------------------ */
function pickFirstString(obj: any, keys: string[]): string {
  if (!obj) return "";
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

function pickFirstValue(obj: any, keys: string[]): any {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj?.[k] !== undefined) return obj[k];
  }
  return undefined;
}

function toNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

function formatWhen(row: TankCurrentRow): string {
  const t = pickFirstString(row, [
    "time",
    "timestamp",
    "ts",
    "last_time",
    "lastTime",
    "updated_at",
    "updatedAt",
    "created_at",
    "createdAt",
    "server_time",
    "serverTime",
  ]);
  if (!t) return "Time: Not available";

  const dt = new Date(t);
  if (!Number.isNaN(dt.getTime())) return dt.toLocaleString();
  return t;
}

function deriveTankIdentity(row: TankCurrentRow): { id: string; name: string } {
  const id =
    pickFirstString(row, ["tank_id", "tankId", "id", "tank_no", "tankNo", "tank"]) ||
    pickFirstString(row, ["tank_name", "tankName", "name"]) ||
    "tank";
  const name =
    pickFirstString(row, ["tank_name", "tankName", "name"]) ||
    (id ? `Tank ${id}` : "Tank");
  return { id, name };
}

/**
 * IMPORTANT: "Issues Detected" logic
 * - ONLY based on status keywords: warning/fault/critical/alarm
 * - Missing volume must NOT affect issues (your instruction)
 */
function isIssueStatusText(s: string): boolean {
  const v = (s || "").toLowerCase();
  return (
    v.includes("warning") ||
    v.includes("fault") ||
    v.includes("critical") ||
    v.includes("alarm")
  );
}

/**
 * Pull a status-like string from row
 * (so your KPI and bell agree with Issue Detected KPI)
 */
function extractStatus(row: TankCurrentRow): string {
  return pickFirstString(row, [
    "tank_status",
    "status",
    "alert_status",
    "state",
    "remark",
    "message",
  ]);
}

/**
 * If you want an "issue text" column (what problem), this tries common fields.
 * If nothing found, it falls back to status.
 */
function extractIssueText(row: TankCurrentRow): string {
  const msg =
    pickFirstString(row, ["alert_message", "alertMessage", "reason", "issue", "problem", "message", "remark"]) ||
    "";
  const status = extractStatus(row);
  return msg || status || "Issue detected";
}

/* ---------------------- component ---------------------- */
export default function Topbar({ onMenuClick }: Props) {
  const [rows, setRows] = useState<TankCurrentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  // ✅ NEW: Bell opens "Issues Detected" modal (not dropdown)
  const [openIssuesModal, setOpenIssuesModal] = useState(false);

  const bellWrapRef = useRef<HTMLDivElement | null>(null);

  // Build issue list exactly like "Issues Detected"
  const issueRows: IssueRow[] = useMemo(() => {
    const out: IssueRow[] = [];

    for (const r of rows) {
      const status = extractStatus(r);

      // Only true issue statuses
      if (!isIssueStatusText(status)) continue;

      const { id, name } = deriveTankIdentity(r);

      out.push({
        id,
        name,
        status: status || "unknown",
        whenText: formatWhen(r),
        issueText: extractIssueText(r),
        raw: r,
      });
    }

    // sort: critical first if status contains critical/alarm
    const rank = (s: string) => {
      const v = (s || "").toLowerCase();
      if (v.includes("critical") || v.includes("alarm")) return 0;
      if (v.includes("fault")) return 1;
      if (v.includes("warning")) return 2;
      return 3;
    };

    out.sort((a, b) => {
      const ra = rank(a.status);
      const rb = rank(b.status);
      if (ra !== rb) return ra - rb;

      const ta = new Date(a.whenText).getTime();
      const tb = new Date(b.whenText).getTime();
      const aOk = Number.isFinite(ta);
      const bOk = Number.isFinite(tb);
      if (aOk && bOk) return tb - ta;

      return a.name.localeCompare(b.name);
    });

    return out;
  }, [rows]);

  const issuesCount = issueRows.length;

  async function fetchAlerts() {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchJsonSafe(API_URL);

      const arr: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.rows)
        ? data.rows
        : [];

      setRows(arr);
    } catch (e: any) {
      setErr(e?.message || "Failed to load issues");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // Auto refresh
  useEffect(() => {
    fetchAlerts();
    const t = window.setInterval(fetchAlerts, 15000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ESC to close modal
  useEffect(() => {
    if (!openIssuesModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIssuesModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openIssuesModal]);

  // If someone clicks outside bell area, do nothing now (modal is separate)
  useEffect(() => {
    function onDocClick(ev: MouseEvent) {
      const target = ev.target as Node;
      if (bellWrapRef.current && bellWrapRef.current.contains(target)) return;
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <>
      <header className="sticky top-3 z-40 lg:z-50">
        <div className="mx-auto max-w-[1400px] px-3">
          <div className="bg-white rounded-2xl shadow-md border border-gray-200/60">
            <div className="px-4 lg:px-6 py-3 flex items-center gap-3">
              {/* LEFT */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button className="icon-btn lg:hidden" onClick={onMenuClick} aria-label="Open menu">
                  <Menu size={18} />
                </button>
              </div>

              {/* RIGHT */}
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="hidden lg:block relative mr-1">
                  <input
                    className="w-64 rounded-xl border border-gray-300/70 bg-transparent pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                    placeholder="Search…"
                  />
                  <Search size={16} className="absolute left-2 top-2.5 opacity-70" />
                </div>

                <button className="icon-btn" aria-label="Refresh" onClick={fetchAlerts} title="Refresh issues">
                  <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </button>

                {/* ✅ Bell -> opens Issues Detected modal */}
                <div className="relative" ref={bellWrapRef}>
                  <button
                    className="icon-btn"
                    aria-label="Issues Detected"
                    onClick={() => setOpenIssuesModal(true)}
                    title="Issues Detected"
                  >
                    <Bell size={18} />
                  </button>

                  {issuesCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] rounded-full px-1.5 py-0.5 bg-red-500 text-white">
                      {issuesCount}
                    </span>
                  )}
                </div>

                <div className="hidden md:flex items-center gap-2">
                  <img src={sailLogo} alt="SAIL" className="h-8 w-auto object-contain" />
                  <img src={plumuleLogo} alt="Plumule Research" className="h-8 w-auto object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ✅ Issues Detected Modal (same concept as KPI popup) */}
      {openIssuesModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpenIssuesModal(false)}
            aria-label="Close dialog"
          />

          {/* Panel */}
          <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Issues Detected ({issuesCount})
                </h2>
                <p className="text-sm text-slate-500">
                  Press <span className="font-semibold">Esc</span> or click outside to close
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpenIssuesModal(false)}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-slate-200 hover:bg-slate-50"
              >
                <X size={18} />
                <span className="text-sm font-medium">Close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              {err ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {err}
                  <div className="text-[11px] mt-1 text-red-600">
                    Tip: Your issues API must return JSON (not HTML).
                  </div>
                </div>
              ) : issueRows.length === 0 ? (
                <div className="rounded-xl border border-slate-200 p-6 text-center text-slate-600">
                  ✅ No issues detected.
                </div>
              ) : (
                <div className="overflow-auto rounded-xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left">
                        <th className="px-4 py-3 font-semibold text-slate-700">Tank</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Issue</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Last Update</th>
                      </tr>
                    </thead>

                    <tbody>
                      {issueRows.map((r) => {
                        const s = (r.status || "").toLowerCase();
                        const tone =
                          s.includes("critical") || s.includes("alarm")
                            ? "bg-red-100 text-red-800 border-red-200"
                            : s.includes("fault")
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : "bg-amber-100 text-amber-800 border-amber-200";

                        return (
                          <tr key={`${r.id}-${r.whenText}`} className="border-t border-slate-100 hover:bg-slate-50/60">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-900">{r.name}</div>
                            </td>

                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>
                                {r.status}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex items-start gap-2">
                                <AlertTriangle size={16} className="text-red-600 mt-[2px]" />
                                <span>{r.issueText}</span>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 text-slate-600">
                                <Clock size={14} />
                                <span>{r.whenText}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 flex items-center justify-end">
                <button
                  className="text-[12px] font-semibold px-3 py-2 rounded-xl border border-gray-300/70 hover:bg-gray-50"
                  onClick={fetchAlerts}
                >
                  Refresh now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
