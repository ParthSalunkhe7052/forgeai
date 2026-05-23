"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, AlertTriangle, ArrowRight, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { CHART_STYLE, CHART_COLORS_HEX } from "@/app/lib/chart-config";

// --- INFO POPOVER ---
interface InfoPopoverProps {
  triggerRect: DOMRect | null;
  content: {
    formula?: string;
    source?: string;
    benchmark?: string;
    lastUpdated?: string;
  };
  onClose: () => void;
}

export function InfoPopover({ triggerRect, content, onClose }: InfoPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Close on any scroll in the page to prevent floating detached popovers
    function handleScroll() {
      onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [onClose]);

  if (!mounted || !triggerRect) return null;

  // Calculate coordinates in viewport
  const top = triggerRect.bottom + 8;
  const left = Math.max(
    16,
    Math.min(window.innerWidth - 296, triggerRect.left - 130 + triggerRect.width / 2)
  );

  return createPortal(
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      style={{ top: `${top}px`, left: `${left}px` }}
      className="fixed z-[9999] pointer-events-auto w-[280px] rounded border border-[var(--border-strong)] bg-[#0C0D12] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.7)] text-xs font-mono text-[var(--text-secondary)] space-y-3"
    >
      <div className="flex items-center gap-1.5 text-[var(--accent)] font-semibold text-[10px] tracking-wider uppercase border-b border-[var(--border)] pb-1.5">
        <HelpCircle className="w-3.5 h-3.5" />
        <span>Metric Information</span>
      </div>

      {content.formula && (
        <div>
          <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide">Formula / Calculation</div>
          <div className="text-white text-[11px] leading-relaxed mt-0.5">{content.formula}</div>
        </div>
      )}

      {content.source && (
        <div>
          <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide">Data Source</div>
          <div className="text-[11px] mt-0.5 text-white">{content.source}</div>
        </div>
      )}

      {content.benchmark && (
        <div>
          <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide">Industry Benchmark</div>
          <div className="text-[11px] mt-0.5 text-white">{content.benchmark}</div>
        </div>
      )}

      {content.lastUpdated && (
        <div className="pt-1.5 border-t border-[var(--border)] text-[9px] text-[var(--text-muted)] flex justify-between">
          <span>UPDATED</span>
          <span className="text-[var(--accent)]">{content.lastUpdated}</span>
        </div>
      )}
    </motion.div>,
    document.body
  );
}

// --- DETAIL SHEET ---
interface DetailSheetProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
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
}

