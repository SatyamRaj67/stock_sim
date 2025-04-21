import {
  TbBuildingStore,
  TbCashRegister,
  TbChartBar,
  TbDashboard,
  TbFileDescription,
  TbHelp,
  TbReport,
  TbReportAnalytics,
  TbSettings,
  TbTerminal,
} from "react-icons/tb";

export const navData = {
  navMain: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: TbDashboard,
    },
    {
      title: "Market",
      href: "/market",
      icon: TbChartBar,
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: TbReportAnalytics,
    },
    {
      title: "Transactions",
      href: "/transactions",
      icon: TbCashRegister,
    },
  ],
  navAdmin: [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: TbTerminal,
    },
    {
      title: "Watchlist",
      href: "/admin/watchlist",
      icon: TbFileDescription,
    },
    {
      title: "Reports",
      href: "/admin/reports",
      icon: TbReport,
    },
    {
      title: "Market",
      href: "/admin/market",
      icon: TbBuildingStore,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: TbSettings,
    },
    {
      title: "Get Help",
      url: "/help",
      icon: TbHelp,
    },
  ],
};
