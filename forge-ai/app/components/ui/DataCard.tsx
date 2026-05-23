"use client";

import React from "react";
import { cn } from "@/app/utils/cn";

interface DataCardProps {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaType?: "up-good" | "up-bad" | "down-good" | "down-bad" | "neutral";
  subtext?: string;
  icon?: React.ReactNode;
  alert?: boolean;     // red left border
  active?: boolean;    // amber left border
  children?: React.ReactNode;
  className?: string;
}

function getDeltaClasses(type?: DataCardProps["deltaType"]): string {
  switch (type) {
    case "up-good":
    case "down-good":
      return "text-[#22C55E] bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)]";
    case "up-bad":
    case "down-bad":
      return "text-[#EF4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)]";
    default:
      return "text-[#6B7280] bg-[rgba(107,114,128,0.08)] border border-[rgba(107,114,128,0.2)]";
  }
}

export default function DataCard({
  label,
  value,
  unit,
  delta,
  deltaType,
  subtext,
  icon,
  alert,
  active,
  children,
  className,
}: DataCardProps) {
  const leftBorder = alert
    ? "border-l-[3px] border-l-[#EF4444]"
    : active
    ? "border-l-[3px] border-l-[#F59E0B]"
    : "";

  return (
    <div
      className={cn(
        "relative flex flex-col gap-1 rounded-[8px] px-6 py-5 cursor-default",
        "transition-colors duration-150",
        "border border-[var(--border)] hover:border-[var(--border-strong)]",
        "hover:bg-[var(--bg-elevated)]",
        leftBorder,
        className
      )}
      style={{ background: "var(--bg-surface)", minHeight: 120 }}
    >
      {/* Row 1: Label + Icon */}
      <div className="flex items-center justify-between">
        <span
          className="card-title"
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </span>
        {icon && (
          <span style={{ color: "var(--text-muted)", width: 16, height: 16 }}>
            {icon}
          </span>
        )}
      </div>

      {/* Row 2: Value + Unit */}
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <span
          className="kpi-number"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 28,
            fontWeight: 300,
            color: "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              fontWeight: 400,
              color: "var(--text-secondary)",
            }}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Row 3: Delta + Subtext */}
      {(delta || subtext) && (
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {delta && (
            <span
              className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded-[3px]",
                getDeltaClasses(deltaType)
              )}
            >
              {delta}
            </span>
          )}
          {subtext && (
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {subtext}
            </span>
          )}
        </div>
      )}

      {/* Row 4: Children slot (sparkline, progress bar, etc.) */}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