export function DetailSheet({ isOpen, title, onClose, detailData }: DetailSheetProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const history = detailData?.history || [75, 78, 76, 80, 84, 82, 85, 87, 86, 88, 91, 89];
  const unit = detailData?.unit || "%";
  const note = detailData?.note || `Asset performance is tracking within historical variance. No degradation anomalies identified.`;

  // Generate chart data
  const chartData = history.map((val, idx) => ({
    day: `D-${12 - idx}`,
    value: val,
  }));

  const maxVal = Math.max(...history);
  const minVal = Math.min(...history);
  const avgVal = history.reduce((a, b) => a + b, 0) / history.length;
  const currentVal = history[history.length - 1];

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="detail-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[9990]"
        />
      )}
      {isOpen && (
        <motion.div
          key="detail-drawer"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-[#0E0F14] border-l border-[var(--border-strong)] shadow-[0_0_40px_rgba(0,0,0,0.8)] z-[9991] flex flex-col font-mono"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 bg-[var(--bg-elevated)]/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              <span className="font-bold text-xs uppercase tracking-wider text-white">
                {title} Analysis
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white transition-all cursor-pointer border-none bg-transparent"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {title.toLowerCase().includes("furnace-2") || title.toLowerCase().includes("furnace 2") ? (
              <div className="space-y-6">
                {/* Critical Stats */}
                <div className="space-y-2.5">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Current Machine Status</span>
                  <div className="border border-[var(--border)] rounded-lg p-4 bg-[#14151B] space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--text-secondary)]">Health Score</span>
                      <span className="text-[var(--status-amber)] font-bold">68% — Degraded</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--text-secondary)]">Vibration</span>
                      <span className="text-[var(--status-red)] font-bold">4.2 mm/s (baseline: 2.1)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--text-secondary)]">Temperature</span>
                      <span className="text-[var(--status-amber)] font-bold">94°C (limit: 100°C)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--text-secondary)]">Failure Risk</span>
                      <span className="text-[var(--status-red)] font-bold">68% within 10 days</span>
                    </div>
                  </div>
                </div>

                {/* Vibration Trend Chart */}
                <div className="space-y-2">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">VIBRATION TREND — 14 DAYS</span>
                  <div className="h-[200px] w-full border border-[var(--border)] rounded-lg p-3 bg-[#101116]/50">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { day: "D1", value: 2.1 },
                          { day: "D2", value: 2.2 },
                          { day: "D3", value: 2.2 },
                          { day: "D4", value: 2.4 },
                          { day: "D5", value: 2.5 },
                          { day: "D6", value: 2.7 },
                          { day: "D7", value: 2.9 },
                          { day: "D8", value: 3.0 },
                          { day: "D9", value: 3.2 },
                          { day: "D10", value: 3.5 },
                          { day: "D11", value: 3.7 },
                          { day: "D12", value: 3.8 },
                          { day: "D13", value: 4.0 },
                          { day: "D14", value: 4.2 }
                        ]}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                        <XAxis dataKey="day" tick={{ fill: CHART_STYLE.axisColor, fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: CHART_STYLE.axisColor, fontSize: 9 }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={false} contentStyle={{ backgroundColor: "#14151C", borderColor: "var(--border-strong)", borderRadius: 6, fontSize: 10 }} />
                        <Line type="monotone" dataKey="value" stroke="var(--status-red)" strokeWidth={2} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AI Note Banner */}
                <div className="border border-[var(--accent)]/20 bg-[var(--accent)]/5 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-1 text-[var(--accent)] text-[10px] font-bold tracking-wider uppercase">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>AI Diagnostics</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-[var(--text-secondary)]">
                    Bearing wear pattern consistent with thermal fatigue. Vibration signature matches **72%** of historical bearing seizure events in the dataset. Estimated cost if unplanned failure: **₹18.6L**. Cost of preventive replacement: **₹2.1L**.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="pt-2 border-t border-[var(--border)] space-y-2">
                  <button
                    onClick={() => {
                      onClose();
                      window.location.href = "/actions";
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded bg-[var(--accent)] hover:brightness-110 text-black py-2.5 text-xs font-bold transition-all border-none cursor-pointer font-mono"
                  >
                    <span>Add to Actions Center</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      alert("Downloading diagnostic report for Pune Furnace-2...");
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded border border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white py-2.5 text-xs font-bold transition-all cursor-pointer font-mono bg-transparent"
                  >
                    <span>Download Diagnostic Report</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Main value indicator */}
                <div className="bg-[#14151B] border border-[var(--border)] rounded-lg p-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Current Value</span>
                    <span className="text-3xl font-light text-white block mt-1">
                      {currentVal.toFixed(1)}{unit}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Status</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[var(--status-green)] font-bold inline-block mt-2">
                      STABLE
                    </span>
                  </div>
                </div>

                {/* 30-Day Trend Chart */}
                <div className="space-y-2">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Performance Trend</span>
                  <div className="h-[220px] w-full border border-[var(--border)] rounded-lg p-3 bg-[#101116]/50">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                        <XAxis
                          dataKey="day"
                          tick={{ fill: CHART_STYLE.axisColor, fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[
                            Math.max(0, Math.floor(minVal * 0.9)),
                            Math.min(100, Math.ceil(maxVal * 1.1)),
                          ]}
                          tick={{ fill: CHART_STYLE.axisColor, fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={false}
                          contentStyle={{
                            backgroundColor: "#14151C",
                            borderColor: "var(--border-strong)",
                            borderRadius: 6,
                            fontSize: 11,
                            color: "white",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={CHART_COLORS_HEX.c1}
                          strokeWidth={2}
                          dot={{ r: 3, stroke: CHART_COLORS_HEX.c1, strokeWidth: 1, fill: "#0E0F14" }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Summary Stats Table */}
                <div className="space-y-2">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Historical Statistics</span>
                  <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                      <tbody>
                        <tr className="border-b border-[var(--border)] bg-[#101116]/30">
                          <td className="p-3 text-[var(--text-secondary)]">Maximum Reading</td>
                          <td className="p-3 text-white text-right font-bold">{maxVal.toFixed(1)}{unit}</td>
                        </tr>
                        <tr className="border-b border-[var(--border)]">
                          <td className="p-3 text-[var(--text-secondary)]">Minimum Reading</td>
                          <td className="p-3 text-white text-right font-bold">{minVal.toFixed(1)}{unit}</td>
                        </tr>
                        <tr className="border-b border-[var(--border)] bg-[#101116]/30">
                          <td className="p-3 text-[var(--text-secondary)]">Historical Average</td>
                          <td className="p-3 text-white text-right font-bold">{avgVal.toFixed(1)}{unit}</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-[var(--text-secondary)]">Current Deviation</td>
                          <td className="p-3 text-[var(--status-green)] text-right font-bold">
                            {((currentVal - avgVal) / (avgVal || 1) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI Note Banner */}
                <div className="border border-[var(--accent)]/20 bg-[var(--accent)]/5 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-1 text-[var(--accent)] text-[10px] font-bold tracking-wider uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Co-Pilot Diagnosis</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[var(--text-secondary)] italic">
                    &ldquo;{note}&rdquo;
                  </p>
                </div>

                {/* Risk Assessment metrics if provided */}
                {(detailData?.financialImpact || detailData?.daysUntilFailure !== undefined) && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 grid grid-cols-2 gap-4">
                    {detailData.financialImpact && (
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Est. Financial Impact</span>
                        <span className="text-xs font-bold text-white block mt-1 text-[var(--status-red)]">
                          {detailData.financialImpact}
                        </span>
                      </div>
                    )}
                    {detailData.daysUntilFailure !== undefined && (
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Days Until Failure</span>
                        <span className="text-xs font-bold text-white block mt-1 text-[var(--status-amber)]">
                          {detailData.daysUntilFailure} Days
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button inside Sheet */}
                {detailData?.showActionsButton && detailData.onActionButtonClick && (
                  <div className="pt-2 border-t border-[var(--border)]">
                    <button
                      onClick={detailData.onActionButtonClick}
                      className="w-full flex items-center justify-center gap-1.5 rounded bg-[var(--accent)] hover:brightness-110 text-black py-2.5 text-xs font-bold transition-all border-none cursor-pointer font-mono"
                    >
                      <span>Add to Actions Center</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// --- ACTION DIALOG ---
interface ActionDialogProps {
  isOpen: boolean;
  title: string;
  actionContent?: string;
  onClose: () => void;
}

export function ActionDialog({ isOpen, title, actionContent, onClose }: ActionDialogProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleAddAction = () => {
    onClose();
    window.location.href = "/actions";
  };

  const actionText = actionContent || `Inspect and schedule thermal core diagnostic cycles for the blast furnace systems in the next 12 hours.`;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="action-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-[2px] z-[9990]"
        />
      )}
      {isOpen && (
        <motion.div
          key="action-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center p-4 z-[9991] pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            className="w-full max-w-md bg-[#0E0F14] border border-[var(--border-strong)] rounded-lg p-5 font-mono shadow-[0_8px_32px_rgba(0,0,0,0.8)] space-y-5 pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center gap-2 text-[var(--accent)] border-b border-[var(--border)] pb-3">
              <AlertTriangle className="w-5 h-5 text-[var(--accent)] animate-pulse" />
              <span className="font-bold text-xs uppercase tracking-wider text-white">
                AI Prescribed Optimization Recommendation
              </span>
            </div>

            {/* Body */}
            <div className="space-y-4">
              <div>
                <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide">Target Metric</span>
                <span className="text-xs text-white block mt-0.5 font-bold uppercase">{title}</span>
              </div>

              <div className="bg-[#14151B] border border-[var(--border)] rounded p-4 text-xs text-[var(--text-secondary)] leading-relaxed">
                {actionText}
              </div>

              <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] bg-[var(--accent)]/5 border border-[var(--accent)]/10 px-3 py-2 rounded">
                <span>CONFIDENCE RATIO</span>
                <span className="text-[var(--status-green)] font-bold">89% (HIGH)</span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded border border-[var(--border)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white text-xs cursor-pointer bg-transparent font-mono transition-all"
              >
                Dismiss
              </button>
              <button
                onClick={handleAddAction}
                className="px-3 py-1.5 rounded bg-[var(--accent)] hover:brightness-110 text-black text-xs font-semibold cursor-pointer border-none flex items-center gap-1 font-mono transition-all"
              >
                <span>Review in Actions Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
