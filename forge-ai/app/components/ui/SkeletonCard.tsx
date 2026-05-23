"use client";

import React from "react";
import { cn } from "@/app/utils/cn";

interface SkeletonCardProps {
  height?: number;
  className?: string;
}

export function SkeletonCard({ height = 120, className }: SkeletonCardProps) {
  return (
    <div
      className={cn("rounded-[8px] border border-[var(--border)]", "skeleton-shimmer", className)}
      style={{ height, background: "var(--bg-surface)" }}
    />
  );
}

export function SkeletonBlock({ height = 32, className }: { height?: number; className?: string }) {
  return (
    <div
      className={cn("rounded-[4px] skeleton-shimmer", className)}
      style={{ height, background: "var(--bg-elevated)" }}
    />
  );
}

export function SkeletonChart({ height = 300, className }: { height?: number; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[8px] border border-[var(--border)] p-5 flex flex-col gap-3",
        className
      )}
      style={{ height, background: "var(--bg-surface)" }}
    >
      <SkeletonBlock height={14} className="w-40" />
      <SkeletonBlock height={10} className="w-64" />
      <div className="flex-1 skeleton-shimmer rounded mt-2" style={{ background: "var(--bg-elevated)" }} />
    </div>
  );
}

export default SkeletonCard;
