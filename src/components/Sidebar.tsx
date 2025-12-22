import {
  LayoutDashboard,
  BarChart3,
  Cpu,
  FileText,
  Bell,
  ChevronDown,
} from "lucide-react";
import clsx from "clsx";
import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import waterlogo from "../assets/waterlogo.png";

/* =======================
   NAV CONFIG
======================= */
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
  {
    id: "reports",
    label: "Reports",
    icon: FileText,
    subMenu: [
      {
        id: "offline_logs",
        label: "Offline Logs",
        icon: FileText,
        path: "/report/offline-logs",
      },
    ],
  },
];

interface SidebarProps {
  horizontal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  horizontal,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const location = useLocation();

  /* =======================
     SUBMENU STATE
  ======================= */
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // auto-open submenu if a child route is active
  useEffect(() => {
    const activeParents: Record<string, boolean> = {};

    NAV.forEach((item) => {
      if (item.subMenu) {
        const isChildActive = item.subMenu.some((sub) =>
          location.pathname.startsWith(sub.path)
        );
        if (isChildActive) activeParents[item.id] = true;
      }
    });

    setOpenMenus((prev) => ({ ...prev, ...activeParents }));
  }, [location.pathname]);

  const toggleMenu = (id: string) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /* =======================
     HORIZONTAL MODE
  ======================= */
  if (horizontal) {
    return (
      <nav className="flex flex-wrap items-center justify-center gap-2 py-2 px-3">
        {NAV.filter((n) => n.path).map(({ id, label, icon: Icon, path }) => (
          <NavLink
            key={id}
            to={path!}
            end={path === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition",
                isActive
                  ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-md"
                  : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
              )
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    );
  }

  /* =======================
     VERTICAL SIDEBAR
  ======================= */
  return (
    <aside
      className={clsx(
        "p-3 space-y-1 border-r border-white/10 bg-[#0f2a44] h-screen transition-transform duration-300",
        "fixed inset-y-0 left-0 w-64 z-50 lg:z-40 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* HEADER */}
      <div className="hidden lg:flex items-center gap-3 px-3 py-4 mb-2 border-b border-white/10">
        <img src={waterlogo} alt="Smart Aqua Sense" className="w-6 h-6" />
        <div>
          <div className="font-semibold text-white text-[15px]">
            Smart Aqua Sense System
          </div>
          <div className="text-[11px] text-white/70">
            Real-Time Water Monitoring
          </div>
        </div>
      </div>

      {/* MOBILE CLOSE */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 lg:hidden text-white/80 hover:text-white"
      >
        ✕
      </button>

      {/* =======================
          MENU ITEMS
      ======================= */}
      {NAV.map(({ id, label, icon: Icon, path, subMenu }) => {
        const isOpenMenu = openMenus[id];

        return (
          <div key={id}>
            {/* MAIN ITEM */}
            {subMenu ? (
              <button
                onClick={() => toggleMenu(id)}
                className={clsx(
                  "w-full flex items-center justify-between px-3 py-3 rounded-xl transition text-left",
                  isOpenMenu
                    ? "bg-white/5 text-white"
                    : "text-white/80 hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span className="text-sm">{label}</span>
                </div>
                <ChevronDown
                  size={16}
                  className={clsx(
                    "transition-transform",
                    isOpenMenu && "rotate-180"
                  )}
                />
              </button>
            ) : (
              <NavLink
                to={path!}
                end={path === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition",
                    isActive
                      ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-md"
                      : "text-white/80 hover:bg-white/5"
                  )
                }
              >
                <Icon size={18} />
                <span className="text-sm">{label}</span>
              </NavLink>
            )}

            {/* SUB MENU */}
            {subMenu && isOpenMenu && (
              <div className="ml-6 mt-1 space-y-1 border-l border-white/10 pl-3">
                {subMenu.map(({ id, label, icon: SubIcon, path }) => (
                  <NavLink
                    key={id}
                    to={path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      clsx(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition",
                        isActive
                          ? "bg-white/10 text-cyan-400"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      )
                    }
                  >
                    <SubIcon size={14} />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}
