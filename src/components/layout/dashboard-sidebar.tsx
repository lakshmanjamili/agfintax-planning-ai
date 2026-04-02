"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Brain,
  TrendingUp,
  User,
  Settings,
  Sparkles,
  Building2,
  Newspaper,
  Video,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getEntityType, getEntityInfo, type EntityType } from "@/lib/tax/plan-store";
import { useTheme } from "@/lib/theme-context";

const mainNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Smart Plan", icon: Sparkles, href: "/dashboard/smart-plan" },
  { label: "Strategies", icon: TrendingUp, href: "/dashboard/strategies" },
  { label: "Tax Chat", icon: Brain, href: "/dashboard/tax-chat" },
  { label: "Blog", icon: Newspaper, href: "/dashboard/blog" },
  { label: "Videos", icon: Video, href: "/dashboard/content" },
];

const bottomNavItems = [
  { label: "Build Profile", icon: User, href: "/dashboard/profile" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export function SidebarContent() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [entityType, setEntityType] = useState<EntityType | null>(null);

  useEffect(() => {
    setEntityType(getEntityType());
    const interval = setInterval(() => {
      const current = getEntityType();
      setEntityType((prev) => (prev === current ? prev : current));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const entityInfo = entityType ? getEntityInfo(entityType) : null;

  const isDark = theme === "dark";

  const renderNavItem = (item: (typeof mainNavItems)[0]) => {
    const isActive =
      item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(item.href);

    return (
      <Link key={item.href} href={item.href}>
        <div
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive
              ? "bg-gradient-to-r from-orange-600 to-orange-400 text-white shadow-lg shadow-orange-900/20"
              : isDark
                ? "text-slate-400 hover:translate-x-1 hover:bg-slate-800/50 hover:text-slate-100"
                : "text-slate-500 hover:translate-x-1 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          {item.label}
        </div>
      </Link>
    );
  };

  return (
    <div className={cn(
      "flex h-full flex-col transition-colors duration-300",
      isDark ? "bg-[#131318]" : "bg-white border-r border-slate-200"
    )}>
      {/* Logo — links to home page */}
      <Link href="/" className="block px-6 pb-6 pt-8 hover:opacity-90 transition-opacity">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-orange-400 shadow-lg shadow-orange-900/30">
            <span className="text-sm font-extrabold text-white">AG</span>
          </div>
          <div>
            <h1 className={cn("text-xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
              AgFinTax
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-orange-500">
              AI Financial Architect
            </p>
          </div>
        </div>
      </Link>

      {/* Entity Type Badge */}
      {entityInfo && (
        <Link href="/dashboard/smart-plan">
          <div
            className="mx-4 mb-4 flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all hover:opacity-80"
            style={{ backgroundColor: `${entityInfo.color}${isDark ? "10" : "08"}`, borderLeft: `3px solid ${entityInfo.color}` }}
          >
            <Building2 className="h-4 w-4 shrink-0" style={{ color: entityInfo.color }} />
            <div className="flex-1 min-w-0">
              <p className={cn("text-xs font-bold truncate", isDark ? "text-slate-200" : "text-slate-700")}>{entityInfo.label}</p>
              <p className={cn("text-[10px]", isDark ? "text-slate-500" : "text-slate-400")}>Form {entityInfo.formNumber}</p>
            </div>
          </div>
        </Link>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        <p className={cn("mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider", isDark ? "text-slate-600" : "text-slate-400")}>
          Main Menu
        </p>
        {mainNavItems.map(renderNavItem)}
      </nav>

      {/* Bottom Section */}
      <div className={cn("mt-auto border-t px-3 pt-4", isDark ? "border-slate-800/50" : "border-slate-200")}>
        {/* Bottom nav items */}
        <div className="space-y-1">
          {bottomNavItems.map(renderNavItem)}
        </div>

        {/* Dark / Light Mode Toggle */}
        <div className="mx-1 my-3">
          <div className={cn(
            "flex items-center rounded-xl p-1 transition-colors duration-300",
            isDark ? "bg-slate-800/50" : "bg-slate-100"
          )}>
            <button
              onClick={() => { if (theme !== "light") toggleTheme(); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all duration-300",
                !isDark
                  ? "bg-white text-slate-900 shadow-sm"
                  : isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Sun className="w-3.5 h-3.5" />
              Light
            </button>
            <button
              onClick={() => { if (theme !== "dark") toggleTheme(); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all duration-300",
                isDark
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Moon className="w-3.5 h-3.5" />
              Dark
            </button>
          </div>
        </div>

        {/* Upgrade / Pro Plan Card */}
        <div className={cn(
          "mx-1 my-4 rounded-xl p-4 ring-1 transition-colors duration-300",
          isDark
            ? "bg-gradient-to-br from-orange-600/20 to-orange-400/10 ring-orange-500/20"
            : "bg-gradient-to-br from-orange-50 to-orange-100/50 ring-orange-200"
        )}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold text-orange-500">
              Pro Plan
            </span>
          </div>
          <p className={cn("mt-1.5 text-xs leading-relaxed", isDark ? "text-slate-400" : "text-slate-500")}>
            Unlock advanced AI strategies and priority support.
          </p>
          <button className="mt-3 w-full rounded-lg bg-gradient-to-r from-orange-600 to-orange-400 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-orange-900/20 transition-all hover:shadow-orange-900/40">
            Upgrade to Pro
          </button>
        </div>

        {/* User section */}
        <div className={cn("border-t pb-4 pt-4", isDark ? "border-slate-800/50" : "border-slate-200")}>
          <div className="flex items-center gap-3 px-2">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: cn("h-9 w-9 ring-2", isDark ? "ring-slate-700" : "ring-slate-200"),
                },
              }}
            />
            <div className="flex-1 text-sm">
              <p className={cn("font-medium", isDark ? "text-slate-200" : "text-slate-700")}>My Account</p>
              <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>Manage profile</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40">
      <SidebarContent />
    </aside>
  );
}
