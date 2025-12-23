import { useEffect, useState } from "react";

const SmsLogTable = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchSmsLogs = async () => {
    try {
      const res = await fetch(
        `https://api.plumuleresearch.co.in/api/tank/sms-logs?page=${page}&limit=${limit}`
      );
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
        setTotalPages(json.pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch sms logs", err);
    }
  };

  useEffect(() => {
    fetchSmsLogs();
  }, [page]);

  return (
    <div className="w-full bg-white rounded-lg shadow">
      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">TANK</th>
              <th className="px-4 py-3">USER</th>
              <th className="px-4 py-3">PHONE</th>
              <th className="px-4 py-3">TIME</th>
              <th className="px-4 py-3 text-center">STATUS</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={`${row.id}-${row.user.id}-${idx}`}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-500">{row.id}</td>
                  <td className="px-4 py-3 text-gray-500">{row.tank_name}</td>
                  <td className="px-4 py-3 text-gray-500">{row.user.name}</td>
                  <td className="px-4 py-3 text-gray-500">{row.user.phone}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(row.time).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Sent
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className={`px-3 py-1 rounded border text-sm
              ${page === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-gray-50 text-gray-700"
              }`}
          >
            Prev
          </button>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className={`px-3 py-1 rounded border text-sm
              ${page === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-gray-50 text-gray-700"
              }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmsLogTable;
