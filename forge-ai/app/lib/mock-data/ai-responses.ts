export interface AIResponse {
  keywords: string[];
  response: string;
}

export const CXO_RESPONSES: AIResponse[] = [
  {
    keywords: ["revenue", "sales", "crore", "cr"],
    response: "Enterprise MTD revenue is tracking at ₹125.0 Cr, which is 95.5% of target. Plant B (Pune) is lagging by 11.8% against its local target, while Plant A (Mumbai) is outperforming by 4.2%."
  },
  {
    keywords: ["profit", "margin", "income"],
    response: "Enterprise net profit is ₹24.0 Cr, representing a 19.2% margin. This is up 3.1% compared to last month. Pune's margin is slightly compressed at 17.9% due to unplanned downtime on Furnace-2."
  },
  {
    keywords: ["savings", "opportunity", "saving"],
    response: "There is an active MTD Savings Opportunity of ₹18.6 Lakhs with 87% confidence. This is driven by preventive replacement of Furnace-2's thermal bearings to avoid an unplanned shutdown."
  },
  {
    keywords: ["risk", "concern", "critical"],
    response: "The top operational risk is Furnace-2's bearing thermal degradation in Pune, showing a 68% probability of failure within 48 hours. Estimated impact is ₹18.6 Lakhs/month if unplanned downtime occurs."
  },
  {
    keywords: ["pune", "plant b"],
    response: "Plant B (Pune) has a composite health index of 68 (degraded). The primary performance bottlenecks are Furnace-2 vibration alerts (OEE at 58%) and peak energy tariff penalties costing ₹1.8L/day."
  },
  {
    keywords: ["energy", "tariff", "electricity"],
    response: "Energy cost MTD stands at ₹45.2 L (+5.3% vs last month). Pune is facing peak rate penalties during 2 PM - 6 PM. We recommend rescheduling arc furnace cycles to off-peak slots to save ₹1.8L/day."
  },
  {
    keywords: ["recommend", "decision", "action"],
    response: "I recommend approving the preventive bearing swap for Pune Furnace-2. Expected ROI is ₹4.2 Lakhs/month in capital loss savings with a 1.2 hour installation window."
  }
];

export const ITOT_RESPONSES: AIResponse[] = [
  {
    keywords: ["historian", "database", "timeout"],
    response: "Historian DB has an active P1 incident due to data sync timeouts (latency at 420ms). DevOps is currently clearing log buffers and restarting the sync daemon."
  },
  {
    keywords: ["incident", "ticket", "p1", "p2"],
    response: "There are currently 4 active incidents: 1 P1 (Historian Timeout), 2 P2s (Vulnerability Scan Probe and Azure Backup Incomplete), and 1 P3 (HMI Unit 4 Latency - Mitigated)."
  },
  {
    keywords: ["sensor", "offline", "degraded"],
    response: "There are 3 offline and 4 degraded sensors in Plant B (Pune). The data pipeline health index is 94.2% with a transmission latency of 124ms (baseline 15ms)."
  },
  {
    keywords: ["backup", "restore", "dr"],
    response: "Azure Cloud Backup failed its daily sync (RPO actual is 3,240 mins). ERP database backup is successful with a 15-minute RPO. Historian backup is showing a warning with a 75-minute RPO."
  },
  {
    keywords: ["latency", "slow", "ping"],
    response: "Data pipeline latency is currently elevated at 124ms (normally 15ms). This is due to network buffer saturation between the PLC network and the SCADA core in Zone 3."
  },
  {
    keywords: ["cyber", "threat", "security", "firewall", "probe"],
    response: "Zone 4 (PLC Subnets) is flagged as warning due to a critical event: an external port probe from unassigned IP 10.14.22.87. We recommend executing a block rule on PaloAlto Firewall."
  },
  {
    keywords: ["uptime", "network", "offline"],
    response: "Global system uptime is 99.82% (+0.04% vs last week). 10 out of 12 critical IT/OT systems are reporting optimal health, with Historian and PLC networks currently degraded."
  }
];

export const FLOOR_RESPONSES: AIResponse[] = [
  {
    keywords: ["target", "produced", "shift"],
    response: "Current shift target is 620 Tons. We have produced 387 Tons so far (62.4% complete). We have 233 Tons remaining with 3.5 hours left in the shift."
  },
  {
    keywords: ["pace", "slow", "shortfall"],
    response: "Current production pace is 29.1 T/hr. To hit the shift target, we require a pace of 47.8 T/hr. The shortfall is projected at 98 Tons unless Line 3 throughput is restored."
  },
  {
    keywords: ["bottleneck", "furnace", "bf2", "line3"],
    response: "Furnace-2 (degraded health at 67%) and Line 3 (critical status at 55%) are the main bottlenecks. Furnace-2 is outputting only 18 T/hr vs a baseline of 28 T/hr."
  },
  {
    keywords: ["defect", "quality", "reject"],
    response: "Quality defect rate is currently 1.8%, representing 8.1 Tons of rejected output today. This is within our tolerance threshold of 2.5%, but has risen from yesterday's 1.2%."
  },
  {
    keywords: ["work order", "wo", "queued"],
    response: "There are 3 active work orders: WO-0554 (Urgent - HRC Coil - In Progress), WO-0551 (High - TMT Rebar - In Progress), and WO-0548 (Normal - Billets - Queued)."
  },
  {
    keywords: ["shipment", "inbound", "outbound", "logistics"],
    response: "There are 3 inbound and 2 outbound shipments scheduled today. Iron Ore inbound (240T) is delayed by 45 minutes; HRC Coils outbound (180T) is ready in the bay."
  },
  {
    keywords: ["inventory", "stock", "level"],
    response: "Iron Ore inventory is normal (1,240T vs reorder level 800T). Limestone stock is at 220T, which is safe. Coke stock is at 310T, close to the reorder line."
  }
];

export function matchResponse(role: "cxo" | "itot" | "floor", query: string): string {
  const normalized = query.toLowerCase();
  const responses = role === "cxo" ? CXO_RESPONSES : role === "itot" ? ITOT_RESPONSES : FLOOR_RESPONSES;
  
  for (const item of responses) {
    if (item.keywords.some(keyword => normalized.includes(keyword))) {
      return item.response;
    }
  }
  
  // Generic role-specific fallbacks
  if (role === "cxo") {
    return "I am scanning enterprise telemetry. Currently, Pune's Furnace-2 thermal fatigue (₹18.6L risk) is the highest priority issue. Ask me about revenue, profit, energy, or Pune plant.";
  }
  if (role === "itot") {
    return "IT/OT monitoring active. Zone 4 PLC port probe and Historian DB sync timeouts are the main incidents. Ask me about systems, incidents, backups, latency, or cybersecurity.";
  }
  return "Operations dashboard active. Furnace-2 degradation (18 T/hr) is bottlenecking the casting line. Ask me about shift targets, production pace, bottlenecks, work orders, or shipments.";
}
