// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import MetricCard from "./MetricCard";
import TankDisplay from "./TankDisplay";
import { Droplet, Activity, AlertTriangle, Gauge, X } from "lucide-react";

import type { Tank } from "../types";
import { getTanks } from "./api/api";

function toNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

type MetricKey = "total" | "online" | "offline" | "issues";

type TankRowForModal = {
  id: string;
  label: string;
  location?: string;
  status: string; // ok/normal/offline etc (display status)
  flowStatus?: string;
  tankStatus?: string;
  currentLevel?: number | null;
  capacity?: number | null;
  fillPct?: number | null;
  lastUpdateText?: string;
  issueReason?: string; // shown in OFFLINE and ISSUES modals (depending on rules)
};

function safeText(v: any): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function pickTankId(t: any, idx: number): string {
  return (
    safeText(t.id) ||
    safeText(t.tank_id) ||
    safeText(t.tankId) ||
    safeText(t.tank_no) ||
    safeText(t.tankNo) ||
    `tank-${idx + 1}`
  );
}

function pickTankLabel(t: any): { label: string; location?: string } {
  const tankNo = safeText(t.tank_no || t.tankNo || t.tank_number || t.tank);
  const location = safeText(t.location || t.site || t.area || t.plant);
  const name = safeText(t.name || t.tank_name || t.tankName);

  const label =
    name ||
    (location && tankNo ? `${location} : ${tankNo}` : "") ||
    (tankNo ? `Tank ${tankNo}` : "") ||
    "Tank";

  return { label, location: location || undefined };
}

function normalizeStatus(t: any): {
  combinedStatus: string;
  flowStatus: string;
  tankStatus: string;
} {
  const flowStatus =
    (t.flow_status || t.flowStatus || t.flow)?.toString().toLowerCase() ||
    (t.stale ? "inactive" : "normal");

  const tankStatus =
    (t.tank_status || t.status)?.toString().toLowerCase() || "ok";

  const combinedStatus = (tankStatus || flowStatus).toLowerCase();

  return { combinedStatus, flowStatus, tankStatus };
}

function isIssueStatus(s: string): boolean {
  const v = (s || "").toLowerCase();
  return (
    v.includes("warning") ||
    v.includes("fault") ||
    v.includes("critical") ||
    v.includes("alarm")
  );
}

function isOfflineStatus(s: string): boolean {
  const v = (s || "").toLowerCase();
  return v === "inactive" || v.includes("inactive") || v.includes("offline");
}

/**
 * Missing volume/level => treat as OFFLINE (for online/offline KPI)
 * BUT must NOT affect Issues Detected KPI.
 */
function isMissingVolumeData(currentLevel: number | null): boolean {
  return currentLevel === null || !Number.isFinite(currentLevel);
}

