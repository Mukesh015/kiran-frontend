// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import MetricCard from "./MetricCard";
import TankDisplay from "./TankDisplay";
import { Droplet, Activity, AlertTriangle, Gauge } from "lucide-react";

import type { Tank } from "../types";
import { getTanks } from "./api/api";

import Topbar, { type TankAlertRow } from "../components/Topbar";

export default function Dashboard() {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [dark, setDark] = useState(false);
  const toggleDark = () => setDark((v) => !v);

  const onMenuClick = () => {
    // Hook your sidebar open/close here
  };

  async function load() {
    try {
      setLoading(true);
      const rows = await getTanks();
      setTanks((rows || []) as unknown as Tank[]);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load tank data");
      setTanks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (cancelled) return;
      await load();
    }

    boot();
    const id = setInterval(() => {
      if (!cancelled) load();
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Tank Tracker list
  const tankAlerts: TankAlertRow[] = useMemo(() => {
    return (tanks as any[]).map((t: any) => {
      const tank_no = (t.tank_no || t.tankNo || t.tank || "UNKNOWN").toString();
      const tank_name = (t.location || t.place || "").toString();

      const flowStatus =
        (t.flow_status || t.flowStatus || t.flow)?.toString().toLowerCase() ||
        (t.stale ? "inactive" : "normal");

      const tankStatusRaw = (t.tank_status || t.status || "OK").toString();
      const tankStatus = tankStatusRaw.toLowerCase();

      const updatedAt =
        t.current_time || t.last_updated || t.timestamp || t.date_time || "";

      let state: "OK" | "WARNING" | "INACTIVE" = "OK";

      const isInactive = flowStatus === "inactive" || t.stale === true || !updatedAt;

      const isWarning =
        tankStatus.includes("warning") ||
        tankStatus.includes("high") ||
        tankStatus.includes("low") ||
        tankStatus.includes("critical") ||
        tankStatus.includes("fault") ||
        tankStatus.includes("alarm");

      if (isInactive) state = "INACTIVE";
      else if (isWarning) state = "WARNING";
      else state = "OK";

      const message =
        state === "OK"
          ? "OK"
          : state === "INACTIVE"
          ? "No data / Inactive"
          : tankStatusRaw;

      return {
        tank_no,
        tank_name,
        state,
        message,
        happened_at: updatedAt,
      };
    });
  }, [tanks]);

  const bellCount = useMemo(() => {
    return tankAlerts.filter((x) => x.state !== "OK").length;
  }, [tankAlerts]);

  // KPI counts
  const { activeCount, issuesCount } = useMemo(() => {
    if (!tanks?.length) return { activeCount: 0, issuesCount: 0 };

    let active = 0;
    let issues = 0;

    for (const t of tanks as any[]) {
      const flowStatus =
        (t.flow_status || t.flowStatus || t.flow)?.toString().toLowerCase() ||
        (t.stale ? "inactive" : "normal");

      const tankStatus =
        (t.tank_status || t.status)?.toString().toLowerCase() || "ok";

      const updatedAt =
        t.current_time || t.last_updated || t.timestamp || t.date_time || "";

      const isInactive = flowStatus === "inactive" || t.stale === true || !updatedAt;
      if (!isInactive) active += 1;

      const isWarning =
        tankStatus.includes("warning") ||
        tankStatus.includes("fault") ||
        tankStatus.includes("critical") ||
        tankStatus.includes("alarm") ||
        tankStatus.includes("high") ||
        tankStatus.includes("low");

      if (isInactive || isWarning) issues += 1;
    }

    return { activeCount: active, issuesCount: issues };
  }, [tanks]);

  return (
    <div className={dark ? "dark" : ""}>
      {/* ✅ Title/subtitle moved into Topbar */}
      <Topbar
        onMenuClick={onMenuClick}
        dark={dark}
        toggleDark={toggleDark}
        tankAlerts={tankAlerts}
        bellCount={bellCount}
        onRefresh={load}
        pageTitle="System Overview"
        pageSubtitle={`Real-time monitoring of ${tanks.length} water tanks`}
      />

      <div className="space-y-6 p-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
          <MetricCard
            title="Total Tanks"
            value={`${tanks.length}`}
            icon={<Droplet size={18} />}
            variant="blue"
          />
          <MetricCard
            title="Active Tanks"
            value={`${activeCount}`}
            icon={<Activity size={18} />}
            variant="green"
          />
          <MetricCard
            title="Free Tanks"
            value={`${tanks.length - activeCount}`}
            icon={<Gauge size={18} />}
            variant="purple"
          />
          <MetricCard
            title="Issues Detected"
            value={issuesCount}
            icon={<AlertTriangle size={18} />}
            variant="red"
          />
        </div>

        {error && (
          <p className="text-center text-sm text-red-500 mt-2">❌ {error}</p>
        )}

        <TankDisplay tanks={tanks} loading={loading} />
      </div>
    </div>
  );
}
