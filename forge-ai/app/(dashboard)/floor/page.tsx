"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDashboardStore } from "../../store/useDashboardStore";
import {
  Hourglass,
  Truck,
  Package,
  Layers,
  Wrench,
  AlertTriangle,
  Info,
  TrendingUp,
  Activity,
  Flame,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/app/utils/cn";
import CollapsibleSection from "@/app/components/ui/CollapsibleSection";
import ContextualMenu from "@/app/components/ui/ContextualMenu";
import { MOCK_DATA } from "@/app/lib/mock-data/constants";
import { DetailSheet } from "@/app/components/ui/Overlays";

interface FloorNode {
  id: string;
  name: string;
  type: string;
  status: string;
  health: number;
  output: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } },
} as const;

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-2 px-6 text-xs mb-4"
      style={{
        height: 32,
        background: "rgba(239,68,68,0.08)",
        borderBottom: "1px solid rgba(239,68,68,0.25)",
        color: "var(--status-red)",
        fontFamily: "'DM Mono', monospace",
        flexShrink: 0,
      }}
    >
      <span>⚠</span>
      <span>{message}</span>
    </div>
  );
}

function getNodeStatusColor(status: string) {
  const s = status.toLowerCase();
  if (s === "operational" || s === "healthy" || s === "green") return "var(--status-green)";
  if (s === "degraded" || s === "warning" || s === "yellow") return "var(--status-amber)";
  if (s === "critical" || s === "red") return "var(--status-red)";
  if (s === "maintenance" || s === "gray" || s === "offline") return "var(--status-muted)";
  return "var(--status-muted)";
}

