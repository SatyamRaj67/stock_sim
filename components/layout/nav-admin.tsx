"use client";

import { type IconType } from "react-icons";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function NavAdmin({
  items,
}: {
  items: {
    title: string;
    href: string;
    icon?: IconType;
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Admin</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link href={item.href}>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  {item.title}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
