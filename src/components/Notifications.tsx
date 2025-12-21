// src/pages/Notifications.tsx
import { useEffect, useMemo, useState } from "react";
import { Bell, AlertTriangle } from "lucide-react";
import { getNotifications, type NotificationRecord } from "./api/api";

// ✅ Same +5:30 date-time formatter
function formatDateTime(raw: string | null | undefined): string {
  if (!raw) return "--";

  const value = String(raw).trim();
  if (!value) return "--";

  try {
    let d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      // Add 5 hours 30 minutes manually
      d = new Date(d.getTime() + (5 * 60 + 30) * 60 * 1000);

      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    }
  } catch {
    // ignore and fall through
  }

  // Fallback: show raw value if parsing fails
  return value;
}

function norm(s: any): string {
  return String(s ?? "").trim();
}

function isNormalText(s: string): boolean {
  const v = norm(s).toLowerCase();
  return v === "ok" || v === "normal" || v === "running" || v === "healthy";
}

function isWarningText(s: string): boolean {
  const v = norm(s).toLowerCase();
  return v === "warning" || v.includes("warning");
}

function isCriticalText(s: string): boolean {
  const v = norm(s).toLowerCase();
  return v === "critical" || v.includes("critical") || v.includes("alarm") || v.includes("fault");
}

function displayTankStatus(raw: string): string {
  // show OK as "Normal"
  if (isNormalText(raw)) return "Normal";
  return raw || "--";
}

function displayAlertType(rawAlertMessage: string, tankStatusRaw: string): string {
  // If tank is OK/Normal, alert type should be "Normal"
  if (isNormalText(tankStatusRaw)) return "Normal";

  // Otherwise show the message (or fallback)
  const msg = norm(rawAlertMessage);
  return msg || "Warning";
}

export default function Notifications() {
  const [records, setRecords] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getNotifications();

        // 🔥 Remove duplicates based on timestamp + tankNo
        const unique = new Map<string, NotificationRecord>();
        data.forEach((item) => {
          const key = `${item.tankNo}_${item.timestamp}`;
          if (!unique.has(key)) unique.set(key, item);
        });

        setRecords([...unique.values()]);
        setError(null);
      } catch (e: any) {
        console.error("Error loading notifications:", e);
        setError(e?.message || "Failed to load notifications.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /**
   * ✅ APPLY YOUR RULE:
   * Do NOT show normal rows.
   * That means: filter out where Tank Status is OK/Normal OR Alert Type becomes "Normal".
   *
   * We treat:
   * - tankStatus OK -> Normal (not shown)
   * - Warning/Critical -> shown
   */
  const filteredRecords = useMemo(() => {
    const list = [...records];

    return list.filter((rec) => {
      const tankStatusRaw = norm((rec as any).tankStatus);
      const alertType = displayAlertType(norm((rec as any).alertMessage), tankStatusRaw);

      // hide Normal rows
      if (isNormalText(tankStatusRaw)) return false;
      if (isNormalText(alertType)) return false;

      // show warning/critical/etc.
      return true;
    });
  }, [records]);

  const totalShown = filteredRecords.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Bell className="h-6 w-6 text-sky-500" />
            Notifications & Alerts
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Only Warning/Critical alerts are shown (Normal/OK is hidden).
          </p>
        </div>

        <div className="flex flex-col items-end text-xs text-slate-500">
          <span>Total Alerts Shown: {totalShown}</span>
          <span className="opacity-70">Raw Records: {records.length}</span>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Loading notifications…
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">SL No.</th>
                  <th className="px-4 py-3">Tank No</th>
                  
                  <th className="px-4 py-3">Alert Type</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-[11px]">
                {filteredRecords.map((rec, index) => {
                  const tankStatusRaw = norm((rec as any).tankStatus);
                  const tankStatus = displayTankStatus(tankStatusRaw);
                  const alertType = displayAlertType(norm((rec as any).alertMessage), tankStatusRaw);

                  const statusLower = tankStatus.toLowerCase();

                  const statusColor =
                    statusLower.includes("critical") || statusLower.includes("alarm") || statusLower.includes("fault")
                      ? "bg-red-100 text-red-700 border-red-200"
                      : statusLower.includes("warning")
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : "bg-emerald-100 text-emerald-700 border-emerald-200";

                  return (
                    <tr key={(rec as any).id ?? `${rec.tankNo}_${rec.timestamp}_${index}`}>
                      {/* SL No */}
                      <td className="px-4 py-2 text-slate-600">{index + 1}</td>

                      {/* Tank No */}
                      <td className="px-4 py-2 text-slate-600">{(rec as any).tankNo}</td>

                      

                      {/* Alert Type */}
                      <td className="px-4 py-2 text-slate-600">{alertType}</td>

                      {/* Timestamp */}
                      <td className="px-4 py-2 text-slate-600">{formatDateTime((rec as any).timestamp)}</td>
                    </tr>
                  );
                })}

                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-400">
                      ✅ No Warning/Critical notifications available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
