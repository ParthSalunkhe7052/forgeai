"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertTriangle, CheckCircle, ArrowRight, ShieldAlert, Heart, Landmark } from "lucide-react";
import Link from "next/link";

interface AISituationRoomCardProps {
  data: any;
  onOpenHealth?: () => void;
  onOpenRisk?: () => void;
}

export default function AISituationRoomCard({ data, onOpenHealth, onOpenRisk }: AISituationRoomCardProps) {
  const [decisionStatus, setDecisionStatus] = useState<"pending" | "executing" | "executed">("pending");

  const health = data?.kpis?.health?.value ?? 84;
  const risk = data?.kpis?.risk?.value ?? 34;
  const savings = data?.kpis?.savings_opportunity?.value ?? "₹18.6 Lakhs";
  const concern = data?.kpis?.savings_opportunity?.top_concern ?? "Furnace-2 bearing temperature has increased by 22% over 48 hours. Current: 92°C vs baseline 75°C. Bearing thermal wear projected in 2 days at 68%. Impact: ₹18.6 Lakhs. Recommended: inspect bearing and approve automatic preventative replacement by May 23, 2026.";
  const recommendation = data?.kpis?.savings_opportunity?.recommended_decision ?? "inspect bearing and approve automatic preventative replacement by May 23, 2026.";

  // Reset decision execution status if the recommendation changes (e.g. when changing plants)
  useEffect(() => {
    setDecisionStatus("pending");
  }, [recommendation]);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // First beep (high pitch)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain1.gain.setValueAtTime(0.1, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.15);

      // Second beep (higher pitch, offset slightly)
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(1320, ctx.currentTime); // E6
        gain2.gain.setValueAtTime(0.08, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.25);
      }, 100);
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  const handleExecute = () => {
    setDecisionStatus("executing");
    setTimeout(() => {
      setDecisionStatus("executed");
      playBeep();
    }, 1200);
  };

  return (
    <div className="relative rounded-xl border border-[var(--accent)]/30 bg-[#0B0C10] shadow-[0_0_20px_rgba(245,158,11,0.08)] overflow-hidden transition-all duration-300 hover:border-[var(--accent)]/50">
      {/* Decorative cybernetic corner lines */}
      <div className="absolute top-0 left-0 w-8 h-[2px] bg-[var(--accent)]" />
      <div className="absolute top-0 left-0 w-[2px] h-8 bg-[var(--accent)]" />
      <div className="absolute top-0 right-0 w-8 h-[2px] bg-[var(--accent)]" />
      <div className="absolute top-0 right-0 w-[2px] h-8 bg-[var(--accent)]" />
      
      {/* Glow highlight */}
      <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[var(--accent)]/5 blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[var(--status-red)]/5 blur-[80px] pointer-events-none" />
 
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5 bg-gradient-to-r from-[var(--bg-elevated)] to-transparent">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-[var(--accent)] animate-pulse" />
            <div className="absolute inset-0 w-4.5 h-4.5 bg-[var(--accent)]/30 rounded-full blur-[4px] animate-ping opacity-75" />
          </div>
          <span className="font-mono text-[10px] font-bold tracking-widest text-[var(--accent)] uppercase">
            AI Situation Room
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[9px] px-2 py-0.5 rounded bg-[var(--accent-glow)] border border-[var(--accent)]/20 text-[var(--accent)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            LIVE ADVISORY ACTIVE
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5">
        
        {/* Left: Gauges & Scores (4 cols) */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-r border-[var(--border)] pr-6 max-lg:border-r-0 max-lg:pr-0 max-lg:pb-4 max-lg:border-b">
          {/* Health Gauge */}
          <div
            onClick={onOpenHealth}
            className="flex flex-col justify-between p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--border-strong)] cursor-pointer hover:bg-[var(--bg-elevated)] transition-all select-none"
            title="Click to view health metrics breakdown"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)] uppercase">
              <span>Health Score</span>
              <Heart className="w-3.5 h-3.5 text-[var(--status-green)]" />
            </div>
            <div className="flex items-baseline gap-1 mt-2.5">
              <span className="text-3xl font-light font-mono text-[var(--status-green)]">{health}</span>
              <span className="text-xs font-mono text-[var(--text-muted)]">/ 100</span>
            </div>
            <div className="mt-2.5">
              <div className="w-full bg-[var(--border)] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[var(--status-green)] h-full" style={{ width: `${health}%` }} />
              </div>
              <span className="text-[9px] font-mono text-[var(--text-muted)] mt-1.5 block">
                Enterprise Status: OPTIMAL
              </span>
            </div>
          </div>

          {/* Risk Gauge */}
          <div
            onClick={onOpenRisk}
            className="flex flex-col justify-between p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--border-strong)] cursor-pointer hover:bg-[var(--bg-elevated)] transition-all select-none"
            title="Click to view risk factors breakdown"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)] uppercase">
              <span>Risk Score</span>
              <ShieldAlert className="w-3.5 h-3.5 text-[var(--status-amber)]" />
            </div>
            <div className="flex items-baseline gap-1 mt-2.5">
              <span className="text-3xl font-light font-mono text-[var(--status-amber)]">{risk}</span>
              <span className="text-xs font-mono text-[var(--text-muted)]">/ 100</span>
            </div>
            <div className="mt-2.5">
              <div className="w-full bg-[var(--border)] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[var(--status-amber)] h-full" style={{ width: `${risk}%` }} />
              </div>
              <span className="text-[9px] font-mono text-[var(--text-muted)] mt-1.5 block">
                Active Hazards: STABLE
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Savings & Top Concern (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between border-r border-[var(--border)] pr-6 max-lg:border-r-0 max-lg:pr-0 max-lg:pb-4 max-lg:border-b">
          {/* Savings */}
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[9px] font-mono text-[var(--text-secondary)] uppercase tracking-wider block">
                Savings Opportunity
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-light font-mono text-[var(--accent)]">{savings}</span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">est. cost recovery</span>
              </div>
            </div>
            <Landmark className="w-5 h-5 text-[var(--accent)] opacity-80" />
          </div>

          {/* Top Concern */}
          <div className="mt-3 p-2.5 rounded bg-[rgba(239,68,68,0.03)] border border-[#EF4444]/20">
            <div className="flex items-center gap-1.5 text-[#EF4444] text-[10px] font-mono uppercase font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Top Operational Concern</span>
            </div>
            <p className="text-[11px] text-[var(--text-primary)] font-medium mt-1 leading-relaxed">
              {concern}
            </p>
          </div>
        </div>

        {/* Right: Recommendation & Action Workflow (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between pl-2 max-lg:pl-0">
          <div>
            <span className="text-[9px] font-mono text-[var(--text-secondary)] uppercase tracking-wider block">
              Recommended Decision
            </span>
            <p className="text-[11px] text-[var(--text-secondary)] font-mono leading-relaxed mt-1.5 bg-[var(--bg-elevated)] p-2.5 rounded border border-[var(--border)]">
              {recommendation}
            </p>
          </div>

          {/* Action button workflow */}
          <div className="flex items-center gap-3 mt-4">
            {decisionStatus === "pending" && (
              <button
                onClick={handleExecute}
                className="flex-1 flex items-center justify-center gap-2 rounded bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-black font-semibold text-xs py-2 px-4 border-none transition-all cursor-pointer hover:shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              >
                <span>Execute Decision</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {decisionStatus === "executing" && (
              <button
                disabled
                className="flex-1 flex items-center justify-center gap-2 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] font-semibold text-xs py-2 px-4 border border-[var(--border)] cursor-not-allowed"
              >
                <div className="w-3 h-3 border-2 border-[var(--text-muted)] border-t-transparent rounded-full animate-spin" />
                <span>Deploying Action...</span>
              </button>
            )}

            {decisionStatus === "executed" && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex-1 flex items-center justify-center gap-2 rounded bg-[rgba(34,197,94,0.1)] border border-[var(--status-green)]/40 text-[var(--status-green)] font-semibold text-xs py-2 px-4"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>DECISION EXECUTED</span>
              </motion.div>
            )}

            <Link
              href="/copilot"
              className="flex items-center justify-center gap-1.5 rounded border border-[var(--border)] hover:border-[var(--border-strong)] bg-transparent hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono text-[10px] py-2 px-3 transition-colors duration-150"
            >
              <span>Workspace</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