export default function FloorDashboard() {
  const { selectedPlantId, liveDashboardData, triggerCopilotAction } = useDashboardStore();
  const [selectedNode, setSelectedNode] = useState<FloorNode | null>(null);
  const [isBottleneckSheetOpen, setIsBottleneckSheetOpen] = useState(false);

  const formatHours = (decimalHours: number): string => {
    const h = Math.floor(decimalHours);
    const m = Math.round((decimalHours - h) * 60);
    return `${h}h ${m > 0 ? `${m}m` : "0m"}`;
  };

  const { data: fetchedData, isLoading, error } = useQuery({
    queryKey: ["floorData", selectedPlantId],
    queryFn: async () => {
      const plantId = selectedPlantId === "all" ? "pune-uuid" : selectedPlantId;
      const res = await fetch(`/api/dashboard/floor?plant_id=${plantId}`);
      if (!res.ok) throw new Error("Failed to fetch Floor dashboard data");
      return await res.json();
    },
    refetchInterval: 30000,
  });

  const fallbackFloorData = React.useMemo(() => {
    return {
      kpis: {
        produced: {
          value: `${MOCK_DATA.currentShift.produced_tons} T`,
          pct: Math.round((MOCK_DATA.currentShift.produced_tons / MOCK_DATA.currentShift.target_tons) * 100)
        },
        target: {
          value: `${MOCK_DATA.currentShift.target_tons} T`
        },
        remaining: {
          value: `${MOCK_DATA.currentShift.remaining_tons} T`,
          sub: `Required pace: ${MOCK_DATA.currentShift.required_pace_t_hr} T/hr (current: ${MOCK_DATA.currentShift.current_pace_t_hr} T/hr)`
        },
        defect_rate: {
          value: `${MOCK_DATA.currentShift.defect_rate_pct}%`
        }
      },
      widgets: {
        timeline: {
          hours_completed: MOCK_DATA.currentShift.hours_completed,
          shift_hours: MOCK_DATA.currentShift.hours_total,
          downtime_blocks: MOCK_DATA.currentShift.downtime_blocks,
        },
        floor_map: [
          { id: "node-bf1", name: "Blast Furnace 1", type: "furnace", status: "Healthy", health: 94, output: "24 T/hr" },
          { id: "node-bf2", name: "Blast Furnace 2", type: "furnace", status: "Degraded", health: 68, output: "18 T/hr" },
          { id: "node-crane-a", name: "Charging Crane A", type: "crane", status: "Healthy", health: 91, output: "Nominal" },
          { id: "node-eaf1", name: "Electric Furnace 1", type: "furnace", status: "Healthy", health: 88, output: "32 T/hr" },
          { id: "node-crane-b", name: "Teeming Crane B", type: "crane", status: "Healthy", health: 95, output: "Nominal" },
          { id: "node-line1", name: "Casting Line 1", type: "line", status: "Healthy", health: 92, output: "15 T/hr" },
          { id: "node-line2", name: "Casting Line 2", type: "line", status: "Healthy", health: 90, output: "12 T/hr" },
          { id: "node-line3", name: "Casting Line 3", type: "line", status: "Degraded", health: 76, output: "8 T/hr" }
        ],
        work_orders: [
          { order_number: "WO-9824", product_type: "HR Coil Grade A", quantity_tons: 120, priority: "Urgent", assigned_team: "Team Alpha" },
          { order_number: "WO-9825", product_type: "CR Coil High-Sil", quantity_tons: 80, priority: "High", assigned_team: "Team Beta" },
          { order_number: "WO-9826", product_type: "Galvanized Plate", quantity_tons: 150, priority: "Normal", assigned_team: "Team Gamma" },
          { order_number: "WO-9827", product_type: "Structural Beam", quantity_tons: 200, priority: "Normal", assigned_team: "Team Delta" }
        ],
        shipments: [
          { type: "INBOUND", material: "Iron Ore", quantity: "240T", eta: "2:30 PM", status: "DELAYED", origin: "Goa Terminal" },
          { type: "INBOUND", material: "Coking Coal", quantity: "180T", eta: "3:45 PM", status: "ON TRACK", origin: "Vizag Port" },
          { type: "OUTBOUND", material: "HR Coils (3x)", quantity: "75T", eta: "4:00 PM", status: "READY", origin: "Coil Yard" }
        ],
        inventory: [
          { material: "Iron Ore Sinter", level: 1420, reorder: 800, pct: 78 },
          { material: "Coking Coal", level: 980, reorder: 600, pct: 65 },
          { material: "Scrap Metal", level: 320, reorder: 400, pct: 32 },
          { material: "Flux Agents", level: 210, reorder: 150, pct: 58 }
        ]
      }
    };
  }, [selectedPlantId]);

  const hasLiveFloorData = liveDashboardData && liveDashboardData.kpis && "target" in liveDashboardData.kpis;
  const data = hasLiveFloorData ? liveDashboardData : (fetchedData || fallbackFloorData);

  // Loading state
  if (isLoading && !fetchedData && !hasLiveFloorData) {
    return (
      <div className="space-y-6">
        <div className="h-[200px] bg-[#141414] rounded-lg animate-pulse" />
        <div className="h-[400px] bg-[#141414] rounded-lg animate-pulse" />
      </div>
    );
  }

  // Error/Fallback — if for some reason data is completely empty
  if (!data) {
    return (
      <div>
        <ErrorBanner message="Floor telemetry offline — displaying last known data — Local API or database connection failed" />
        <div className="h-[200px] flex items-center justify-center border border-[var(--border)] bg-[var(--bg-surface)] rounded-lg">
          <span className="text-[var(--text-secondary)] font-mono">No operations telemetry loaded. Verify Next.js API or Supabase database configuration.</span>
        </div>
      </div>
    );
  }

  const { kpis, widgets } = data;
  const { timeline, floor_map, work_orders, shipments, inventory } = widgets;

  const getPriorityStyle = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === "urgent") return {
      color: "#F59E0B",
      background: "rgba(146,64,14,0.15)",
      border: "1px solid rgba(245,158,11,0.25)",
    };
    if (p === "high") return {
      color: "#3B82F6",
      background: "rgba(59,130,246,0.1)",
      border: "1px solid rgba(59,130,246,0.2)",
    };
    if (p === "normal") return {
      color: "var(--text-muted)",
      background: "transparent",
      border: "1px solid var(--border)",
    };
    return { color: "var(--text-muted)", background: "transparent", border: "none" };
  };

  // SVG node positions — 110×64px nodes
  const nodePositions: Record<string, { x: number; y: number }> = {
    "node-bf1":    { x: 45,  y: 40  },
    "node-bf2":    { x: 45,  y: 145 },
    "node-crane-a":{ x: 185, y: 93  },
    "node-eaf1":   { x: 325, y: 40  },
    "node-crane-b":{ x: 465, y: 93  },
    "node-line1":  { x: 610, y: 20  },
    "node-line2":  { x: 610, y: 115 },
    "node-line3":  { x: 610, y: 210 },
  };
  const NODE_W = 110;
  const NODE_H = 64;

  const handleAskAIAboutNode = (node: FloorNode) => {
    const query = `Analyze the health and output rate for machine ${node.name} (${node.output}, health ${node.health}%). What is its diagnostics breakdown?`;
    triggerCopilotAction(query, "chat");
  };

  // Define bottleneck asset (Furnace-2 is the slowest asset / critical status)
  const bottleneckNodeId = "node-bf2"; // Furnace-2

  // Metrics derived for operations
  const producedVal = parseFloat(kpis.produced.value.replace(/[^\d.]/g, "")) || MOCK_DATA.currentShift.produced_tons;
  const targetVal = parseFloat(kpis.target.value.replace(/[^\d.]/g, "")) || MOCK_DATA.currentShift.target_tons;
  const progressPct = kpis.produced.pct ?? Math.round((producedVal / targetVal) * 100);
  const remainingVal = kpis.remaining?.value ?? `${MOCK_DATA.currentShift.remaining_tons} T`;
  const defectRate = kpis.defect_rate?.value ?? `${MOCK_DATA.currentShift.defect_rate_pct}%`;
  
  // Custom mock values to fit Honeywell/Siemens benchmark requirements
  const scheduleAdherence = "95.5%";
  const shiftEfficiency = "98.2%";
  
  const bottleneckAsset = {
    name: "Pune Furnace-2",
    health: 68,
    status: "Degrading",
    vibration: "Anomalous (4.2 mm/s)",
    metric: "18 T/hr",
    detail: "Vibration threshold exceeded (limit: 3.0 mm/s). Accelerometer reports spike."
  };

  const nextCriticalShipment = {
    type: "INBOUND",
    material: "Iron Ore",
    quantity: "240T",
    eta: "2:30 PM",
    status: "DELAYED",
    origin: "Goa Terminal"
  };

  const activeProductionRisks = [
    {
      id: "risk-1",
      title: "Furnace-2 Thermal Degradation",
      probability: "68%",
      impact: "HIGH",
      color: "var(--status-red)"
    },
    {
      id: "risk-2",
      title: "Iron Ore ETA Delay (Lag: 2.5h)",
      probability: "90%",
      impact: "MEDIUM",
      color: "var(--status-amber)"
    },
    {
      id: "risk-3",
      title: "Line 3 Slag Jam Constraint",
      probability: "45%",
      impact: "LOW",
      color: "var(--status-amber)"
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {error && data && (
        <ErrorBanner message="Floor telemetry offline — displaying last known data — Local API or database connection failed" />
      )}

      {/* ========================================================
          DOMINANT HERO COMPONENT: OPERATIONS COMMAND CONSOLE
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
            <Activity className="w-4 h-4 text-[var(--accent)] animate-pulse" />
            <span className="font-mono text-[10px] font-bold tracking-widest text-[var(--accent)] uppercase">
              Operations Control Center · Live Floor Advisory
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 font-mono text-[9px] px-2 py-0.5 rounded bg-[var(--accent-glow)] border border-[var(--accent)]/20 text-[var(--accent)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] pulse-dot" />
              LIVE TELEMETRY ACTIVE
            </div>
            <ContextualMenu
              title="Operations Command Center"
              context={`Produced: ${producedVal}T, Target: ${targetVal}T, Adherence: ${scheduleAdherence}, Efficiency: ${shiftEfficiency}, Bottleneck: ${bottleneckAsset.name}, Risk: Furnace-2`}
            />
          </div>
        </div>

        {/* Grid Layout for Command Console */}
        <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border)] bg-[var(--bg-surface)]/20">
          
          {/* 1. Production vs Target Hero Progress */}
          <div className="p-5 lg:col-span-2 flex flex-col justify-between min-h-[140px]">
            <div>
              <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                01. Production vs Target (Hero)
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-mono text-white font-bold">{producedVal} T</span>
                <span className="text-xs font-mono text-[var(--text-muted)]">/ {targetVal} T Target</span>
              </div>
              <div className="relative mt-3" style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${progressPct}%`,
                    background: "var(--accent)",
                    borderRadius: 3,
                    transition: "width 500ms ease",
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-[var(--text-secondary)] mt-2">
              <span>{progressPct}% Completed</span>
              <span>
                Remaining: <span className="text-white font-bold">{remainingVal}</span>{" "}
                <span className="text-[var(--status-amber)]">({kpis.remaining.sub})</span>
              </span>
            </div>
          </div>

          {/* 2. Schedule Adherence & Shift Efficiency */}
          <div className="p-5 flex flex-col justify-between min-h-[140px]">
            <div>
              <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                02. Adherence & Efficiency
              </span>
              <div className="mt-2.5 space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono text-[var(--text-secondary)]">Sch. Adherence</span>
                    <span className="text-xs font-mono text-[var(--status-green)] font-semibold">{scheduleAdherence}</span>
                  </div>
                  <div className="relative" style={{ height: 4, background: "var(--border)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: scheduleAdherence, background: "var(--status-green)", borderRadius: 2 }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono text-[var(--text-secondary)]">Shift Efficiency</span>
                    <span className="text-xs font-mono text-[var(--accent)] font-semibold">{shiftEfficiency}</span>
                  </div>
                  <div className="relative" style={{ height: 4, background: "var(--border)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: shiftEfficiency, background: "var(--accent)", borderRadius: 2 }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono text-[var(--text-secondary)]">Quality Defect Rate</span>
                    <span className="text-xs font-mono text-[var(--status-amber)] font-semibold">{defectRate}</span>
                  </div>
                  <div className="relative" style={{ height: 4, background: "var(--border)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: defectRate, background: "var(--status-amber)", borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <ContextualMenu
                title="Adherence & Efficiency"
                context={`Schedule Adherence: ${scheduleAdherence}, Shift Efficiency: ${shiftEfficiency}`}
              />
            </div>
          </div>

          {/* 3. Bottleneck Asset Alert */}
          <div className="p-5 flex flex-col justify-between min-h-[140px] bg-red-500/2">
            <div>
              <span className="text-[9px] font-mono text-[var(--status-red)] uppercase tracking-wider block flex items-center gap-1 font-bold">
                <Flame className="w-3 h-3" /> 03. Bottleneck Asset
              </span>
              <span className="text-xs font-mono text-white mt-2 block font-semibold">
                {bottleneckAsset.name}
              </span>
              <div className="text-[9px] font-mono text-[var(--text-secondary)] mt-1.5 space-y-1">
                <p>Health: <span className="text-[var(--status-amber)]">{bottleneckAsset.health}% (Degraded)</span></p>
                <p className="truncate">Vib: <span className="text-[var(--status-red)]">{bottleneckAsset.vibration}</span></p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 gap-1.5">
              <ContextualMenu
                title={bottleneckAsset.name}
                context={`Health: ${bottleneckAsset.health}%, Vibration: ${bottleneckAsset.vibration}, Status: ${bottleneckAsset.status}`}
              />
              <button
                onClick={() => setIsBottleneckSheetOpen(true)}
                className="flex items-center justify-center p-1 rounded bg-[var(--status-red)]/10 hover:bg-[var(--status-red)]/20 border border-[var(--status-red)]/30 text-[var(--status-red)] font-bold text-[8px] cursor-pointer font-mono"
                title="Analyze Bottleneck"
              >
                ANALYZE
              </button>
            </div>
          </div>

          {/* 4. Next Critical Shipment */}
          <div className="p-5 flex flex-col justify-between min-h-[140px]">
            <div>
              <span className="text-[9px] font-mono text-[var(--status-amber)] uppercase tracking-wider block flex items-center gap-1 font-bold">
                <Truck className="w-3 h-3" /> 04. Critical Shipment
              </span>
              <span className="text-xs font-mono text-white mt-2 block font-semibold truncate">
                {nextCriticalShipment.material} ({nextCriticalShipment.quantity})
              </span>
              <div className="text-[9px] font-mono text-[var(--text-secondary)] mt-1.5 space-y-1">
                <p>ETA: <span className="text-[var(--status-amber)]">{nextCriticalShipment.eta}</span></p>
                <p>Status: <span className="text-[var(--status-red)]">{nextCriticalShipment.status}</span></p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <ContextualMenu
                title="Logistics Shipment"
                context={`Next Critical Shipment: ${nextCriticalShipment.material}, Quantity: ${nextCriticalShipment.quantity}, ETA: ${nextCriticalShipment.eta}, Status: ${nextCriticalShipment.status}`}
              />
              <span className="text-[8px] font-mono text-[var(--text-muted)] truncate">{nextCriticalShipment.origin}</span>
            </div>
          </div>

        </div>

        {/* Bottom Panel: Active Production Risks */}
        <div className="border-t border-[var(--border)] px-5 py-3.5 bg-[var(--bg-elevated)]/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[var(--status-amber)]" />
            <span className="font-mono text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Active Production Risks queue
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {activeProductionRisks.map((risk) => (
              <div
                key={risk.id}
                className="flex items-center gap-2 px-2.5 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all text-[9px] font-mono"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: risk.color }} />
                <span className="text-white font-medium">{risk.title}</span>
                <span className="text-[var(--text-muted)]">({risk.probability})</span>
                <ContextualMenu
                  title={risk.title}
                  context={`Risk description: ${risk.title}, Probability: ${risk.probability}, Impact: ${risk.impact}`}
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ========================================================
          PROGRESSIVE DISCLOSURE COLLAPSIBLES (REDUCED CLUTTER)
          ======================================================== */}
      
      {/* 1. SCADA Map & Digital Twin (Defaults to Collapsed) */}
      <motion.div variants={itemVariants}>
        <CollapsibleSection
          title="Interactive Digital Twin & SCADA Inspector"
          subtitle="Click asset nodes to view sensor telemetries, PLC network latencies, and speed constraints"
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
            
            {/* SVG Floor Map */}
            <div
              className="lg:col-span-8 flex flex-col rounded-[8px]"
              style={{ height: 440, background: "var(--bg-surface)", border: "1px solid var(--border)", padding: "20px 24px" }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="card-title font-mono text-[10px]" style={{ color: "var(--text-secondary)" }}>
                  ▲ Interactive Flow Paths
                </span>
                <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] font-mono">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[var(--status-green)]" />
                    <span>Healthy</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[var(--status-amber)]" />
                    <span>Warning</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[var(--status-red)]" />
                    <span>Critical</span>
                  </div>
                </div>
              </div>

              <div
                className="flex-1 rounded-[6px] relative overflow-hidden flex items-center justify-center p-2"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              >
                <svg viewBox="0 0 790 300" className="w-full h-full" style={{ maxHeight: 340 }}>
                  <defs>
                    <style>{`
                      @keyframes flowDash { to { stroke-dashoffset: -24; } }
                      .flow-line-live { stroke-dasharray: 6 4; animation: flowDash 1s linear infinite; }
                      .flow-line-slowed { stroke-dasharray: 4 8; animation: flowDash 2.5s linear infinite; }
                      .pulse-glow { animation: livePulse 2s ease-in-out infinite; }
                      @keyframes livePulse {
                        0%, 100% { opacity: 0.15; }
                        50% { opacity: 0.35; }
                      }
                    `}</style>
                    <filter id="red-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="accent-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Connectors */}
                  <line x1="20" y1="72" x2="45" y2="72" stroke="var(--border-strong)" strokeWidth="3" />
                  <line x1="20" y1="177" x2="45" y2="177" stroke="var(--border-strong)" strokeWidth="3" />
                  
                  <path d="M 155 72 L 170 72 L 170 125 L 185 125" stroke="var(--border-strong)" strokeWidth="3" fill="none" />
                  <path d="M 155 177 L 170 177 L 170 125 L 185 125" stroke="var(--border-strong)" strokeWidth="3" fill="none" />
                  
                  <path d="M 295 125 L 310 125 L 310 72 L 325 72" stroke="var(--border-strong)" strokeWidth="3" fill="none" />
                  <path d="M 435 72 L 450 72 L 450 125 L 465 125" stroke="var(--border-strong)" strokeWidth="3" fill="none" />
                  
                  <path d="M 575 125 L 595 125 L 595 52 L 610 52" stroke="var(--border-strong)" strokeWidth="3" fill="none" />
                  <path d="M 575 125 L 595 125 L 595 147 L 610 147" stroke="var(--border-strong)" strokeWidth="3" fill="none" />
                  <path d="M 575 125 L 595 125 L 595 242 L 610 242" stroke="var(--border-strong)" strokeWidth="3" fill="none" />

                  <line x1="720" y1="52"  x2="760" y2="52"  stroke="var(--border-strong)" strokeWidth="3" />
                  <line x1="720" y1="147" x2="760" y2="147" stroke="var(--border-strong)" strokeWidth="3" />
                  <line x1="720" y1="242" x2="760" y2="242" stroke="var(--border-strong)" strokeWidth="3" />

                  {/* Flow pipeline overlays */}
                  <line x1="20" y1="72" x2="45" y2="72" stroke="var(--status-green)" strokeWidth="2.5" strokeDasharray="6 4" className="flow-line-live" />
                  <path d="M 155 72 L 170 72 L 170 125 L 185 125" stroke="var(--status-green)" strokeWidth="2.5" strokeDasharray="6 4" fill="none" className="flow-line-live" />
                  <path d="M 295 125 L 310 125 L 310 72 L 325 72" stroke="var(--status-blue)" strokeWidth="2.5" strokeDasharray="6 4" fill="none" className="flow-line-live" />
                  <path d="M 435 72 L 450 72 L 450 125 L 465 125" stroke="var(--status-blue)" strokeWidth="2.5" strokeDasharray="6 4" fill="none" className="flow-line-live" />

                  <path d="M 575 125 L 595 125 L 595 52 L 610 52" stroke="var(--status-green)" strokeWidth="2" strokeDasharray="6 4" fill="none" className="flow-line-live" />
                  <path d="M 575 125 L 595 125 L 595 147 L 610 147" stroke="var(--status-green)" strokeWidth="2" strokeDasharray="6 4" fill="none" className="flow-line-live" />
                  
                  <line x1="720" y1="52"  x2="760" y2="52"  stroke="var(--status-green)" strokeWidth="2" strokeDasharray="6 4" className="flow-line-live" />
                  <line x1="720" y1="147" x2="760" y2="147" stroke="var(--status-green)" strokeWidth="2" strokeDasharray="6 4" className="flow-line-live" />

                  {/* Bottleneck pipelines */}
                  <line x1="20" y1="177" x2="45" y2="177" stroke="var(--status-amber)" strokeWidth="2" strokeDasharray="4 8" className="flow-line-slowed" />
                  <path d="M 155 177 L 170 177 L 170 125 L 185 125" stroke="var(--status-amber)" strokeWidth="2.5" strokeDasharray="4 8" fill="none" className="flow-line-slowed" />
                  <path d="M 575 125 L 595 125 L 595 242 L 610 242" stroke="var(--status-red)" strokeWidth="2.5" strokeDasharray="3 10" fill="none" className="flow-line-slowed" style={{ strokeWidth: 3 }} />
                  <line x1="720" y1="242" x2="760" y2="242" stroke="var(--status-red)" strokeWidth="2.5" strokeDasharray="3 10" className="flow-line-slowed" />

                  {/* Text labels */}
                  <text x="8" y="125" fill="var(--text-muted)" fontSize="8" fontWeight="700" fontFamily="DM Mono" textAnchor="middle" transform="rotate(-90 8 125)">RAW INPUT</text>
                  <text x="778" y="145" fill="var(--text-muted)" fontSize="8" fontWeight="700" fontFamily="DM Mono" textAnchor="middle" transform="rotate(90 778 145)">COIL YARD</text>

                  {/* Nodes */}
                  {floor_map.map((node: FloorNode) => {
                    const pos = nodePositions[node.id];
                    if (!pos) return null;
                    const isSelected = selectedNode?.id === node.id;
                    const isBottleneck = node.id === bottleneckNodeId;
                    const nodeStatus = node.status.toLowerCase();
                    
                    let stateColor = "var(--status-muted)";
                    let stateName = "Offline";

                    if (nodeStatus === "operational" || nodeStatus === "healthy") {
                      stateColor = "var(--status-green)";
                      stateName = "Healthy";
                    } else if (nodeStatus === "degraded" || nodeStatus === "warning") {
                      stateColor = "var(--status-amber)";
                      stateName = "Warning";
                    } else if (nodeStatus === "critical" || nodeStatus === "alarm" || nodeStatus === "red") {
                      stateColor = "var(--status-red)";
                      stateName = "Critical";
                    } else if (nodeStatus === "maintenance" || nodeStatus === "offline") {
                      stateColor = "var(--status-muted)";
                      stateName = "Offline";
                    }

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => setSelectedNode(node)}
                        style={{ cursor: "pointer" }}
                      >
                        {isBottleneck && (
                          <rect
                            width={NODE_W + 10}
                            height={NODE_H + 10}
                            x="-5"
                            y="-5"
                            rx="8"
                            fill="rgba(239, 68, 68, 0.08)"
                            stroke="rgba(239, 68, 68, 0.25)"
                            strokeWidth="1.5"
                            className="pulse-glow"
                            filter="url(#red-glow)"
                          />
                        )}

                        <rect
                          width={NODE_W}
                          height={NODE_H}
                          rx="6"
                          fill={isSelected ? "var(--bg-hover)" : "var(--bg-surface)"}
                          stroke={isSelected ? "var(--accent)" : isBottleneck ? "var(--status-red)" : "var(--border)"}
                          strokeWidth={isSelected ? 1.75 : isBottleneck ? 1.5 : 1}
                          filter={isSelected ? "url(#accent-glow)" : ""}
                        />

                        <rect x="0" y="0" width="3.5" height={NODE_H} fill={stateColor} />

                        {isBottleneck && (
                          <g transform={`translate(${NODE_W - 68}, ${NODE_H - 14})`}>
                            <rect width="64" height="11" rx="2" fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.4)" strokeWidth="0.5" />
                            <text x="32" y="8" fill="var(--status-red)" fontSize="7" fontWeight="bold" fontFamily="DM Mono" textAnchor="middle">
                              SLOWEST ASSET
                            </text>
                          </g>
                        )}

                        <circle cx={NODE_W - 10} cy="10" r="3.5" fill={stateColor} className={isBottleneck ? "animate-pulse" : ""} />

                        <text x="10" y="16" fill="var(--text-primary)" fontSize="10" fontWeight="600" fontFamily="DM Sans, sans-serif">
                          {node.name}
                        </text>

                        <text x="10" y="27" fill="var(--text-muted)" fontSize="7.5" fontWeight="600" fontFamily="DM Mono, monospace">
                          {node.type.toUpperCase()}
                        </text>

                        <text x="10" y="42" fill="var(--accent)" fontSize="8.5" fontWeight="500" fontFamily="DM Mono, monospace">
                          {node.output}
                        </text>

                        <text x="10" y="54" fill={stateColor} fontSize="8.5" fontWeight="500" fontFamily="DM Mono, monospace">
                          {stateName} ({node.health}%)
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Diagnostics Inspector */}
            <div
              className="lg:col-span-4 flex flex-col rounded-[8px]"
              style={{ height: 440, background: "var(--bg-surface)", border: "1px solid var(--border)", padding: "20px 24px" }}
            >
              <span className="card-title mb-4 font-mono text-[10px]" style={{ color: "var(--text-secondary)" }}>
                ▲ Asset Diagnostics Inspector
              </span>
              
              <AnimatePresence mode="wait">
                {selectedNode ? (
                  <motion.div
                    key={selectedNode.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    className="flex-1 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{selectedNode.name}</span>
                        <div className="flex items-center gap-2">
                          <ContextualMenu
                            title={selectedNode.name}
                            context={`Node health is ${selectedNode.health}%, status is ${selectedNode.status}, output rate is ${selectedNode.output}`}
                            variant="dropdown"
                          />
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: getNodeStatusColor(selectedNode.status) }} />
                            <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">
                              {selectedNode.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-[6px] p-3 bg-[var(--bg-elevated)] border border-[var(--border)]">
                          <span className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wider font-mono block">Health Index</span>
                          <span className="font-mono text-2xl font-light" style={{ color: getNodeStatusColor(selectedNode.status) }}>
                            {selectedNode.health}%
                          </span>
                        </div>
                        <div className="rounded-[6px] p-3 bg-[var(--bg-elevated)] border border-[var(--border)]">
                          <span className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wider font-mono block">Throughput</span>
                          <span className="font-mono text-sm font-semibold text-[var(--text-primary)] mt-1 block">{selectedNode.output}</span>
                        </div>
                      </div>

                      {selectedNode.id === bottleneckNodeId && (
                        <div className="rounded-[6px] p-3 bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.25)] flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-[var(--status-red)] mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-[10px] font-bold text-[var(--status-red)] uppercase font-mono">Slowest Asset Alert</span>
                            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                              This unit has been isolated as the primary conveyor blockage causing a downstream throughput lag of -14.6%.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="rounded-[6px] p-3 bg-[var(--bg-elevated)] border border-[var(--border)] border-l-[3px]" style={{ borderLeftColor: getNodeStatusColor(selectedNode.status) }}>
                        <span className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wider font-mono block mb-1">SCADA Diagnostics</span>
                        {selectedNode.status === "operational" || selectedNode.status === "healthy" ? (
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            Operating within nominal OEE thresholds. PLC node ping: 14ms (healthy). Output is matching production line constraints.
                          </p>
                        ) : selectedNode.status === "degraded" || selectedNode.status === "warning" ? (
                          <p className="text-xs text-[var(--status-amber)] leading-relaxed">
                            Bearing accelerometer registering 3.9 mm/s (Warning threshold: 3.0). Thermal thermocouples are showing early core friction.
                          </p>
                        ) : (
                          <p className="text-xs text-[var(--status-red)] leading-relaxed">
                            Mechanical constraint flagged. Slag accumulation rate exceeds limits. Thermocouple zone 3 reports -14% temperature loss.
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAskAIAboutNode(selectedNode)}
                      className="flex items-center justify-center gap-2 rounded-[6px] transition-colors duration-150 mt-4 cursor-pointer"
                      style={{
                        width: "100%",
                        padding: "9px",
                        background: "var(--accent)",
                        color: "#000",
                        fontSize: 12,
                        fontWeight: 600,
                        border: "none",
                      }}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Troubleshoot with AI Copilot</span>
                    </button>
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <Layers className="w-9 h-9 mb-3 text-[var(--border-strong)]" />
                    <p className="text-xs text-[var(--text-muted)] max-w-[200px] leading-relaxed">
                      Click any digital twin asset node to inspect sensor diagnostics, live speeds, and flow rates.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </CollapsibleSection>
      </motion.div>

      {/* 2. Shift Operations Timeline (Defaults to Collapsed) */}
      <motion.div variants={itemVariants}>
        <CollapsibleSection
          title="Shift Operations Timeline"
          subtitle="8-hour shift execution schedule and unplanned downtime events"
          icon={<Hourglass className="w-4 h-4 text-[var(--status-blue)]" />}
          defaultOpen={false}
        >
          <div className="relative pt-5 pb-3">
            <div className="absolute top-0 inset-x-0 flex justify-between pb-1" style={{ borderBottom: "1px solid var(--border)" }}>
              {["Hour 0", "Hour 2", "Hour 4", "Hour 6", "Hour 8"].map((h) => (
                <span key={h} className="text-[10px] font-mono text-[var(--text-muted)]">{h}</span>
              ))}
            </div>

            {/* Header info badge display to avoid overlapping absolute positioned blocks */}
            <div className="flex justify-between items-center mt-7 mb-1.5 px-1 text-[11px] font-mono">
              <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {formatHours(timeline.hours_completed)} ELAPSED ({Math.round((timeline.hours_completed / timeline.shift_hours) * 100)}%)
              </span>
              <span className="text-[var(--text-secondary)] font-semibold">
                {formatHours(timeline.shift_hours - timeline.hours_completed)} REMAINING
              </span>
            </div>

            <div
              className="relative rounded-[6px] overflow-hidden flex"
              style={{ height: 48, background: "var(--bg-base)", border: "1px solid var(--border)" }}
            >
              <div
                className="flex items-center justify-end pr-3"
                style={{
                  width: `${(timeline.hours_completed / timeline.shift_hours) * 100}%`,
                  background: "rgba(34,197,94,0.12)",
                  borderRight: "2px solid rgba(34,197,94,0.4)",
                }}
              />

              {timeline.downtime_blocks.map((block: any, idx: number) => {
                const leftPct = (block.start_hour / timeline.shift_hours) * 100;
                const widthPct = (block.duration_hours / timeline.shift_hours) * 100;
                return (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 flex items-center justify-center overflow-hidden"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      background: block.type === "break" ? "rgba(107,114,128,0.2)" : "rgba(239,68,68,0.2)",
                      borderLeft: `2px solid ${block.type === "break" ? "rgba(107,114,128,0.4)" : "rgba(239,68,68,0.4)"}`,
                    }}
                    title={`${block.label ?? "Break"} (${block.duration_hours}h)`}
                  >
                    <span className="text-[9px] font-mono text-ellipsis overflow-hidden white-space-nowrap px-1" style={{ color: block.type === "break" ? "var(--text-muted)" : "var(--status-red)" }}>
                      {block.label ?? "Break"}
                    </span>
                  </div>
                );
              })}

              <div
                className="absolute top-0 bottom-0 z-10"
                style={{
                  left: `${(timeline.hours_completed / timeline.shift_hours) * 100}%`,
                  width: 2,
                  background: "#FFFFFF",
                  boxShadow: "0 0 8px 2px #FFFFFF",
                }}
              />
            </div>

            <div className="flex items-center gap-5 mt-3">
              {[
                { label: "Completed", color: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)" },
                { label: "Planned Break", color: "rgba(107,114,128,0.15)", border: "rgba(107,114,128,0.3)" },
                { label: "Unplanned Downtime", color: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div style={{ width: 12, height: 8, background: s.color, border: `1px solid ${s.border}`, borderRadius: 2 }} />
                  <span className="text-[10px] text-[var(--text-muted)]">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>
      </motion.div>

      {/* 3. Operational Logs & Logistics Ledger (Defaults to Collapsed) */}
      <motion.div variants={itemVariants}>
        <CollapsibleSection
          title="Operational Logs & Material Ledgers"
          subtitle="Work order assignments, stockpile materials levels, and transport shipment registry"
          icon={<Layers className="w-4 h-4 text-[var(--status-blue)]" />}
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
            
            {/* Work Orders Table */}
            <div
              className="rounded-[8px] p-5 flex flex-col"
              style={{ height: 350, background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="card-title font-mono text-[10px]" style={{ color: "var(--text-secondary)" }}>
                  ▲ Live Work Orders
                </span>
                <ContextualMenu
                  title="Work Orders List"
                  context={`Total pending/active work orders: ${work_orders.length}`}
                  variant="dropdown"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Order", "Product", "Tons", "Priority", "AI"].map((h) => (
                        <th key={h} className="py-2 pr-2" style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {work_orders.map((wo: any, idx: number) => (
                      <tr
                        key={idx}
                        style={{ borderBottom: "1px solid var(--border)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td className="py-2.5 pr-2" style={{ fontFamily: "DM Mono", fontSize: 11, fontWeight: 500, color: "var(--text-secondary)" }}>{wo.order_number}</td>
                        <td className="py-2.5 pr-2 text-xs text-white">{wo.product_type}</td>
                        <td className="py-2.5 pr-2" style={{ fontFamily: "DM Mono", fontSize: 11, color: "var(--text-secondary)" }}>{wo.quantity_tons}T</td>
                        <td className="py-2.5 pr-2">
                          <span style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 3,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            ...getPriorityStyle(wo.priority),
                          }}>
                            {wo.priority}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <ContextualMenu
                            title={`Work Order ${wo.order_number}`}
                            context={`Order number: ${wo.order_number}, product: ${wo.product_type}, quantity: ${wo.quantity_tons}T, priority: ${wo.priority}, assigned: ${wo.assigned_team}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Material Inventory */}
            <div
              className="rounded-[8px] p-5 flex flex-col"
              style={{ height: 350, background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="card-title font-mono text-[10px]" style={{ color: "var(--text-secondary)" }}>
                  ▲ Material Stockpile Inventory
                </span>
                <ContextualMenu
                  title="Inventory Status"
                  context="Raw material stocks levels"
                  variant="dropdown"
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-4">
                {inventory.map((inv: any, idx: number) => {
                  const barColor = inv.pct > 50 ? "var(--status-green)" : inv.pct > 20 ? "var(--status-amber)" : "var(--status-red)";
                  return (
                    <div key={idx} className="group relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-white font-medium">{inv.material}</span>
                          <ContextualMenu
                            title={`${inv.material} Stockpile`}
                            context={`Material: ${inv.material}, current stockpile level: ${inv.level}T, reorder point: ${inv.reorder}T`}
                          />
                        </div>
                        <span style={{ fontFamily: "DM Mono", fontSize: 11, color: "var(--text-secondary)" }}>
                          {inv.level}T <span style={{ color: "var(--text-muted)" }}>/ min {inv.reorder}T</span>
                        </span>
                      </div>
                      <div className="relative rounded-[3px] overflow-visible" style={{ height: 8, background: "var(--border)" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${inv.pct}%`,
                            background: barColor,
                            borderRadius: 3,
                            transition: "width 500ms ease",
                          }}
                        />
                        <div
                          className="absolute top-0 bottom-0"
                          style={{ left: "50%", width: 2, background: "rgba(255,255,255,0.5)", borderRadius: 1 }}
                          title="Reorder threshold"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shipment Log */}
            <div
              className="rounded-[8px] p-5 flex flex-col"
              style={{ height: 350, background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="card-title font-mono text-[10px]" style={{ color: "var(--text-secondary)" }}>
                  ▲ Logistics & Shipment Registry
                </span>
                <ContextualMenu
                  title="Logistics List"
                  context="Active inbound and outbound raw material shipments"
                  variant="dropdown"
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {shipments.map((s: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-[6px] p-2.5"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex items-center justify-center rounded-[4px]"
                        style={{
                          width: 28, height: 28, flexShrink: 0,
                          background: s.type === "INBOUND" ? "rgba(59,130,246,0.1)" : "rgba(245,158,11,0.1)",
                          border: `1px solid ${s.type === "INBOUND" ? "rgba(59,130,246,0.25)" : "rgba(245,158,11,0.25)"}`,
                          color: s.type === "INBOUND" ? "var(--status-blue)" : "var(--accent)",
                        }}
                      >
                        {s.type === "INBOUND" ? <Truck className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <p className="text-xs text-white font-medium">{s.material}</p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "DM Mono", marginTop: 1 }}>ETA: {s.eta} · {s.quantity}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{
                          background: s.status.toLowerCase().includes("ready") || s.status.toLowerCase().includes("on track")
                            ? "var(--status-green)"
                            : s.status.toLowerCase().includes("delay")
                            ? "var(--status-amber)"
                            : "var(--status-muted)",
                        }} />
                        <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{s.status}</span>
                      </div>
                      <ContextualMenu
                        title={`${s.type} ${s.material}`}
                        context={`Shipment type: ${s.type}, material: ${s.material}, quantity: ${s.quantity}, ETA: ${s.eta}, status: ${s.status}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </CollapsibleSection>
      </motion.div>

      <DetailSheet
        isOpen={isBottleneckSheetOpen}
        title={bottleneckAsset.name}
        detailData={{
          history: [2.8, 2.9, 3.1, 3.0, 3.2, 3.4, 3.5, 3.7, 3.6, 3.8, 4.0, 4.2],
          unit: " mm/s",
          note: "Furnace-2 bearing temperature has increased by 22% over 48 hours. Current: 92°C vs baseline 75°C. Bearing thermal wear projected in 2 days at 68%. Impact: ₹18.6 Lakhs. Recommended: inspect bearing and approve automatic preventative replacement by May 23, 2026."
        }}
        onClose={() => setIsBottleneckSheetOpen(false)}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-dot {
          0% { transform: scale(0.9); opacity: 0.6; box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.5); }
          50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 8px 2px rgba(245, 158, 11, 0.8); }
          100% { transform: scale(0.9); opacity: 0.6; box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
        .pulse-dot {
          animation: pulse-dot 2s infinite ease-in-out;
        }
      `}} />
    </motion.div>
  );
}
