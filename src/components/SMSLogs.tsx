import { useEffect, useState } from "react";
import { Logs, Download, Plus, X } from "lucide-react";
import EditMembersModal from "./ui/EditMembersModal";

const SmsLogTable = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openModal, setOpenModal] = useState<boolean>(false);
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

  const exportToCSV = () => {
    if (!data.length) return;

    const headers = [
      "ID",
      "Tank",
      "User",
      "Phone",
      "Time",
      "Status",
    ];

    const rows = data.map((row: any) => [
      row?.id ?? "",
      row?.tank_name ?? "",
      row?.user?.name ?? "",
      row?.user?.phone ?? "",
      new Date(row?.time).toLocaleString(),
      "Sent",
    ]);

    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) =>
              `"${String(cell).replace(/"/g, '""')}"`
            )
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `sms_logs_page_${page}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };


  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">
            <Logs size={20} className="inline-block mr-2" />SMS Logs
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              disabled={data.length === 0}
              className={`px-10 flex items-center gap-2 py-2 rounded border-2 text-sm font-bold uppercase
    ${data.length === 0
                  ? "border-gray-300 text-gray-400 cursor-not-allowed"
                  : "border-rose-500 text-rose-500 hover:bg-rose-50"
                }`}
            >
              <Download size={16} />
              Export to CSV
            </button>

            <button
              onClick={() => setOpenModal(true)}
              className="flex items-center gap-2 py-2 rounded bg-rose-500 border-rose-500 border text-sm px-10 font-bold uppercase cursor-pointer">
              <Plus size={16} color="white" />
              Add members
            </button>
          </div>
        </div>
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
                      key={`${row?.id}-${row?.user?.id}-${idx}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-500">{row?.id}</td>
                      <td className="px-4 py-3 text-gray-500">{row?.tank_name}</td>
                      <td className="px-4 py-3 text-gray-500">{row?.user?.name}</td>
                      <td className="px-4 py-3 text-gray-500">{row?.user?.phone}</td>
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
      </div>

      <EditMembersModal openModal={openModal} setOpenModal={setOpenModal} />
    </>
  );
};

export default SmsLogTable;
