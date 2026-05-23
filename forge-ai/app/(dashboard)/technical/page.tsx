"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/app/utils/cn";
import { CHART_STYLE, CHART_COLORS_HEX } from "@/app/lib/chart-config";
import {
  Server,
  Activity,
  ShieldAlert,
  Cpu,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Layers,
  CheckCircle,
  Clock,
  HelpCircle,
  Zap,
  Info,
  Network,
  Database,
  Lock,
  Globe,
  RefreshCw
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import CollapsibleSection from "@/app/components/ui/CollapsibleSection";
import ContextualMenu from "@/app/components/ui/ContextualMenu";
import { DetailSheet } from "@/app/components/ui/Overlays";
import { MOCK_DATA } from "@/app/lib/mock-data/constants";
import {
  SYSTEMS_STATUS,
  LATENCY_48H,
  ACTIVE_INCIDENTS,
  CYBER_EVENTS,
  NETWORK_ZONES,
  SENSOR_HEALTH,
  BACKUP_STATUS,
  SystemStatus,
  ActiveIncident
} from "@/app/lib/mock-data/it-ot";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } },
} as const;

function InfoBar() {
  return (
    <div
      className="flex items-center justify-between px-6 text-[11px] mb-4 border border-[var(--status-amber)]/20 rounded-lg"
      style={{
        height: 36,
        background: "rgba(245,158,11,0.05)",
        color: "var(--status-amber)",
        fontFamily: "'DM Mono', monospace",
        flexShrink: 0,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="animate-pulse">⚠</span>
        <span>OT LATENCY ALERT: PLC Network ping at 124ms vs 15ms baseline. OT backbone congestion suspected.</span>
      </div>
      <div className="text-[10px] opacity-75">
        AUTOMATED AI WATCHDOG · ACTIVE
      </div>
    </div>
  );
}

export default function ITOTDashboard() {
  const [selectedSystem, setSelectedSystem] = useState<SystemStatus | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<ActiveIncident | null>(null);

  const [activeCyberBlock, setActiveCyberBlock] = useState<string | null>(null);

  const itOtData = MOCK_DATA.itOT;

  const getStatusColorClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === "healthy" || s === "operational" || s === "success" || s === "secure" || s === "optimal") {
      return "text-[var(--status-green)] border-emerald-500/20 bg-emerald-500/10";
    }
    if (s === "degraded" || s === "warning" || s === "inspected") {
      return "text-[var(--status-amber)] border-amber-500/20 bg-amber-500/10";
    }
    return "text-[var(--status-red)] border-red-500/20 bg-red-500/10";
  };

  const getSeverityColor = (severity: string) => {
    const s = severity.toUpperCase();
    if (s === "P1" || s === "CRITICAL") return "text-[var(--status-red)] border-red-500/20 bg-red-500/10";
    if (s === "P2" || s === "WARNING" || s === "HIGH") return "text-[var(--status-amber)] border-amber-500/20 bg-amber-500/10";
    return "text-blue-400 border-blue-500/20 bg-blue-500/10";
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Dynamic latency alert bar */}
      {itOtData.pipeline_latency_ms > 100 && <InfoBar />}

      {/* ========================================================
          IT/OT INFRASTRUCTURE STATUS HERO (TOP SECTION)
          ======================================================== */}
      <motion.div
        variants={itemVariants}
        className="relative rounded-xl border border-[var(--accent)]/30 bg-[#0B0C10] shadow-[0_0_20px_rgba(245,158,11,0.08)] overflow-hidden transition-all duration-300 hover:border-[var(--accent)]/50"
      >
        {/* Aesthetic Cybernetic Corners */}
        <div className="absolute top-0 left-0 w-6 h-[2px] bg-[var(--accent)]" />
        <div className="absolute top-0 left-0 w-[2px] h-6 bg-[var(--accent)]" />
        <div className="absolute top-0 right-0 w-6 h-[2px] bg-[var(--accent)]" />
        <div className="absolute top-0 right-0 w-[2px] h-6 bg-[var(--accent)]" />

        {/* Glowing Accents */}
        <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-[var(--accent)]/5 blur-[50px] pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full bg-[var(--status-red)]/5 blur-[50px] pointer-events-none" />

        {/* Console Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3 bg-[var(--bg-elevated)]/30">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-[var(--accent)] animate-pulse" />
            <span className="font-mono text-[10px] font-bold tracking-widest text-[var(--accent)] uppercase">
              IT/OT Systems Infrastructure Control Center
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 font-mono text-[9px] px-2 py-0.5 rounded bg-[var(--accent-glow)] border border-[var(--accent)]/20 text-[var(--accent)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              INFRASTRUCTURE ENGINE ONLINE
            </div>
            <ContextualMenu
              title="IT/OT Infrastructure"
              context={`Global Uptime: ${itOtData.uptime_pct}%, Active Incidents: ${itOtData.incidents_active}, Pipeline Health: ${itOtData.pipeline_health_pct}%, Latency: ${itOtData.pipeline_latency_ms}ms`}
            />
          </div>
        </div>

        {/* 6 Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-[var(--border)] bg-[var(--bg-surface)]/20">
          {/* 1. Global Uptime */}
          <div className="p-4 flex flex-col justify-between min-h-[110px]">
            <div>
              <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                01. Global Uptime
              </span>
              <span className="text-xl font-mono text-white mt-1.5 block font-bold">
                {itOtData.uptime_pct}%
              </span>
            </div>
            <span className="text-[9px] font-mono text-[var(--status-green)] mt-1">
              {itOtData.uptime_delta}
            </span>
          </div>

          {/* 2. Active Incidents */}
          <div className="p-4 flex flex-col justify-between min-h-[110px]">
            <div>
              <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                02. Active Incidents
              </span>
              <span className="text-xl font-mono text-[var(--status-amber)] mt-1.5 block font-bold">
                {itOtData.incidents_active}
              </span>
            </div>
            <span className="text-[9px] font-mono text-[var(--text-secondary)] mt-1">
              1 Critical (P1) · 3 High (P2)
            </span>
          </div>

          {/* 3. Operational Systems */}
          <div className="p-4 flex flex-col justify-between min-h-[110px]">
            <div>
              <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                03. Systems Online
              </span>
              <span className="text-xl font-mono text-white mt-1.5 block font-bold">
                {itOtData.systems_healthy} / {itOtData.systems_total}
              </span>
            </div>
            <span className="text-[9px] font-mono text-[var(--status-amber)] mt-1">
              2 systems degraded/alert
            </span>
          </div>

          {/* 4. Cybersecurity Alerts */}
          <div className="p-4 flex flex-col justify-between min-h-[110px]">
            <div>
              <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                04. Cyber Alerts
              </span>
              <span className="text-xl font-mono text-[var(--status-red)] mt-1.5 block font-bold">
                {itOtData.cyber_alerts_critical} Crit / {itOtData.cyber_alerts_warning} Warn
              </span>
            </div>
            <span className="text-[9px] font-mono text-[var(--text-secondary)] mt-1">
              {itOtData.cyber_events_24h} packets inspected/min
            </span>
          </div>

          {/* 5. Pipeline Health */}
          <div className="p-4 flex flex-col justify-between min-h-[110px]">
            <div>
              <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                05. Data Pipeline
              </span>
              <span className="text-xl font-mono text-white mt-1.5 block font-bold">
                {itOtData.pipeline_health_pct}%
              </span>
            </div>
            <span className="text-[9px] font-mono text-[var(--status-amber)] mt-1 font-semibold">
              Warning status (Plant B)
            </span>
          </div>

          {/* 6. OT Bus Latency */}
          <div className="p-4 flex flex-col justify-between min-h-[110px]">
            <div>
              <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                06. Pipeline Latency
              </span>
              <span className="text-xl font-mono text-[var(--status-red)] mt-1.5 block font-bold">
                {itOtData.pipeline_latency_ms} ms
              </span>
            </div>
            <span className="text-[9px] font-mono text-[var(--text-secondary)] mt-1">
              Baseline: {itOtData.pipeline_latency_baseline_ms}ms
            </span>
          </div>
        </div>
      </motion.div>

      {/* ========================================================
          1. NETWORK & SYSTEMS STATUS SECTION
          ======================================================== */}
      <motion.div variants={itemVariants}>
        <CollapsibleSection
          title="Network & Systems Status"
          subtitle="Real-time uptime monitoring for enterprise and industrial technology layers"
          icon={<Server className="w-4 h-4 text-[var(--accent)]" />}
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* System Health Grid Table */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[10px] font-mono text-[var(--text-secondary)] font-bold uppercase tracking-wider">Critical Host Registry</span>
                <span className="text-[9px] font-mono text-[var(--text-muted)]">CLICK ROW FOR HISTORICAL GRAPH</span>
              </div>
              <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[#0C0D12]/40">
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-[11px] font-mono text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-strong)] bg-[#101116] text-[var(--text-muted)] sticky top-0">
                        <th className="p-2.5">System Name</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Uptime MTD</th>
                        <th className="p-2.5">Ping</th>
                        <th className="p-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {SYSTEMS_STATUS.map((sys) => (
                        <tr
                          key={sys.name}
                          onClick={() => setSelectedSystem(sys)}
                          className="hover:bg-[var(--bg-elevated)]/50 cursor-pointer transition-all duration-150"
                        >
                          <td className="p-2.5 font-bold text-white flex items-center gap-1.5">
                            <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", 
                              sys.status === "healthy" ? "bg-[var(--status-green)]" : sys.status === "degraded" ? "bg-[var(--status-amber)]" : "bg-[var(--status-red)]"
                            )} />
                            {sys.name}
                          </td>
                          <td className="p-2.5 text-[var(--text-secondary)]">{sys.category} Node</td>
                          <td className="p-2.5 text-white">{sys.uptime.toFixed(2)}%</td>
                          <td className="p-2.5 text-[var(--text-secondary)]">{sys.latency}</td>
                          <td className="p-2.5 text-right">
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase", getStatusColorClass(sys.status))}>
                              {sys.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Latency Chart */}
            <div id="chart-latency-trend" className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[10px] font-mono text-[var(--text-secondary)] font-bold uppercase tracking-wider">OT Bus Latency (48H)</span>
                <span className="text-[9px] font-mono text-[var(--status-red)] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-red)] animate-ping" />
                  SYNC LAG SPIKING
                </span>
              </div>
              <div className="h-[300px] border border-[var(--border)] rounded-lg p-3 bg-[#101116]/40 flex flex-col justify-between">
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={LATENCY_48H} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                      <XAxis
                        dataKey="time"
                        tick={{ fill: CHART_STYLE.axisColor, fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        interval={12}
                      />
                      <YAxis
                        tick={{ fill: CHART_STYLE.axisColor, fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 450]}
                      />
                      <Tooltip
                        cursor={false}
                        contentStyle={{
                          backgroundColor: "#14151C",
                          borderColor: "var(--border-strong)",
                          borderRadius: 6,
                          fontSize: 10,
                          color: "white",
                        }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                      <Line
                        type="monotone"
                        dataKey="plcToScada"
                        name="PLC → SCADA"
                        stroke={CHART_COLORS_HEX.c3}
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="scadaToHistorian"
                        name="SCADA → Historian"
                        stroke={CHART_COLORS_HEX.c1}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="historianToDashboard"
                        name="Historian → App"
                        stroke={CHART_COLORS_HEX.c2}
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[9px] font-mono text-[var(--text-muted)] border-t border-[var(--border)] pt-2 flex items-center justify-between">
                  <span>CRITICAL BUS THRESHOLD: 100ms</span>
                  <span className="text-[var(--status-red)] font-bold">BREACHED (30H - 36H)</span>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </motion.div>

      {/* ========================================================
          2. OT CYBERSECURITY & INCIDENTS SECTION
          ======================================================== */}
      <motion.div variants={itemVariants}>
        <CollapsibleSection
          title="OT Cybersecurity & Incidents"
          subtitle="Firewall integrity alerts, network zone isolation telemetry, and P1/P2 remediation logs"
          icon={<ShieldAlert className="w-4 h-4 text-[var(--status-red)]" />}
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Active Incidents Table */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[10px] font-mono text-[var(--text-secondary)] font-bold uppercase tracking-wider">Remediation Incident Board</span>
                <span className="text-[9px] font-mono text-[var(--text-muted)]">CLICK TO PRESCRIBE ACTIONS</span>
              </div>
              <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[#0C0D12]/40">
                <table className="w-full text-[11px] font-mono text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-strong)] bg-[#101116] text-[var(--text-muted)]">
                      <th className="p-2.5">Severity</th>
                      <th className="p-2.5">Incident Title</th>
                      <th className="p-2.5">Raised</th>
                      <th className="p-2.5">Owner</th>
                      <th className="p-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {ACTIVE_INCIDENTS.map((inc) => (
                      <tr
                        key={inc.id}
                        onClick={() => setSelectedIncident(inc)}
                        className="hover:bg-[var(--bg-elevated)]/50 cursor-pointer transition-all duration-150"
                      >
                        <td className="p-2.5">
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase", getSeverityColor(inc.severity))}>
                            {inc.severity}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-white">{inc.title}</td>
                        <td className="p-2.5 text-[var(--text-secondary)]">{inc.raisedAt}</td>
                        <td className="p-2.5 text-[var(--text-secondary)]">{inc.owner}</td>
                        <td className="p-2.5 text-right">
                          <span className={cn("text-[9px] font-bold uppercase", 
                            inc.status === "Mitigated" ? "text-[var(--status-green)]" : "text-[var(--status-amber)]"
                          )}>
                            {inc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cyber Alert Feed + Zone Status cards */}
            <div className="lg:col-span-5 space-y-4">
              {/* Threat Feed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] font-bold uppercase tracking-wider">IDS Threat Feed</span>
                  <span className="text-[9px] font-mono text-[var(--status-amber)] font-bold">3 ACTIVE ALERTS</span>
                </div>
                <div className="border border-[var(--border)] rounded-lg p-3 bg-[#0C0D12]/40 max-h-[140px] overflow-y-auto space-y-2">
                  {CYBER_EVENTS.map((evt) => (
                    <div key={evt.id} className="text-[10px] border-b border-[var(--border)] last:border-0 pb-2 last:pb-0 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={cn("w-1.5 h-1.5 rounded-full",
                            evt.severity === "critical" ? "bg-[var(--status-red)] animate-ping" : "bg-[var(--status-amber)]"
                          )} />
                          <span className="text-white font-bold">{evt.zone}</span>
                          <span className="text-[var(--text-muted)] font-mono">· {evt.time}</span>
                        </div>
                        <p className="text-[var(--text-secondary)] mt-1 font-mono leading-tight">{evt.description}</p>
                      </div>
                      <div className="flex-shrink-0 flex gap-1">
                        <button
                          onClick={() => {
                            setActiveCyberBlock(evt.id);
                            alert(`Security action deployed: PaloAlto block applied to origin host of ${evt.id}`);
                          }}
                          disabled={activeCyberBlock === evt.id}
                          className="px-1.5 py-0.5 rounded border border-red-500/30 hover:bg-red-500/10 text-red-400 font-bold text-[8px] uppercase cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                          {activeCyberBlock === evt.id ? "Blocked" : "Block IP"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zone statuses */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">Isolated Segment Monitoring</span>
                <div className="grid grid-cols-2 gap-2.5">
                  {NETWORK_ZONES.map((zone) => (
                    <div key={zone.name} className="border border-[var(--border)] bg-[#101116]/40 p-2.5 rounded flex flex-col justify-between min-h-[64px]">
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[9px] font-mono text-white leading-tight font-bold truncate">{zone.name.split(":")[1] || zone.name}</span>
                        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
                          zone.status === "secure" ? "bg-[var(--status-green)]" : zone.status === "inspected" ? "bg-blue-400" : zone.status === "warning" ? "bg-[var(--status-amber)]" : "bg-[var(--status-red)] animate-pulse"
                        )} />
                      </div>
                      <div className="flex justify-between items-baseline mt-1.5">
                        <span className="text-[9px] text-[var(--text-muted)] font-mono">{zone.activeNodes} nodes</span>
                        <span className="text-[9px] text-white font-mono">{zone.trafficRate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </motion.div>

      {/* ========================================================
          3. DATA PIPELINE & SENSOR HEALTH SECTION
          ======================================================== */}
      <motion.div variants={itemVariants}>
        <CollapsibleSection
          title="Data Pipeline & Sensor Health"
          subtitle="Per-plant gateway diagnostics, transmission health, and backup systems"
          icon={<Cpu className="w-4 h-4 text-blue-400" />}
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sensor quality breakdown */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[10px] font-mono text-[var(--text-secondary)] font-bold uppercase tracking-wider">Sensor Transceiver Status</span>
              </div>
              <div className="border border-[var(--border)] rounded-lg p-3 bg-[#0C0D12]/40 space-y-3.5">
                {SENSOR_HEALTH.map((plant) => (
                  <div key={plant.plantName} className="border border-[var(--border)] bg-[#101116]/50 p-2.5 rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-white font-bold">{plant.plantName}</span>
                      <span className={cn("text-[8px] px-1 rounded border uppercase font-bold", getStatusColorClass(plant.status))}>
                        {plant.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                      <div>
                        <span className="text-[8px] text-[var(--text-muted)] block uppercase">Total Transceivers</span>
                        <span className="text-white font-semibold">{plant.totalSensors}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-[var(--text-muted)] block uppercase">Offline</span>
                        <span className={cn("font-semibold", plant.offlineCount > 0 ? "text-[var(--status-red)]" : "text-white")}>
                          {plant.offlineCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-[var(--text-muted)] block uppercase">Degraded</span>
                        <span className={cn("font-semibold", plant.degradedCount > 0 ? "text-[var(--status-amber)]" : "text-white")}>
                          {plant.degradedCount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Backup & DR status */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[10px] font-mono text-[var(--text-secondary)] font-bold uppercase tracking-wider">Backup & DR Registry</span>
                <span className="text-[9px] font-mono text-[var(--status-red)] font-semibold">1 SYNC FAILING</span>
              </div>
              <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[#0C0D12]/40">
                <table className="w-full text-[11px] font-mono text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-strong)] bg-[#101116] text-[var(--text-muted)]">
                      <th className="p-2.5">Target System</th>
                      <th className="p-2.5">Last Snap</th>
                      <th className="p-2.5">RPO</th>
                      <th className="p-2.5">RTO</th>
                      <th className="p-2.5 text-right">Job Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {BACKUP_STATUS.map((bu) => (
                      <tr key={bu.system} className="hover:bg-[var(--bg-elevated)]/20">
                        <td className="p-2.5 font-bold text-white">{bu.system}</td>
                        <td className="p-2.5 text-[var(--text-secondary)]">{bu.lastBackup}</td>
                        <td className="p-2.5 text-[var(--text-secondary)]">
                          {bu.rpoActualMins >= 60 ? `${(bu.rpoActualMins/60).toFixed(1)}h` : `${bu.rpoActualMins}m`}
                        </td>
                        <td className="p-2.5 text-[var(--text-secondary)]">{bu.rtoActualHours.toFixed(1)}h</td>
                        <td className="p-2.5 text-right">
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase", getStatusColorClass(bu.status))}>
                            {bu.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </motion.div>

      {/* ========================================================
          POPUP DETAIL OVERLAYS
          ======================================================== */}
      {/* 1. Detail Sheet for Systems Uptime Click */}
      <DetailSheet
        isOpen={selectedSystem !== null}
        title={selectedSystem?.name || ""}
        detailData={{
          history: selectedSystem?.status === "critical"
            ? [99.5, 99.2, 98.4, 97.5, 96.8, 96.2, 95.8, 95.5, 95.0, 94.8, 94.4, 94.15]
            : selectedSystem?.status === "degraded"
            ? [99.8, 99.7, 99.6, 99.4, 99.1, 98.9, 98.7, 98.8, 98.5, 98.4, 98.6, 98.42]
            : [99.99, 99.98, 99.98, 99.99, 100, 99.99, 99.98, 99.98, 99.99, 99.99, 99.98, 99.98],
          unit: "%",
          note: selectedSystem?.status === "critical"
            ? `Historian Database is exhibiting synchronizer lockouts under heavy IIoT buffering. Cleared log buffers 2h ago but throughput remains degraded.`
            : selectedSystem?.status === "degraded"
            ? `PLC network router is dropping packets on Subnet 3 (Pune Cooling tower). Retries have spiked latency to 120ms.`
            : `System ${selectedSystem?.name} is operating within nominal parameters. Uptime matches the SLAs.`
        }}
        onClose={() => setSelectedSystem(null)}
      />

      {/* 2. Detail Sheet for Incidents Click */}
      <DetailSheet
        isOpen={selectedIncident !== null}
        title={selectedIncident?.title || ""}
        detailData={{
          history: selectedIncident?.severity === "P1"
            ? [10, 25, 45, 90, 150, 240, 310, 380, 420]
            : [2, 5, 8, 12, 18, 22, 28, 32, 35],
          unit: "ms",
          note: selectedIncident?.suggestedResolution || ""
        }}
        onClose={() => setSelectedIncident(null)}
      />

    </motion.div>
  );
}
