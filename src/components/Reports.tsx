// src/pages/Reports.tsx
import { useState } from "react";
import {
  Calendar,
  TrendingUp,
  FileText,
  Download,
  FileSpreadsheet,
} from "lucide-react";

type ReportType = "daily" | "weekly" | "monthly";

// ✅ Hard bind API base so it ALWAYS hits your backend directly
// Daily PDF URL becomes:
// http://119.18.62.146:3000/api/reports/daily?format=pdf
const API_BASE = "https://api.plumuleresearch.co.in/api";

export default function Reports() {
  const [loadingReport, setLoadingReport] = useState<ReportType | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------- COMMON DOWNLOAD HELPER ----------
  const downloadFileFromResponse = async (
    response: Response,
    defaultFilename: string
  ) => {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // ---------- PDF REPORT HANDLER ----------
  const handleGenerate = async (type: ReportType) => {
    setError(null);
    setLoadingReport(type);

    try {
      // ✅ Always hits:
      // http://119.18.62.146:3000/api/reports/<type>?format=pdf
      const endpoint = `${API_BASE}/reports/${type}?format=pdf`;

      const response = await fetch(endpoint, { method: "GET" });

      if (!response.ok) {
        throw new Error(`Failed to generate ${type} report`);
      }

      const filename = `${type}_report.pdf`;
      await downloadFileFromResponse(response, filename);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate report");
    } finally {
      setLoadingReport(null);
    }
  };

  // ---------- RAW CSV EXPORT HANDLER ----------
  const handleExportCsv = async () => {
    setError(null);
    setCsvLoading(true);

    try {
      // ✅ Always hits:
      // http://119.18.62.146:3000/api/reports/export-csv
      const endpoint = `${API_BASE}/reports/export-csv`;

      const response = await fetch(endpoint, { method: "GET" });

      if (!response.ok) {
        throw new Error("Failed to export CSV");
      }

      const filename = `raw_transactions.csv`;
      await downloadFileFromResponse(response, filename);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to export CSV");
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports &amp; Export</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate and download system reports
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* Report cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Daily Summary */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
            <Calendar className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Daily Summary
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Snapshot of tank levels, alerts, and usage for the last 24 hours.
          </p>

          <button
            type="button"
            onClick={() => handleGenerate("daily")}
            disabled={loadingReport === "daily"}
            className="mt-6 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="mr-2 h-4 w-4" />
            {loadingReport === "daily" ? "Generating..." : "Generate"}
          </button>
        </div>

        {/* Weekly Analysis */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Weekly Analysis
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Trends in consumption, abnormalities and tank performance by week.
          </p>

          <button
            type="button"
            onClick={() => handleGenerate("weekly")}
            disabled={loadingReport === "weekly"}
            className="mt-6 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="mr-2 h-4 w-4" />
            {loadingReport === "weekly" ? "Generating..." : "Generate"}
          </button>
        </div>

        {/* Monthly Report */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <FileText className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Monthly Report
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            High-level summary for management and audit / compliance review.
          </p>

          <button
            type="button"
            onClick={() => handleGenerate("monthly")}
            disabled={loadingReport === "monthly"}
            className="mt-6 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="mr-2 h-4 w-4" />
            {loadingReport === "monthly" ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* Export Options block */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Export Options</h2>
        <p className="mt-1 text-sm text-gray-500">
          Generate raw data exports for further analysis.
        </p>

        <div className="mt-5 rounded-2xl bg-gray-50 px-5 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">CSV Data</div>
              <div className="mt-1 text-xs text-gray-500">
                Raw data export for further analysis in Excel or other tools.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={csvLoading}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {csvLoading ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}
