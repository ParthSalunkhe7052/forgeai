"use client";

import React, { useState, useRef } from "react";
import { HelpCircle, ZoomIn, TrendingUp, Zap, Sparkles } from "lucide-react";
import { useDashboardStore } from "@/app/store/useDashboardStore";
import { cn } from "@/app/utils/cn";
import { InfoPopover, DetailSheet, ActionDialog } from "./Overlays";

interface ContextualMenuProps {
  title: string;
  context: string;
  className?: string;
  variant?: "row" | "dropdown";
  infoContent?: {
    formula?: string;
    source?: string;
    benchmark?: string;
    lastUpdated?: string;
  };
  detailData?: {
    history?: number[];
    labels?: string[];
    unit?: string;
    note?: string;
  };
  scrollTarget?: string;
  actionContent?: string;
}

export default function ContextualMenu({
  title,
  context,
  className,
  variant = "row",
  infoContent,
  detailData,
  scrollTarget,
  actionContent,
}: ContextualMenuProps) {
  const { triggerCopilotAction } = useDashboardStore();
  const [isOpen, setIsOpen] = useState(false);

  // States for custom overlays
  const [infoPopoverRect, setInfoPopoverRect] = useState<DOMRect | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);

  const actions = [
    {
      id: "explain",
      label: "Explain",
      icon: HelpCircle,
      color: "hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/20",
      query: `Explain the current state of "${title}" with context: ${context}. Identify if this matches normal operating baselines.`,
    },
    {
      id: "investigate",
      label: "Investigate",
      icon: ZoomIn,
      color: "hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20",
      query: `Investigate recent anomalies or performance drops for "${title}" (context: ${context}). List potential root causes.`,
    },
    {
      id: "predict",
      label: "Predict",
      icon: TrendingUp,
      color: "hover:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/20",
      query: `Predict future trends or failure probabilities for "${title}" based on context: ${context}.`,
    },
    {
      id: "recommend",
      label: "Recommend",
      icon: Zap,
      color: "hover:text-[var(--accent)] hover:bg-amber-500/10 hover:border-[var(--accent)]/30",
      query: `Recommend corrective decisions or optimizations for "${title}" (context: ${context}). Estimate ROI and business impact.`,
    },
  ];

  const handleAction = (id: string, query: string, e?: React.MouseEvent) => {
    if (id === "explain" && infoContent) {
      if (e) {
        const rect = e.currentTarget.getBoundingClientRect();
        setInfoPopoverRect(rect);
      }
    } else if (id === "investigate" && detailData) {
      setIsDetailSheetOpen(true);
    } else if (id === "predict" && scrollTarget) {
      // Expand accordions first
      window.dispatchEvent(new CustomEvent("expand-sections"));
      
      // Allow DOM update, then scroll
      setTimeout(() => {
        const el = document.getElementById(scrollTarget);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("animate-highlight");
          setTimeout(() => {
            el.classList.remove("animate-highlight");
          }, 2000);
        }
      }, 100);
    } else if (id === "recommend" && actionContent) {
      setIsActionDialogOpen(true);
    } else {
      // Fallback
      triggerCopilotAction(query, "chat");
    }
  };

  if (variant === "dropdown") {
    return (
      <div className={cn("relative inline-block text-left", className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono border border-[var(--border)] hover:border-[var(--accent)] rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white transition-all cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-[var(--accent)]" />
          <span>[AI ACTIONS]</span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-1 w-36 rounded border border-[var(--border)] bg-[var(--bg-surface)] shadow-lg z-20 overflow-hidden">
              <div className="py-1">
                {actions.map((act) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.id}
                      onClick={(e) => {
                        handleAction(act.id, act.query, e);
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-[11px] font-mono text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] flex items-center gap-2 transition-all cursor-pointer border-none"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{act.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Custom Overlays */}
        {infoPopoverRect && infoContent && (
          <InfoPopover
            triggerRect={infoPopoverRect}
            content={infoContent}
            onClose={() => setInfoPopoverRect(null)}
          />
        )}
        <DetailSheet
          isOpen={isDetailSheetOpen}
          title={title}
          detailData={detailData}
          onClose={() => setIsDetailSheetOpen(false)}
        />
        <ActionDialog
          isOpen={isActionDialogOpen}
          title={title}
          actionContent={actionContent}
          onClose={() => setIsActionDialogOpen(false)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 bg-[var(--bg-base)]/50 border border-[var(--border)] p-0.5 rounded-[4px] backdrop-blur-sm",
        className
      )}
    >
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.id}
            onClick={(e) => handleAction(act.id, act.query, e)}
            className={cn(
              "p-1 rounded-[3px] border border-transparent text-[var(--text-muted)] transition-all cursor-pointer bg-transparent",
              act.color
            )}
            title={`${act.label} this`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}

      {/* Custom Overlays */}
      {infoPopoverRect && infoContent && (
        <InfoPopover
          triggerRect={infoPopoverRect}
          content={infoContent}
          onClose={() => setInfoPopoverRect(null)}
        />
      )}
      <DetailSheet
        isOpen={isDetailSheetOpen}
        title={title}
        detailData={detailData}
        onClose={() => setIsDetailSheetOpen(false)}
      />
      <ActionDialog
        isOpen={isActionDialogOpen}
        title={title}
        actionContent={actionContent}
        onClose={() => setIsActionDialogOpen(false)}
      />
    </div>
  );
}
