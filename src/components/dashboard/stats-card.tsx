"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  color = "#4CD6FB",
}: StatsCardProps) {
  return (
    <div className="glass-panel p-6 rounded-xl">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#C7C5D3] uppercase tracking-widest">
            {title}
          </p>
          <p className="text-3xl font-extrabold tracking-tighter text-[#E4E1E9]">
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                trendUp
                  ? "bg-[#FFB596]/10 text-[#FFB596]"
                  : "bg-[#FFB4AB]/10 text-[#FFB4AB]"
              )}
            >
              {trendUp ? "\u2191" : "\u2193"} {trend}
            </span>
          )}
        </div>
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: `${color}10` }}
        >
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
      </div>
    </div>
  );
}
