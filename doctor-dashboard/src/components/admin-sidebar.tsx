"use client";

import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  ClipboardCheck,
  LayoutDashboard,
  Sparkles,
  GraduationCap,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";

const navMainItems = [
  {
    title: "لوحة التحكم",
    url: "/",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "محاضراتي",
    url: "/my-schedule",
    icon: Calendar,
    items: [
      {
        title: "الجدول الأسبوعي",
        url: "/my-schedule",
      },
      {
        title: "محاضرات اليوم",
        url: "/my-schedule/today",
      },
    ],
  },
  {
    title: "المواد الدراسية",
    url: "/courses",
    icon: BookOpen,
    items: [
      {
        title: "موادي",
        url: "/courses",
      },
    ],
  },
  {
    title: "الحضور والغياب",
    url: "/attendance",
    icon: ClipboardCheck,
    items: [
      {
        title: "سجلات الحضور",
        url: "/attendance",
      },
      {
        title: "طلاب معرضون للحرمان",
        url: "/attendance/at-risk",
      },
      {
        title: "تقارير الحضور",
        url: "/attendance/reports",
      },
    ],
  },
  {
    title: "المساعد الذكي",
    url: "/ai-chat",
    icon: Sparkles,
  },
];

export function DoctorSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Handle name format - could be string or object
  const userName =
    typeof user?.name === "object"
      ? `${user.name.first} ${user.name.last}`
      : user?.name || "الدكتور";

  const userData = {
    name: userName,
    email: user?.email || "",
    avatar: "",
  };

  // Update isActive based on current path
  const navItems = navMainItems.map((item) => ({
    ...item,
    isActive:
      location.pathname === item.url ||
      item.items?.some((subItem) => location.pathname === subItem.url),
  }));

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      side="left"
      className="border-r px-0"
      {...props}
    >
      <SidebarHeader className="md:px-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-transparent active:bg-transparent px-0"
            >
              <Link
                to="/"
                className="flex items-center justify-center group-data-[state=expanded]:justify-start group-data-[state=expanded]:px-3 gap-3"
              >
                <div className="bg-primary/10 text-primary flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg">
                  <GraduationCap className="size-6" />
                </div>
                <div className="grid flex-1 text-right leading-tight group-data-[state=collapsed]:hidden">
                  <span className="truncate font-bold text-lg text-foreground">
                    حضور
                  </span>
                  <span className="truncate text-xs text-muted-foreground font-medium">
                    بوابة الأستاذ
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2 gap-2">
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <NavUser user={userData} onLogout={logout} />
      </SidebarFooter>
    </Sidebar>
  );
}
