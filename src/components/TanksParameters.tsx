// src/components/TanksParameters.tsx
import { useEffect, useMemo, useState } from "react";
import Section from "./Section";
import { getTankMaster, type TankMasterRow } from "./api/api";

// -------- DATE FORMAT HELPER: dd/mm/yyyy --------
function formatDDMMYYYY(raw: unknown): string {
  if (raw === null || raw === undefined) return "-";

  let dateStr = String(raw).trim();
  if (!dateStr) return "-";

  if (dateStr.includes("T")) {
    dateStr = dateStr.split("T")[0];
  } else if (dateStr.includes(" ")) {
    dateStr = dateStr.split(" ")[0];
  }

  const parts = dateStr.split(/[-/]/);
  if (parts.length !== 3) return dateStr;

  let year = "";
  let month = "";
  let day = "";

  if (parts[0].length === 4) {
    year = parts[0];
    month = parts[1].padStart(2, "0");
    day = parts[2].padStart(2, "0");
  } else {
    day = parts[0].padStart(2, "0");
    month = parts[1].padStart(2, "0");
    year = parts[2];
  }

  return `${day}/${month}/${year}`;
}

// -------- CONVERT FORM DATE (dd/mm/yyyy or yyyy-mm-dd) → yyyy-mm-dd --------
function toBackendDate(value: string): string | null {
  const v = value.trim();
  if (!v) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const d = m[1].padStart(2, "0");
    const mo = m[2].padStart(2, "0");
    const y = m[3];
    return `${y}-${mo}-${d}`;
  }

  return v;
}

// -------- NORMALIZED ROW SHAPE FOR UI --------
export type NormalizedTankRow = {
  tankNo: string;
  simNumber: string;
  imeiNumber: string;
  ssid: string;
  ultrasonicStatus: string;
  tankStatus: string;
  safeMaxLevelL: number | null;
  safeMinLevelL: number | null;
  installDate: string | null;
};

type ApiError = string | null;
type AnyRow = TankMasterRow & Record<string, any>;

function normalizeTankRow(row: AnyRow): NormalizedTankRow {
  // Try multiple possible backend field names for safe limits
  const safeMax =
    row.safe_max_level_l ??
    row.safeMaxLevelL ??
    row.upper_safe_limit_pct ??
    row.upper_safe_limit_l ??
    null;

  const safeMin =
    row.safe_min_level_l ??
    row.safeMinLevelL ??
    row.lower_safe_limit_pct ??
    row.lower_safe_limit_l ??
    null;

  const installRaw =
    row.installation_date ??
    row.installationDate ??
    row.install_year ??
    row.installYear ??
    null;

  const tankStatus =
    row.tank_status ??
    row.tankStatus ??
    row.status ??
    "";

  return {
    tankNo:
      row.tank_no ??
      row.tankNo ??
      row.tank_name ??
      row.tankName ??
      "",
    simNumber: row.sim_number ?? row.simNumber ?? "",
    imeiNumber: row.imei_number ?? row.imeiNumber ?? "",
    ssid: row.ssid ?? row.SSID ?? "",
    ultrasonicStatus:
      row.ultrasonic_status ??
      row.ultrasonicStatus ??
      row.status ??
      "",
    tankStatus: tankStatus,
    safeMaxLevelL:
      typeof safeMax === "number"
        ? safeMax
        : safeMax != null
        ? Number(safeMax) || null
        : null,
    safeMinLevelL:
      typeof safeMin === "number"
        ? safeMin
        : safeMin != null
        ? Number(safeMin) || null
        : null,
    installDate: installRaw ? formatDDMMYYYY(installRaw) : null,
  };
}

// -------- SAVE PAYLOAD --------
type SaveTankPayload = {
  tank_no: string;
  sim_number: string;
  imei_number: string;
  ssid: string;
  ultrasonic_status: string;
  safe_max_level_l: number | null;
  safe_min_level_l: number | null;
  installation_date: string | null;
};

async function saveTankParameter(
  payload: SaveTankPayload
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/tank-master", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("saveTankParameter HTTP error:", res.status, text);
      return { ok: false, error: `HTTP ${res.status}` };
    }

    return { ok: true };
  } catch (err: any) {
    console.error("saveTankParameter error:", err);
    return { ok: false, error: err?.message || "Network error" };
  }
}

type FormState = {
  tankNo: string;
  simNumber: string;
  imeiNumber: string;
  ssid: string;
  safeMaxLevel: string;
  safeMinLevel: string;
  ultrasonicStatus: string;
  installDate: string;
};

