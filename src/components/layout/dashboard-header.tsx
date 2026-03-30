"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Bell, Menu, Search, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/layout/dashboard-sidebar";
import { getEntityType, getEntityInfo, type EntityType } from "@/lib/tax/plan-store";

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Your financial command center",
  },
  "/dashboard/smart-plan": {
    title: "Smart Plan",
    subtitle: "AI-powered personalized tax planning",
  },
  "/dashboard/tax-chat": {
    title: "Tax Chat",
    subtitle: "AI-powered tax conversations",
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
    subtitle: "AI-powered tax review",
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
  const [entityType, setEntityType] = useState<EntityType | null>(null);

  useEffect(() => {
    setEntityType(getEntityType());
    // Listen for storage changes (entity type set in Smart Plan)
    const handler = () => setEntityType(getEntityType());
    window.addEventListener("storage", handler);
    // Also poll briefly since storage events don't fire in same tab
    const interval = setInterval(handler, 2000);
    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(interval);
    };
  }, []);

  const entityInfo = entityType ? getEntityInfo(entityType) : null;

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 bg-[#131318]/80 px-4 backdrop-blur-md md:px-8">
      {/* Mobile menu trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white md:hidden"
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
          <h1 className="text-2xl font-bold text-white">{title}</h1>
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
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            placeholder="Search..."
            className="h-10 w-48 rounded-full bg-[#1B1B20] pl-10 pr-4 text-sm text-slate-300 outline-none ring-1 ring-white/5 transition-all placeholder:text-slate-600 focus:w-64 focus:ring-orange-500/30 lg:w-64 lg:focus:w-80"
          />
        </div>

        {/* Notification bell */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#1B1B20] text-slate-400 ring-1 ring-white/5 transition-colors hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-[#131318]" />
          <span className="sr-only">Notifications</span>
        </button>

        {/* User button */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-9 w-9 ring-2 ring-slate-700",
            },
          }}
        />
      </div>
    </header>
  );
}
