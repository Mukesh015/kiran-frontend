import { useEffect, useMemo, useRef, useState } from "react";
import {
  Menu,
  Bell,
  RefreshCw,
  Moon,
  Sun,
  Search,
  AlertTriangle,
  CheckCircle2,
  WifiOff,
} from "lucide-react";
import waterlogo from "../assets/waterlogo.png";

// keep your existing imports if you already use logos
import sailLogo from "../assets/1.jpg";
import plumuleLogo from "../assets/2.jpg";

export type TankAlertRow = {
  tank_no: string;
  tank_name?: string;
  state: "OK" | "WARNING" | "INACTIVE";
  message: string;
  happened_at?: string;
};

interface Props {
  onMenuClick: () => void;
  dark: boolean;
  toggleDark: () => void;

  tankAlerts?: TankAlertRow[];
  bellCount?: number;

  onRefresh?: () => void;

  // ✅ Page heading (to be shown INSIDE the Topbar box)
  pageTitle?: string;
  pageSubtitle?: string;
}

function formatWhen(v?: string) {
  if (!v) return "--";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  let hh = d.getHours();
  const min = String(d.getMinutes()).padStart(2, "0");
  const ampm = hh >= 12 ? "pm" : "am";
  hh = hh % 12 || 12;

  return `${dd}/${mm}/${yyyy}, ${hh}:${min} ${ampm}`;
}

