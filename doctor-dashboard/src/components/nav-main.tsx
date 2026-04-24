import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-3 pb-2 text-xs font-semibold text-muted-foreground/60">
        القائمة الرئيسية
      </SidebarGroupLabel>
      <SidebarMenu className="gap-0.5">
        {items.map((item) => {
          const isActive =
            location.pathname === item.url ||
            item.items?.some((subItem) =>
              location.pathname.startsWith(subItem.url),
            );

          return (
            <Collapsible key={item.title} asChild defaultOpen={isActive}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  className="h-10 rounded-lg transition-all hover:bg-muted/50 data-[active=true]:bg-primary/5 data-[active=true]:text-primary px-0"
                >
                  <Link to={item.url} className="flex items-center justify-center group-data-[state=expanded]:justify-start group-data-[state=expanded]:px-3 gap-3">
                    <item.icon
                      className="size-4.5 shrink-0"
                    />
                    <span
                      className="text-sm font-medium group-data-[state=collapsed]:hidden"
                    >
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:-rotate-90 transition-transform duration-200">
                        <ChevronLeft className="size-4" />
                        <span className="sr-only">توسيع</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="mr-4 mt-0.5 border-r border-border/50 gap-0.5 pr-2">
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === subItem.url}
                              className="h-8 rounded-md hover:bg-muted/50 data-[active=true]:bg-transparent data-[active=true]:text-primary data-[active=true]:font-semibold"
                            >
                              <Link
                                to={subItem.url}
                                className="flex items-center px-3"
                              >
                                <span className="text-xs">{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
