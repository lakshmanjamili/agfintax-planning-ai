import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#131318]">
      {/* Sidebar - fixed on desktop, hidden on mobile */}
      <DashboardSidebar />

      {/* Main content area - offset by sidebar width on desktop */}
      <div className="flex min-h-screen flex-col md:ml-64">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