export default function Topbar({
  onMenuClick,
  dark,
  toggleDark,
  tankAlerts = [],
  bellCount = 0,
  onRefresh,
  pageTitle,
  pageSubtitle,
}: Props) {
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement | null>(null);

  const rows = useMemo(() => {
    const rank = (s: TankAlertRow["state"]) =>
      s === "INACTIVE" ? 0 : s === "WARNING" ? 1 : 2;

    return [...tankAlerts].sort((a, b) => {
      const ra = rank(a.state);
      const rb = rank(b.state);
      if (ra !== rb) return ra - rb;

      const ta = a.happened_at ? new Date(a.happened_at).getTime() : 0;
      const tb = b.happened_at ? new Date(b.happened_at).getTime() : 0;
      return tb - ta;
    });
  }, [tankAlerts]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!open) return;
      const target = e.target as Node;
      if (popRef.current && !popRef.current.contains(target)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const okCount = tankAlerts.filter((x) => x.state === "OK").length;
  const warningCount = tankAlerts.filter((x) => x.state === "WARNING").length;
  const inactiveCount = tankAlerts.filter((x) => x.state === "INACTIVE").length;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/70 dark:border-white/10 bg-[rgb(var(--bg))]/90 backdrop-blur">
      {/* ✅ ONE unified Topbar container (Row-1 + Page Title inside same box) */}
      <div className="mx-auto max-w-[1400px] px-3 lg:px-4 pt-2 lg:pt-3 pb-2">
        {/* Row-1: Topbar controls */}
        <div className="flex items-center gap-3">
          {/* LEFT */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              className="icon-btn lg:hidden"
              onClick={onMenuClick}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>

            <img
              src={waterlogo}
              alt="logo"
              className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl object-contain"
            />

            <div className="leading-tight hidden lg:block">
              <div className="font-semibold">Smart Aqua Sense System</div>
              <div className="text-xs text-gray-500">
                Real-Time Water Monitoring
              </div>
            </div>

            <div className="leading-tight lg:hidden truncate">
              <div className="font-semibold text-sm">Smart Aqua Sense</div>
              <div className="text-[10px] text-gray-500">Real-Time Monitoring</div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Search (desktop only) */}
            <div className="hidden lg:block relative mr-1">
              <input
                className="w-64 rounded-xl border border-gray-300/70 dark:border-white/10 bg-transparent pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                placeholder="Search…"
              />
              <Search size={16} className="absolute left-2 top-2.5 opacity-70" />
            </div>

            <button
              className="icon-btn"
              aria-label="Refresh"
              onClick={() => onRefresh?.()}
            >
              <RefreshCw size={18} />
            </button>

            <button
              className="icon-btn"
              onClick={toggleDark}
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* 🔔 Tank Tracker */}
            <div className="relative" ref={popRef}>
              <button
                className="icon-btn"
                aria-label="Notifications"
                onClick={() => setOpen((v) => !v)}
              >
                <Bell size={18} />
              </button>

              {bellCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] rounded-full px-1.5 py-0.5 bg-red-500 text-white">
                  {bellCount}
                </span>
              )}

              {open && (
                <div
                  className="absolute right-0 mt-2 w-[420px] max-w-[92vw]
                  rounded-2xl border border-gray-200/70 dark:border-white/10
                  bg-white/95 dark:bg-slate-900/95 backdrop-blur
                  shadow-xl z-[9999] overflow-hidden"
                >
                  <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200/60 dark:border-white/10">
                    <div className="font-semibold text-sm">Tank Tracker</div>
                    <div className="text-[11px] text-gray-500">
                      {bellCount > 0
                        ? `${bellCount} issue(s) • ${tankAlerts.length} tanks`
                        : `All OK • ${tankAlerts.length} tanks`}
                    </div>
                  </div>

                  <div className="max-h-[420px] overflow-auto">
                    {rows.length === 0 ? (
                      <div className="px-4 py-5 text-sm text-gray-600 dark:text-gray-300">
                        No tank data available.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-white/10">
                        {rows.map((it, idx) => {
                          const isOk = it.state === "OK";
                          const isInactive = it.state === "INACTIVE";

                          const pill =
                            isInactive
                              ? "bg-red-50 text-red-700 border-red-200"
                              : isOk
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200";

                          return (
                            <div
                              key={`${it.tank_no}-${idx}`}
                              className="px-4 py-3 hover:bg-gray-50/80 dark:hover:bg-white/5"
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                  {isInactive ? (
                                    <WifiOff className="h-4 w-4 text-red-600" />
                                  ) : isOk ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="font-semibold text-sm truncate">
                                      {it.tank_no}
                                      {it.tank_name ? (
                                        <span className="ml-2 text-[11px] font-medium text-gray-500">
                                          {it.tank_name}
                                        </span>
                                      ) : null}
                                    </div>

                                    <span
                                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${pill}`}
                                    >
                                      {it.state}
                                    </span>
                                  </div>

                                  <div className="mt-1 text-[12px] text-gray-700 dark:text-gray-200">
                                    {it.message}
                                  </div>

                                  <div className="mt-1 text-[11px] text-gray-500">
                                    Last Update: {formatWhen(it.happened_at)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-gray-200/60 dark:border-white/10 flex items-center justify-between">
                    <button
                      className="text-[12px] font-semibold text-gray-700 dark:text-gray-200 hover:underline"
                      onClick={() => setOpen(false)}
                    >
                      Close
                    </button>

                    <div className="text-[11px] text-gray-500">
                      OK: {okCount} • Warning: {warningCount} • Inactive:{" "}
                      {inactiveCount}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Logos */}
            <div className="hidden md:flex items-center gap-2">
              <img src={sailLogo} alt="SAIL" className="h-8 w-auto object-contain" />
              <img
                src={plumuleLogo}
                alt="Plumule Research"
                className="h-8 w-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* ✅ Page Title/SubTitle now INSIDE the same Topbar box (no extra strip) */}
        {(pageTitle || pageSubtitle) && (
          <div className="pt-3 lg:pt-4 pb-1">
            <div className="flex flex-col items-center text-center">
              {pageTitle && (
                <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {pageTitle}
                </h1>
              )}
              {pageSubtitle && (
                <p className="mt-0.5 text-xs lg:text-sm text-slate-600 dark:text-slate-400">
                  {pageSubtitle}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
