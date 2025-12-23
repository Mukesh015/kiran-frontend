import React, { useEffect, useMemo, useState } from "react";

const ReportLogPage: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [entries, setEntries] = useState(10);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    /* =======================
       FETCH API (PAGINATED)
    ======================= */
    const fetchLogs = async () => {
        try {
            const res = await fetch(
                `https://api.plumuleresearch.co.in/api/tank/logs?page=${page}&limit=${entries}`
            );

            const json = await res.json();

            if (json.ok) {
                // map API → UI shape
                const mapped = json.data.map((r: any) => ({
                    tank: r.tankname,
                    offline: new Date(r.offline_time).toLocaleString(),
                    online: new Date(r.online_time).toLocaleString(),
                    duration: r.duration,
                }));

                setData(mapped);
                setTotal(json.pagination.totalRecords);
            } else {
                setData([]);
                setTotal(0);
            }
        } catch (err) {
            console.error("API error", err);
            setData([]);
            setTotal(0);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, entries]);

    /* =======================
       KEEP YOUR UI LOGIC
    ======================= */
    const filteredData = useMemo(() => {
        return data.filter((row) =>
            row.tank.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, data]);

    const totalPages = Math.ceil(total / entries);
    const startIndex = (page - 1) * entries;
    const endIndex = startIndex + filteredData.length;

    useEffect(() => {
        setPage(1);
    }, [search, entries]);

    const getVisiblePages = () => {
        const maxButtons = 7;
        const half = Math.floor(maxButtons / 2);

        let start = Math.max(1, page - half);
        let end = Math.min(totalPages, start + maxButtons - 1);

        if (end - start < maxButtons - 1) {
            start = Math.max(1, end - maxButtons + 1);
        }

        return Array.from(
            { length: end - start + 1 },
            (_, i) => start + i
        );
    };

    const handleExportCSV = () => {
        if (!filteredData.length) return;

        const headers = [
            "SL NO",
            "Tank Name",
            "Offline Time",
            "Online Time",
            "Offline Period",
        ];

        const rows = filteredData.map((row, index) => [
            startIndex + index + 1,
            row.tank,
            row.offline,
            row.online,
            row.duration,
        ]);

        const csvContent = [
            headers.join(","), // header row
            ...rows.map((r) =>
                r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
            "download",
            `offline_log_page_${page}.csv`
        );

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };



    return (
        <div className="p-6 bg-slate-200 min-h-screen rounded-xl">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold text-gray-700">
                    Offline Logs
                </h1>

                <div className="flex gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="px-5 py-2 rounded-md uppercase bg-indigo-500 text-white text-sm hover:bg-indigo-600"
                    >
                        Export as CSV
                    </button>

                </div>
            </div>

            {/* CONTROLS */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    Show
                    <select
                        value={entries}
                        onChange={(e) => setEntries(Number(e.target.value))}
                        className="border rounded px-2 py-1 bg-white"
                    >
                        {[10, 25, 50, 100].map((n) => (
                            <option key={n}>{n}</option>
                        ))}
                    </select>
                    entries
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                    Search:
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border rounded px-3 py-1"
                        placeholder="Search tanks..."
                    />
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-lg border overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">SL. NO.</th>
                            <th className="px-4 py-3">Tank Name</th>
                            <th className="px-4 py-3">Offline Time</th>
                            <th className="px-4 py-3">Online Time</th>
                            <th className="px-4 py-3">Offline Period</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredData.map((row, index) => (
                            <tr
                                key={index}
                                className="border-t border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                <td className="px-4 py-3">
                                    {startIndex + index + 1}
                                </td>
                                <td className="px-4 py-3">{row.tank}</td>
                                <td className="px-4 py-3">{row.offline}</td>
                                <td className="px-4 py-3">{row.online}</td>
                                <td className="px-4 py-3">{row.duration}</td>
                            </tr>
                        ))}

                        {filteredData.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="text-center py-6 text-gray-500"
                                >
                                    No records found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}
            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-indigo-600">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, total)} of {total} entries
                </div>
                <div className="flex items-center gap-2">
                    {page > 4 && (
                        <>
                            <button
                                onClick={() => setPage(1)}
                                className="px-3 py-1 border rounded hover:bg-gray-100"
                            >
                                1
                            </button>
                            <span className="px-2 text-indigo-600">…</span>
                        </>
                    )}

                    {getVisiblePages().map((pageNo) => (
                        <button
                            key={pageNo}
                            onClick={() => setPage(pageNo)}
                            className={`px-3 py-1 text-indigo-600 border border-indigo-500 rounded ${page === pageNo
                                ? "bg-indigo-500 text-white"
                                : "hover:bg-gray-100"
                                }`}
                        >
                            {pageNo}
                        </button>
                    ))}

                    {page < totalPages - 3 && (
                        <>
                            <span className="px-2">…</span>
                            <button
                                onClick={() => setPage(totalPages)}
                                className="px-3 text-indigo-600 border border-indigo-500 py-1 rounded hover:bg-gray-100"
                            >
                                {totalPages}
                            </button>
                        </>
                    )}
                </div>
            </div>


        </div>
    );
};

export default ReportLogPage;
