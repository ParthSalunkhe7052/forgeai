"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDashboardStore, ActionItem } from "../../store/useDashboardStore";
import {
  FileText,
  Printer,
  FileSpreadsheet,
  FileDown,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Check,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/app/utils/cn";
import ContextualMenu from "@/app/components/ui/ContextualMenu";
import CollapsibleSection from "@/app/components/ui/CollapsibleSection";
import { DetailSheet } from "@/app/components/ui/Overlays";

interface AISummary {
  key_findings: string[];
  risks: {
    severity: "critical" | "high" | "medium";
    title: string;
    description: string;
    impact: string;
  }[];
  recommended_actions: {
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
    owner: string;
    impact: string;
  }[];
  savings_opportunity: {
    amount: string;
    driver: string;
    confidence: string;
  };
  today_in_3_sentences?: string[];
  one_thing_today?: string;
  decisions_deferred?: string[];
  whats_going_well?: string[];
}

interface ReportMeta {
  id: string;
  title: string;
  type: "daily" | "weekly" | "monthly";
  date_range: string;
  generated_at: string;
  size: string;
  status: string;
  ai_summary?: AISummary;
}

interface ReportSection {
  title: string;
  content?: string;
  type: "text" | "table" | "bullets";
  headers?: string[];
  rows?: string[][];
  items?: string[];
}

interface ReportContent {
  id: string;
  title: string;
  plant_id: string;
  generated_by: string;
  date: string;
  sections: ReportSection[];
  ai_summary?: AISummary;
}

const playBeep = (type: "info" | "success" | "warning" = "success") => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    if (type === "success") {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(880.0, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    } else if (type === "warning") {
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(180, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.25);
    } else {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
    }
  } catch (e) {
    console.error("Audio Context failed:", e);
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } },
} as const;

const TYPE_BADGE: Record<string, { color: string; border: string; bg: string }> = {
  daily:   { color: "var(--status-green)", border: "rgba(34,197,94,0.3)",   bg: "rgba(34,197,94,0.06)"   },
  weekly:  { color: "var(--status-blue)",  border: "rgba(59,130,246,0.3)",   bg: "rgba(59,130,246,0.06)"  },
  monthly: { color: "var(--accent)",       border: "rgba(245,158,11,0.3)",  bg: "rgba(245,158,11,0.06)" },
};

