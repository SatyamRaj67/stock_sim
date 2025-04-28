"use client";

import * as React from "react";

import { TbInnerShadowTop } from "react-icons/tb";

import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { NavMain } from "@/components/layout/nav-main";
import { NavSecondary } from "@/components/layout/nav-secondary";
import { NavUser } from "@/components/layout/nav-user";
import { NavAdmin } from "@/components/layout/nav-admin";

import { useCurrentUser } from "@/hooks/useCurrentUser";

import { navData } from "@/data/nav-data";
import { RoleGate } from "../auth/role-gate";
import { UserRole } from "@prisma/client";
import { usePathname } from "next/navigation";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useCurrentUser();

  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              onClick={handleLinkClick}
              isActive={pathname === "/"}
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <TbInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">SmartStock</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
        <RoleGate allowedRoles={UserRole.SUPER_ADMIN || UserRole.ADMIN}>
          <NavAdmin items={navData.navAdmin} />
        </RoleGate>

        <NavSecondary items={navData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