export default function TanksParameters() {
  const [rawRows, setRawRows] = useState<TankMasterRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError>(null);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [formState, setFormState] = useState<FormState>({
    tankNo: "",
    simNumber: "",
    imeiNumber: "",
    ssid: "",
    safeMaxLevel: "",
    safeMinLevel: "",
    ultrasonicStatus: "",
    installDate: "",
  });

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const rows = await getTankMaster();
      setRawRows(rows || []);
    } catch (err: any) {
      console.error("getTankMaster error:", err);
      setError(err?.message || "Failed to load tank master data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const normalizedRows: NormalizedTankRow[] = useMemo(
    () => rawRows.map((r) => normalizeTankRow(r as AnyRow)),
    [rawRows]
  );

  const filteredRows = useMemo(() => {
    if (!search.trim()) return normalizedRows;

    const q = search.toLowerCase();
    return normalizedRows.filter((r) => {
      return (
        r.tankNo.toLowerCase().includes(q) ||
        r.simNumber.toLowerCase().includes(q) ||
        r.imeiNumber.toLowerCase().includes(q) ||
        r.ssid.toLowerCase().includes(q) ||
        r.ultrasonicStatus.toLowerCase().includes(q) ||
        r.tankStatus.toLowerCase().includes(q)
      );
    });
  }, [normalizedRows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const openAddModal = () => {
    setFormMode("add");
    setFormState({
      tankNo: "",
      simNumber: "",
      imeiNumber: "",
      ssid: "",
      safeMaxLevel: "",
      safeMinLevel: "",
      ultrasonicStatus: "",
      installDate: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (row: NormalizedTankRow) => {
    setFormMode("edit");
    setFormState({
      tankNo: row.tankNo,
      simNumber: row.simNumber,
      imeiNumber: row.imeiNumber,
      ssid: row.ssid,
      safeMaxLevel:
        row.safeMaxLevelL != null ? String(row.safeMaxLevelL) : "",
      safeMinLevel:
        row.safeMinLevelL != null ? String(row.safeMinLevelL) : "",
      ultrasonicStatus: row.ultrasonicStatus,
      installDate: (() => {
        if (!row.installDate) return "";
        const v = row.installDate;
        const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (m) {
          const d = m[1];
          const mo = m[2];
          const y = m[3];
          return `${y}-${mo}-${d}`;
        }
        return v;
      })(),
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (
    field: keyof FormState,
    value: string
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed: FormState = {
      tankNo: formState.tankNo.trim(),
      simNumber: formState.simNumber.trim(),
      imeiNumber: formState.imeiNumber.trim(),
      ssid: formState.ssid.trim(),
      safeMaxLevel: formState.safeMaxLevel.trim(),
      safeMinLevel: formState.safeMinLevel.trim(),
      ultrasonicStatus: formState.ultrasonicStatus.trim(),
      installDate: formState.installDate.trim(),
    };

    if (!trimmed.tankNo) {
      alert("Tank No is required.");
      return;
    }

    const safeMaxNum =
      trimmed.safeMaxLevel === ""
        ? null
        : Number(trimmed.safeMaxLevel);
    const safeMinNum =
      trimmed.safeMinLevel === ""
        ? null
        : Number(trimmed.safeMinLevel);

    if (
      trimmed.safeMaxLevel !== "" &&
      (Number.isNaN(safeMaxNum) || safeMaxNum === null)
    ) {
      alert("Safe Max Level must be a number or empty.");
      return;
    }
    if (
      trimmed.safeMinLevel !== "" &&
      (Number.isNaN(safeMinNum) || safeMinNum === null)
    ) {
      alert("Safe Min Level must be a number or empty.");
      return;
    }

    const backendDate = trimmed.installDate
      ? toBackendDate(trimmed.installDate)
      : null;

    const payload: SaveTankPayload = {
      tank_no: trimmed.tankNo,
      sim_number: trimmed.simNumber,
      imei_number: trimmed.imeiNumber,
      ssid: trimmed.ssid,
      ultrasonic_status: trimmed.ultrasonicStatus,
      safe_max_level_l: safeMaxNum,
      safe_min_level_l: safeMinNum,
      installation_date: backendDate,
    };

    const result = await saveTankParameter(payload);
    if (!result.ok) {
      alert(`Failed to save: ${result.error || "Unknown error"}`);
      return;
    }

    await loadData();
    setIsModalOpen(false);
  };

  const handleExportCsv = () => {
    const headers = [
      "SL_NO",
      "TANK_NO",
      "SIM_NUMBER",
      "IMEI_NUMBER",
      "SSID",
      "SAFE_MAX_LEVEL_L",
      "SAFE_MIN_LEVEL_L",
      "TANK_STATUS",
      "ULTRASONIC_STATUS",
      "INSTALLATION_DATE",
    ];

    const rows = filteredRows.map((r, idx) => [
      String(idx + 1),
      r.tankNo,
      r.simNumber,
      r.imeiNumber,
      r.ssid,
      r.safeMaxLevelL != null ? String(r.safeMaxLevelL) : "",
      r.safeMinLevelL != null ? String(r.safeMinLevelL) : "",
      r.tankStatus,
      r.ultrasonicStatus,
      r.installDate ?? "",
    ]);

    const csvContent =
      [headers, ...rows]
        .map((cols) =>
          cols
            .map((c) =>
              `"${String(c).replace(/"/g, '""')}"`
            )
            .join(",")
        )
        .join("\n") + "\n";

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "tank_parameters.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Section title="Tank Parameters">
      {/* Description inside instead of prop */}
      <p className="mb-2 text-xs text-slate-500">
        Master configuration for all DSP tanks: SIM, IMEI, SSID, safe limits and installation date.
      </p>

      {/* Top Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by tank, SIM, IMEI, SSID, status..."
            className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <select
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value) || 10);
              setPage(1);
            }}
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            + Add Parameter
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-3 text-xs text-red-600">
          ❌ {error}
        </p>
      )}
      {loading && (
        <p className="mb-3 text-xs text-slate-500">
          Loading tank parameters...
        </p>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                SL
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                Tank No
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                SIM Number
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                IMEI Number
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                SSID
              </th>
              <th className="px-3 py-2 text-right font-semibold text-slate-700">
                Safe Max (L)
              </th>
              <th className="px-3 py-2 text-right font-semibold text-slate-700">
                Safe Min (L)
              </th>
             
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                Installation Date
              </th>
              <th className="px-3 py-2 text-right font-semibold text-slate-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="px-3 py-4 text-center text-xs text-slate-500"
                >
                  No tanks found.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, idx) => (
                <tr
                  key={`${row.tankNo}-${idx}`}
                  className="hover:bg-slate-50/80"
                >
                  <td className="px-3 py-2 text-slate-500">
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  <td className="px-3 py-2 font-semibold text-slate-800">
                    {row.tankNo}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {row.simNumber}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {row.imeiNumber}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {row.ssid}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {row.safeMaxLevelL != null
                      ? row.safeMaxLevelL.toFixed(1)
                      : "-"}
                    
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {row.safeMinLevelL != null
                      ? row.safeMinLevelL.toFixed(1)
                      : "-"}
                  </td>
                  
                  <td className="px-3 py-2 text-slate-700">
                    {row.installDate ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => openEditModal(row)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600">
        <div>
          Showing{" "}
          <span className="font-semibold">
            {paginatedRows.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold">
            {filteredRows.length}
          </span>{" "}
          tanks
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded border border-slate-300 px-2 py-1 text-[11px] disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            Page{" "}
            <span className="font-semibold">{page}</span> /{" "}
            <span className="font-semibold">{totalPages}</span>
          </span>
          <button
            type="button"
            onClick={() =>
              setPage((p) => Math.min(totalPages, p + 1))
            }
            disabled={page >= totalPages}
            className="rounded border border-slate-300 px-2 py-1 text-[11px] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                {formMode === "add"
                  ? "Add Tank Parameter"
                  : "Edit Tank Parameter"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleFormSubmit}
              className="space-y-3 text-[11px]"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">
                    Tank No *
                  </label>
                  <input
                    type="text"
                    value={formState.tankNo}
                    onChange={(e) =>
                      handleFormChange("tankNo", e.target.value)
                    }
                    disabled={formMode === "edit"}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">
                    SIM Number
                  </label>
                  <input
                    type="text"
                    value={formState.simNumber}
                    onChange={(e) =>
                      handleFormChange("simNumber", e.target.value)
                    }
                    className="w-full rounded border border-slate-300 px-2 py-1 text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">
                    IMEI Number
                  </label>
                  <input
                    type="text"
                    value={formState.imeiNumber}
                    onChange={(e) =>
                      handleFormChange("imeiNumber", e.target.value)
                    }
                    className="w-full rounded border border-slate-300 px-2 py-1 text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">
                    SSID
                  </label>
                  <input
                    type="text"
                    value={formState.ssid}
                    onChange={(e) =>
                      handleFormChange("ssid", e.target.value)
                    }
                    className="w-full rounded border border-slate-300 px-2 py-1 text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">
                    Safe Max Level (L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formState.safeMaxLevel}
                    onChange={(e) =>
                      handleFormChange("safeMaxLevel", e.target.value)
                    }
                    className="w-full rounded border border-slate-300 px-2 py-1 text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">
                    Safe Min Level (L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formState.safeMinLevel}
                    onChange={(e) =>
                      handleFormChange("safeMinLevel", e.target.value)
                    }
                    className="w-full rounded border border-slate-300 px-2 py-1 text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">
                    Ultrasonic Status
                  </label>
                  <input
                    type="text"
                    value={formState.ultrasonicStatus}
                    onChange={(e) =>
                      handleFormChange(
                        "ultrasonicStatus",
                        e.target.value
                      )
                    }
                    className="w-full rounded border border-slate-300 px-2 py-1 text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">
                    Installation Date
                  </label>
                  <input
                    type="date"
                    value={formState.installDate}
                    onChange={(e) =>
                      handleFormChange("installDate", e.target.value)
                    }
                    className="w-full rounded border border-slate-300 px-2 py-1 text-[11px] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700"
                >
                  {formMode === "add" ? "Add" : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Section>
  );
}
