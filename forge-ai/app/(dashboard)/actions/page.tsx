"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  CheckCircle,
  UserPlus,
  Play,
  Clock,
  Sparkles,
  Zap,
  ShieldAlert,
  ArrowRight,
  User,
  Activity,
  AlertTriangle
} from "lucide-react";
import ContextualMenu from "@/app/components/ui/ContextualMenu";
import { cn } from "@/app/utils/cn";
import { useDashboardStore, ActionItem } from "@/app/store/useDashboardStore";
import { MOCK_DATA, formatCurrency } from "@/app/lib/mock-data/constants";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } },
} as const;

export default function ActionsCenter() {
  const {
    actions,
    approveAction,
    assignActionOwner,
    updateActionStatus
  } = useDashboardStore();

  const [filter, setFilter] = useState<"all" | "pending" | "scheduled" | "in_progress" | "completed">("all");

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  const handleApprove = (id: string) => {
    playBeep();
    approveAction(id);
  };

  const handleAssignOwner = (id: string, newOwner: string) => {
    assignActionOwner(id, newOwner);
  };

  const handleStatusChange = (id: string, newStatus: ActionItem["status"]) => {
    updateActionStatus(id, newStatus);
  };

  const filteredActions = actions.filter((act) => filter === "all" || act.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "var(--status-amber)";
      case "scheduled":
        return "var(--status-green)";
      case "in_progress":
        return "var(--status-blue)";
      case "completed":
        return "var(--text-muted)";
      default:
        return "var(--text-muted)";
    }
  };

  const renderStatusBadge = (status: ActionItem["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Pending
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Approved
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            In Progress
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
            <CheckCircle className="w-2.5 h-2.5" />
            Completed
          </span>
        );
    }
  };

  const renderProgressTracker = (status: ActionItem["status"]) => {
    const steps = [
      { id: "pending", label: "DIAGNOSTICS", color: "var(--status-amber)" },
      { id: "scheduled", label: "APPROVED", color: "var(--status-green)" },
      { id: "in_progress", label: "DEPLOYED", color: "var(--status-blue)" },
      { id: "completed", label: "VERIFIED", color: "var(--text-muted)" }
    ];

    const currentStepIdx = steps.findIndex(s => s.id === status);

    return (
      <div className="ml-2 pt-2 flex flex-col gap-3 font-mono">
        <div className="flex justify-between items-center text-[8px] text-[var(--text-muted)] uppercase">
          <span>Execution Timeline Status</span>
          <span className="font-semibold text-white">{status === "scheduled" ? "approved" : status}</span>
        </div>
        
        {/* Node and Line Container */}
        <div className="relative flex items-center justify-between px-8">
          {/* Background Connecting Lines */}
          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-[2px] bg-[var(--border)] z-0" />
          
          {/* Active Progress Line */}
          <div 
            className="absolute left-8 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-amber-500 via-emerald-500 to-blue-500 transition-all duration-500 z-0"
            style={{
              width: `${currentStepIdx * 33.33}%`
            }}
          />

          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isActive = idx === currentStepIdx;
            
            return (
              <div key={step.id} className="relative flex flex-col items-center z-10">
                {/* Node dot */}
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                    isCompleted 
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isActive
                      ? "bg-amber-500 border-amber-500"
                      : "bg-[#0E0F14] border-[var(--border-strong)]"
                  )}
                  style={{
                    boxShadow: isActive ? "0 0 10px rgba(245, 158, 11, 0.4)" : "none",
                    animation: isActive ? "highlight-pulse 1.5s infinite" : "none"
                  }}
                >
                  {isCompleted && (
                    <span className="text-[8px] font-bold">✓</span>
                  )}
                </div>
                
                {/* Label */}
                <span 
                  className={cn(
                    "absolute top-6 text-[8px] font-bold tracking-wider whitespace-nowrap transition-colors",
                    isActive ? "text-white" : "text-[var(--text-muted)]"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Extra spacing for labels */}
        <div className="h-4" />
      </div>
    );
  };

  // Stats
  const pendingCount = actions.filter((a) => a.status === "pending").length;
  const approvedCount = actions.filter((a) => a.status === "scheduled" || a.status === "in_progress").length;
  const estRoiVal = "₹24.6 Lakhs";
  const costAvoidance = formatCurrency(MOCK_DATA.plantB.furnace2.impact_unplanned_lakhs, "Lakhs");

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Dynamic keyframe styles */}
      <style>{`
        @keyframes highlight-pulse {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          50% { box-shadow: 0 0 12px 3px rgba(245, 158, 11, 0.2); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
      `}</style>

      {/* ========================================================
          TOTAL IMPACT SUMMARY BANNER
          ======================================================== */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--border)] rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4 text-center font-mono"
      >
        <div className="py-2 md:py-0 flex flex-col justify-center">
          <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider block">Pending Review</span>
          <span className="text-sm font-bold text-[var(--status-amber)] mt-1">{pendingCount} Actions</span>
        </div>
        <div className="py-2 md:py-0 flex flex-col justify-center">
          <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider block">Approved / Scheduled</span>
          <span className="text-sm font-bold text-[var(--status-blue)] mt-1">{approvedCount} Scheduled</span>
        </div>
        <div className="py-2 md:py-0 flex flex-col justify-center">
          <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider block">Total AI-Estimated Monthly Savings</span>
          <span className="text-sm font-bold text-[var(--status-green)] mt-1">{estRoiVal}</span>
        </div>
      </motion.div>

      {/* ========================================================
          CYBERNETIC HEADER SECTION
          ======================================================== */}
      <motion.div
        variants={itemVariants}
        className="relative rounded-xl border border-[var(--accent)]/30 bg-[#0B0C10] shadow-[0_0_20px_rgba(245,158,11,0.08)] overflow-hidden p-5"
      >
        <div className="absolute top-0 left-0 w-6 h-[2px] bg-[var(--accent)]" />
        <div className="absolute top-0 left-0 w-[2px] h-6 bg-[var(--accent)]" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent)]/10 rounded border border-[var(--accent)]/20 text-[var(--accent)]">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold tracking-widest text-[var(--accent)] uppercase block">
                Workflow Automation Desk
              </span>
              <h1 className="text-xl font-bold text-white mt-1">Actions Center</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[9px] px-2.5 py-1 rounded bg-[var(--accent-glow)] border border-[var(--accent)]/20 text-[var(--accent)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            AI ADVISOR SYNCED
          </div>
        </div>

        {/* Advisory stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-[var(--border)]">
          <div>
            <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">Pending Recommendations</span>
            <span className="text-2xl font-mono text-[var(--status-amber)] font-bold">{pendingCount}</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">Approved & Scheduled</span>
            <span className="text-2xl font-mono text-[var(--status-blue)] font-bold">{approvedCount}</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">Total Estimated ROI</span>
            <span className="text-2xl font-mono text-[var(--status-green)] font-bold">{estRoiVal}</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">Cost Avoidance</span>
            <span className="text-2xl font-mono text-white font-bold">{costAvoidance}</span>
          </div>
        </div>
      </motion.div>

      {/* ========================================================
          ACTIONS QUEUE CONTROLS
          ======================================================== */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "All Actions" },
            { id: "pending", label: "Pending" },
            { id: "scheduled", label: "Approved/Scheduled" },
            { id: "in_progress", label: "In Progress" },
            { id: "completed", label: "Completed" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-[4px] border font-mono text-[10px] uppercase transition-all cursor-pointer",
                filter === tab.id
                  ? "bg-[var(--accent)] text-black font-semibold border-[var(--accent)]"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--text-muted)]"
              )}
            >
              {tab.label} ({tab.id === "all" ? actions.length : actions.filter((a) => a.status === tab.id).length})
            </button>
          ))}
        </div>
      </motion.div>

      {/* ========================================================
          ACTIONS QUEUE LISTING
          ======================================================== */}
      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredActions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[200px] flex flex-col items-center justify-center border border-[var(--border)] bg-[var(--bg-surface)] rounded-lg text-center"
            >
              <CheckCircle className="w-8 h-8 mb-2.5 text-[var(--status-green)] opacity-70" />
              <p className="text-xs font-mono text-[var(--text-secondary)]">Zero actions fit this queue filter status.</p>
            </motion.div>
          ) : (
            filteredActions.map((act) => (
              <motion.div
                key={act.id}
                layoutId={act.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="relative rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] transition-all p-5 flex flex-col justify-between gap-5"
              >
                {/* Glowing vertical state color indicator */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-lg"
                  style={{ backgroundColor: getStatusColor(act.status) }}
                />

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 pl-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-mono text-[var(--accent)] font-semibold uppercase tracking-wider bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border)]">
                        {act.source}
                      </span>
                      <span className="text-[9px] font-mono text-[var(--text-muted)]">Confidence: {act.confidence}</span>
                    </div>
                    <h2 className="text-sm font-semibold text-white">{act.title}</h2>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      <span className="font-semibold text-white">Business Impact:</span> {act.businessImpact}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {renderStatusBadge(act.status)}
                    <ContextualMenu
                      title={act.title}
                      context={`Action: ${act.title}, source: ${act.source}, impact: ${act.businessImpact}, cause: ${act.rootCause}, recommendation: ${act.recommendation}, ROI: ${act.roi}`}
                      variant="dropdown"
                    />
                  </div>
                </div>

                {/* Technical RCA Details Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-md p-4 ml-2">
                  <div>
                    <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block font-bold">
                      Root Cause Diagnostics
                    </span>
                    <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                      {act.rootCause}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-[var(--accent)] uppercase tracking-wider block font-bold">
                      AI Action Recommendation
                    </span>
                    <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                      {act.recommendation}
                    </p>
                  </div>
                </div>

                {/* ROI, Owner, Timeline Track Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 ml-2 pt-2.5 border-t border-[var(--border)]">
                  
                  {/* ROI & Owner */}
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono">
                    <div className="text-[var(--text-muted)]">
                      ROI: <span className="text-emerald-500 font-semibold">{act.roi}</span>
                    </div>
                    
                    {/* Owner Assign Dropdown */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--text-muted)]">Owner:</span>
                      <select
                        value={act.owner}
                        onChange={(e) => handleAssignOwner(act.id, e.target.value)}
                        className="bg-[var(--bg-elevated)] border border-[var(--border)] text-white text-[10px] font-mono rounded px-1.5 py-0.5 focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                      >
                        <option value="Maintenance Team">Maintenance Crew Alpha</option>
                        <option value="Operations Lead">Operations Dispatch Lead</option>
                        <option value="Safety Team">HSE Risk Manager</option>
                        <option value="Control Room Engineer">Lead Automation Engineer</option>
                      </select>
                    </div>
                  </div>

                  {/* Approve, Assign status triggers */}
                  <div className="flex items-center gap-2">
                    
                    {/* Progress tracking button */}
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-mono text-[var(--text-muted)] mr-1">Progress State:</span>
                      <div className="flex items-center gap-1">
                        {(["pending", "scheduled", "in_progress", "completed"] as const).map((st) => (
                          <button
                            key={st}
                            onClick={() => handleStatusChange(act.id, st)}
                            className={cn(
                              "w-3 h-3 rounded-full border cursor-pointer transition-all",
                              act.status === st 
                                ? "scale-110"
                                : "opacity-40 hover:opacity-75"
                            )}
                            style={{
                              backgroundColor: getStatusColor(st),
                              borderColor: act.status === st ? "#fff" : "transparent"
                            }}
                            title={`Set status to ${st}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Approve button for quick action */}
                    {act.status === "pending" && (
                      <button
                        onClick={() => handleApprove(act.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-[var(--accent)] hover:brightness-110 text-black font-semibold text-[10px] font-mono rounded border-none cursor-pointer transition-all"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>APPROVE ACTION</span>
                      </button>
                    )}
                  </div>

                </div>

                {/* Execution Timeline Meter */}
                {renderProgressTracker(act.status)}

              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  );
}