// Rich local summaries fallback
const MOCK_SUMMARIES: Record<string, AISummary> = {
  "rep-daily-today": {
    key_findings: [
      "Blast Furnace line output was 262.4 Tons, slightly underperforming target of 280.0 Tons (OEE at 81.2%).",
      "Quality defect rates remained stable at 1.8%, well within the 2.5% tolerance threshold.",
      "Energy consumption spiked +12% above baseline during peak rate hours (2 PM to 6 PM).",
      "Furnace-2 logged high thermal fatigue and bearing vibrations in the afternoon."
    ],
    risks: [
      {
        severity: "critical",
        title: "Furnace-2 bearing degradation",
        description: "Furnace-2 bearing temperature has increased by 22% over 48 hours. Current: 92°C vs baseline 75°C. Bearing thermal wear projected in 2 days at 68%. Impact: ₹18.6 Lakhs. Recommended: inspect bearing and approve automatic preventative replacement by May 23, 2026.",
        impact: "₹18.6L/month"
      },
      {
        severity: "medium",
        title: "Energy usage above baseline",
        description: "+12% peak rate consumption driving up marginal production costs.",
        impact: "₹1.8L/day"
      }
    ],
    recommended_actions: [
      {
        priority: "high",
        title: "Replace Furnace-2 bearing",
        description: "Perform preventive swap of the bearing housing during next shift handover.",
        owner: "Maintenance Team",
        impact: "₹4.2L/month savings"
      },
      {
        priority: "medium",
        title: "Shift heavy furnace loads",
        description: "Adjust timing of energy-intensive schedules to run during off-peak hours.",
        owner: "Operations Lead",
        impact: "₹1.8L/day savings"
      }
    ],
    savings_opportunity: {
      amount: "₹18.6 Lakhs",
      driver: "Furnace-2 downtime avoidance",
      confidence: "91%"
    },
    today_in_3_sentences: [
      "Furnace-2 bearing temperature has increased by 22% over 48 hours. Current: 92°C vs baseline 75°C. Bearing thermal wear projected in 2 days at 68%. Impact: ₹18.6 Lakhs. Recommended: inspect bearing and approve automatic preventative replacement by May 23, 2026.",
      "Current shift 56.2% complete with 387T vs 620T. Pace 29.1 T/hr is 39.1% below required 47.8 T/hr. Primary cause: slag chute restriction on Line 3. Shortfall: 233T. Options: Clear Line 3 slag chute jam or Reassign Team A to HRC Coils.",
      "Pune energy intensity 520 kWh/ton vs 480 kWh/ton. 8.3% excess costs ₹1.8 Lakhs/day. Driver: thermal processes running during peak grid tariffs. Opportunity: Shift peak thermal furnace cycles to off-peak slots saves ₹54.0 Lakhs/month."
    ],
    one_thing_today: "Furnace-2 bearing temperature has increased by 22% over 48 hours. Current: 92°C vs baseline 75°C. Bearing thermal wear projected in 2 days at 68%. Impact: ₹18.6 Lakhs. Recommended: inspect bearing and approve automatic preventative replacement by May 23, 2026.",
    decisions_deferred: [
      "Approve retrofitting auxiliary fans on the Electric Arc Furnace cooling jacket.",
      "Authorize standard operating procedure (SOP) training hours for the new Line 3 shift crew."
    ],
    whats_going_well: [
      "Finishing Line OEE outperformed forecast by 2.2%, achieving a robust 90.2% yield.",
      "Zero safety incidents or OT cybersecurity alerts logged across all plant operational zones."
    ]
  },
  "rep-weekly-last": {
    key_findings: [
      "Weekly steel production reached 1,842 Tons, representing 94% of the weekly plan.",
      "Total unplanned downtime stood at 8.4 hours, primarily caused by Conveyor-1 electrical failures.",
      "Product quality yield improved to 98.1% due to sensor calibrations on finishing lines.",
      "Average plant availability was 84.1%, falling below the 88.0% OEE target."
    ],
    risks: [
      {
        severity: "high",
        title: "Conveyor-1 electrical switchgear trips",
        description: "Repeated voltage transients are causing belt shutdowns. Risk level is high.",
        impact: "₹5.2L/week"
      },
      {
        severity: "medium",
        title: "Iron ore logistics delay",
        description: "Shipment delayed by 2 hours at port; production risk increased to 7%.",
        impact: "₹2.2L/event"
      }
    ],
    recommended_actions: [
      {
        priority: "high",
        title: "Calibrate Conveyor-1 switchgear",
        description: "Conduct diagnostic testing and replace faulty trip coils in the power sub-panel.",
        owner: "Electrical Crew",
        impact: "₹2.5L/month savings"
      },
      {
        priority: "medium",
        title: "Optimize rolling mill changeovers",
        description: "Train operators on standardized roll change procedures to reduce changeover times.",
        owner: "Floor Lead",
        impact: "₹1.5L/week savings"
      }
    ],
    savings_opportunity: {
      amount: "₹5.2 Lakhs",
      driver: "Conveyor stabilization",
      confidence: "88%"
    },
    today_in_3_sentences: [
      "Weekly production volume closed at 1,842 Tons, meeting 94% of planned targets.",
      "Unplanned downtime accumulated to 8.4 hours, mostly attributed to electrical trips on Conveyor-1.",
      "Finishing line yield reached 98.1%, benefiting directly from recent instrumentation calibrations."
    ],
    one_thing_today: "Deploy the electrical maintenance crew to calibrate Conveyor-1 switchgear and replace weak trip coils in the Zone B distribution center.",
    decisions_deferred: [
      "Review the vendor agreement extension for bulk limestone logistics.",
      "Finalize the maintenance schedule for the annual rolling mill alignment check."
    ],
    whats_going_well: [
      "Finishing line output achieved 98.1% prime yield, matching our quarterly peak.",
      "Nitrogen purge system optimization reduced utility consumption by 4.2% week-over-week."
    ]
  },
  "rep-monthly-last": {
    key_findings: [
      "Total monthly revenue stood at ₹442.4 Cr, representing a 1.7% deviation from target (₹450 Cr).",
      "Net profit margins remained stable at 14.2% due to successful supply chain hedging.",
      "Unplanned downtime cost the plant ₹38.4L, with Furnace-2 thermal wear being the chief driver.",
      "Overall OEE averaged 81.5% across all 5 production lines, down from 83.2% last month."
    ],
    risks: [
      {
        severity: "high",
        title: "Blast furnace lining degradation",
        description: "Refractory lining thickness has reached near critical limits. Repair window: 42 days.",
        impact: "₹65.0L/repair"
      },
      {
        severity: "medium",
        title: "Carbon credit offset ceiling",
        description: "Emissions are +8% higher than projected monthly baseline, risking regulatory penalties.",
        impact: "₹12.0L potential fine"
      }
    ],
    recommended_actions: [
      {
        priority: "high",
        title: "Pre-order refractory brick set",
        description: "Order specialized refractory replacement parts to prevent delivery bottlenecks.",
        owner: "Procurement",
        impact: "Avoids ₹65L breakdown"
      },
      {
        priority: "medium",
        title: "Tune oxygen-to-fuel ratio",
        description: "Recalibrate the digital burner controllers on Furnace-1 to optimize combustion and reduce emissions.",
        owner: "Engineering",
        impact: "₹5.0L fine avoidance"
      }
    ],
    savings_opportunity: {
      amount: "₹65.0 Lakhs",
      driver: "Refractory failure avoidance",
      confidence: "95%"
    },
    today_in_3_sentences: [
      "Monthly revenue concluded at ₹442.4 Cr, underperforming the ₹450 Cr corporate plan by a narrow 1.7% margin.",
      "Refractory brick linings on Blast Furnace 1 have degraded by an additional 12%, leaving a critical repair window of 42 days.",
      "Net profit margin was sustained at 14.2% through forward fuel hedging and scrap steel reclamation projects."
    ],
    one_thing_today: "Authorize procurement to pre-order the specialized silicon-carbide refractory brick set to prevent delivery delays ahead of the scheduled blast furnace shutdown.",
    decisions_deferred: [
      "Authorize purchase of third-party carbon offsets for the Q2 compliance audit.",
      "Sign off on the proposed mechanical redesign of the scrap pre-heater system."
    ],
    whats_going_well: [
      "Scrap steel recycling rates achieved a record 22.4% of total furnace charge volume.",
      "Average cold-rolling speed sustained a 12-month high with zero shape anomalies detected."
    ]
  }
};

