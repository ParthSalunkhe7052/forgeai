"use client";

import React, { useState } from "react";
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
    financialImpact?: string;
    daysUntilFailure?: number;
    showActionsButton?: boolean;
    onActionButtonClick?: () => void;
  };
  scrollTarget?: string;
  actionContent?: string;
  actionQuery?: string;
}

// Helper to generate context-specific metadata
const getGeneratedInfo = (title: string, context: string) => {
  const t = title.toLowerCase();
  
  let formula = `Calculated index representing the state of ${title}.`;
  let source = "Plant Telemetry Database";
  let benchmark = "Within nominal operating bounds";
  
  if (t.includes("oee")) {
    formula = "OEE = Availability (%) × Performance (%) × Quality (%)";
    source = "SCADA Line PLCs & Quality Registry";
    benchmark = ">= 85.0% (Optimal Baseline)";
  } else if (t.includes("revenue")) {
    formula = "MTD Revenue = Sum of daily invoiced sales across all active plants";
    source = "SAP ERP Financials Billing Ledger";
    benchmark = "₹450.0 Cr/month target";
  } else if (t.includes("utilization")) {
    formula = "Utilization = Actual Operating Time / Scheduled Time";
    source = "Machine Run-State Sensors";
    benchmark = ">= 90.0% (Nominal Target)";
  } else if (t.includes("downtime") || t.includes("loss")) {
    formula = "Total Downtime Loss = ∑ (Unplanned Outage Duration × Hourly Cost)";
    source = "PLC Alarm logs & Cost models";
    benchmark = "< 5% of Scheduled Time";
  } else if (t.includes("energy")) {
    formula = "Energy Intensity = Power Consumption (kWh) / Production Output (Tons)";
    source = "Smart Grid Meters & Mesh PLC Nodes";
    benchmark = "< 480 kWh/ton baseline";
  } else if (t.includes("health")) {
    formula = "Health Index = Weighted Avg (40% OEE, 30% Asset Degradation, 20% Energy Intensity)";
    source = "MES Platform + IIoT Edge Sensors";
    benchmark = ">= 80/100 (Optimal)";
  } else if (t.includes("risk")) {
    formula = "Risk Score = Probability of Failure × Financial Impact Severity";
    source = "Predictive Reliability AI Engine";
    benchmark = "<= 25% (Low Risk)";
  } else if (t.includes("defect") || t.includes("quality")) {
    formula = "Quality Rate = (Total Parts produced - Defective Parts) / Total Parts";
    source = "Quality Assurance Scan Registry";
    benchmark = ">= 98.5% Yield";
  }

  return { formula, source, benchmark, lastUpdated: "Realtime" };
};

