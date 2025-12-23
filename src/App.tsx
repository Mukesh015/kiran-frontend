// src/App.tsx
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import Dashboard from "./components/Dashboard";
import Analytics from "./components/Analytics";
import TanksParameters from "./components/TanksParameters";
import Notifications from "./components/Notifications";
// import Reports from "./components/Reports";
import ReportLogPage from "./components/ReportLogPage";
import SMSLogs from "./components/SMSLogs";


export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/tanks-parameters" element={<TanksParameters />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/report/offline-logs" element={<ReportLogPage />} />
        <Route path="/report/sms-logs" element={<SMSLogs />} />
      </Routes>
    </Layout>
  );
}