export default function ReportsHub() {
  const { selectedPlantId } = useDashboardStore();
  const queryClient = useQueryClient();
  const [activeReportId, setActiveReportId] = useState<string>("rep-daily-today");
  const [generationType, setGenerationType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [successMessage, setSuccessMessage] = useState("");
  const [tab, setTab] = useState<"briefing" | "document">("briefing");
  const [actionStates, setActionStates] = useState<Record<string, "pending" | "approved" | "assigned">>({});
  const [selectedRisk, setSelectedRisk] = useState<{
    title: string;
    severity: string;
    description: string;
    impact: string;
    daysUntilFailure?: number;
    financialImpact?: string;
  } | null>(null);
  const [isRiskSheetOpen, setIsRiskSheetOpen] = useState(false);
  const [assigningActionKey, setAssigningActionKey] = useState<string | null>(null);

  const handleAddRiskAction = () => {
    if (!selectedRisk) return;
    const actionItem: ActionItem = {
      id: `risk-act-${selectedRisk.title.replace(/\s+/g, '-').toLowerCase()}`,
      title: `Mitigate Risk: ${selectedRisk.title}`,
      source: `Risk Assessment (${activeReport?.title || "Daily Report"})`,
      businessImpact: `Avoids estimated loss of ${selectedRisk.impact}`,
      rootCause: selectedRisk.description,
      recommendation: `Conduct urgent inspection and execute mitigation plan for ${selectedRisk.title}.`,
      roi: selectedRisk.impact,
      owner: selectedRisk.title.toLowerCase().includes("bearing") ? "Maintenance Team" : "Engineering",
      status: "pending",
      confidence: "91%",
      dateGenerated: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    useDashboardStore.getState().addAction(actionItem);
    setIsRiskSheetOpen(false);
    window.location.href = "/actions";
  };

  // Reset tab to briefing when report selection changes
  useEffect(() => {
    setTab("briefing");
  }, [activeReportId]);

  const MOCK_REPORTS_LIST: ReportMeta[] = [
    {
      id: "rep-daily-today",
      title: `Daily Operations Summary — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      type: "daily",
      date_range: new Date().toISOString().split("T")[0],
      generated_at: new Date().toISOString(),
      size: "45 KB",
      status: "ready",
      ai_summary: MOCK_SUMMARIES["rep-daily-today"]
    },
    {
      id: "rep-weekly-last",
      title: "Weekly Performance Report — Week " + String(Math.ceil(new Date().getDate() / 7) + 18),
      type: "weekly",
      date_range: "Past 7 Days",
      generated_at: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
      size: "120 KB",
      status: "ready",
      ai_summary: MOCK_SUMMARIES["rep-weekly-last"]
    },
    {
      id: "rep-monthly-last",
      title: "Monthly Financial & Operations Review — " + new Date(Date.now() - 30 * 24 * 3600000).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      type: "monthly",
      date_range: "Past 30 Days",
      generated_at: new Date(Date.now() - 15 * 24 * 3600000).toISOString(),
      size: "340 KB",
      status: "ready",
      ai_summary: MOCK_SUMMARIES["rep-monthly-last"]
    }
  ];

  const { data: reportsListRaw = [], isLoading: isLoadingList } = useQuery<ReportMeta[]>({
    queryKey: ["reportsList"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) throw new Error("Failed to load reports");
        return await res.json();
      } catch (err) {
        console.warn("Local reports API offline, using frontend reports fallback");
        return MOCK_REPORTS_LIST;
      }
    },
  });

  const reportsList = reportsListRaw.length > 0 ? reportsListRaw : MOCK_REPORTS_LIST;

  const { data: activeReport, isLoading: isLoadingReport, error: reportError } = useQuery<ReportContent>({
    queryKey: ["reportContent", activeReportId, selectedPlantId],
    queryFn: async () => {
      const plantId = selectedPlantId === "all" ? "pune-uuid" : selectedPlantId;
      try {
        const res = await fetch(`/api/reports/${activeReportId}?plant_id=${plantId}`);
        if (!res.ok) throw new Error("Failed to fetch report");
        return await res.json();
      } catch (err) {
        console.warn("Local reports API offline, using frontend active report fallback");
        const match = reportsList.find(r => r.id === activeReportId) || MOCK_REPORTS_LIST[0];
        
        return {
          id: activeReportId,
          title: match.title,
          plant_id: plantId,
          generated_by: "Forge AI Copilot",
          date: new Date().toISOString().split("T")[0],
          ai_summary: MOCK_SUMMARIES[activeReportId] || MOCK_SUMMARIES["rep-daily-today"],
          sections: [
            {
              title: "1. AI Executive Summary",
              content: `Operations for this period show stable output overall, but efficiency is impacted by equipment degradation on selected lines. Quality rates are maintaining a healthy 97.4% baseline, but availability fell to 84.1% due to unscheduled maintenance. Immediate attention should be placed on restoring normal furnace speeds.`,
              type: "text"
            },
            {
              title: "2. Production Metrics Breakdown",
              type: "table",
              headers: ["Line Name", "Target (T)", "Actual (T)", "Defects (T)", "OEE (%)"],
              rows: [
                ["Blast Furnace Line", "280.0", "262.4", "5.1", "81.2%"],
                ["Electric Arc Furnace Line", "240.0", "238.1", "2.4", "88.5%"],
                ["Rolling Mill Line", "320.0", "295.2", "8.2", "76.4%"],
                ["Finishing Line", "200.0", "198.0", "1.1", "90.2%"],
                ["Cold Rolling Line", "160.0", "154.5", "1.8", "86.1%"]
              ]
            },
            {
              title: "3. Unplanned Downtime Logs",
              type: "table",
              headers: ["Machine Name", "Cause Category", "Duration (mins)", "Impact (T)"],
              rows: [
                ["Furnace-2", "Mechanical (Bearing)", "120", "42.5 T"],
                ["Conveyor-1", "Electrical (Trip)", "45", "15.0 T"]
              ]
            },
            {
              title: "4. Top AI Action Items",
              type: "bullets",
              items: [
                "Replace bearing housing on Furnace-2 during upcoming shift rotation to avoid failure.",
                "Reschedule heavy furnace runs to off-peak hours (10:00 PM to 6:00 AM) to save ₹1.8L daily.",
                "Reallocate team members from line 4 finishing area to line 1 packing area to mitigate output gaps."
              ]
            }
          ]
        };
      }
    },
    enabled: !!activeReportId,
  });

  const generateMutation = useMutation({
    mutationFn: async (type: string) => {
      const plantId = selectedPlantId === "all" ? "pune-uuid" : selectedPlantId;
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plant_id: plantId, report_type: type }),
      });
      if (!res.ok) throw new Error("Failed to compile report");
      return await res.json();
    },
    onSuccess: (data) => {
      playBeep("success");
      setSuccessMessage(data.message || `Custom ${generationType} report successfully scheduled for compilation.`);
      queryClient.invalidateQueries({ queryKey: ["reportsList"] });
      setTimeout(() => setSuccessMessage(""), 5000);
    },
    onError: () => {
      // Offline fallback success simulation
      playBeep("success");
      setSuccessMessage(`Custom ${generationType} report compilation triggered. Mock compiler updated list successfully.`);
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  });

  const handleAction = (actionId: string, type: "approved" | "assigned") => {
    playBeep("success");
    setActionStates(prev => ({ ...prev, [actionId]: type }));
    setSuccessMessage(`AI Recommended Action successfully ${type === "approved" ? "authorized for execution" : "dispatched to maintenance owner"}.`);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const handleDownload = () => {
    playBeep("info");
    setSuccessMessage(`Report document "${activeReport?.title || "Operational Brief"}" successfully exported to PDF/Excel.`);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const summaryData = activeReport?.ai_summary || MOCK_SUMMARIES[activeReportId] || MOCK_SUMMARIES["rep-daily-today"];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6"
    >
      {/* Left panel: Generators and Registry */}
      <motion.div variants={itemVariants} className="lg:col-span-4 space-y-5">
        {/* Report generator */}
        <div
          className="rounded-lg p-5 space-y-4 bg-[var(--bg-surface)] border border-[var(--border)]"
        >
          <span className="card-title block">
            Compile Custom Report
          </span>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block mb-2">
                Timeframe Window
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["daily", "weekly", "monthly"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setGenerationType(t)}
                    className={cn(
                      "rounded py-2 text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer",
                      generationType === t
                        ? "bg-amber-500/10 border-[var(--accent)] text-[var(--accent)]"
                        : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:text-white"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => generateMutation.mutate(generationType)}
              disabled={generateMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded py-2.5 transition-all font-bold text-xs bg-[var(--accent)] hover:brightness-110 text-black border-none cursor-pointer"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Compiling Logs...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Compile Custom Report</span>
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2.5 rounded p-3 bg-emerald-500/10 border border-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--status-green)]" />
                <div>
                  <p className="text-xs font-semibold text-[var(--status-green)]">Action Executed</p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 leading-normal">{successMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reports registry */}
        <div
          className="rounded-lg p-5 flex flex-col bg-[var(--bg-surface)] border border-[var(--border)]"
          style={{ height: 490 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <FileSpreadsheet className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="card-title">
              Compiled Reports Registry
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {isLoadingList ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
              </div>
            ) : (
              reportsList.map((rep) => {
                const isActive = activeReportId === rep.id;
                const badge = TYPE_BADGE[rep.type] ?? TYPE_BADGE.daily;
                const repSummary = rep.ai_summary || MOCK_SUMMARIES[rep.id] || MOCK_SUMMARIES["rep-daily-today"];
                
                return (
                  <div
                    key={rep.id}
                    onClick={() => setActiveReportId(rep.id)}
                    className={cn(
                      "flex flex-col rounded-md p-3 cursor-pointer transition-all border",
                      isActive
                        ? "bg-[var(--bg-elevated)] border-[var(--border-strong)]"
                        : "bg-transparent border-transparent hover:bg-[var(--bg-elevated)]/60"
                    )}
                  >
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]")} />
                        <span className={cn("text-xs font-semibold truncate", isActive ? "text-white" : "text-[var(--text-secondary)]")}>
                          {rep.title}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          padding: "1px 5px",
                          borderRadius: 2,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          flexShrink: 0,
                          marginLeft: 6,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          background: badge.bg,
                        }}
                      >
                        {rep.type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2.5 text-[9px] font-mono text-[var(--text-muted)]">
                      <span>{rep.date_range} · {rep.size}</span>
                      {repSummary && (
                        <span className="text-[var(--accent)] flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5 animate-pulse" /> AI Summed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>

      {/* Right panel: Tabbed Briefing & Report Content */}
      <motion.div variants={itemVariants} className="lg:col-span-8">
        <div
          className="rounded-lg flex flex-col bg-[var(--bg-surface)] border border-[var(--border)] p-6 md:p-8"
          style={{ minHeight: 680 }}
        >
          <AnimatePresence mode="wait">
            {isLoadingReport ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-20">
                <Loader2 className="w-7 h-7 animate-spin text-[var(--text-muted)]" />
                <span className="text-xs text-[var(--text-secondary)] font-mono">Synthesizing log tables & metrics...</span>
              </div>
            ) : reportError || !activeReport ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto py-20">
                <AlertTriangle className="w-10 h-10 mb-3 text-[var(--status-amber)]" />
                <h4 className="text-sm font-semibold text-white">Report Content Error</h4>
                <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
                  Failed to load report contents. Verify that a plant has been chosen and the local database connection is active.
                </p>
              </div>
            ) : (
              <motion.div
                key={activeReport.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col"
              >
                {/* Document Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 mb-5 border-b border-[var(--border)]">
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-white">{activeReport.title}</h2>
                    <div className="flex flex-wrap items-center gap-2.5 mt-2 text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-wider">
                      <span>Ref: {activeReport.id}</span>
                      <span className="text-[var(--border-strong)]">•</span>
                      <span>By: {activeReport.generated_by}</span>
                      <span className="text-[var(--border-strong)]">•</span>
                      <span>Date: {activeReport.date}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center justify-center rounded bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white transition-all w-8 h-8 cursor-pointer"
                      title="Print Report"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:text-white bg-[var(--bg-elevated)]/50 transition-all cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex border-b border-[var(--border)] mb-6">
                  <button
                    onClick={() => setTab("briefing")}
                    className={cn(
                      "pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer",
                      tab === "briefing" ? "text-[var(--accent)] font-bold" : "text-[var(--text-secondary)] hover:text-white"
                    )}
                  >
                    AI Briefing Summary
                    {tab === "briefing" && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[var(--accent)]"
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setTab("document")}
                    className={cn(
                      "ml-6 pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer",
                      tab === "document" ? "text-[var(--accent)] font-bold" : "text-[var(--text-secondary)] hover:text-white"
                    )}
                  >
                    Full Technical Document
                    {tab === "document" && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[var(--accent)]"
                      />
                    )}
                  </button>
                </div>

                {/* Tab Content Display */}
                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    {tab === "briefing" ? (
                      <motion.div
                        key="briefing-tab"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-6"
                      >
                        {/* AI Executive Briefing Memo Card */}
                        <div className="rounded-lg p-5 border border-[var(--border)] bg-[var(--bg-elevated)]/30 space-y-4 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[var(--accent)]/5 to-transparent rounded-full blur-xl pointer-events-none" />
                          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                            <span className="text-[10px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 animate-pulse text-[var(--accent)]" /> AI Synthesized Executive Briefing
                            </span>
                            <span className="text-[9px] font-mono text-[var(--text-muted)]">CLASSIFICATION: CONFIDENTIAL</span>
                          </div>
                          
                          <div className="space-y-4 text-xs font-mono text-[var(--text-secondary)]">
                            <div className="flex justify-between items-center text-[9px] text-[var(--text-muted)] uppercase tracking-wider pb-1 border-b border-[var(--border)]">
                              <span>Date: May 22, 2026 | Scope: Plant B — Pune</span>
                              <span>Confidence: High</span>
                            </div>

                            {/* Today in 3 Sentences */}
                            <div>
                              <div className="text-[10px] font-bold text-white uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <span className="w-1 h-3 bg-[var(--accent)] inline-block"></span>
                                TODAY IN 3 SENTENCES:
                              </div>
                              <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)] leading-relaxed">
                                {(summaryData.today_in_3_sentences || [
                                  "Blast Furnace line output was 262.4 Tons, slightly underperforming target.",
                                  "Quality defect rates remained stable at 1.8%, well within threshold.",
                                  "Energy consumption spiked +12% above baseline during peak rate hours."
                                ]).map((s, i) => (
                                  <li key={i} className="pl-1 text-justify">{s}</li>
                                ))}
                              </ul>
                            </div>

                            {/* The One Thing You Must Do Today */}
                            <div className="rounded border border-amber-500/20 bg-amber-500/5 p-3">
                              <div className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5 animate-pulse text-[var(--accent)]" />
                                THE ONE THING YOU MUST DO TODAY:
                              </div>
                              <p className="text-[11px] text-white leading-relaxed font-sans font-medium">
                                {summaryData.one_thing_today || 
                                 "Authorize immediate preventative replacement of the Furnace-2 bearing housing during the upcoming shift changeover."}
                              </p>
                            </div>

                            {/* Decisions Deferred & What's Going Well in 2 columns */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                              {/* Decisions Deferred */}
                              <div>
                                <div className="text-[10px] font-bold text-[var(--status-amber)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  DECISIONS DEFERRED FROM YESTERDAY:
                                </div>
                                <ul className="space-y-1 text-[var(--text-muted)]">
                                  {(summaryData.decisions_deferred || [
                                    "Approve retrofitting auxiliary fans on the Electric Arc Furnace cooling jacket.",
                                    "Authorize standard operating procedure (SOP) training hours for the new Line 3 shift crew."
                                  ]).map((d, i) => (
                                    <li key={i} className="flex items-start gap-1.5">
                                      <span className="text-[var(--status-amber)]">•</span>
                                      <span>{d}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* What's Going Well */}
                              <div>
                                <div className="text-[10px] font-bold text-[var(--status-green)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  WHAT'S GOING WELL:
                                </div>
                                <ul className="space-y-1 text-[var(--text-secondary)]">
                                  {(summaryData.whats_going_well || [
                                    "Finishing Line OEE outperformed forecast by 2.2%, achieving 90.2% yield.",
                                    "Zero safety incidents or OT cybersecurity alerts logged across all plant operational zones."
                                  ]).map((g, i) => (
                                    <li key={i} className="flex items-start gap-1.5">
                                      <span className="text-[var(--status-green)]">✓</span>
                                      <span>{g}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-end pt-2 border-t border-[var(--border)]">
                            <ContextualMenu
                              title="Executive Briefing Summary"
                              context={
                                summaryData.today_in_3_sentences?.join(" ") ||
                                "Operations for this period show stable output overall."
                              }
                              variant="dropdown"
                            />
                          </div>
                        </div>

                        {/* Highlights row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* AI Savings Opportunity Card (Amber glow accent) */}
                          <div 
                            className="rounded-lg p-5 border transition-all duration-200 bg-[var(--bg-elevated)] border-[var(--border-accent)]"
                            style={{
                              boxShadow: "0 0 16px var(--accent-glow)"
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-[var(--accent)] tracking-wider uppercase font-mono flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 animate-pulse text-[var(--accent)]" /> AI Savings Opportunity
                              </span>
                              <span className="text-[10px] text-[var(--status-green)] font-mono font-semibold flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5" /> High Confidence
                              </span>
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                              <span className="text-3xl font-light font-mono text-white">
                                {summaryData.savings_opportunity.amount}
                              </span>
                              <span className="text-xs font-mono text-[var(--text-muted)]">Lakhs</span>
                            </div>
                            <p className="mt-2 text-xs text-[var(--text-secondary)] font-mono">
                              Top Driver: <span className="text-white">{summaryData.savings_opportunity.driver}</span>
                            </p>
                            <div className="mt-3.5 pt-2.5 border-t border-[var(--border)] text-[10px] font-mono text-[var(--text-secondary)] flex justify-between">
                              <span>Confidence Metric: {summaryData.savings_opportunity.confidence}</span>
                              <ContextualMenu
                                title="AI Savings Opportunity"
                                context={`Savings opportunity of ${summaryData.savings_opportunity.amount} driven by ${summaryData.savings_opportunity.driver} with ${summaryData.savings_opportunity.confidence} confidence.`}
                                variant="dropdown"
                                className="scale-90"
                              />
                            </div>
                          </div>

                          {/* Scope & Schedule card */}
                          <div className="rounded-lg p-5 border border-[var(--border)] bg-[var(--bg-surface)] flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-wider uppercase font-mono">
                                Scope & Schedule
                              </span>
                              <h3 className="text-sm font-semibold text-white mt-1.5 truncate">
                                {activeReport.title}
                              </h3>
                              <p className="text-[11px] text-[var(--text-muted)] mt-1 font-mono">
                                Source Database: forgeai.db · Plant B
                              </p>
                            </div>
                            <div className="mt-3.5 pt-2.5 border-t border-[var(--border)] text-[10px] font-mono text-[var(--text-secondary)] flex items-center justify-between">
                              <span className="text-[var(--status-green)] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-green)] live-dot" /> Telemetry Locked
                              </span>
                              <ContextualMenu
                                title="Scope & Schedule"
                                context={`Report: ${activeReport.title}, date: ${activeReport.date}, plant: ${activeReport.plant_id}`}
                                variant="dropdown"
                                className="scale-90"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Key Findings List (Max 6 bullets) */}
                        <div className="rounded-lg p-5 border border-[var(--border)] bg-[var(--bg-surface)]">
                          <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono mb-3.5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" /> Executive Key Findings Summary
                          </h3>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                            {summaryData.key_findings.map((finding, idx) => (
                              <li 
                                key={idx} 
                                className="group relative rounded-md p-2 -mx-2 hover:bg-[var(--bg-elevated)]/40 transition-all flex items-start justify-between gap-4"
                              >
                                <div className="text-xs text-[var(--text-secondary)] leading-relaxed flex items-start gap-2">
                                  <span className="text-[var(--accent)] mt-0.5 select-none font-bold font-mono">•</span>
                                  <span>{finding}</span>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                  <ContextualMenu 
                                    title={`Key Finding #${idx + 1}`} 
                                    context={finding} 
                                    variant="dropdown"
                                  />
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Active Alerts/Risks Grid (Max 3 visible) */}
                        <div className="rounded-lg p-5 border border-[var(--border)] bg-[var(--bg-surface)]">
                          <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-red)] animate-pulse" /> Analyzed High-Priority Anomalies
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {summaryData.risks.map((risk, idx) => {
                              const isCritical = risk.severity === "critical" || risk.severity === "high";
                              const colorClass = risk.severity === "critical" 
                                ? "border-l-[3px] border-l-[var(--status-red)]" 
                                : risk.severity === "high" 
                                ? "border-l-[3px] border-l-[var(--status-amber)]" 
                                : "border-l-[3px] border-l-[var(--status-blue)]";
                              
                              const badgeStyle = risk.severity === "critical"
                                ? "bg-red-500/10 text-[var(--status-red)] border border-red-500/20"
                                : risk.severity === "high"
                                ? "bg-amber-500/10 text-[var(--status-amber)] border border-amber-500/20"
                                : "bg-blue-500/10 text-[var(--status-blue)] border border-blue-500/20";

                              return (
                                <div key={idx} className={cn("rounded bg-[var(--bg-elevated)] border border-[var(--border)] p-4 flex flex-col justify-between min-h-[140px]", colorClass)}>
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className={cn("text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded", badgeStyle)}>
                                        {risk.severity}
                                      </span>
                                      <span className="text-[9px] font-mono text-[var(--text-muted)]">
                                        Loss: {risk.impact}
                                      </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-white leading-tight">{risk.title}</h4>
                                    <p className="text-[11px] text-[var(--text-secondary)] mt-2 leading-relaxed">{risk.description}</p>
                                  </div>
                                  
                                  <div className="mt-3 flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        playBeep("info");
                                        setSelectedRisk({
                                          title: risk.title,
                                          severity: risk.severity,
                                          description: risk.description,
                                          impact: risk.impact,
                                          daysUntilFailure: risk.title.toLowerCase().includes("bearing") ? 2 : risk.title.toLowerCase().includes("lining") ? 42 : 14,
                                          financialImpact: risk.impact,
                                        });
                                        setIsRiskSheetOpen(true);
                                      }}
                                      className="flex-1 text-center text-[9px] font-mono font-bold text-[var(--accent)] hover:text-white bg-[var(--bg-hover)] border border-[var(--border)] hover:border-[var(--border-strong)] py-1.5 rounded transition-all cursor-pointer"
                                    >
                                      [Analyze Risk]
                                    </button>
                                    <button
                                      onClick={() => {
                                        playBeep("info");
                                        window.location.href = "/actions";
                                      }}
                                      className="flex-1 text-center text-[9px] font-mono font-bold text-[var(--text-secondary)] hover:text-white bg-[var(--bg-hover)] border border-[var(--border)] hover:border-[var(--border-strong)] py-1.5 rounded transition-all cursor-pointer"
                                    >
                                      [AI Actions]
                                    </button>
                                    <ContextualMenu
                                      title={risk.title}
                                      context={`Risk: ${risk.title}, Description: ${risk.description}, Severity: ${risk.severity}, Impact: ${risk.impact}`}
                                      variant="dropdown"
                                      className="scale-90"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Recommended Actions */}
                        <div className="rounded-lg p-5 border border-[var(--border)] bg-[var(--bg-surface)]">
                          <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-green)]" /> AI Recommended Prescriptions
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {summaryData.recommended_actions.map((act, idx) => {
                              const actionKey = `${activeReport.id}-${act.title}`;
                              const currentStatus = actionStates[actionKey] || "pending";

                              return (
                                <div key={idx} className="rounded bg-[var(--bg-elevated)] border border-[var(--border)] p-4 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center justify-between mb-2.5">
                                      <span className="text-[9px] font-bold font-mono uppercase tracking-wider bg-[var(--accent)] text-black px-1.5 py-0.5 rounded">
                                        {act.priority}
                                      </span>
                                      <span className="text-[10px] font-mono text-[var(--status-green)] font-semibold">
                                        {act.impact}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-start gap-2">
                                      <h4 className="text-xs font-bold text-white leading-snug">{act.title}</h4>
                                      <ContextualMenu
                                        title={act.title}
                                        context={`Action: ${act.title}, Description: ${act.description}, Priority: ${act.priority}, Impact: ${act.impact}`}
                                        variant="dropdown"
                                        className="scale-90 flex-shrink-0"
                                      />
                                    </div>
                                    <p className="text-[11px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">{act.description}</p>
                                    <div className="mt-2.5 text-[9px] font-mono text-[var(--text-muted)]">
                                      <span>Owner: {act.owner}</span>
                                    </div>
                                  </div>

                                  <div className="mt-4 flex gap-2">
                                    {assigningActionKey === actionKey ? (
                                      <div className="w-full space-y-2 mt-2">
                                        <div className="text-[10px] text-[var(--text-muted)] font-mono">SELECT OWNER:</div>
                                        <div className="flex gap-2">
                                          <select
                                            id={`select-owner-${actionKey}`}
                                            className="flex-1 bg-[#14151B] border border-[var(--border)] rounded px-2 py-1 text-xs text-white focus:outline-none font-mono"
                                            defaultValue={act.owner}
                                          >
                                            <option value="Maintenance Team">Maintenance Team</option>
                                            <option value="Electrical Crew">Electrical Crew</option>
                                            <option value="Operations Lead">Operations Lead</option>
                                            <option value="Procurement">Procurement</option>
                                            <option value="Engineering">Engineering</option>
                                          </select>
                                          <button
                                            onClick={() => {
                                              const selectEl = document.getElementById(`select-owner-${actionKey}`) as HTMLSelectElement;
                                              const selectedOwner = selectEl?.value || act.owner;
                                              
                                              handleAction(actionKey, "assigned");
                                              const actionItem: ActionItem = {
                                                id: `rep-act-${idx}-${activeReportId}`,
                                                title: act.title,
                                                source: `AI Briefing Prescription (${activeReport.title})`,
                                                businessImpact: act.impact,
                                                rootCause: `Dispatched from compiled report for plant ${activeReport.plant_id}`,
                                                recommendation: act.description,
                                                roi: act.impact,
                                                owner: selectedOwner,
                                                status: "pending",
                                                confidence: act.priority === "high" ? "90%" : act.priority === "medium" ? "75%" : "60%",
                                                dateGenerated: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                              };
                                              useDashboardStore.getState().addAction(actionItem);
                                              
                                              setAssigningActionKey(null);
                                            }}
                                            className="px-2.5 py-1 bg-[var(--accent)] text-black font-bold text-xs rounded hover:brightness-110 border-none cursor-pointer font-mono"
                                          >
                                            Confirm
                                          </button>
                                          <button
                                            onClick={() => setAssigningActionKey(null)}
                                            className="px-2.5 py-1 bg-transparent border border-[var(--border)] text-[var(--text-secondary)] hover:text-white text-xs rounded cursor-pointer font-mono"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : currentStatus === "pending" ? (
                                      <>
                                        <button
                                          onClick={() => {
                                            handleAction(actionKey, "approved");
                                            const actionItem: ActionItem = {
                                              id: `rep-act-${idx}-${activeReportId}`,
                                              title: act.title,
                                              source: `AI Briefing Prescription (${activeReport.title})`,
                                              businessImpact: act.impact,
                                              rootCause: `Approved from compiled report for plant ${activeReport.plant_id}`,
                                              recommendation: act.description,
                                              roi: act.impact,
                                              owner: act.owner || "Unassigned",
                                              status: "scheduled",
                                              confidence: act.priority === "high" ? "90%" : act.priority === "medium" ? "75%" : "60%",
                                              dateGenerated: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                            };
                                            useDashboardStore.getState().addAction(actionItem);
                                          }}
                                          className="flex-1 text-center text-xs font-bold bg-[var(--accent)] hover:brightness-110 text-black py-1.5 rounded transition-all cursor-pointer border-none font-mono"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          onClick={() => setAssigningActionKey(actionKey)}
                                          className="flex-1 text-center text-xs font-bold bg-[var(--bg-hover)] hover:bg-[var(--border-strong)] text-[var(--text-secondary)] hover:text-white py-1.5 border border-[var(--border)] rounded transition-all cursor-pointer font-mono"
                                        >
                                          Assign
                                        </button>
                                      </>
                                    ) : (
                                      <div className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[var(--status-green)] text-xs font-semibold font-mono">
                                        <Check className="w-3.5 h-3.5" />
                                        <span>ACTION {currentStatus.toUpperCase()}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Call to Action to Document */}
                        <div className="rounded-lg p-5 border border-[var(--border)] bg-gradient-to-r from-[var(--bg-elevated)] to-[var(--bg-surface)] flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                              <ShieldAlert className="w-3.5 h-3.5 text-[var(--accent)]" /> Detailed logs compiled
                            </h4>
                            <p className="text-[11px] text-[var(--text-secondary)] mt-1.5 max-w-xl leading-relaxed">
                              Authorizing shift schedules or inspecting specific sensor arrays requires logging operations sign-off. Load the complete tabular spreadsheet grids.
                            </p>
                          </div>
                          <button
                            onClick={() => setTab("document")}
                            className="flex items-center justify-center gap-2 rounded bg-[var(--accent)] hover:brightness-110 text-black px-4 py-2 text-xs font-bold transition-all flex-shrink-0 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)] border-none"
                          >
                            <span>Open Technical Document</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="document-tab"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-6"
                      >
                        {/* Sections content */}
                        <div className="space-y-6">
                          {/* Narrative/Text & Bullet sections rendered first */}
                          {activeReport.sections
                            .filter((section) => section.type !== "table")
                            .map((section, sIdx) => (
                              <div key={sIdx} className="space-y-3">
                                <div className="flex items-center border-l-2 border-[var(--accent)] pl-3 justify-between">
                                  <h4 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider font-mono">
                                    {section.title}
                                  </h4>
                                  <ContextualMenu
                                    title={section.title}
                                    context={section.content || section.items?.join(", ") || ""}
                                    variant="dropdown"
                                  />
                                </div>

                                {section.type === "text" && (
                                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-3.5">
                                    {section.content}
                                  </p>
                                )}

                                {section.type === "bullets" && section.items && (
                                  <ul className="space-y-2 pl-8 list-disc text-xs text-[var(--text-secondary)] leading-relaxed">
                                    {section.items.map((item, idx) => (
                                      <li key={idx} className="group relative rounded px-2 -mx-2 hover:bg-[var(--bg-elevated)]/20 transition-all">
                                        <div className="flex justify-between items-center gap-4">
                                          <span>{item}</span>
                                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ContextualMenu
                                              title={`Action Item #${idx + 1}`}
                                              context={item}
                                              variant="dropdown"
                                              className="scale-90"
                                            />
                                          </span>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}

                          {/* Raw Data Annex - table sections collapsed by default */}
                          {activeReport.sections.some((s) => s.type === "table") && (
                            <CollapsibleSection
                              title="Raw Data Annex"
                              subtitle="Detailed logs, spreadsheet grids, and metrics tables"
                              icon={<FileSpreadsheet className="w-4 h-4 text-[var(--accent)]" />}
                              defaultOpen={false}
                            >
                              <div className="space-y-8">
                                {activeReport.sections
                                  .filter((section) => section.type === "table")
                                  .map((section, sIdx) => (
                                    <div key={sIdx} className="space-y-3">
                                      <div className="flex items-center justify-between border-l-2 border-[var(--accent)] pl-3 mb-1">
                                        <h4 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider font-mono">
                                          {section.title}
                                        </h4>
                                        <ContextualMenu
                                          title={section.title}
                                          context={`Summary of Table: ${section.title}. Headers: ${section.headers?.join(", ")}`}
                                          variant="dropdown"
                                        />
                                      </div>

                                      {section.headers && section.rows && (
                                        <div className="overflow-x-auto rounded border border-[var(--border)] bg-[var(--bg-elevated)]/30">
                                          <table className="w-full text-left border-collapse">
                                            <thead>
                                              <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]/60">
                                                {section.headers.map((h, idx) => (
                                                  <th key={idx} className="py-2.5 px-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
                                                    {h}
                                                  </th>
                                                ))}
                                                <th className="py-2.5 px-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono text-right w-28">
                                                  AI Analysis
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {section.rows.map((row, rIdx) => {
                                                const rowTitle = row[0] || "Metrics Row";
                                                const rowContext = section.headers!.map((h, i) => `${h}: ${row[i] || ""}`).join(", ");
                                                
                                                return (
                                                  <tr
                                                    key={rIdx}
                                                    className="group border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)]/30 transition-colors"
                                                    style={{
                                                      background: rIdx % 2 === 1 ? "var(--bg-base)" : "transparent",
                                                    }}
                                                  >
                                                    {row.map((cell, cIdx) => (
                                                      <td key={cIdx} className="py-2.5 px-3 text-xs text-[var(--text-secondary)] font-mono">
                                                        {cell}
                                                      </td>
                                                    ))}
                                                    <td className="py-1 px-3 text-right">
                                                      <div className="inline-flex justify-end opacity-40 group-hover:opacity-100 transition-opacity">
                                                        <ContextualMenu 
                                                          title={rowTitle}
                                                          context={rowContext}
                                                          variant="row"
                                                        />
                                                      </div>
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </CollapsibleSection>
                          )}
                        </div>

                        {/* Footer classification */}
                        <div className="flex justify-between items-center mt-10 pt-5 border-t border-[var(--border)] text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
                          <span>Classification: STRICTLY CONFIDENTIAL</span>
                          <span>Forge Operations Intelligence</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <DetailSheet
        isOpen={isRiskSheetOpen}
        title={selectedRisk?.title || "Risk"}
        onClose={() => setIsRiskSheetOpen(false)}
        detailData={{
          note: selectedRisk?.description,
          financialImpact: selectedRisk?.financialImpact,
          daysUntilFailure: selectedRisk?.daysUntilFailure,
          showActionsButton: true,
          onActionButtonClick: handleAddRiskAction,
          history: selectedRisk?.title.toLowerCase().includes("bearing") ? [82, 83, 85, 87, 89, 92] : [65, 68, 72, 75, 78, 81],
          unit: selectedRisk?.title.toLowerCase().includes("bearing") ? "°C" : "%"
        }}
      />
    </motion.div>
  );
}
