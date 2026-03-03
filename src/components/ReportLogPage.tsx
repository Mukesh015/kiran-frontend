import React, { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface Log {
    tankname: string;
    offline_time: string;
    online_time: string;
    duration: string;
}

const API_BASE = "http://localhost:3000/api/tank/logs"; // change if deployed

const ReportLogPage: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [selectedTank, setSelectedTank] = useState("All");

    const [range, setRange] = useState<any[]>([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: "selection",
        },
    ]);

    const [data, setData] = useState<Log[]>([]);
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    function formatDateTime(v: string | null): string {
        if (!v) return "--";

        const d = new Date(v);

        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();

        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, "0");

        const ampm = hours >= 12 ? "pm" : "am";
        hours = hours % 12 || 12;

        return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
    }

    // Convert date to MySQL format
    const formatDate = (date: Date) =>
        date.toISOString().slice(0, 19).replace("T", " ");

    // 🔥 Fetch Data
    const fetchData = async () => {
        try {
            setLoading(true);

            const start = formatDate(range[0].startDate);
            const end = formatDate(range[0].endDate);

            const query = new URLSearchParams({
                page: String(page),
                limit: String(limit),
                tank: selectedTank,
                startDate: start,
                endDate: end,
            }).toString();

            const res = await fetch(`${API_BASE}?${query}`);
            console.log('res', res)

            if (res.ok) {
                const json = await res.json();
                console.log('json', json)
                setTotalPages(json.pagination.totalPages);
                setTotalRecords(json.pagination.totalRecords);
                setData(json.data);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch when filters change
    useEffect(() => {
        fetchData();
    }, [page, limit, selectedTank, range]);

    // 🔥 CSV Download (Server Side)
    const handleDownload = () => {
        const start = formatDate(range[0].startDate);
        const end = formatDate(range[0].endDate);

        const query = new URLSearchParams({
            tank: selectedTank,
            startDate: start,
            endDate: end,
        }).toString();

        window.open(`${API_BASE}/export?${query}`);
        setShowModal(false);
    };

    return (
        <div className="bg-[#f6f6fb] min-h-screen p-6 text-black">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-700">
                    Offline Logs
                </h2>

                <div className="flex gap-4">
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-md"
                    >
                        Export
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-md shadow border">
                <table className="w-full">
                    <thead className="bg-gray-100 text-gray-600 text-sm uppercase">
                        <tr>
                            <th className="px-6 py-3 text-left">SL. NO.</th>
                            <th className="px-6 py-3 text-left">Tank Name</th>
                            <th className="px-6 py-3 text-left">Offline Time</th>
                            <th className="px-6 py-3 text-left">Online Time</th>
                            <th className="px-6 py-3 text-left">Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-6">
                                    Loading...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-6">
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            data.map((row, index) => {
                                const serialNumber = (page - 1) * limit + index + 1;
                                return (
                                    <tr
                                        key={`${row.tankname}-${row.offline_time}`}
                                        className="border-t text-black"
                                    >
                                        <td className="px-6 py-4">{serialNumber}</td>
                                        <td className="px-6 py-4">{row.tankname}</td>
                                        <td className="px-6 py-4">{formatDateTime(row.offline_time)}</td>
                                        <td className="px-6 py-4">{formatDateTime(row.online_time)}</td>
                                        <td className="px-6 py-4">{row.duration}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Footer */}
                <div className="flex justify-between items-center mt-4 text-sm text-gray-600 p-5">
                    <div>
                        Showing page {page} of {totalPages} | Total Records:{" "}
                        {totalRecords}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="px-3 py-1 rounded hover:bg-gray-200 disabled:opacity-40"
                        >
                            ‹ Previous
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .slice(0, 5)
                            .map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setPage(num)}
                                    className={`w-9 h-9 rounded-full ${page === num
                                        ? "bg-indigo-600 text-white"
                                        : "hover:bg-gray-200"
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}

                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                            className="px-3 py-1 rounded hover:bg-gray-200 disabled:opacity-40"
                        >
                            Next ›
                        </button>
                    </div>
                </div>
            </div>

            {/* Export Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-white w-[800px] rounded-lg shadow-lg p-6 relative text-black">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-3 right-4 text-xl"
                        >
                            ×
                        </button>

                        <h3 className="text-lg font-semibold mb-6">
                            Download Offline Logs
                        </h3>

                        <div className="flex gap-6 mb-6">
                            {/* Tank */}
                            <div className="w-1/3">
                                <label className="block text-sm mb-2">
                                    Select Tank:
                                </label>
                                <input
                                    type="text"
                                    value={selectedTank}
                                    onChange={(e) =>
                                        setSelectedTank(e.target.value)
                                    }
                                    placeholder="Enter tank name or All"
                                    className="w-full border rounded-md px-3 py-2"
                                />
                            </div>

                            {/* Calendar */}
                            <div className="w-2/3">
                                <label className="block text-sm mb-2">
                                    Select Date Range:
                                </label>
                                <div className="border rounded-md p-2 bg-white shadow-sm">
                                    <DateRange
                                        editableDateInputs={true}
                                        onChange={(item) =>
                                            setRange([item.selection])
                                        }
                                        moveRangeOnFirstSelection={false}
                                        ranges={range}
                                        rangeColors={["#6366f1"]}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleDownload}
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 rounded-md"
                        >
                            Download
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportLogPage;