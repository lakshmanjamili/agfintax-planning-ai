"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Bell, Menu, Search, Building2, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/layout/dashboard-sidebar";
import { getEntityType, getEntityInfo, type EntityType } from "@/lib/tax/plan-store";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Your financial command center",
  },
  "/dashboard/smart-plan": {
    title: "Smart Plan",
    subtitle: "Personalized tax planning by AG FinTax",
  },
  "/dashboard/tax-chat": {
    title: "Ask AG",
    subtitle: "Expert tax conversations",
  },
  "/dashboard/documents": {
    title: "Documents",
    subtitle: "Manage your tax documents",
  },
  "/dashboard/strategies": {
    title: "Strategies",
    subtitle: "Tax optimization strategies",
  },
  "/dashboard/savings": {
    title: "Savings",
    subtitle: "Track your tax savings",
  },
  "/dashboard/tax-review": {
    title: "Review",
    subtitle: "Expert tax review",
  },
  "/dashboard/profile": {
    title: "Profile",
    subtitle: "Manage your account",
  },
  "/dashboard/settings": {
    title: "Settings",
    subtitle: "Configure your preferences",
  },
};

function getPageMeta(pathname: string) {
  if (pageMeta[pathname]) return pageMeta[pathname];
  const match = Object.keys(pageMeta)
    .filter((key) => key !== "/dashboard")
    .find((key) => pathname.startsWith(key));
  return match
    ? pageMeta[match]
    : { title: "Dashboard", subtitle: "Your financial command center" };
}

export function DashboardHeader() {
  const pathname = usePathname();
  const { title, subtitle } = getPageMeta(pathname);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [entityType, setEntityType] = useState<EntityType | null>(null);

  useEffect(() => {
    setEntityType(getEntityType());
    const handler = () => setEntityType(getEntityType());
    window.addEventListener("storage", handler);
    const interval = setInterval(handler, 2000);
    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(interval);
    };
  }, []);

  const entityInfo = entityType ? getEntityInfo(entityType) : null;

  return (
    <header className={cn(
      "sticky top-0 z-30 flex h-20 items-center gap-4 px-4 backdrop-blur-md md:px-8 transition-colors duration-300",
      isDark ? "bg-[#131318]/80" : "bg-white/80 border-b border-slate-200/50"
    )}>
      {/* Mobile menu trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "md:hidden",
              isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 border-0 p-0" showCloseButton={false}>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Page title */}
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-slate-900")}>{title}</h1>
          {entityInfo && (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: `${entityInfo.color}15`, color: entityInfo.color }}
            >
              <Building2 className="w-3 h-3" />
              {entityInfo.label} ({entityInfo.formNumber})
            </span>
          )}
        </div>
        <p className={cn("text-sm", isDark ? "text-slate-500" : "text-slate-400")}>{subtitle}</p>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className={cn("absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2", isDark ? "text-slate-500" : "text-slate-400")} />
          <input
            placeholder="Search..."
            className={cn(
              "h-10 w-48 rounded-full pl-10 pr-4 text-sm outline-none ring-1 transition-all focus:w-64 lg:w-64 lg:focus:w-80",
              isDark
                ? "bg-[#1B1B20] text-slate-300 ring-white/5 placeholder:text-slate-600 focus:ring-orange-500/30"
                : "bg-slate-100 text-slate-700 ring-slate-200 placeholder:text-slate-400 focus:ring-orange-500/30"
            )}
          />
        </div>

        {/* Dark / Light Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "flex h-10 items-center gap-2 rounded-full px-3 ring-1 transition-all duration-300",
            isDark
              ? "bg-[#1B1B20] text-slate-400 ring-white/5 hover:text-yellow-300 hover:ring-yellow-500/20"
              : "bg-slate-100 text-slate-500 ring-slate-200 hover:text-slate-700 hover:ring-slate-300"
          )}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="text-xs font-medium hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
        </button>

        {/* Notification bell */}
        <button className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full ring-1 transition-colors",
          isDark
            ? "bg-[#1B1B20] text-slate-400 ring-white/5 hover:text-white"
            : "bg-slate-100 text-slate-500 ring-slate-200 hover:text-slate-700"
        )}>
          <Bell className="h-5 w-5" />
          <span className={cn("absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500 ring-2", isDark ? "ring-[#131318]" : "ring-white")} />
          <span className="sr-only">Notifications</span>
        </button>

        {/* User button */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: cn("h-9 w-9 ring-2", isDark ? "ring-slate-700" : "ring-slate-200"),
            },
          }}
        />
      </div>
    </header>
  );
}
