"use client";

import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Building2,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardCheck,
  LayoutDashboard,
  DoorOpen,
  Wifi,
  UserCog,
  Sparkles,
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
    title: "الأقسام",
    url: "/departments",
    icon: Building2,
    items: [
      {
        title: "جميع الأقسام",
        url: "/departments",
      },
      {
        title: "إضافة قسم",
        url: "/departments/new",
      },
    ],
  },
  {
    title: "القاعات",
    url: "/halls",
    icon: DoorOpen,
    items: [
      {
        title: "جميع القاعات",
        url: "/halls",
      },
      {
        title: "إضافة قاعة",
        url: "/halls/new",
      },
      {
        title: "نقاط الوصول",
        url: "/halls/access-points",
      },
    ],
  },
  {
    title: "الدكاترة",
    url: "/doctors",
    icon: UserCog,
    items: [
      {
        title: "جميع الدكاترة",
        url: "/doctors",
      },
      {
        title: "إضافة دكتور",
        url: "/doctors/new",
      },
    ],
  },
  {
    title: "الطلاب",
    url: "/students",
    icon: GraduationCap,
    items: [
      {
        title: "جميع الطلاب",
        url: "/students",
      },
      {
        title: "إضافة طالب",
        url: "/students/new",
      },
      {
        title: "استيراد طلاب",
        url: "/students/import",
      },
      {
        title: "طلبات تغيير الجهاز",
        url: "/students/device-requests",
      },
    ],
  },
  {
    title: "المواد الدراسية",
    url: "/courses",
    icon: BookOpen,
    items: [
      {
        title: "جميع المواد",
        url: "/courses",
      },
      {
        title: "إضافة مادة",
        url: "/courses/new",
      },
    ],
  },
  {
    title: "المحاضرات",
    url: "/lectures",
    icon: Calendar,
    items: [
      {
        title: "جميع المحاضرات",
        url: "/lectures",
      },
      {
        title: "جدولة المحاضرات",
        url: "/lectures/schedule",
      },
      {
        title: "محاضرات اليوم",
        url: "/lectures/today",
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
        title: "🔴 مباشر",
        url: "/attendance/live",
      },
      {
        title: "التقارير",
        url: "/attendance/reports",
      },
      {
        title: "طلاب متعثرون",
        url: "/attendance/at-risk",
      },
    ],
  },
  {
    title: "المساعد الذكي",
    url: "/ai-chat",
    icon: Sparkles,
  },
];

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const userName =
    typeof user?.name === "object"
      ? `${user.name.first} ${user.name.last}`
      : user?.name || "مدير النظام";

  const userData = {
    name: userName,
    email: user?.email || "",
    avatar: "",
  };

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
      className="border-r p-0"
      {...props}
    >
      <SidebarHeader className="md:p-4">
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
                    لوحة تحكم الإدارة
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
