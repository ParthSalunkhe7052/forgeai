"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ShieldAlert, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";

interface SubMetric {
  weight: number;
  value: number;
  status: string;
}

interface BreakdownData {
  value: number;
  breakdown: Record<string, SubMetric>;
}

interface BreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "health" | "risk";
  data?: BreakdownData;
  plantName: string;
}

const METRIC_LABELS: Record<string, string> = {
  // Health
  oee: "Asset Availability & OEE Index",
  finance: "Financial Target Adherence",
  energy: "Specific Energy Efficiency",
  safety: "Safety Compliance Ratio",
  // Risk
  equipment: "Equipment Anomalies & Wear",
  supply: "Supply Chain & Logistics Delay Risk",
  // energy is already defined
};

const METRIC_DESCRIPTIONS: Record<string, string> = {
  oee: "Measures overall equipment effectiveness, machine availability, and throughput performance vs production targets.",
  finance: "Evaluates actual cost-to-revenue ratio and margin targets against monthly budget baselines.",
  energy: "Specific energy consumption metrics tracking kWh usage limits per ton of finished steel output.",
  safety: "Tracks historical near-miss reports, zero-incident shift counts, and compliance audits.",
  equipment: "Monitors real-time thermal wear, vibration levels, and predictive failure alarms across plant components.",
  supply: "Aggregates inbound raw material rail delay logs and outbound carrier logistics dispatch delays.",
};

export default function BreakdownModal({ isOpen, onClose, type, data, plantName }: BreakdownModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Disable body scroll when open
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

  if (!mounted) return null;
  if (!data) return null;

  const score = data.value;
  const isHealth = type === "health";
  const TitleIcon = isHealth ? Heart : ShieldAlert;
  const mainColor = isHealth ? "var(--status-green)" : "var(--status-amber)";

  // Helper to map status to colors and icons
  const getStatusDetails = (status: string) => {
    switch (status.toLowerCase()) {
      case "optimal":
      case "stable":
        return {
          color: "var(--status-green)",
          bg: "rgba(34, 197, 94, 0.08)",
          border: "rgba(34, 197, 94, 0.2)",
          icon: CheckCircle,
          label: isHealth ? "Optimal" : "Stable",
        };
      case "amber":
      case "warning":
        return {
          color: "var(--status-amber)",
          bg: "rgba(245, 158, 11, 0.08)",
          border: "rgba(245, 158, 11, 0.2)",
          icon: AlertTriangle,
          label: "Warning",
        };
      case "degraded":
      case "critical":
        return {
          color: "var(--status-red)",
          bg: "rgba(239, 68, 68, 0.08)",
          border: "rgba(239, 68, 68, 0.2)",
          icon: AlertCircle,
          label: "Critical",
        };
      default:
        return {
          color: "var(--text-secondary)",
          bg: "var(--bg-elevated)",
          border: "var(--border)",
          icon: CheckCircle,
          label: status,
        };
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="breakdown-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9990]"
        />
      )}
      {isOpen && (
        <motion.div
          key="breakdown-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center p-4 z-[9991] pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-lg overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[#0B0C10] shadow-2xl z-10 flex flex-col max-h-[90vh] pointer-events-auto"
            style={{
              boxShadow: `0 0 30px rgba(${isHealth ? "34,197,94" : "245,158,11"}, 0.04)`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 bg-[var(--bg-surface)]">
              <div className="flex items-center gap-2.5">
                <TitleIcon className="w-5 h-5" style={{ color: mainColor }} />
                <div>
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    {isHealth ? "Enterprise Health Index" : "Operational Risk Index"}
                  </h3>
                  <span className="font-mono text-[9px] text-[var(--text-secondary)] uppercase">
                    {plantName}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors cursor-pointer border-none bg-transparent"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Score Display Banner */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                    Composite Score
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-4xl font-light font-mono" style={{ color: mainColor }}>
                      {score}
                    </span>
                    <span className="text-sm font-mono text-[var(--text-secondary)]">/ 100</span>
                  </div>
                </div>

                <div className="text-right relative z-10">
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                    Telemetry Status
                  </span>
                  <span
                    className="inline-block mt-2 px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold"
                    style={{
                      color: mainColor,
                      background: `rgba(${isHealth ? "34,197,94" : "245,158,11"}, 0.08)`,
                      border: `1px solid ${isHealth ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`,
                    }}
                  >
                    {isHealth
                      ? score >= 80
                        ? "OPTIMAL"
                        : score >= 60
                        ? "DEGRADED"
                        : "CRITICAL"
                      : score <= 25
                      ? "STABLE"
                      : score <= 50
                      ? "ALERT"
                      : "CRITICAL"}
                  </span>
                </div>
                
                {/* Visual Background Glow */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none filter blur-xl"
                  style={{
                    background: `radial-gradient(circle, ${mainColor} 0%, transparent 80%)`,
                  }}
                />
              </div>

              {/* Sub-Metrics Breakdown Header */}
              <div>
                <h4 className="font-mono text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                  Weighted Factor Analysis
                </h4>

                <div className="space-y-4">
                  {Object.entries(data.breakdown).map(([key, subMetric]) => {
                    const label = METRIC_LABELS[key] || key.toUpperCase();
                    const desc = METRIC_DESCRIPTIONS[key] || "Operational metric contributing to the overall plant composite index.";
                    const details = getStatusDetails(subMetric.status);
                    const StatusIcon = details.icon;

                    return (
                      <div
                        key={key}
                        className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-[var(--text-primary)] block">
                              {label}
                            </span>
                            <span className="text-[10px] text-[var(--text-secondary)] block leading-relaxed">
                              {desc}
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold shrink-0"
                            style={{
                              color: details.color,
                              background: details.bg,
                              border: `1px solid ${details.border}`,
                            }}
                          >
                            <StatusIcon className="w-3 h-3" />
                            <span>{details.label.toUpperCase()}</span>
                          </div>
                        </div>

                        {/* Progress bar and Value */}
                        <div className="mt-3.5 flex items-center gap-3">
                          <div className="flex-1 bg-[var(--border)] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${subMetric.value}%`,
                                backgroundColor: isHealth ? "var(--status-green)" : "var(--status-amber)",
                              }}
                            />
                          </div>
                          <span className="font-mono text-xs text-[var(--text-primary)] shrink-0 w-8 text-right">
                            {subMetric.value}%
                          </span>
                        </div>

                        {/* Weight Indicator */}
                        <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-[var(--text-muted)]">
                          <span>Contribution Weight:</span>
                          <span>{subMetric.weight}% of total index</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-4 bg-[var(--bg-surface)] text-[10px] font-mono text-[var(--text-muted)]">
              <span>Sensor Feed: Realtime · LIVE</span>
              <span>Updated 30s ago</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
