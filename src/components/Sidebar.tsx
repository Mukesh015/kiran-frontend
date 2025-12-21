import {
  LayoutDashboard,
  BarChart3,
  Cpu,
  FileText,
  Bell,
} from "lucide-react";
import clsx from "clsx";
import { NavLink } from "react-router-dom";
import waterlogo from "../assets/waterlogo.png";


const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics" },
  {
    id: "tank_config",
    label: "Tanks Parameters",
    icon: Cpu,
    path: "/tanks-parameters",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    path: "/notifications",
  },
  { id: "reports", label: "Reports", icon: FileText, path: "/reports" },
];

interface SidebarProps {
  horizontal?: boolean;
  /** For mobile / tab – controls slide-in */
  isOpen?: boolean;
  /** Called when a nav item is clicked (used to close sidebar on mobile) */
  onClose?: () => void;
}

export default function Sidebar({
  horizontal,
  isOpen = false,
  onClose,
}: SidebarProps) {
  // 🔹 Horizontal bar version (below Topbar, if ever needed)
  if (horizontal) {
    return (
      <nav className="flex flex-wrap items-center justify-center gap-2 py-2 px-3">
        {NAV.map(({ id, label, icon: Icon, path }) => (
          <NavLink
            key={id}
            to={path}
            end={path === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition",
                isActive
                  ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-md pt-5"
                  : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={clsx(
                    isActive ? "text-white" : "text-gray-500 dark:text-gray-400"
                  )}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    );
  }

  // 🔹 Vertical layout
  // - Mobile / Tab: fixed overlay from LEFT, hidden by default (no layout space)
  // - Desktop: static in flex row, always visible
  return (
    <aside
      className={clsx(
        "p-3 space-y-1 border-r border-white/10 bg-[#0f2a44] h-screen transition-transform duration-300",

        // Positioning (UI only)
        "fixed inset-y-0 left-0 w-64 z-50 lg:z-40 lg:fixed lg:translate-x-0",


        // Slide-in animation (mobile only)
        isOpen
          ? "translate-x-0"
          : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* SIDEBAR HEADER — DESKTOP ONLY */}
      <div className="hidden lg:flex items-center gap-3 px-3 py-4 mb-2 border-b border-white/10">
        <img
          src={waterlogo}
          alt="Smart Aqua Sense"
          className="w-4 h-4 rounded-lg object-contain"
        />

        <div className="leading-tight">
          <div className="font-semibold text-base text-white text-[15px]">
            Smart Aqua Sense System
          </div>
          <div className="text-[11px] text-white/80">
            Real-Time Water Monitoring
          </div>
        </div>
      </div>

      {/* ❌ Mobile close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 lg:hidden text-white/80 hover:text-white"
        aria-label="Close sidebar"
      >
        ✕
      </button>



      {/* MENU ITEMS (UNCHANGED) */}
      {NAV.map(({ id, label, icon: Icon, path }) => (
        <NavLink
          key={id}
          to={path}
          end={path === "/"}
          onClick={onClose}
          className={({ isActive }) =>
            clsx(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition pt-4 pb-4",
              isActive
                ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-md mt-5"
                : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                size={18}
                className={clsx(
                  isActive ? "text-white" : "text-white"
                )}
              />
              <span className="text-sm text-white">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </aside>
  );

}
