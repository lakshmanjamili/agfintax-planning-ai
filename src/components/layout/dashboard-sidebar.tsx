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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getEntityType, getEntityInfo, type EntityType } from "@/lib/tax/plan-store";

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
              : "text-slate-400 hover:translate-x-1 hover:bg-slate-800/50 hover:text-slate-100"
          )}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          {item.label}
        </div>
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col bg-[#131318]">
      {/* Logo */}
      <div className="px-6 pb-6 pt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-orange-400 shadow-lg shadow-orange-900/30">
            <span className="text-sm font-extrabold text-white">AG</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">
              AgFinTax
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-orange-500">
              AI Financial Architect
            </p>
          </div>
        </div>
      </div>

      {/* Entity Type Badge */}
      {entityInfo && (
        <Link href="/dashboard/smart-plan">
          <div
            className="mx-4 mb-4 flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all hover:opacity-80"
            style={{ backgroundColor: `${entityInfo.color}10`, borderLeft: `3px solid ${entityInfo.color}` }}
          >
            <Building2 className="h-4 w-4 shrink-0" style={{ color: entityInfo.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{entityInfo.label}</p>
              <p className="text-[10px] text-slate-500">Form {entityInfo.formNumber}</p>
            </div>
          </div>
        </Link>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
          Main Menu
        </p>
        {mainNavItems.map(renderNavItem)}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto border-t border-slate-800/50 px-3 pt-4">
        {/* Bottom nav items */}
        <div className="space-y-1">
          {bottomNavItems.map(renderNavItem)}
        </div>

        {/* Upgrade / Pro Plan Card */}
        <div className="mx-1 my-4 rounded-xl bg-gradient-to-br from-orange-600/20 to-orange-400/10 p-4 ring-1 ring-orange-500/20">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-400" />
            <span className="text-sm font-semibold text-orange-400">
              Pro Plan
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            Unlock advanced AI strategies and priority support.
          </p>
          <button className="mt-3 w-full rounded-lg bg-gradient-to-r from-orange-600 to-orange-400 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-orange-900/20 transition-all hover:shadow-orange-900/40">
            Upgrade to Pro
          </button>
        </div>

        {/* User section */}
        <div className="border-t border-slate-800/50 pb-4 pt-4">
          <div className="flex items-center gap-3 px-2">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 ring-2 ring-slate-700",
                },
              }}
            />
            <div className="flex-1 text-sm">
              <p className="font-medium text-slate-200">My Account</p>
              <p className="text-xs text-slate-500">Manage profile</p>
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
