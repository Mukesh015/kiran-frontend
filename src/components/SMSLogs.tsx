import { useEffect, useMemo, useState } from "react";

/* =========================================================
   CONFIG
========================================================= */

const API_URL = "https://api.plumuleresearch.co.in/api/tank-current/all";

// Fixed 4 users (frontend only)
const USERS = [
  "Shri S. Bhowmick",
  "Shri U. Barman",
  "Shri R. Das",
  "Shri A. Ghosh",
];

/* =========================================================
   HELPERS
========================================================= */

function formatTime(iso: string) {
  if (!iso) return "-";
  return new Date(iso).toISOString().slice(0, 19).replace("T", " ");
}

/* =========================================================
   COMPONENT
========================================================= */

export default function SMSLogs() {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     FETCH & TRANSFORM DATA
  ======================================================= */

  useEffect(() => {
    fetch(API_URL)
      .then((r) => r.json())
      .then((res) => {
        // Safely extract array from API response
        const tankArray =
          Array.isArray(res)
            ? res
            : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.rows)
            ? res.rows
            : [];

        // Keep ONLY required fields
        const minimal = tankArray.map((t: any) => ({
          tank_no: t.tank_no,
          last_updated: t.last_updated,
          tank_alert_message: t.tank_alert_message,
        }));

        // Fan-out: one tank -> 4 users (ONLY High / Low)
        const expanded: any[] = [];

        minimal.forEach((tank: any) => {
          if (
            tank.tank_alert_message !== "Low level" &&
            tank.tank_alert_message !== "High level"
          ) {
            return;
          }

          USERS.forEach((user) => {
            expanded.push({
              user,
              tank: tank.tank_no,
              type: tank.tank_alert_message,
              status: "Sent",
              time: formatTime(tank.last_updated),
            });
          });
        });

        setRows(expanded);
        setLoading(false);
      })
      .catch((err) => {
        console.error("SMS Logs API error:", err);
        setError("Failed to load SMS Logs");
        setLoading(false);
      });
  }, []);

  /* =======================================================
     SEARCH FILTER
  ======================================================= */

  const filteredRows = useMemo(() => {
    return rows.filter((r) =>
      Object.values(r).some((v) =>
        String(v).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [rows, search]);

  /* =======================================================
     PAGINATION LOGIC
  ======================================================= */

  const totalPages = Math.ceil(filteredRows.length / entries);

  useEffect(() => {
    setPage(1);
  }, [search, entries]);

  const pagedRows = filteredRows.slice(
    (page - 1) * entries,
    page * entries
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="p-6 bg-[#e9eef5] min-h-screen">
      <div className="bg-white rounded-xl border border-slate-800/40 p-6">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">SMS Logs</h2>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-indigo-500 text-white rounded-lg">
              Export
            </button>
            <button
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg"
              onClick={() => window.print()}
            >
              Print Table
            </button>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span>Show</span>
            <select
              value={entries}
              onChange={(e) => setEntries(Number(e.target.value))}
              className="border border-slate-400 rounded px-2 py-1 bg-white"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span>Search:</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tanks..."
              className="border border-slate-400 rounded px-3 py-1 bg-white"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto border border-slate-800/40 rounded-lg">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">SL. NO.</th>
                <th className="px-4 py-3 text-left font-semibold">USER NAME</th>
                <th className="px-4 py-3 text-left font-semibold">TANK NAME</th>
                <th className="px-4 py-3 text-left font-semibold">TYPE</th>
                <th className="px-4 py-3 text-left font-semibold">STATUS</th>
                <th className="px-4 py-3 text-left font-semibold">TIME</th>
              </tr>
            </thead>

            <tbody>
              {pagedRows.map((r, i) => (
                <tr key={i} className="border-b border-slate-300">
                  <td className="px-4 py-3">
                    {(page - 1) * entries + i + 1}
                  </td>
                  <td className="px-4 py-3">{r.user}</td>
                  <td className="px-4 py-3">{r.tank}</td>
                  <td className="px-4 py-3">{r.type}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">
                    {r.status}
                  </td>
                  <td className="px-4 py-3">{r.time}</td>
                </tr>
              ))}

              {!loading && pagedRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No SMS Logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center mt-4 text-sm text-indigo-600">
          <span>
            Showing {(page - 1) * entries + 1}
            {" "}to{" "}
            {Math.min(page * entries, filteredRows.length)}
            {" "}of {filteredRows.length} entries
          </span>

          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(0, 7)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 border rounded
                    ${p === page
                      ? "bg-indigo-500 text-white"
                      : "text-indigo-600"
                    }`}
                >
                  {p}
                </button>
              ))}
          </div>
        </div>

      </div>
    </div>
  );
}
