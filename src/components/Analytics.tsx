// src/components/Analytics.tsx
import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import Chart from "react-apexcharts";

import { getTankHistory, type HistoryRow } from "./api/api";

// =====================
// 🔧 WATER LEVEL CLEANING LOGIC
// (NO API / BACKEND / UI CHANGE)
// =====================
const EMPTY_LEVEL = 15; // % below this = tank empty
const SPIKE_LEVEL = 40; // % sudden spike threshold
const MAX_JUMP = 30;    // % sudden jump reject

function sanitizeLevel(current: number, last: number | null) {
  if (last === null) return current;

  // 1️⃣ Empty tank fake spike
  if (last < EMPTY_LEVEL && current > SPIKE_LEVEL) {
    return last;
  }

  // 2️⃣ Hard sudden jump / drop
  if (Math.abs(current - last) > MAX_JUMP) {
    return last;
  }

  // 3️⃣ 🔥 SOFT SMOOTHING (weighted average)
  const ALPHA = 0.3; // 0.2–0.4 best
  return last + ALPHA * (current - last);
}

// value format: "<tank_no>_<location>"
const TANK_OPTIONS = [
  { value: "CS21_Battery-5", label: "CS21 - Battery-5" },
  { value: "CS21B_Battery-5", label: "CS21B - Battery-5" },
  { value: "BS-11_Battery-5 WF", label: "BS-11 - Battery-5 WF" },
  { value: "BS-10_Battery-5 WF", label: "BS-10 - Battery-5 WF" },
  { value: "BS-7A_Battery-3 WF", label: "BS-7A - Battery-3 WF" },
  { value: "BS-7B_Battery-2 WF", label: "BS-7B - Battery-2 WF" },
  { value: "CS-23B_Sinter Plant R", label: "CS-23B - Sinter Plant R" },
  { value: "BS-6_Power Plant of", label: "BS-6 - Power Plant of" },
  { value: "LS-1_M. Gas Holder", label: "LS-1 - M. Gas Holder" },
  { value: "MS-14_ERS", label: "MS-14 - ERS" },
  { value: "FIRE-TANK_Propane Gas", label: "FIRE-TANK - Propane Gas" },
];

function parseTankValue(value: string) {
  const [tank_no] = value.split("_");
  return { tank_no };
}

function formatDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function Analytics() {
  const [selectedTank, setSelectedTank] = useState<string>(
    TANK_OPTIONS[0]?.value ?? ""
  );

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  // Default range: last 3 days
  useEffect(() => {
    const now = new Date();
    const today = formatDateInput(now);
    const back = new Date();
    back.setDate(now.getDate() - 3);

    setStartDate(formatDateInput(back));
    setEndDate(today);
  }, []);

  // Load history
  useEffect(() => {
    if (!selectedTank || !startDate || !endDate) return;

    const { tank_no } = parseTankValue(selectedTank);

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const rows = await getTankHistory(tank_no, startDate, endDate);
        setHistory(rows);
      } catch (err: any) {
        setError(err.message ?? "Failed to load history");
        setHistory([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [selectedTank, startDate, endDate]);

  const selectedLabel =
    TANK_OPTIONS.find((t) => t.value === selectedTank)?.label ??
    "Select tank";

  // =====================
  // 🧠 CLEAN + SMOOTH DATA BEFORE GRAPH
  // =====================
  const series = useMemo(() => {
    let lastValid: number | null = null;

    return [
      {
        name: "Volume %",
        data: history.map((row) => {
          const raw = Number(row.volume_percentage);
          const cleaned = sanitizeLevel(raw, lastValid);
          lastValid = cleaned;

          return {
            x: new Date(row.date_time).getTime(),
            y: cleaned,
          };
        }),
      },
    ];
  }, [history]);

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "area",
      zoom: {
        enabled: true,
        type: "x",
        autoScaleYaxis: true,
      },
      toolbar: { show: true },
      animations: { enabled: false },
    },

    dataLabels: { enabled: false },

    markers: {
      size: 0,
      hover: { size: 6 },
    },

    tooltip: {
      enabled: true,
      x: { format: "dd MMM yyyy, HH:mm" },
      y: { formatter: (v: number) => `${v.toFixed(2)}%` },
    },

    xaxis: {
      type: "datetime",
      tickPlacement: "on",
      labels: {
        datetimeUTC: true,
        rotate: -45,
        rotateAlways: true,
        formatter: (value: string) => {
          const d = new Date(value);
          return d.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "UTC",
          });
        },
      },
      title: {
        text: "Date & Time",
        style: { fontSize: "14px", fontWeight: 500, color: "#64748b" },
      },
    },

    yaxis: {
      min: 0,
      max: 100,
      labels: { formatter: (v: number) => `${v.toFixed(2)}%` },
      title: {
        text: "Water Level (%)",
        style: { fontSize: "14px", fontWeight: 500, color: "#64748b" },
      },
    },

    stroke: { curve: "smooth", width: 3 },

    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
      },
    },

    colors: ["#06b6d4"],
  };

  return (
    <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Analytics & Insights
        </h2>
        <p className="text-sm text-slate-500">
          Historical trends and predictive analytics
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:w-64">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Tank
          </span>
          <select
            className="w-full appearance-none rounded-xl border px-4 py-2 pr-10 text-sm"
            value={selectedTank}
            onChange={(e) => setSelectedTank(e.target.value)}
          >
            {TANK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-7 h-4 w-4 text-slate-400" />
        </div>

        <div className="flex flex-1 gap-3">
          <input
            type="date"
            className="flex-1 rounded-xl border px-3 py-2 text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className="flex-1 rounded-xl border px-3 py-2 text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="h-72 rounded-3xl bg-sky-50/60 p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            Loading history for {selectedLabel}…
          </div>
        ) : history.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            No data available
          </div>
        ) : (
          <Chart options={options} series={series} type="area" height="100%" />
        )}
      </div>
    </div>
  );
}
