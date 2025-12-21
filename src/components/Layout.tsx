import type { ReactNode } from "react";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useDarkMode } from "../hook/useDarkMode";

export default function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { dark, setDark } = useDarkMode();

  const handleToggleSidebar = () => setOpen((prev) => !prev);
  const handleCloseSidebar = () => setOpen(false);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">

        {/* SIDEBAR */}
        <Sidebar isOpen={open} onClose={handleCloseSidebar} />

        {/* RIGHT SIDE (Topbar + Content + Footer) */}
        <div className="flex flex-col min-h-screen lg:ml-64">

          {/* TOPBAR */}
          <Topbar
            onMenuClick={handleToggleSidebar}
            dark={dark}
            toggleDark={() => setDark(!dark)}
          />

          {/* MAIN CONTENT */}
          <main className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="mx-auto max-w-[1400px]">{children}</div>
          </main>

          {/* FOOTER */}
          <footer className="border-t border-gray-200/70 dark:border-white/10">
            <div className="mx-auto max-w-[1400px] px-4 py-3 text-xs text-gray-500">
              © {new Date().getFullYear()} Plumule Research LLP • Industrial IoT
            </div>
          </footer>

        </div>
      </div>
    </div>
  );

}
