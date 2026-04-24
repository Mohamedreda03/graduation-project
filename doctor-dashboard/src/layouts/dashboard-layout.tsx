import { Outlet, useLocation } from "react-router-dom";
import { DoctorSidebar } from "@/components/admin-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ModeToggle } from "@/components/mode-toggle";

export function DashboardLayout() {
  const location = useLocation();
  const isAIChatPage = location.pathname === "/ai-chat";

  return (
    <SidebarProvider>
      <DoctorSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-6 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <SidebarTrigger className="-ms-1" />
          <div className="mr-auto flex items-center gap-2">
            <ModeToggle />
          </div>
        </header>
        <div
          className={`flex flex-1 flex-col gap-6 ${isAIChatPage ? "p-0" : "p-6"}`}
        >
          <Outlet />
        </div>
      </SidebarInset>
      <Toaster position="top-center" richColors />
    </SidebarProvider>
  );
}