export default function Dashboard() {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------- Modal State ----------------
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("total");

  function openMetricModal(key: MetricKey) {
    setSelectedMetric(key);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  // Escape to close
  useEffect(() => {
    if (!modalOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  // ------------------------------------------------------------
  // Fetch live tank list
  // ------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const rows = await getTanks();
        if (!cancelled) {
          setTanks((rows || []) as unknown as Tank[]);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load tank data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 600000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // ------------------------------------------------------------
  // Compute counts + modal drilldown rows
  // ------------------------------------------------------------
  const {
    activeCount,
    issuesCount,
    offlineCount,
    modalRowsTotal,
    modalRowsOnline,
    modalRowsOffline,
    modalRowsIssues,
  } = useMemo(() => {
    if (!tanks?.length) {
      return {
        activeCount: 0,
        issuesCount: 0,
        offlineCount: 0,
        modalRowsTotal: [] as TankRowForModal[],
        modalRowsOnline: [] as TankRowForModal[],
        modalRowsOffline: [] as TankRowForModal[],
        modalRowsIssues: [] as TankRowForModal[],
      };
    }

    let active = 0;
    let issues = 0;
    let offline = 0;

    const allRows: TankRowForModal[] = [];

    for (let i = 0; i < (tanks as any[]).length; i++) {
      const t: any = (tanks as any[])[i];

      // level / "volume showing" field
      const currentLevel =
        toNumber(t.currentLevel) ??
        toNumber(t.current_level) ??
        toNumber(t.current_level_l) ??
        toNumber(t.effective?.volume_l) ??
        toNumber(t.rawVolume) ??
        toNumber(t.volumeLitres) ??
        null;

      // capacity
      const capacity =
        toNumber(t.tank_volume) ??
        toNumber(t.capacity_litre) ??
        toNumber(t.capacityLitres) ??
        toNumber(t.capacity) ??
        toNumber(t.geometry?.capacity_l) ??
        null;

      // fill %
      const fillPctFromApi =
        toNumber(t.fillPercentage) ??
        toNumber(t.fill_percentage) ??
        toNumber(t.fillPct) ??
        toNumber(t.effective?.fill_percentage);

      const fillPctCalculated =
        capacity && currentLevel != null ? (currentLevel / capacity) * 100 : null;

      const fillPct =
        fillPctFromApi ?? (fillPctCalculated != null ? fillPctCalculated : null);

      const { combinedStatus, flowStatus, tankStatus } = normalizeStatus(t);

      // last update
      const lastUpdateText =
        safeText(t.last_update) ||
        safeText(t.lastUpdate) ||
        safeText(t.updated_at) ||
        safeText(t.timestamp) ||
        safeText(t.time) ||
        "";

      // base issue message from API (real issues)
      const apiIssueReason =
        safeText(t.alert_message) ||
        safeText(t.alertMessage) ||
        safeText(t.reason) ||
        safeText(t.issue) ||
        safeText(t.problem) ||
        "";

      // missing volume message (OFFLINE modal only; won't affect issues KPI)
      const missingVolume = isMissingVolumeData(currentLevel);
      const missingVolumeReason = missingVolume
        ? "No volume data (Level missing)"
        : "";

      // Row issueReason: we can store combined; later decide where to show it
      const rowIssueReason =
        [apiIssueReason, missingVolumeReason].filter(Boolean).join(" | ") || "";

      const { label, location } = pickTankLabel(t);
      const id = pickTankId(t, i);

      // KPI OFFLINE rule (UPDATED)
      const derivedOffline = isOfflineStatus(combinedStatus) || missingVolume;

      // KPI ISSUE rule (IMPORTANT): Missing volume does NOT count as issue.
      // Issues depend ONLY on real status keywords (or you can also add apiIssueReason if you want).
      const derivedIssue = isIssueStatus(combinedStatus); // <-- key change

      // Display status: if missing volume but status says normal, show "offline"
      const statusForDisplay = derivedOffline ? "offline" : combinedStatus;

      const row: TankRowForModal = {
        id,
        label,
        location,
        status: statusForDisplay,
        flowStatus,
        tankStatus,
        currentLevel,
        capacity,
        fillPct,
        lastUpdateText: lastUpdateText || undefined,
        issueReason: rowIssueReason || undefined,
      };

      allRows.push(row);

      // KPI counts
      if (derivedOffline) offline += 1;
      else active += 1;

      if (derivedIssue) issues += 1;
    }

    const onlineRows = allRows.filter((r) => !isOfflineStatus(r.status));
    const offlineRows = allRows.filter((r) => isOfflineStatus(r.status));

    // Issues modal should NOT include "missing volume" only.
    // It will include only rows that have true issue status keywords.
    const issueRows = allRows.filter((r) => isIssueStatus((r.status || "").toLowerCase()));

    return {
      activeCount: active,
      issuesCount: issues,
      offlineCount: offline,
      modalRowsTotal: allRows,
      modalRowsOnline: onlineRows,
      modalRowsOffline: offlineRows,
      modalRowsIssues: issueRows,
    };
  }, [tanks]);

  const modalTitle = useMemo(() => {
    switch (selectedMetric) {
      case "total":
        return `Total Tanks (${tanks.length})`;
      case "online":
        return `Online Tanks (${activeCount})`;
      case "offline":
        return `Offline Tanks (${offlineCount})`;
      case "issues":
        return `Issues Detected (${issuesCount})`;
      default:
        return "Details";
    }
  }, [selectedMetric, tanks.length, activeCount, offlineCount, issuesCount]);

  const modalRows = useMemo(() => {
    switch (selectedMetric) {
      case "total":
        return modalRowsTotal;
      case "online":
        return modalRowsOnline;
      case "offline":
        return modalRowsOffline;
      case "issues":
        return modalRowsIssues;
      default:
        return modalRowsTotal;
    }
  }, [
    selectedMetric,
    modalRowsTotal,
    modalRowsOnline,
    modalRowsOffline,
    modalRowsIssues,
  ]);

  // Show Issue column in OFFLINE and ISSUES modals (as you want issue visible there)
  const showIssueColumn = selectedMetric === "offline" || selectedMetric === "issues";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold">System Overview</h1>
        <p className="mt-1 text-base text-gray-600">
          Real-time monitoring of {tanks.length} water tanks
        </p>
      </div>

      {/* KPI Cards (clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 text-2xl gap-4 mt-6">
        <button
          type="button"
          onClick={() => openMetricModal("total")}
          className="text-left focus:outline-none"
          aria-label="Open Total Tanks details"
        >
          <MetricCard
            title="Total Tanks"
            value={`${tanks.length}`}
            icon={<Droplet size={24} />}
            variant="blue"
          />
        </button>

        <button
          type="button"
          onClick={() => openMetricModal("online")}
          className="text-left focus:outline-none"
          aria-label="Open Online Tanks details"
        >
          <MetricCard
            title="Online Tanks"
            value={`${activeCount}`}
            icon={<Activity size={24} />}
            variant="green"
          />
        </button>

        <button
          type="button"
          onClick={() => openMetricModal("offline")}
          className="text-left focus:outline-none"
          aria-label="Open Offline Tanks details"
        >
          <MetricCard
            title="Offline Tanks"
            value={`${offlineCount}`}
            icon={<Gauge size={24} />}
            variant="purple"
          />
        </button>

        <button
          type="button"
          onClick={() => openMetricModal("issues")}
          className="text-left focus:outline-none"
          aria-label="Open Issues Detected details"
        >
          <MetricCard
            title="Issues Detected"
            value={issuesCount}
            icon={<AlertTriangle size={24} />}
            variant="red"
          />
        </button>
      </div>

      {error && (
        <p className="text-center text-sm text-red-500 mt-2">❌ {error}</p>
      )}

      <TankDisplay tanks={tanks} loading={loading} />

      {/* ---------------- Modal Dialog ---------------- */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={modalTitle}
        >
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
            aria-label="Close dialog"
          />

          {/* Panel */}
          <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {modalTitle}
                </h2>
                <p className="text-sm text-slate-500">
                  Click outside or press <span className="font-semibold">Esc</span>{" "}
                  to close
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-slate-200 hover:bg-slate-50"
              >
                <X size={18} />
                <span className="text-sm font-medium">Close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              {modalRows.length === 0 ? (
                <div className="rounded-xl border border-slate-200 p-6 text-center text-slate-600">
                  No details to show.
                </div>
              ) : (
                <div className="overflow-auto rounded-xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left">
                        <th className="px-4 py-3 font-semibold text-slate-700">
                          Tank
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700">
                          Status
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700">
                          Level (L)
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700">
                          Capacity (L)
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700">
                          Fill %
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700">
                          Last Update
                        </th>
                        {showIssueColumn && (
                          <th className="px-4 py-3 font-semibold text-slate-700">
                            Issue
                          </th>
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {modalRows.map((r) => {
                        const status = (r.status || "").toLowerCase();
                        const isOff = isOfflineStatus(status);
                        const isIss = isIssueStatus(status);

                        const badgeTone = isIss
                          ? "bg-red-100 text-red-800 border-red-200"
                          : isOff
                          ? "bg-slate-200 text-slate-800 border-slate-300"
                          : "bg-green-100 text-green-800 border-green-200";

                        const fillText =
                          r.fillPct == null
                            ? "-"
                            : `${Math.max(0, Math.min(100, r.fillPct)).toFixed(1)}%`;

                        // IMPORTANT:
                        // - For OFFLINE modal: show issueReason including "No volume data..."
                        // - For ISSUES modal: show issueReason (real issue likely from API)
                        // - For other modals: no issue column anyway
                        const issueText = r.issueReason || "-";

                        return (
                          <tr
                            key={r.id}
                            className="border-t border-slate-100 hover:bg-slate-50/60"
                          >
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-900">
                                {r.label}
                              </div>
                              {r.location ? (
                                <div className="text-xs text-slate-500">
                                  {r.location}
                                </div>
                              ) : null}
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeTone}`}
                              >
                                {status || "unknown"}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              {r.currentLevel == null
                                ? "-"
                                : Math.round(r.currentLevel).toLocaleString()}
                            </td>

                            <td className="px-4 py-3">
                              {r.capacity == null
                                ? "-"
                                : Math.round(r.capacity).toLocaleString()}
                            </td>

                            <td className="px-4 py-3">{fillText}</td>

                            <td className="px-4 py-3">
                              {r.lastUpdateText ? r.lastUpdateText : "-"}
                            </td>

                            {showIssueColumn && (
                              <td className="px-4 py-3">{issueText}</td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 text-xs text-slate-500">
                Note: Missing Level/Volume affects only Online/Offline KPI. Issues KPI is based on warning/fault/critical/alarm only.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
