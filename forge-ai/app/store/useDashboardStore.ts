import { create } from "zustand";

export type RoleType = "cxo" | "technical" | "floor" | "reports" | "actions";

export interface ActionItem {
  id: string;
  title: string;
  source: string;
  businessImpact: string;
  rootCause: string;
  recommendation: string;
  roi: string;
  owner: string;
  status: "pending" | "scheduled" | "in_progress" | "completed";
  confidence: string;
  dateGenerated: string;
}

interface DashboardState {
  selectedPlantId: string; // "all", or plant UUID
  selectedRole: RoleType;
  countdown: number;
  isConnected: boolean;
  liveDashboardData: any;
  isCopilotOpen: boolean;
  copilotQuery: string | null;
  copilotTab: "overview" | "insights" | "actions" | "chat" | "reports" | null;
  actions: ActionItem[];
  isMobileSidebarOpen: boolean;
  
  setPlantId: (id: string) => void;
  setRole: (role: RoleType) => void;
  setCountdown: (seconds: number | ((prev: number) => number)) => void;
  setIsConnected: (connected: boolean) => void;
  setLiveDashboardData: (data: any) => void;
  setCopilotOpen: (open: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  triggerCopilotAction: (
    query: string,
    tab?: "overview" | "insights" | "actions" | "chat" | "reports"
  ) => void;
  clearCopilotAction: () => void;
  
  // Actions Center sync
  setActions: (actions: ActionItem[]) => void;
  approveAction: (id: string) => void;
  addAction: (action: ActionItem) => void;
  updateActionStatus: (id: string, status: ActionItem["status"]) => void;
  assignActionOwner: (id: string, owner: string) => void;
}

const DEFAULT_ACTIONS: ActionItem[] = [
  {
    id: "act-1",
    title: "Replace Furnace-2 Core Spindle Bearing Assembly",
    source: "Predictive Reliability Model v4.1",
    businessImpact: "Saves ₹4.2L/month in capital loss and avoids ₹18.6L in catastrophic downtime",
    rootCause: "Furnace-2 bearing thermal wear matches 72% profile of catastrophic spindle lock events. Accelerometer vibration shows anomalous spike to 4.2mm/s (limit: 3.0).",
    recommendation: "Deploy Maintenance Crew Alpha for immediate mechanical replacement swap. Supply chain registry confirms replacement bearing is stocked in Zone C depot.",
    roi: "₹18.6L catastrophic cost avoidance, ₹4.2L/month ongoing OEE protection",
    owner: "Maintenance Team",
    status: "pending",
    confidence: "88%",
    dateGenerated: "2026-05-22 06:12 AM"
  },
  {
    id: "act-2",
    title: "Recalibrate Line 3 Conveyor Tension Limiters",
    source: "SCADA Anomaly Detector",
    businessImpact: "Resolves conveyor drag and increases line throughput by +14.6%",
    rootCause: "Slag accumulation on Line 3 drive belt causing motor torque overload alarms (180A peak). PLC speed feedback reports 8% slip rate.",
    recommendation: "Schedule brief 15-minute operational pause. Clear drive slag accumulation and recalibrate tension parameters on edge PLC nodes.",
    roi: "₹4.2L/month OEE correction, 14.6% production rate restoration",
    owner: "Operations Lead",
    status: "pending",
    confidence: "62%",
    dateGenerated: "2026-05-22 05:45 AM"
  },
  {
    id: "act-3",
    title: "Reschedule Peak Electric Arc Melting Operations",
    source: "Energy Tariff Optimizer",
    businessImpact: "Reduces plant energy billing surcharge rate by ₹3.1L",
    rootCause: "Arc melting scheduled during peak industrial grid pricing window (12:00 PM - 4:00 PM) causing ₹4.12/kWh peak utility charge rates.",
    recommendation: "Reschedule next billet melting cycle to off-peak slots (10:00 PM - 6:00 AM). Modify shift dispatch ledger accordingly.",
    roi: "₹3.1L direct utility savings with zero production volume loss",
    owner: "Operations Lead",
    status: "pending",
    confidence: "91%",
    dateGenerated: "2026-05-22 04:30 AM"
  },
  {
    id: "act-4",
    title: "Calibrate Crusher-1 Hydraulic Feed Valves",
    source: "Asset Diagnostic Stream Matrix",
    businessImpact: "Avoids pressure loss and feedstock output constraints",
    rootCause: "Hydraulic pressure sensor readings show micro-oscillations, indicating possible seal wear or valve ring leakage.",
    recommendation: "Schedule field mechanical inspection during planned lunch downtime block. Check seal rings on valve 4B.",
    roi: "₹1.8L loss avoidance, protects Crusher-1 health score from degrading below 60%",
    owner: "Maintenance Team",
    status: "scheduled",
    confidence: "47%",
    dateGenerated: "2026-05-22 02:15 AM"
  }
];

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedPlantId: "all",
  selectedRole: "cxo",
  countdown: 30,
  isConnected: false,
  liveDashboardData: null,
  isCopilotOpen: false, // Default to closed on initial load for cleaner initial layout
  copilotQuery: null,
  copilotTab: null,
  actions: DEFAULT_ACTIONS,
  isMobileSidebarOpen: false,

  setPlantId: (id) => set({ selectedPlantId: id }),
  setRole: (role) => set({ selectedRole: role }),
  setCountdown: (val) =>
    set((state) => ({
      countdown: typeof val === "function" ? val(state.countdown) : val,
    })),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setLiveDashboardData: (data) => set({ liveDashboardData: data }),
  setCopilotOpen: (open) => set({ isCopilotOpen: open }),
  setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),
  triggerCopilotAction: (query, tab = "chat") =>
    set({
      isCopilotOpen: true,
      copilotQuery: query,
      copilotTab: tab,
    }),
  clearCopilotAction: () => set({ copilotQuery: null, copilotTab: null }),
  
  // Actions management
  setActions: (actions) => set({ actions }),
  approveAction: (id) =>
    set((state) => ({
      actions: state.actions.map((act) =>
        act.id === id ? { ...act, status: "scheduled" } : act
      ),
    })),
  addAction: (action) =>
    set((state) => {
      // Check if action already exists
      if (state.actions.some((a) => a.id === action.id)) return state;
      return { actions: [action, ...state.actions] };
    }),
  updateActionStatus: (id, status) =>
    set((state) => ({
      actions: state.actions.map((act) =>
        act.id === id ? { ...act, status } : act
      ),
    })),
  assignActionOwner: (id, owner) =>
    set((state) => ({
      actions: state.actions.map((act) =>
        act.id === id ? { ...act, owner } : act
      ),
    })),
}));