const getGeneratedDetailData = (title: string, context: string, isPredict = false) => {
  const t = title.toLowerCase();
  let history = [75, 78, 76, 80, 84, 82, 85, 87, 86, 88, 91, 89];
  let unit = "%";
  let note = context || `Asset performance is tracking within historical variance. No degradation anomalies identified.`;
  let financialImpact: string | undefined = undefined;
  let daysUntilFailure: number | undefined = undefined;

  if (t.includes("oee")) {
    history = isPredict ? [81.5, 81.2, 80.8, 80.5, 79.9, 78.4, 75.2, 70.1] : [82, 83, 81, 82, 80, 81, 82, 83, 82, 81, 81.5];
    unit = "%";
    note = isPredict 
      ? `AI forecasts OEE degrading to 70.1% within 2 weeks due to accelerating Furnace-2 friction wear.` 
      : `OEE is currently stable but showing micro-stoppages.`;
  } else if (t.includes("revenue")) {
    history = isPredict ? [39.0, 39.5, 40.1, 41.2, 42.0, 42.5, 43.1] : [35.0, 36.2, 37.0, 37.8, 38.5, 39.0];
    unit = " Cr";
    note = isPredict
      ? `Projected revenue growth to ₹43.1 Cr if the Line 3 dispatch backlog is cleared.`
      : `MTD revenue tracking positively.`;
  } else if (t.includes("utilization")) {
    history = isPredict ? [81.5, 81.0, 80.5, 79.2, 77.1, 75.0, 72.3] : [83, 82, 84, 83, 81, 82, 81.5];
    unit = "%";
  } else if (t.includes("downtime") || t.includes("loss")) {
    history = isPredict ? [18.6, 20.2, 22.4, 25.1, 31.0, 45.2] : [12.4, 14.1, 15.0, 16.5, 17.2, 18.6];
    unit = "L";
    note = isPredict 
      ? `Failure to replace deteriorating components will result in cumulative losses scaling to ₹45.2L.`
      : `Cumulative losses tracked.`;
  } else if (t.includes("energy")) {
    history = isPredict ? [4.3, 4.5, 4.8, 5.2, 5.5, 5.9, 6.4] : [3.8, 4.1, 4.5, 4.3, 4.2, 4.3];
    unit = "L";
  } else if (t.includes("health")) {
    history = isPredict ? [68, 67, 65, 62, 58, 50, 42] : [72, 71, 70, 71, 69, 68];
    unit = "/100";
    note = isPredict
      ? `AI projects Health score dropping to 42/100 as thermal wear constraints intensify.`
      : `Plant Health is degraded.`;
  } else if (t.includes("risk")) {
    history = isPredict ? [32, 35, 42, 55, 68, 85] : [24, 26, 25, 28, 30, 32];
    unit = "%";
    note = isPredict
      ? `Risk level projected to breach critical threshold of 85% within 48 hours.`
      : `Operational risk board.`;
  }

  if (isPredict || t.includes("risk") || t.includes("downtime") || t.includes("furnace")) {
    financialImpact = t.includes("energy") ? "₹1.8 Lakhs/day" : t.includes("revenue") ? "₹3.9 Crores" : "₹18.6 Lakhs";
    daysUntilFailure = t.includes("oee") || t.includes("furnace") ? 2 : t.includes("lining") ? 42 : 7;
  }

  return { history, unit, note, financialImpact, daysUntilFailure };
};

const getGeneratedAction = (title: string, context: string) => {
  const t = title.toLowerCase();
  if (t.includes("oee") || t.includes("furnace") || t.includes("downtime") || t.includes("health")) {
    return `Authorize immediate preventative replacement of the Furnace-2 bearing housing during the upcoming shift changeover. Supply chain registry confirms replacement bearing is stocked in Zone C depot.`;
  }
  if (t.includes("energy") || t.includes("waste")) {
    return `Shift peak thermal furnace melting cycles to off-peak slots (10:00 PM - 6:00 AM) to minimize tariff surcharges. Surcharge reduction will save ₹1.8L/day.`;
  }
  if (t.includes("revenue") || t.includes("utilization")) {
    return `Deploy additional operator crew to Line 3 to clear the conveyor drag limitation and increase throughput rate by +14.6%.`;
  }
  return `Schedule a field maintenance inspection for ${title} to check core sensor calibration and check mechanical seal rings.`;
};

