"use client";

import * as React from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "./app-sidebar";
import { DemoBanner } from "./demo-banner";
import { MobileTabBar } from "./mobile-nav";
import { Topbar } from "./topbar";

const COLLAPSE_KEY = "h2.sidebar.collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // ignorera
    }
  }, []);

  const toggle = () =>
    setCollapsed((prev) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, prev ? "0" : "1");
      } catch {
        // ignorera
      }
      return !prev;
    });

  return (
    <TooltipProvider>
      <div className="flex min-h-svh">
        <AppSidebar collapsed={collapsed} onToggle={toggle} />
        <div className="flex min-w-0 flex-1 flex-col">
          <DemoBanner />
          <Topbar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-24 md:px-8 md:pt-8 md:pb-10">{children}</main>
        </div>
      </div>
      <MobileTabBar />
    </TooltipProvider>
  );
}
