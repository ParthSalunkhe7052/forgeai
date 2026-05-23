/**
 * Unified Mock Data Layer Constants
 * Serving as the single source of truth for the Forge AI frontend dashboard.
 */

export const MOCK_DATA = {
  enterprise: {
    revenue_mtd_cr: 12.5,
    revenue_mtd_target_cr: 15.0,
    revenue_mtd_prev_cr: 12.1,
    revenue_delta_pct: 8.2,
    net_profit_cr: 2.4,
    net_profit_margin_pct: 19.2,
    net_profit_delta_pct: 3.1,
    utilization_pct: 84.0,
    utilization_delta_pct: -2.1,
    production_tons: 11840,
    production_target_tons: 12400,
    production_delta_pct: 95.5,
    energy_cost_lakhs: 45.2,
    energy_cost_delta_pct: 5.3,
    energy_rate_kwh: 3.82,
    losses_mtd_lakhs: 18.6,
    losses_delta_pct: -12.0,
    health_score: 84,
    risk_score: 34,
    savings_opportunity_lakhs: 18.6,
    savings_confidence_pct: 87,
    savings_delta_pct: -5.3,
    top_driver: "Furnace-2 downtime",
    top_concern: "Furnace-2 bearing temperature has increased by 22% over 48 hours. Current: 92°C vs baseline 75°C. Bearing thermal wear projected in 2 days at 68%. Impact: ₹18.6 Lakhs. Recommended: inspect bearing and approve automatic preventative replacement by May 23, 2026.",
    recommended_decision: "inspect bearing and approve automatic preventative replacement by May 23, 2026.",
    expected_roi_lakhs_month: 4.2,
  },
  
  plantA: {
    id: "mumbai-uuid",
    name: "Plant A — Mumbai",
    revenue_mtd_cr: 6.1,
    revenue_mtd_prev_cr: 5.8,
    revenue_target_mtd_cr: 7.2,
    revenue_delta_pct: 5.2,
    net_profit_cr: 1.2,
    net_margin_pct: 19.7,
    plant_health_index: 84,
    oee_pct: 78.2,
  },

  plantB: {
    id: "pune-uuid",
    name: "Plant B — Pune",
    revenue_mtd_cr: 3.9,
    revenue_mtd_prev_cr: 3.7,
    revenue_target_mtd_cr: 4.6,
    revenue_delta_pct: 5.4,
    net_profit_cr: 0.7,
    net_profit_margin_pct: 17.9,
    net_profit_delta_pct: -1.2,
    utilization_pct: 81.5,
    utilization_delta_pct: -2.1,
    production_tons: 3800,
    production_target_tons: 4300,
    production_delta_pct: 88.2,
    energy_cost_lakhs: 16.0,
    energy_cost_delta_pct: 18.2,
    energy_rate_kwh: 4.12,
    losses_mtd_lakhs: 7.1,
    losses_delta_pct: -5.3,
    health_score: 68,
    risk_score: 51,
    savings_opportunity_lakhs: 7.1,
    savings_confidence_pct: 88,
    savings_delta_pct: -5.3,
    top_driver: "Furnace-2 downtime",
    top_concern: "Furnace-2 bearing temperature has increased by 22% over 48 hours. Current: 92°C vs baseline 75°C. Bearing thermal wear projected in 2 days at 68%. Impact: ₹18.6 Lakhs. Recommended: inspect bearing and approve automatic preventative replacement by May 23, 2026.",
    recommended_decision: "inspect bearing and approve automatic preventative replacement by May 23, 2026.",
    expected_roi_lakhs_month: 4.2,
    furnace2: {
      temperature: 92,
      temperature_baseline: 75,
      failure_probability: 68,
      timeframe_hours: 48,
      impact_unplanned_lakhs: 18.6,
      savings_potential_lakhs: 4.2,
    }
  },

  currentShift: {
    target_tons: 620,
    produced_tons: 387,
    remaining_tons: 233,
    required_pace_t_hr: 47.8,
    current_pace_t_hr: 29.1,
    defect_rate_pct: 1.8,
    defects_tons: 8.1,
    inbound_shipments: 3,
    outbound_loads: 2,
    hours_completed: 4.5,
    hours_total: 8.0,
    downtime_blocks: [
      { start_hour: 1.5, duration_hours: 0.5, type: "break", label: "Scheduled Break" },
      { start_hour: 3.0, duration_hours: 0.75, type: "mechanical", label: "Line 3 Jam" }
    ],
  },
  
  itOT: {
    uptime_pct: 99.82,
    uptime_delta: "+0.04% vs last week",
    incidents_active: 4,
    incidents_total_week: 14,
    systems_total: 12,
    systems_healthy: 10,
    cyber_alerts_critical: 0,
    cyber_alerts_warning: 3,
    cyber_events_24h: 128,
    pipeline_health_pct: 94.2,
    pipeline_latency_ms: 124,
    pipeline_latency_baseline_ms: 15,
    backup_rpo_mins: 15,
    backup_rto_hours: 4.0,
  }
};

/**
 * Format helper for currency (INR Lakhs/Crores)
 */
export function formatCurrency(value: number, unit: "Cr" | "Lakhs" = "Cr"): string {
  if (unit === "Cr") {
    return `₹${value.toFixed(1)} Cr`;
  }
  return `₹${value.toFixed(1)} Lakhs`;
}

/**
 * Format helper for percentage
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Resolves standard status colors based on thresholds
 */
export function getStatusColor(value: number, type: "health" | "risk" | "generic"): string {
  if (type === "health") {
    if (value >= 80) return "var(--status-green)";
    if (value >= 60) return "var(--status-amber)";
    return "var(--status-red)";
  }
  if (type === "risk") {
    if (value <= 25) return "var(--status-green)";
    if (value <= 50) return "var(--status-amber)";
    return "var(--status-red)";
  }
  return "var(--text-primary)";
}
