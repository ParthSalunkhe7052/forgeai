export interface SystemStatus {
  name: string;
  category: "IT" | "OT";
  status: "healthy" | "degraded" | "critical";
  uptime: number;
  lastIncident: string;
  version: string;
  latency: string;
}

export interface LatencyData {
  time: string;
  plcToScada: number;
  scadaToHistorian: number;
  historianToDashboard: number;
}

export interface ActiveIncident {
  id: string;
  severity: "P1" | "P2" | "P3";
  title: string;
  status: "Active" | "Investigating" | "Mitigated";
  raisedAt: string;
  owner: string;
  suggestedResolution: string;
}

export interface CyberEvent {
  id: string;
  severity: "critical" | "warning" | "info";
  time: string;
  description: string;
  zone: string;
}

export interface NetworkZone {
  name: string;
  status: "secure" | "inspected" | "warning" | "breach";
  trafficRate: string;
  activeNodes: number;
}

export interface SensorPlantHealth {
  plantName: string;
  totalSensors: number;
  offlineCount: number;
  degradedCount: number;
  status: "optimal" | "warning" | "critical";
}

export interface BackupDRStatus {
  system: string;
  status: "success" | "warning" | "failed";
  lastBackup: string;
  rpoActualMins: number;
  rtoActualHours: number;
}

export const SYSTEMS_STATUS: SystemStatus[] = [
  { name: "SCADA Core", category: "OT", status: "healthy", uptime: 99.98, lastIncident: "3 weeks ago", version: "v8.4.2", latency: "14ms" },
  { name: "MES Control", category: "OT", status: "healthy", uptime: 99.95, lastIncident: "2 days ago", version: "v5.1.0", latency: "28ms" },
  { name: "PLC Network", category: "OT", status: "degraded", uptime: 98.42, lastIncident: "Active", version: "Firmware v3.9", latency: "120ms" },
  { name: "HMI Cluster", category: "OT", status: "healthy", uptime: 99.90, lastIncident: "1 week ago", version: "v2.12.1", latency: "18ms" },
  { name: "Historian DB", category: "OT", status: "critical", uptime: 94.15, lastIncident: "Active", version: "v11.2", latency: "420ms" },
  { name: "IIoT Gateway", category: "OT", status: "healthy", uptime: 99.88, lastIncident: "5 days ago", version: "v4.0.1", latency: "35ms" },
  { name: "SAP ERP", category: "IT", status: "healthy", uptime: 99.91, lastIncident: "None this month", version: "v2026.1", latency: "80ms" },
  { name: "CMMS Asset Manager", category: "IT", status: "healthy", uptime: 99.85, lastIncident: "2 weeks ago", version: "v6.3", latency: "95ms" },
  { name: "Factory Firewall", category: "IT", status: "healthy", uptime: 100.0, lastIncident: "None this quarter", version: "PaloAlto v11.1", latency: "2ms" },
  { name: "Azure Cloud Backup", category: "IT", status: "healthy", uptime: 99.99, lastIncident: "12 days ago", version: "v3.1.2", latency: "65ms" },
  { name: "Active Directory", category: "IT", status: "healthy", uptime: 99.99, lastIncident: "None", version: "Windows Server 2025", latency: "5ms" },
  { name: "LIMS Quality DB", category: "IT", status: "healthy", uptime: 99.94, lastIncident: "4 days ago", version: "v8.1", latency: "40ms" }
];

// Generate 48-hour hourly mock latency
export const LATENCY_48H: LatencyData[] = (() => {
  const data: LatencyData[] = [];
  const startHour = 48;
  for (let i = 0; i <= startHour; i++) {
    const timeVal = new Date();
    timeVal.setHours(timeVal.getHours() - (startHour - i));
    const label = timeVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Simulate latency spikes on Historian DB
    let historianLatency = 18 + Math.random() * 8;
    if (i >= 30 && i <= 36) {
      historianLatency += 280; // massive spike
    } else if (i > 36) {
      historianLatency += 80;  // lingering high latency
    }
    
    data.push({
      time: label,
      plcToScada: 12 + Math.random() * 4,
      scadaToHistorian: historianLatency,
      historianToDashboard: 20 + Math.random() * 6
    });
  }
  return data;
})();

