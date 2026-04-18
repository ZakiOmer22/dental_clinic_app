import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: "blue" | "green" | "yellow" | "red";
}

const colorMap = {
  blue:   { bg: "bg-primary-50",       icon: "text-primary-600",  iconBg: "bg-primary-100" },
  green:  { bg: "bg-accent-400/10",    icon: "text-accent-600",   iconBg: "bg-accent-400/20" },
  yellow: { bg: "bg-warn-400/10",      icon: "text-warn-500",     iconBg: "bg-warn-400/20" },
  red:    { bg: "bg-danger-400/10",    icon: "text-danger-600",   iconBg: "bg-danger-400/20" },
};

export default function StatCard({ label, value, icon: Icon, trend, trendUp, color = "blue" }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`card flex items-center gap-4`}>
      <div className={`${c.iconBg} ${c.icon} p-3 rounded-xl`}>
        <Icon size={22} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-surface-700/50">{label}</p>
        <p className="text-2xl font-bold text-surface-800 mt-0.5">{value}</p>
        {trend && (
          <p className={`text-xs mt-0.5 font-medium ${trendUp ? "text-accent-600" : "text-danger-500"}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
