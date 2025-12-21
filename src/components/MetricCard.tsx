import type { ReactNode } from "react";
import clsx from "clsx";

type Variant = "blue" | "green" | "purple" | "red" | "plain";

export default function MetricCard({
  title,
  value,
  trend,
  icon,
  variant = "plain",
}: {
  title: string;
  value: string | number;
  trend?: string;
  icon?: ReactNode;
  variant?: Variant;
}) {
  const tone = {
    blue: "bg-cyan-50 text-cyan-900 dark:bg-cyan-500/10",
    green: "bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10",
    purple: "bg-violet-50 text-violet-900 dark:bg-violet-500/10",
    red: "bg-rose-50 text-rose-900 dark:bg-rose-500/10",
    plain: "bg-[rgb(var(--card))]",
  }[variant];

  return (
    <div className={clsx("card p-4", tone)}>
      <div className="flex items-center justify-between">
        <div className="text-xl opacity-80">{title}</div>
        {icon}
      </div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      {trend && <div className="mt-1 text-xl opacity-80">{trend}</div>}
    </div>
  );
}
