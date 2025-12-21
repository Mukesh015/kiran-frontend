// src/components/api/api.ts
// -----------------------------------------------------------------------------
// Unified API layer for Smart Aqua Sense dashboard
// -----------------------------------------------------------------------------

const RAW_BASE =
  import.meta.env.VITE_API_BASE ?? "http://119.18.62.146:3000/api";

const API_BASE = RAW_BASE.replace(/\/+$/, "");

// -----------------------------------------------------------------------------
// Common envelope type
// -----------------------------------------------------------------------------
interface ApiEnvelope<T> {
  ok?: boolean;
  error?: string;

  data?: T;
  rows?: T;
  result?: T;

  [k: string]: any;
}

// -----------------------------------------------------------------------------
// Generic GET helper
// -----------------------------------------------------------------------------
async function apiGet<T>(
  path: string,
  query?: Record<string, any>
): Promise<T> {
  const url = new URL(API_BASE + path);

  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }

  console.log("🔵 apiGet →", url.toString());

  const res = await fetch(url.toString());

  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {
      body = "<no body>";
    }

    console.error(
      "🔴 apiGet error:",
      res.status,
      res.statusText,
      "URL:",
      url.toString()
    );
    console.error("🔴 Response body:", body);

    throw new Error(`HTTP ${res.status} ${res.statusText} on ${url.pathname}`);
  }

  const json = (await res.json()) as ApiEnvelope<T> | T;

  // If backend returns a plain array, just return it
  if (Array.isArray(json)) {
    return json as T;
  }

  const env = json as ApiEnvelope<T>;

  // Backend-style logical error
  if (env.error && env.ok === false) {
    console.error("🔴 apiGet logical error:", env.error, "URL:", url.toString());
    throw new Error(env.error);
  }

  // Try common envelope keys in order
  if (env.data !== undefined) return env.data as T;
  if (env.rows !== undefined) return env.rows as T;
  if (env.result !== undefined) return env.result as T;

  // Fallback – return raw json
  return json as T;
}

// -----------------------------------------------------------------------------
// Tank list (cards / dashboard)
// -----------------------------------------------------------------------------
export type TankRow = Record<string, any>;

export async function getTanks(): Promise<TankRow[]> {
  const data = await apiGet<any>("/tank-current/all");

  if (Array.isArray(data)) return data;
  if (Array.isArray((data as any).data)) return (data as any).data;
  if (Array.isArray((data as any).rows)) return (data as any).rows;

  return [];
}

// -----------------------------------------------------------------------------
// Tank master / parameters  ( /api/tank-master?debug=1 )
// -----------------------------------------------------------------------------
export interface TankMasterRow {
  tank_no?: string;
  location?: string;

  device_id?: string;
  sim_number?: string;
  imei_number?: string;

  capacity_l?: number;
  working_volume_l?: number;
  safe_min_level_l?: number;
  safe_max_level_l?: number;

  install_year?: number | string;

  [k: string]: any;
}

export async function getTankMaster(): Promise<TankMasterRow[]> {
  // debug=1 so backend can log extra info if enabled
  const raw = await apiGet<any>("/tank-master", { debug: 1 });

  if (Array.isArray(raw)) return raw as TankMasterRow[];

  if (Array.isArray((raw as any).data)) {
    return (raw as any).data as TankMasterRow[];
  }
  if (Array.isArray((raw as any).rows)) {
    return (raw as any).rows as TankMasterRow[];
  }
  if (Array.isArray((raw as any).result)) {
    return (raw as any).result as TankMasterRow[];
  }

  console.warn("⚠ getTankMaster: no array found in response", raw);
  return [];
}

// -----------------------------------------------------------------------------
// HISTORY TYPES
// -----------------------------------------------------------------------------
export interface HistoryRow {
  tank_no?: string;
  location?: string;

  date_time?: string;
  current_time?: string;
  timestamp?: string;
  date_only?: string;
  time_only?: string;

  currentLevel?: number;
  fillPercentage?: number;
  fill_percentage?: number;

  tank_volume_l?: number;
  water_volume_l?: number;
  volume_percentage?: number;

  flowStatus?: string;
  flow_status?: string;
  tank_status?: string;
  tank_alert_message?: string;

  under_maintenance?: boolean | number;

  [k: string]: any;
}

// -----------------------------------------------------------------------------
// Old history API (if still used)
// -----------------------------------------------------------------------------
export async function getTransactionHistory(
  tank_no: string,
  location: string,
  start: string,
  end: string
): Promise<HistoryRow[]> {
  const data = await apiGet<any>("/transactions-history", {
    tank_no,
    location,
    start,
    end,
  });

  if (Array.isArray(data)) return data;
  if (Array.isArray((data as any).rows)) return (data as any).rows;
  if (Array.isArray((data as any).data)) return (data as any).data;

  return [];
}