export default function ContextualMenu({
  title,
  context,
  className,
  variant = "row",
  infoContent,
  detailData,
  scrollTarget,
  actionContent,
  actionQuery,
}: ContextualMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  // States for custom overlays
  const [infoPopoverRect, setInfoPopoverRect] = useState<DOMRect | null>(null);
  const [detailMode, setDetailMode] = useState<"investigate" | "predict" | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);

  // Auto-generate contents if not supplied
  const resolvedInfoContent = infoContent || getGeneratedInfo(title, context);
  const resolvedDetailData = detailData || getGeneratedDetailData(title, context, false);
  const resolvedPredictDetailData = getGeneratedDetailData(title, context, true);
  const resolvedActionContent = actionContent || getGeneratedAction(title, context);

  const actions = [
    {
      id: "explain",
      label: "Explain",
      icon: HelpCircle,
      color: "hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/20",
    },
    {
      id: "investigate",
      label: "Investigate",
      icon: ZoomIn,
      color: "hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20",
    },
    {
      id: "predict",
      label: "Predict",
      icon: TrendingUp,
      color: "hover:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/20",
    },
    {
      id: "recommend",
      label: "Recommend",
      icon: Zap,
      color: "hover:text-[var(--accent)] hover:bg-amber-500/10 hover:border-[var(--accent)]/30",
    },
  ];

  const handleAction = (id: string, e?: React.MouseEvent) => {
    if (id === "explain") {
      if (e) {
        const rect = e.currentTarget.getBoundingClientRect();
        setInfoPopoverRect(rect);
      }
    } else if (id === "investigate") {
      setDetailMode("investigate");
    } else if (id === "predict") {
      setDetailMode("predict");
    } else if (id === "recommend") {
      setIsActionDialogOpen(true);
    }
  };

  const handleAddActionDirectly = () => {
    const actionItem = {
      id: `ai-act-${Math.random().toString(36).substring(2, 9)}`,
      title: `Optimize ${title}`,
      source: "Situation Room Predictive Model",
      businessImpact: resolvedPredictDetailData.financialImpact || "Optimizes plant health score",
      rootCause: resolvedPredictDetailData.note,
      recommendation: resolvedActionContent,
      roi: resolvedPredictDetailData.financialImpact || "₹4.2L/month saved",
      owner: "Operations Lead",
      status: "pending" as const,
      confidence: "89%",
      dateGenerated: new Date().toISOString().split("T")[0] + " 09:00 AM"
    };
    useDashboardStore.getState().addAction(actionItem);
    window.location.href = "/actions";
  };

  // Attach button action handler to the predictive data if showActionsButton is not explicitly configured
  const finalPredictDetailData = {
    ...resolvedPredictDetailData,
    showActionsButton: true,
    onActionButtonClick: handleAddActionDirectly
  };

  if (actionQuery) {
    return (
      <button
        onClick={() => useDashboardStore.getState().triggerCopilotAction(actionQuery, "chat")}
        className={cn(
          "flex items-center gap-1 px-2 py-1 text-[9px] font-mono border border-[var(--border)] hover:border-[var(--accent)] rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white transition-all cursor-pointer",
          className
        )}
      >
        <Sparkles className="w-3 h-3 text-[var(--accent)]" />
        <span>[AI ACTIONS]</span>
      </button>
    );
  }

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
                        handleAction(act.id, e);
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
        {infoPopoverRect && (
          <InfoPopover
            triggerRect={infoPopoverRect}
            content={resolvedInfoContent}
            onClose={() => setInfoPopoverRect(null)}
          />
        )}
        <DetailSheet
          isOpen={detailMode !== null}
          title={title}
          detailData={detailMode === "predict" ? finalPredictDetailData : resolvedDetailData}
          onClose={() => setDetailMode(null)}
        />
        <ActionDialog
          isOpen={isActionDialogOpen}
          title={title}
          actionContent={resolvedActionContent}
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
            onClick={(e) => handleAction(act.id, e)}
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
      {infoPopoverRect && (
        <InfoPopover
          triggerRect={infoPopoverRect}
          content={resolvedInfoContent}
          onClose={() => setInfoPopoverRect(null)}
        />
      )}
      <DetailSheet
        isOpen={detailMode !== null}
        title={title}
        detailData={detailMode === "predict" ? finalPredictDetailData : resolvedDetailData}
        onClose={() => setDetailMode(null)}
      />
      <ActionDialog
        isOpen={isActionDialogOpen}
        title={title}
        actionContent={resolvedActionContent}
        onClose={() => setIsActionDialogOpen(false)}
      />
    </div>
  );
}
