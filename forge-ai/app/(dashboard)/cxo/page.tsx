"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDashboardStore } from "../../store/useDashboardStore";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Area,
  Label,
  ReferenceLine,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/app/utils/cn";
import { CHART_STYLE, CHART_COLORS_HEX } from "@/app/lib/chart-config";
import {
  Sparkles,
  TrendingUp,
  AlertOctagon,
  Activity,
  ShieldAlert,
  Award,
  Landmark,
  Zap,
  DollarSign,
  TrendingDown,
  CheckCircle,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import CollapsibleSection from "@/app/components/ui/CollapsibleSection";
import BreakdownModal from "@/app/components/ui/BreakdownModal";
import ContextualMenu from "@/app/components/ui/ContextualMenu";
import { MOCK_DATA, formatCurrency, formatPercent } from "@/app/lib/mock-data/constants";

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
      }}
    >
      <span>⚠</span>
      <span>{message}</span>
    </div>
  );
}

// Mini Sparkline SVG helper
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const width = 110;
  const height = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min === 0 ? 1 : max - min;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function CXODashboard() {
  const { selectedPlantId, liveDashboardData } = useDashboardStore();
  const [modalType, setModalType] = useState<"health" | "risk" | null>(null);
  const [decisionState, setDecisionState] = useState<"pending" | "executing" | "executed">("pending");

  const {
    data: fetchedData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["cxoData", selectedPlantId],
    queryFn: async () => {
      const url = `/api/dashboard/cxo${
        selectedPlantId !== "all" ? `?plant_id=${selectedPlantId}` : ""
      }`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch CXO dashboard data");
      return await res.json();
    },
    refetchInterval: 30000,
  });

  const fallbackCxoData = React.useMemo(() => {
    const isPune = selectedPlantId === "pune-uuid" || selectedPlantId === "pune";
    return {
      kpis: {
        revenue: {
          value: isPune ? `₹${MOCK_DATA.plantB.revenue_mtd_cr.toFixed(1)} Cr` : `₹${MOCK_DATA.enterprise.revenue_mtd_cr.toFixed(1)} Cr`,
          delta: isPune ? `+${MOCK_DATA.plantB.revenue_delta_pct}% vs last month` : `+${MOCK_DATA.enterprise.revenue_delta_pct}% vs last month`,
          trend: "up",
          history: isPune ? [30, 32, 34, 33, 35, 36, 37, 38, 37.5, 38.2, 39.0, 39.0] : [110, 112, 115, 113, 118, 120, 122, 121, 123, 124, 125, 125.0],
        },
        net_profit: {
          value: isPune ? `₹${MOCK_DATA.plantB.net_profit_cr.toFixed(1)} Cr` : `₹${MOCK_DATA.enterprise.net_profit_cr.toFixed(1)} Cr`,
          margin: isPune ? `${MOCK_DATA.plantB.net_profit_margin_pct}%` : `${MOCK_DATA.enterprise.net_profit_margin_pct}%`,
          delta: isPune ? `${MOCK_DATA.plantB.net_profit_delta_pct}% vs last month` : `+${MOCK_DATA.enterprise.net_profit_delta_pct}% vs last month`,
          trend: isPune ? "down" : "up",
          history: isPune ? [5, 5.5, 6, 5.8, 6.2, 6.5, 6.8, 7.0, 6.9, 7.1, 7.0, 7.0] : [18, 19, 20, 19.5, 21, 22, 22.5, 23, 23.5, 23.8, 24.0, 24.0],
        },
        health: {
          value: isPune ? MOCK_DATA.plantB.health_score : MOCK_DATA.enterprise.health_score,
        },
        risk: {
          value: isPune ? MOCK_DATA.plantB.risk_score : MOCK_DATA.enterprise.risk_score,
        },
        utilization: {
          value: isPune ? `${MOCK_DATA.plantB.utilization_pct.toFixed(1)}%` : `${MOCK_DATA.enterprise.utilization_pct.toFixed(1)}%`,
        },
        savings_opportunity: {
          value: isPune ? `₹${MOCK_DATA.plantB.savings_opportunity_lakhs.toFixed(1)} Lakhs` : `₹${MOCK_DATA.enterprise.savings_opportunity_lakhs.toFixed(1)} Lakhs`,
          confidence: isPune ? `${MOCK_DATA.plantB.savings_confidence_pct}%` : `${MOCK_DATA.enterprise.savings_confidence_pct}%`,
          delta: isPune ? `${MOCK_DATA.plantB.savings_delta_pct}%` : `${MOCK_DATA.enterprise.savings_delta_pct}%`,
          top_concern: isPune ? MOCK_DATA.plantB.top_concern : MOCK_DATA.enterprise.top_concern,
          recommended_decision: isPune ? MOCK_DATA.plantB.recommended_decision : MOCK_DATA.enterprise.recommended_decision,
          expected_roi: isPune ? `Saves ₹${MOCK_DATA.plantB.expected_roi_lakhs_month.toFixed(1)}L/month in capital loss` : `Saves ₹${MOCK_DATA.enterprise.expected_roi_lakhs_month.toFixed(1)}L/month in capital loss`,
        },
      },
      charts: {
        loss_sources: [
          { name: "Downtime", value: 42 },
          { name: "Energy Waste", value: 28 },
          { name: "Defects", value: 30 },
        ],
        plant_comparison: [
          { name: "Mumbai", revenue: 45.0, oee: 85, utilization: 86 },
          { name: "Pune", revenue: 39.0, oee: 68, utilization: 81.5 },
          { name: "Surat", revenue: 41.0, oee: 80, utilization: 83.8 },
        ],
        energy_trend: [
          { date: "05-01", cost: 3.8, limit: 5.0 },
          { date: "05-05", cost: 4.1, limit: 5.0 },
          { date: "05-10", cost: 4.8, limit: 5.0 },
          { date: "05-15", cost: 5.2, limit: 5.0 },
          { date: "05-20", cost: 4.5, limit: 5.0 },
          { date: "05-22", cost: 4.3, limit: 5.0 },
        ],
        revenue_forecast: [
          { month: "Jan", actual: 110, forecast: 110, optimistic: 110, pessimistic: 110 },
          { month: "Feb", actual: 112, forecast: 112, optimistic: 112, pessimistic: 112 },
          { month: "Mar", actual: 115, forecast: 115, optimistic: 115, pessimistic: 115 },
          { month: "Apr", actual: 120, forecast: 120, optimistic: 120, pessimistic: 120 },
          { month: "May", actual: 125, forecast: 125, optimistic: 125, pessimistic: 125 },
          { month: "Jun", actual: null, forecast: 130, optimistic: 140, pessimistic: 120 },
          { month: "Jul", actual: null, forecast: 135, optimistic: 150, pessimistic: 122 },
        ],
      },
    };
  }, [selectedPlantId]);

  const hasLiveCxoData =
    liveDashboardData && liveDashboardData.kpis && "revenue" in liveDashboardData.kpis;
  const data = hasLiveCxoData ? liveDashboardData : (fetchedData || fallbackCxoData);

  const forecastDataWithBand = React.useMemo(() => {
    if (!data?.charts?.revenue_forecast) return [];
    return data.charts.revenue_forecast.map((item: any) => ({
      ...item,
      band: item.optimistic !== null && item.pessimistic !== null ? [item.pessimistic, item.optimistic] : null,
    }));
  }, [data?.charts?.revenue_forecast]);

  // Reset decision execution status if selected plant/data shifts
  React.useEffect(() => {
    setDecisionState("pending");
  }, [selectedPlantId]);

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

  const handleExecuteDecision = () => {
    playBeep();
    window.location.href = "/actions";
  };

  // Loading state — skeleton grid
  if (isLoading && !fetchedData && !hasLiveCxoData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[120px] bg-[#141414] rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-[160px] bg-[#141414] rounded-lg animate-pulse" />
          <div className="h-[160px] bg-[#141414] rounded-lg animate-pulse" />
          <div className="h-[160px] bg-[#141414] rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  const { kpis, charts } = data;

  // Dynamically compute target/prev for visual consistency across plant scales
  const revenueValueNum = parseFloat(kpis.revenue.value.replace(/[^\d.]/g, "")) || 12.5;
  const revenueScale = revenueValueNum / 12.5;
  const targetRevenue = (450.0 * revenueScale).toFixed(1);
  const prevRevenue = (445.8 * revenueScale).toFixed(1);

  const currentMargin = parseFloat(kpis.net_profit.margin.replace("%", "")) || 19.2;

  // Dynamic health/risk status resolvers
  const healthStatus = kpis.health.value >= 80 ? "OPTIMAL" : kpis.health.value >= 60 ? "DEGRADED" : "CRITICAL";
  const healthColor = kpis.health.value >= 80 ? "var(--status-green)" : kpis.health.value >= 60 ? "var(--status-amber)" : "var(--status-red)";
  const riskColor = kpis.risk.value <= 25 ? "var(--status-green)" : kpis.risk.value <= 50 ? "var(--status-amber)" : "var(--status-red)";

  const DONUT_COLORS = ["#F59E0B", "#3B82F6", "#F43F5E"];

  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, value, name, index } = props;
    const isPuneOee = index === 1 && name === "OEE (%)";
    return (
      <g>
        <text x={x + width / 2} y={y - 6} fill="var(--text-muted)" fontSize={9} fontFamily="DM Mono" textAnchor="middle">
          {value}
        </text>
        {isPuneOee && (
          <text x={x + width / 2} y={y - 18} fill="var(--status-amber)" fontSize={12} textAnchor="middle" fontWeight="bold">
            ⚠
          </text>
        )}
      </g>
    );
  };

  const axisProps = {
    tick: {
      fill: "var(--text-muted)",
      fontSize: 11,
      fontFamily: "DM Mono, monospace",
    },
    axisLine: false as const,
    tickLine: false as const,
  };

  const savingsValue = kpis.savings_opportunity?.value ?? "₹18.6 Lakhs";
  const recommendedDecision = kpis.savings_opportunity?.recommended_decision ?? "inspect bearing and approve automatic preventative replacement by May 23, 2026.";
  const riskTitle = kpis.savings_opportunity?.top_concern ?? "Furnace-2 bearing temperature has increased by 22% over 48 hours. Current: 92°C vs baseline 75°C. Bearing thermal wear projected in 2 days at 68%. Impact: ₹18.6 Lakhs. Recommended: inspect bearing and approve automatic preventative replacement by May 23, 2026.";
  const expectedRoi = `Saves ₹4.2L/month in capital loss`;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {error && data && (
        <ErrorBanner message="CXO telemetry offline — displaying last known data — FastAPI server unreachable on :8000" />
      )}

      {/* ========================================================
          SITUATION ROOM CONSOLE LAYOUT (TOP SECTION)
          ======================================================== */}
      <motion.div variants={itemVariants} className="relative rounded-xl border border-[var(--accent)]/30 bg-[#0B0C10] shadow-[0_0_20px_rgba(245,158,11,0.08)] overflow-hidden transition-all duration-300 hover:border-[var(--accent)]/50">
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
            <Sparkles className="w-4 h-4 text-[var(--accent)] animate-pulse" />
            <span className="font-mono text-[10px] font-bold tracking-widest text-[var(--accent)] uppercase">
              Situation Room Advisory Desk
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 font-mono text-[9px] px-2 py-0.5 rounded bg-[var(--accent-glow)] border border-[var(--accent)]/20 text-[var(--accent)]">
              <span className="w-1 h-1 rounded-full bg-[var(--accent)] pulse-dot" />
              LIVE ADVISORY ACTIVE
            </div>
            <ContextualMenu
              title="Situation Room Summary"
              context={`MTD Savings Opportunity: ${savingsValue}, Top Concern: ${riskTitle}, Recommended Decision: ${recommendedDecision}, Health: ${kpis.health.value}, Risk: ${kpis.risk.value}`}
            />
          </div>
        </div>

        {/* 5 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-[var(--border)] bg-[var(--bg-surface)]/20">
          
          {/* 1. Savings Opportunity */}
          <div className="p-4 flex flex-col justify-between min-h-[110px]">
            <div>
              <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                01. Savings Opportunity
              </span>
              <span className="text-xl font-mono text-[var(--accent)] mt-1.5 block font-bold">
                {savingsValue}
              </span>
            </div>
            <span className="text-[9px] font-mono text-[var(--text-secondary)] mt-1">
              Conf: {kpis.savings_opportunity?.confidence ?? "87%"}
            </span>
          </div>

          {/* 2. Profit Impact */}
          <div className="p-4 flex flex-col justify-between min-h-[110px]">
            <div>
              <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                02. Profit Impact
              </span>
              <span className="text-xl font-mono text-white mt-1.5 block font-semibold">
                {kpis.net_profit.value}
              </span>
            </div>
            <span className="text-[9px] font-mono text-[var(--text-secondary)] mt-1">
              Margin: {currentMargin}%
            </span>
          </div>

          {/* 3. Top Operational Risk */}
          <div className="p-4 flex flex-col justify-between min-h-[110px] bg-red-500/2">
            <div>
              <span className="text-[9px] font-mono text-[var(--status-red)] uppercase tracking-wider block flex items-center gap-1 font-bold">
                <AlertOctagon className="w-3 h-3" /> 03. Top Risk
              </span>
              <span className="text-xs font-mono text-white mt-2 block font-medium leading-tight line-clamp-2">
                {riskTitle}
              </span>
            </div>
            <span className="text-[9px] font-mono text-[var(--status-red)] mt-1">
              Risk: {kpis.risk.value}% · CRITICAL
            </span>
          </div>

          {/* 4. Recommended Executive Decision */}
          <div className="p-4 flex flex-col justify-between min-h-[110px] md:col-span-1">
            <div>
              <span className="text-[9px] font-mono text-[var(--accent)] uppercase tracking-wider block font-bold">
                04. Recommended Decision
              </span>
              <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-2 leading-snug line-clamp-3">
                {recommendedDecision}
              </p>
            </div>
          </div>

          {/* 5. Expected ROI & Workflow Actions */}
          <div className="p-4 flex flex-col justify-between min-h-[110px]">
            <div>
              <span className="text-[9px] font-mono text-[var(--status-green)] uppercase tracking-wider block font-bold">
                05. Expected ROI
              </span>
              <span className="text-[10px] font-mono text-white mt-1.5 block leading-tight">
                {expectedRoi}
              </span>
            </div>
            <div className="mt-2.5">
              <button
                onClick={handleExecuteDecision}
                className="w-full flex items-center justify-center gap-1 py-1.5 rounded bg-[var(--accent)] hover:brightness-110 text-black font-semibold text-[10px] border-none transition-all cursor-pointer font-mono"
              >
                <span>Review in Actions Center</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>
      </motion.div>


      {/* ========================================================
          CRITICAL BUSINESS KPIS ROW (ONLY PRIMARY TELEMETRY)
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Revenue MTD */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col justify-between rounded-lg p-5 border border-[var(--border)] hover:border-[var(--border-strong)] transition-all bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] min-h-[135px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-wider uppercase font-mono">
              MTD Revenue
            </span>
            <ContextualMenu
              title="MTD Revenue"
              context={`Current Revenue: ${kpis.revenue.value}, Trend: ${kpis.revenue.delta}`}
              infoContent={{
                formula: "MTD Revenue = Sum of daily invoiced sales across all active plants",
                source: "SAP ERP Financials Billing Ledger",
                benchmark: "₹450.0 Cr/month target",
                lastUpdated: "5 mins ago",
              }}
              detailData={{
                history: selectedPlantId === "pune-uuid" || selectedPlantId === "pune" ? [30, 32, 34, 33, 35, 36, 37, 38, 37.5, 38.2, 39.0, 39.0] : [110, 112, 115, 113, 118, 120, 122, 121, 123, 124, 125, 125.0],
                unit: " Cr",
                note: "Revenue is tracking positively with a 8.2% delta, driven by strong outbound shipment performance in Mumbai and Surat.",
              }}
              scrollTarget="chart-plant-comparison"
              actionContent="Review current plant billing performance. Coordinate logistics dispatch schedules to clear backlog at Pune."
            />
          </div>
          
          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-light font-mono text-[var(--text-primary)]">
                {kpis.revenue.value.replace(" Cr", "")}
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">Cr</span>
            </div>
            <MiniSparkline data={kpis.revenue.history || [420, 428, 435, 430, 442, 455, 462, 470, 468, 475, 480, 482.4]} color="var(--status-green)" />
          </div>

          <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-[var(--text-secondary)] border-t border-[var(--border)] pt-2.5">
            <span>Target: ₹{targetRevenue} Cr</span>
            <span className={cn(
              "font-semibold",
              kpis.revenue.trend === "up" ? "text-[var(--status-green)]" : "text-[var(--status-red)]"
            )}>
              {kpis.revenue.trend === "up" ? "▲" : "▼"} {kpis.revenue.delta.split(" ")[0]}
            </span>
          </div>
        </motion.div>

        {/* 2. Net Profit */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col justify-between rounded-lg p-5 border border-[var(--border)] hover:border-[var(--border-strong)] transition-all bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] min-h-[135px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-wider uppercase font-mono">
              Net Profit
            </span>
            <ContextualMenu
              title="Net Profit"
              context={`Current Net Profit: ${kpis.net_profit.value}, Margin: ${kpis.net_profit.margin}`}
              infoContent={{
                formula: "Net Profit = Total Revenue - (Cost of Goods Sold + Operating Expenses + Energy Cost)",
                source: "SAP ERP + Operations Cost Logs",
                benchmark: "18.0% Net Margin industry standard",
                lastUpdated: "5 mins ago",
              }}
              detailData={{
                history: selectedPlantId === "pune-uuid" || selectedPlantId === "pune" ? [5, 5.5, 6, 5.8, 6.2, 6.5, 6.8, 7.0, 6.9, 7.1, 7.0, 7.0] : [18, 19, 20, 19.5, 21, 22, 22.5, 23, 23.5, 23.8, 24.0, 24.0],
                unit: " Cr",
                note: "Net profit margins are slightly constrained by peak energy costs at Pune (Plant B). Suggesting power scheduling audit.",
              }}
              scrollTarget="chart-revenue-forecast"
              actionContent="Initiate peak energy shaving protocol for furnace heating elements to increase margin by 1.2%."
            />
          </div>
          
          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-light font-mono text-[var(--text-primary)]">
                {kpis.net_profit.value.replace(" Cr", "")}
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">Cr</span>
            </div>
            <MiniSparkline data={kpis.net_profit.history || [80, 82, 85, 83, 89, 94, 98, 102, 100, 104, 108, 110.2]} color="var(--status-green)" />
          </div>

          <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-[var(--text-secondary)] border-t border-[var(--border)] pt-2.5">
            <span>Margin: {kpis.net_profit.margin}</span>
            <span className={cn(
              "font-semibold",
              kpis.net_profit.trend === "up" ? "text-[var(--status-green)]" : "text-[var(--status-red)]"
            )}>
              {kpis.net_profit.trend === "up" ? "▲" : "▼"} {kpis.net_profit.delta.split(" ")[0]}
            </span>
          </div>
        </motion.div>

        {/* 3. Plant Health & OEE */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col justify-between rounded-lg p-5 border border-[var(--border)] hover:border-[var(--border-strong)] transition-all bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] min-h-[135px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-wider uppercase font-mono">
              Plant Health Index
            </span>
            <ContextualMenu
              title="Plant Health Index"
              context={`Current Health Score: ${kpis.health.value}/100, Status: ${healthStatus}, OEE: ${kpis.utilization.value}`}
              infoContent={{
                formula: "Health Index = Weighted Avg (40% OEE, 30% Asset Degradation, 20% Energy Intensity, 10% Safety Events)",
                source: "MES Platform + IIoT Edge Sensors",
                benchmark: ">= 80% (OPTIMAL) target benchmark",
                lastUpdated: "Realtime",
              }}
              detailData={{
                history: selectedPlantId === "pune-uuid" || selectedPlantId === "pune" ? [72, 70, 68, 69, 71, 70, 68, 67, 68, 68, 68, 68] : [84, 85, 83, 84, 82, 85, 86, 84, 85, 84, 84, 84],
                unit: "",
                note: "Pune plant health is degraded (68/100) due to Furnace-2 bearing temperature rise. Recommending parts replacement.",
              }}
              scrollTarget="chart-loss-sources"
              actionContent="Furnace-2 bearing temperature has increased by 22% over 48 hours. Current: 92°C vs baseline 75°C. Bearing thermal wear projected in 2 days at 68%. Impact: ₹18.6 Lakhs. Recommended: inspect bearing and approve automatic preventative replacement by May 23, 2026."
            />
          </div>
          
          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-light font-mono" style={{ color: healthColor }}>
                {kpis.health.value}
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">/ 100</span>
            </div>
            <div className="w-20 bg-[var(--border)] h-1.5 rounded-full overflow-hidden self-center">
              <div className="h-full" style={{ width: `${kpis.health.value}%`, backgroundColor: healthColor }} />
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-[var(--text-secondary)] border-t border-[var(--border)] pt-2.5">
            <span>OEE Metric: {kpis.utilization.value}</span>
            <span className="font-semibold" style={{ color: healthColor }}>
              {healthStatus}
            </span>
          </div>
        </motion.div>

      </div>


      {/* ========================================================
          PROGRESSIVE DISCLOSURE (COLLAPSED SECONDARY CHARTS)
          ======================================================== */}
      <motion.div variants={itemVariants} className="space-y-4">
        
        <CollapsibleSection
          title="Secondary Analytics & Energy Trends"
          subtitle="Contains inter-plant utility correlations, daily grid power tariffs, and loss source charts"
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
            
            {/* Loss Sources Donut Chart (4 cols) */}
            <div id="chart-loss-sources" className="lg:col-span-4 flex flex-col rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-wider uppercase font-mono">
                  MTD Loss Sources Breakdown
                </span>
                <ContextualMenu
                  title="MTD Loss Sources"
                  context="Losses distribution: Downtime (42%), Energy Waste (28%), Defects (30%)"
                />
              </div>
              <div className="h-[210px] min-h-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.loss_sources}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ percent }) => percent !== undefined ? `${(percent * 100).toFixed(0)}%` : ""}
                    >
                      {charts.loss_sources.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                      <Label value="TOTAL LOSS" position="center" dy={-10} style={{ fontSize: '9px', fill: 'var(--text-muted)', fontFamily: 'DM Mono' }} />
                      <Label value="₹18.6 L" position="center" dy={10} style={{ fontSize: '18px', fill: 'white', fontWeight: 'bold', fontFamily: 'DM Mono' }} />
                    </Pie>
                    <Tooltip contentStyle={CHART_STYLE.tooltipStyle} />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      formatter={(value: string) => {
                        const item = charts.loss_sources.find((d: any) => d.name === value);
                        if (!item) return value;
                        const total = charts.loss_sources.reduce((sum: number, d: any) => sum + d.value, 0) || 1;
                        const pct = ((item.value / total) * 100).toFixed(0);
                        return <span className="text-[var(--text-secondary)] font-mono text-[9px] mx-1">{value}: ₹{item.value}L ({pct}%)</span>;
                      }}
                      wrapperStyle={{ fontSize: 9, fontFamily: "DM Mono" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[9px] text-[var(--text-muted)] italic mt-3 font-mono">
                * AI Advisory: Plant B downtime is the primary loss driver, representing 42% of MTD loss.
              </p>
            </div>

            {/* Inter-Plant OEE Comparison (8 cols) */}
            <div id="chart-plant-comparison" className="lg:col-span-8 flex flex-col rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-wider uppercase font-mono">
                  Plant Comparisons (MTD Revenue & Utilization)
                </span>
                <ContextualMenu
                  title="Plant Comparisons"
                  context="Inter-plant OEE and utilization statistics"
                />
              </div>
              <div className="h-[210px] min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.plant_comparison} margin={{ top: 25, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip contentStyle={CHART_STYLE.tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 10, fontFamily: "DM Mono" }} />
                    <Bar name="Revenue (Cr)" dataKey="revenue" fill={CHART_COLORS_HEX.c1} radius={[3, 3, 0, 0]} label={renderCustomBarLabel} />
                    <Bar name="OEE (%)" dataKey="oee" fill={CHART_COLORS_HEX.c2} radius={[3, 3, 0, 0]} label={renderCustomBarLabel} />
                    <Bar name="Utilization (%)" dataKey="utilization" fill={CHART_COLORS_HEX.c3} radius={[3, 3, 0, 0]} label={renderCustomBarLabel} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[9px] text-[var(--text-muted)] italic mt-3 font-mono">
                * AI Advisory: Pune OEE is degraded at 68% due to Furnace-2 micro-stoppages.
              </p>
            </div>

          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Grid Load & Revenue Forecast Ledger"
          subtitle="Contains predictive revenue margins and daily energy utility cost thresholds"
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
            
            {/* Energy Cost Trend (6 cols) */}
            <div id="chart-energy-trend" className="lg:col-span-6 flex flex-col rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-wider uppercase font-mono">
                  Energy Billing Trend (30 Days)
                </span>
                <ContextualMenu
                  title="Energy Cost Trend"
                  context="Daily energy utilization vs cost limit bounds"
                />
              </div>
              <div className="h-[210px] min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={charts.energy_trend} margin={{ top: 15, right: 15, left: -25, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip contentStyle={CHART_STYLE.tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 10, fontFamily: "DM Mono" }} />
                    <Area name="Cost Shading" type="monotone" dataKey="cost" fill="#3B82F6" stroke="none" fillOpacity={0.05} />
                    <Line name="Daily Cost (Lakhs)" type="monotone" dataKey="cost" stroke={CHART_COLORS_HEX.c2} strokeWidth={1.5} dot={(props: any) => {
                      const { cx, cy, value } = props;
                      if (value > 4.7) {
                        return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill="var(--status-red)" stroke="white" strokeWidth={1} />;
                      }
                      return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={2} fill={CHART_COLORS_HEX.c2} />;
                    }} />
                    <ReferenceLine y={5.0} stroke="var(--status-amber)" strokeDasharray="4 4" strokeWidth={1.5}>
                      <Label value="Budget Cap" position="insideTopRight" fill="var(--status-amber)" style={{ fontSize: 9, fontFamily: 'DM Mono' }} />
                    </ReferenceLine>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[9px] text-[var(--text-muted)] italic mt-3 font-mono">
                * AI Advisory: Tariff threshold breached on May 15 due to peak-hour furnace pre-heating.
              </p>
            </div>

            {/* Revenue Forecast (6 cols) */}
            <div id="chart-revenue-forecast" className="lg:col-span-6 flex flex-col rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-wider uppercase font-mono">
                  Revenue Forecast Trend & Deviations
                </span>
                <ContextualMenu
                  title="Revenue Forecast"
                  context="Pessimistic, actual and optimistic forward forecasts"
                />
              </div>
              <div className="h-[210px] min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={forecastDataWithBand}
                    margin={{ top: 15, right: 15, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip contentStyle={CHART_STYLE.tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 10, fontFamily: "DM Mono" }} />
                    <Area name="Confidence Interval" type="monotone" dataKey="band" stroke="none" fill="rgba(156, 163, 175, 0.08)" />
                    <Line name="Actual Revenue" type="monotone" dataKey="actual" stroke={CHART_COLORS_HEX.c1} strokeWidth={2} />
                    <Line name="AI Forecast Model" type="monotone" dataKey="forecast" stroke={CHART_COLORS_HEX.c2} strokeWidth={1.5} strokeDasharray="3 3" />
                    <Line name="Optimistic Path" type="monotone" dataKey="optimistic" stroke="var(--status-green)" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                    <Line name="Pessimistic Path" type="monotone" dataKey="pessimistic" stroke="var(--status-red)" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                    <ReferenceLine x="May" stroke="var(--accent)" strokeDasharray="3 3" strokeWidth={1}>
                      <Label value="TODAY (May 22)" position="insideTopLeft" fill="var(--accent)" style={{ fontSize: 9, fontFamily: 'DM Mono' }} />
                    </ReferenceLine>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[9px] text-[var(--text-muted)] italic mt-3 font-mono">
                * AI Advisory: Current MTD actual revenue is tracking within 1.2% of the AI Mid-Case forecast.
              </p>
            </div>

          </div>
        </CollapsibleSection>

      </motion.div>

      {/* MODALS */}
      <BreakdownModal
        isOpen={modalType === "health"}
        type="health"
        data={kpis.health}
        plantName={selectedPlantId === "all" ? "All Enterprise Plants" : selectedPlantId.toUpperCase()}
        onClose={() => setModalType(null)}
      />
      <BreakdownModal
        isOpen={modalType === "risk"}
        type="risk"
        data={kpis.risk}
        plantName={selectedPlantId === "all" ? "All Enterprise Plants" : selectedPlantId.toUpperCase()}
        onClose={() => setModalType(null)}
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
        @keyframes highlight-pulse {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          50% { box-shadow: 0 0 16px 6px rgba(245, 158, 11, 0.3); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
        .animate-highlight {
          animation: highlight-pulse 0.5s ease-out 4;
          border-color: var(--accent) !important;
        }
      `}} />
    </motion.div>
  );
}