// -----------------------------------------------------------------------------
// New history API used by Analytics
// -----------------------------------------------------------------------------
export async function getTankHistory(
  tank_no: string,
  start: string,
  end: string
): Promise<HistoryRow[]> {
  const raw = await apiGet<any>("/tanks/history", {
    tank_no,
    start,
    end,
  });

  console.log("🔍 raw history response:", raw);

  if (Array.isArray(raw)) return raw as HistoryRow[];

  if (Array.isArray((raw as any).history)) {
    return (raw as any).history as HistoryRow[];
  }

  if (Array.isArray((raw as any).rows)) {
    return (raw as any).rows as HistoryRow[];
  }
  if (Array.isArray((raw as any).data)) {
    return (raw as any).data as HistoryRow[];
  }

  console.warn("⚠ getTankHistory: no array found in response", raw);
  return [];
}

// -----------------------------------------------------------------------------
// Notifications
// -----------------------------------------------------------------------------
//
// We NORMALIZE the backend rows to a clean shape that the React page uses:
//   - tankNo          (from tank_no)
//   - place           (from location)
//   - tankStatus      (from tank_status)
//   - alertMessage    (from tank_alert_message)
//   - underMaintenance (from under_maintenance)
//   - alertEnabled    (inverse of disable_alert)
//   - timestamp       (from current_time / date_time / time)
// -----------------------------------------------------------------------------

export interface NotificationRecord {
  id: string;

  // Normalized, camelCase fields used by Notifications.tsx
  tankNo: string;
  place: string;
  tankStatus: string;
  alertMessage: string;
  underMaintenance: boolean;
  alertEnabled: boolean;
  timestamp: string;

  // Optional extras if needed later
  level?: number;
  fillPercentage?: number;

  // Keep raw access flexible
  [k: string]: any;
}

export async function getNotifications(): Promise<NotificationRecord[]> {
  const raw = await apiGet<any>("/notifications");

  let rows: any[] = [];

  if (Array.isArray(raw)) {
    rows = raw;
  } else if (Array.isArray((raw as any).data)) {
    rows = (raw as any).data;
  } else if (Array.isArray((raw as any).rows)) {
    rows = (raw as any).rows;
  } else {
    console.warn("⚠ getNotifications: no array in response", raw);
    return [];
  }

  return rows.map((row: any, index: number): NotificationRecord => {
    const tankNo = row.tankNo ?? row.tank_no ?? "";
    const place = row.place ?? row.location ?? "";
    const tankStatus = row.tankStatus ?? row.tank_status ?? "Normal";

    const alertMessage =
      row.alertMessage ??
      row.tank_alert_message ??
      row.alert_type ??
      "";

    // under_maintenance can be 0/1 or boolean
    const underMaintenanceRaw =
      row.underMaintenance ?? row.under_maintenance ?? 0;
    const underMaintenance =
      typeof underMaintenanceRaw === "number"
        ? underMaintenanceRaw === 1
        : !!underMaintenanceRaw;

    // disable_alert: 1 = disabled, 0 = enabled
    const disableAlertRaw =
      row.disable_alert ?? row.alertDisabled ?? row.alert_enabled;
    let alertEnabled = true;

    if (disableAlertRaw !== undefined && disableAlertRaw !== null) {
      if (typeof disableAlertRaw === "number") {
        alertEnabled = disableAlertRaw === 0;
      } else if (typeof disableAlertRaw === "string") {
        // "0" / "1" / "true" / "false"
        const v = disableAlertRaw.trim().toLowerCase();
        if (v === "0" || v === "false" || v === "no") {
          alertEnabled = true;
        } else if (v === "1" || v === "true" || v === "yes") {
          alertEnabled = false;
        }
      } else {
        alertEnabled = !Boolean(disableAlertRaw);
      }
    }

    const timestamp =
      row.timestamp ??
      row.current_time ??
      row.date_time ??
      row.time ??
      "";

    const level = row.level ?? row.currentLevel ?? null;
    const fillPercentage =
      row.fillPercentage ?? row.fill_percentage ?? null;

    const id =
      String(row.id ??
        `${tankNo || "TANK"}-${timestamp || "ts"}-${index}`);

    return {
      id,
      tankNo,
      place,
      tankStatus,
      alertMessage,
      underMaintenance,
      alertEnabled,
      timestamp,
      level: level ?? undefined,
      fillPercentage: fillPercentage ?? undefined,
      raw: row,
    };
  });
}

// -----------------------------------------------------------------------------
// Default export
// -----------------------------------------------------------------------------
export default {
  getTanks,
  getTankMaster,
  getTransactionHistory,
  getTankHistory,
  getNotifications,
};
