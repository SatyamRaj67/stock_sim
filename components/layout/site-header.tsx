"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import ThemeToggle from "@/components/layout/theme-toggle";
import { usePathname } from "next/navigation";

function formatPathname(pathname: string): string {
  // ... existing formatPathname function ...
  if (!pathname || pathname === "/") return "";

  const segments = pathname.replace(/^\/|\/$/g, "").split("/");

  const capitalizedSegments = segments.map((segment) => {
    if (segment.length === 0) return "";
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  });

  return " / " + capitalizedSegments.join(" / ");
}

export function SiteHeader() {
  const path = usePathname();
  const pathName = formatPathname(path);
  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b transition-[height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-[var(--header-height-collapsed)]">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="truncate text-base font-medium">App{pathName}</h1>{" "}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
