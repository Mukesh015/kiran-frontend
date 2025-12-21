// src/App.tsx
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import Dashboard from "./components/Dashboard";
import Analytics from "./components/Analytics";
import TanksParameters from "./components/TanksParameters";
import Notifications from "./components/Notifications";
import Reports from "./components/Reports";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/tanks-parameters" element={<TanksParameters />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Layout>
  );
}
