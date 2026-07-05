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
  ShieldCheck,
  Settings,
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

import type { AdminRole } from "@/types";

type NavItem = {
  title: string;
  url: string;
  icon: any;
  isActive?: boolean;
  allowedAdminRoles?: AdminRole[];
  items?: Omit<NavItem, "icon" | "items">[];
};

const navMainItems: NavItem[] = [
  {
    title: "لوحة التحكم",
    url: "/",
    icon: LayoutDashboard,
    isActive: true,
    allowedAdminRoles: ["super_admin", "dean", "student_affairs"],
  },
  {
    title: "الموظفون والصلاحيات",
    url: "/employees",
    icon: ShieldCheck,
    allowedAdminRoles: ["super_admin"],
    items: [
      {
        title: "جميع الموظفين",
        url: "/employees",
      },
      {
        title: "إضافة موظف",
        url: "/employees/new",
      },
    ],
  },
  {
    title: "الكليات",
    url: "/specializations",
    icon: Building2,
    allowedAdminRoles: ["super_admin"],
    items: [
      {
        title: "جميع الكليات",
        url: "/specializations",
        allowedAdminRoles: ["super_admin"],
      },
      {
        title: "إضافة كلية",
        url: "/specializations/new",
        allowedAdminRoles: ["super_admin"],
      },
    ],
  },
  {
    title: "القاعات",
    url: "/halls",
    icon: DoorOpen,
    allowedAdminRoles: ["super_admin"],
    items: [
      {
        title: "جميع القاعات",
        url: "/halls",
        allowedAdminRoles: ["super_admin"],
      },
      {
        title: "إضافة قاعة",
        url: "/halls/new",
        allowedAdminRoles: ["super_admin"],
      },
      {
        title: "نقاط الوصول",
        url: "/halls/access-points",
        allowedAdminRoles: ["super_admin"],
      },
    ],
  },
  {
    title: "الدكاترة",
    url: "/doctors",
    icon: UserCog,
    allowedAdminRoles: ["super_admin", "student_affairs"],
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
    allowedAdminRoles: ["super_admin", "student_affairs"],
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
    allowedAdminRoles: ["super_admin", "student_affairs"],
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
    allowedAdminRoles: ["super_admin", "student_affairs"],
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
    allowedAdminRoles: ["super_admin", "dean", "student_affairs"],
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
        title: "طلاب متعثرون",
        url: "/attendance/at-risk",
      },
    ],
  },
  {
    title: "إعدادات النظام",
    url: "/settings",
    icon: Settings,
    allowedAdminRoles: ["super_admin"],
  },
  {
    title: "المساعد الأكاديمي",
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

  const userAdminRole = user?.adminRole as AdminRole | undefined;

  const navItems = navMainItems
    .filter((item) => {
      // If no roles specified, it's public for all admins (e.g. AI Chat)
      if (!item.allowedAdminRoles) return true;
      // If user doesn't have an adminRole (legacy) or has a role that isn't allowed, hide it
      if (!userAdminRole || !item.allowedAdminRoles.includes(userAdminRole)) return false;
      return true;
    })
    .map((item) => {
      // Filter sub-items if they exist and have allowedAdminRoles
      const filteredItems = item.items?.filter((subItem) => {
        if (!subItem.allowedAdminRoles) return true;
        if (!userAdminRole || !subItem.allowedAdminRoles.includes(userAdminRole)) return false;
        return true;
      });

      return {
        ...item,
        items: filteredItems?.length ? filteredItems : undefined,
        isActive:
          location.pathname === item.url ||
          filteredItems?.some((subItem) => location.pathname === subItem.url),
      };
    });

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
                  <span className="truncate text-xs font-black text-foreground font-sans">
                    MAC-Based Automated
                  </span>
                  <span className="truncate text-[10px] text-muted-foreground font-semibold">
                    Attendance System
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