export const ACTIVE_INCIDENTS: ActiveIncident[] = [
  {
    id: "inc-01",
    severity: "P1",
    title: "Historian Data Sync Timeout",
    status: "Active",
    raisedAt: "2 hours ago",
    owner: "DevOps Team",
    suggestedResolution: "Clear log buffers and force restart sync daemon. If CPU remains >95%, scale RAM buffer allocation."
  },
  {
    id: "inc-02",
    severity: "P2",
    title: "Vulnerability Scan Port Probe",
    status: "Investigating",
    raisedAt: "4 hours ago",
    owner: "Security Ops",
    suggestedResolution: "Validate host origin IP. Execute firewall policy blocking rule for IP range 10.192.42.0/24 on DMZ zone."
  },
  {
    id: "inc-03",
    severity: "P2",
    title: "Azure Backup Job Incomplete",
    status: "Active",
    raisedAt: "6 hours ago",
    owner: "IT Admin",
    suggestedResolution: "Verify network route to West US region endpoint. Re-run incremental snapshot job manually."
  },
  {
    id: "inc-04",
    severity: "P3",
    title: "HMI Unit 4 Screen Latency Elevated",
    status: "Mitigated",
    raisedAt: "Yesterday",
    owner: "OT Maintenance",
    suggestedResolution: "Perform memory purge on HMI terminal local cache. Scheduled firmware patch on next scheduled shift window."
  }
];

export const CYBER_EVENTS: CyberEvent[] = [
  {
    id: "evt-01",
    severity: "critical",
    time: "10 mins ago",
    description: "Port probe detected on Zone 3 (PLC Backbone) from unassigned IP (10.14.22.87).",
    zone: "OT Backbone"
  },
  {
    id: "evt-02",
    severity: "warning",
    time: "42 mins ago",
    description: "Repeated failed authentication attempts on MES Gateway admin terminal.",
    zone: "Enterprise DMZ"
  },
  {
    id: "evt-03",
    severity: "info",
    time: "2 hours ago",
    description: "SSL certificate renewal completed for factory local domain trust store.",
    zone: "Corporate IT"
  }
];

export const NETWORK_ZONES: NetworkZone[] = [
  { name: "Zone 1: Corporate IT", status: "secure", trafficRate: "420 Mbps", activeNodes: 240 },
  { name: "Zone 2: DMZ Gateway", status: "inspected", trafficRate: "85 Mbps", activeNodes: 18 },
  { name: "Zone 3: SCADA Core", status: "warning", trafficRate: "12 Mbps", activeNodes: 45 },
  { name: "Zone 4: PLC Subnets", status: "breach", trafficRate: "1.4 Mbps", activeNodes: 128 }
];

export const SENSOR_HEALTH: SensorPlantHealth[] = [
  { plantName: "Plant A — Mumbai", totalSensors: 840, offlineCount: 0, degradedCount: 2, status: "optimal" },
  { plantName: "Plant B — Pune", totalSensors: 620, offlineCount: 3, degradedCount: 4, status: "warning" },
  { plantName: "Plant C — Surat", totalSensors: 410, offlineCount: 0, degradedCount: 0, status: "optimal" }
];

export const BACKUP_STATUS: BackupDRStatus[] = [
  { system: "ERP Database", status: "success", lastBackup: "May 22, 12:00 PM", rpoActualMins: 15, rtoActualHours: 0.5 },
  { system: "SCADA Configurations", status: "success", lastBackup: "May 22, 06:00 AM", rpoActualMins: 360, rtoActualHours: 1.0 },
  { system: "Historian Data Log", status: "warning", lastBackup: "May 22, 02:30 PM", rpoActualMins: 75, rtoActualHours: 2.5 },
  { system: "AD Directory state", status: "success", lastBackup: "May 21, 11:30 PM", rpoActualMins: 1440, rtoActualHours: 4.0 },
  { system: "DR Cloud Replica", status: "failed", lastBackup: "May 20, 04:00 AM", rpoActualMins: 3240, rtoActualHours: 12.0 }
];
