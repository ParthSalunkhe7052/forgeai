"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Cpu,
  Factory,
  FileText,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ClipboardList,
  X,
} from "lucide-react";
import { cn } from "@/app/utils/cn";
import { useDashboardStore } from "../store/useDashboardStore";

interface SidebarProps {
  className?: string;
}

const menuItems = [
  {
    name: "Executive",
    href: "/cxo",
    icon: BarChart3,
    description: "Business KPIs & Forecasts",
  },
  {
    name: "IT/OT Manager",
    href: "/technical",
    icon: Cpu,
    description: "Infrastructure & Security",
  },
  {
    name: "Factory Floor",
    href: "/floor",
    icon: Factory,
    description: "Digital Twin & Operations",
  },
  {
    name: "Reports Hub",
    href: "/reports",
    icon: FileText,
    description: "Analytical Report Engine",
  },
];

export default function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useDashboardStore();

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] md:hidden transition-opacity duration-300"
        />
      )}

      <aside
        className={cn(
          "fixed md:relative h-screen flex flex-col z-50 md:z-20 transition-all duration-300 ease-in-out",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "w-14" : "w-[200px]",
          className
        )}
        style={{
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
        }}
      >
      {/* Logo area */}
      <div
        className="flex items-center justify-between px-4"
        style={{
          height: 52,
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 18,
              fontWeight: 500,
              color: "var(--accent)",
              letterSpacing: "-0.02em",
              flexShrink: 0,
            }}
          >
            F|A
          </span>
          {!isCollapsed && (
            <div className="flex flex-col leading-none select-none">
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  letterSpacing: "0.06em",
                }}
              >
                FORGE AI
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  color: "var(--text-muted)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                STEEL OPS
              </span>
            </div>
          )}
        </Link>
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="hidden md:block p-1 rounded transition-colors duration-150"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="block md:hidden p-1.5 rounded transition-colors duration-150 hover:bg-[var(--bg-elevated)]"
          style={{ color: "var(--text-muted)" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileSidebarOpen(false)}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-[6px] transition-colors duration-150 relative",
                isActive ? "cursor-default" : "cursor-pointer"
              )}
              style={{
                background: isActive ? "var(--bg-elevated)" : "transparent",
                borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-muted)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--bg-elevated)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-muted)";
                }
              }}
            >
              <Icon
                className="w-5 h-5 flex-shrink-0 transition-colors duration-150"
                style={{ color: isActive ? "var(--accent)" : "inherit" }}
              />
              {!isCollapsed && (
                <div className="flex flex-col min-w-0 select-none">
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "inherit",
                      lineHeight: 1.2,
                    }}
                  >
                    {item.name}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      lineHeight: 1.2,
                      marginTop: 1,
                    }}
                  >
                    {item.description}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <div
          className="p-3 flex justify-center"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1.5 rounded transition-colors duration-150"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer: Plant status + version */}
      {!isCollapsed && (
        <div
          className="p-4"
          style={{ borderTop: "1px solid var(--border)", flexShrink: 0 }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: "var(--status-green)" }}
            />
            <span
              style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)" }}
            >
              System Active
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              Demo Mode — SQLite
            </span>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              v1.0.0
            </span>
          </div>
        </div>
      )}
    </aside>
    </>
  );
}
