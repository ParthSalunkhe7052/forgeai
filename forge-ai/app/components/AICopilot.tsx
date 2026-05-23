"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDashboardStore } from "../store/useDashboardStore";
import {
  Send,
  User,
  Bot,
  Loader2,
  X,
  Mic,
  Activity,
  Check,
  TrendingUp,
  Clock,
  Sparkles,
  ClipboardList,
  Brain,
  Zap,
  MessageSquare,
  FileText,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/app/utils/cn";

interface AlertData {
  id: string;
  severity: "critical" | "high" | "medium";
  title: string;
  body: string;
  actionText: string;
  query: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

interface ActionData {
  id: string;
  priority: "CRITICAL" | "HIGH PRIORITY" | "MEDIUM PRIORITY";
  action: string;
  impact: string;
  owner: string;
}

const playBeep = (type: "info" | "success" | "warning" = "success") => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    if (type === "success") {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(880.0, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    } else if (type === "warning") {
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(180, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.25);
    } else {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
    }
  } catch (e) {
    console.error("Audio Context failed:", e);
  }
};

const getWelcomeMessage = (role: string) => {
  switch (role) {
    case "cxo":
      return "Welcome to Forge AI Command Center (Executive Room). Enter your questions regarding financial telemetry, potential monthly savings, or carbon offset regulations.";
    case "technical":
      return "IT/OT telemetry diagnostics online. Historian DB sync timeout (P1) is active causing an 8-second pipeline lag on Plant B. Also, DR Cloud Replica sync is failed (54h lag). Pune Furnace-2 vibration is at 4.2mm/s. How can I assist with network, database, or mechanical failure diagnostics?";
    case "floor":
      return "Floor assistant active. Raw iron ore stockpile stands at 14.2k Tons. JSW Steel shipment logistics are scheduled for 10 PM. Ask me to draft work orders or run inventory audits.";
    default:
      return "Forge AI Command Center ready. How can I assist with your factory operations today?";
  }
};

const getPlantName = (plantId: string) => {
  if (plantId === "all") return "All Plants";
  if (plantId.includes("pune") || plantId === "pune-uuid") return "Plant B – Pune";
  if (plantId.includes("mumbai") || plantId === "mumbai-uuid") return "Plant A – Mumbai";
  if (plantId.includes("surat") || plantId === "surat-uuid") return "Plant C – Surat";
  return "Plant B – Pune";
};

// Zero-dependency markdown parser helper
const renderMarkdown = (text: string) => {
  if (!text) return null;
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  
  lines.forEach((line, idx) => {
    let cleanLine = line.trim();
    if (!cleanLine) {
      elements.push(<div key={`empty-${idx}`} className="h-2" />);
      return;
    }
    
    // Check for list item (e.g. "* item" or "- item")
    const isListItem = cleanLine.startsWith("* ") || cleanLine.startsWith("- ");
    if (isListItem) {
      cleanLine = cleanLine.substring(2);
    }
    
    // Replace **bold** with styled spans
    const parts = cleanLine.split(/\*\*([^*]+)\*\*/g);
    const parsedLine = parts.map((part, pIdx) => {
      if (pIdx % 2 === 1) {
        return (
          <span key={pIdx} style={{ color: "var(--accent)", fontWeight: 600 }}>
            {part}
          </span>
        );
      }
      return part;
    });
    
    if (isListItem) {
      elements.push(
        <li key={idx} style={{ marginBottom: "4px", fontSize: "12px", listStyleType: "disc", marginLeft: "14px" }} className="text-white">
          {parsedLine}
        </li>
      );
    } else {
      elements.push(
        <p key={idx} style={{ marginBottom: "8px", lineHeight: 1.6 }} className="text-white">
          {parsedLine}
        </p>
      );
    }
  });
  
  return <div className="space-y-1">{elements}</div>;
};

// Contextual intelligent responses
const CXO_RESPONSES = [
  {
    keywords: ['profit', 'drop', 'decline', 'fell', 'down'],
    response: `Net profit of **₹1.2 Cr** (19.7% margin) is tracking **+3.1%** above last month despite a temporary revenue dip from Plant B's reduced output. The margin is holding because energy costs decreased 8% with the tariff rescheduling implemented last week. Primary risk to profit: if Furnace-2 fails unplanned, we absorb **₹18.6L** in emergency costs which would cut this month's net profit by approximately 67%.`
  },
  {
    keywords: ['loss', 'losses', 'waste', 'breakdown'],
    response: `MTD losses of **₹8.2L** break down as:
- **Downtime (42%, ₹3.4L)** primarily from Plant B Furnace-2 micro-stoppages.
- **Defects (30%, ₹2.5L)** from temperature variance in the Rolling Mill.
- **Energy Waste (28%, ₹2.3L)** from peak-hour tariff overruns.
The highest ROI intervention is the Furnace-2 bearing replacement — addressing that single machine eliminates an estimated 61% of the downtime category.`
  },
  {
    keywords: ['forecast', 'next month', 'predict', 'june'],
    response: `June revenue forecast: **₹7.8 Cr** (mid-case) with confidence interval **₹6.9-8.7 Cr**. This assumes Furnace-2 maintenance is completed before June 5. If the bearing fails unplanned, the pessimistic case of **₹6.2 Cr** becomes likely. The AI model is weighting Plant C's strong performance (91% OEE) to offset Plant B's drag on enterprise output.`
  },
  {
    keywords: ['plant b', 'pune', 'underperform', 'worst'],
    response: `Plant B (Pune) is the enterprise's primary underperformer: OEE **67%** vs target **82%**, contributing 38% of total energy spend at 12% lower efficiency than Plant A. The root cause is aging furnace infrastructure — BF-2 is the bottleneck asset with vibration anomaly at **4.2mm/s**. Once the bearing is replaced, Plant B's OEE is modeled to recover to 76-79% within 2 weeks, worth approximately **₹4.2L/month** in recovered output.`
  },
  {
    keywords: ['energy', 'power', 'electricity', 'tariff'],
    response: `Energy billing is at **₹45.2L** MTD (₹3.82/kWh average). The Situation Room flagged peak-hour billing as the top risk — 8 of the last 30 days breached the tariff threshold. Opportunity: rescheduling heavy arc furnace melting from 10AM-6PM to 10PM-6AM saves an estimated **₹1.8L/month** with no production impact. This action is already in the Actions Center as a MEDIUM priority recommendation.`
  },
  {
    keywords: ['risk', 'biggest risk', 'concern', 'worry'],
    response: `Highest operational risk: **Furnace-2 bearing failure** at Plant B. At current vibration trajectory, **68%** probability of seizure within 10 days. Financial exposure: **₹18.6L** in unplanned downtime + emergency repair costs. This is 155% of current month net profit. Second risk: DR Cloud Replica not synced in 54 hours (flagged by IT/OT team) — compliance exposure if audited. Recommend reviewing Actions Center for both items.`
  }
];

const FLOOR_RESPONSES = [
  {
    keywords: ['target', 'hit', 'make it', 'shift'],
    response: `Current pace of **29.1 T/hr** against required **47.8 T/hr** makes the 620T shift target unlikely without intervention. Projected completion at current pace: **~542T** (87.4% of target). Gap: approximately **78T**. Recovery options:
- Line 1 overtime adds **~17T** in remaining 3.5 hrs.
- Carry WO-3278 to next shift saves production time on current lines.
The Line 3 jam is cleared — pace should improve in the next 30 minutes.`
  },
  {
    keywords: ['bottleneck', 'slowdown', 'jam', 'line 3'],
    response: `Line 3 experienced a slag jam that ran from approximately Hour 3 to Hour 4.5 of the shift (visible on the Gantt timeline). The jam is now cleared per SCADA telemetry. However, Furnace-2 is still running at degraded output (**18 T/hr** vs **32 T/hr** baseline) due to the bearing vibration issue. Furnace-2 is the current production bottleneck, not Line 3.`
  },
  {
    keywords: ['team', 'reallocate', 'assign', 'prioritize', 'work orders'],
    response: `Recommended team reallocation for this shift:
- Move Team C from Billets WO-3278 (lower urgency, can defer) to support Line 1 throughput — this adds approximately **5 T/hr**.
- Authorize overtime for Line 1 operator crew for the remaining 3.5 hours.
- Pre-position Maintenance Crew Alpha near Furnace-2 — if vibration reaches 4.5mm/s, immediate intervention is needed. Do not assign new work to Furnace-2 crew until maintenance is confirmed.`
  },
  {
    keywords: ['shipment', 'iron ore', 'delay', 'material'],
    response: `Iron Ore inbound shipment (**240T**, carrier: CONCOR) is delayed by 2.5 hours — new ETA **2:30 PM**. Current Iron Ore inventory: **3,150T** against 3,000T minimum. You have approximately 6 hours of runway at current consumption rate. The delay is within safe margins for this shift but risks the evening shift if a second delay occurs. Recommend triggering the expedite request to CONCOR dispatch now.`
  }
];

const ITOT_RESPONSES = [
  {
    keywords: ['historian', 'p1', 'sync', 'database'],
    response: `Historian DB P1 (raised 2 hours ago): disk utilization at **78%** triggered a sync queue timeout. Effect: **8-second pipeline lag** on Plant B SCADA → Historian path, 6% sensor data gap this hour. The 6:00 AM backup job also failed as a cascade. Data is NOT lost — buffering in SCADA queue. Fix: archive partitions older than 90 days (~140GB estimated freed). ETA to resolve: 2-3 hours with DevOps Team. AI models on Plant B data should be treated as stale until resolved.`
  },
  {
    keywords: ['backup', 'dr', 'disaster', 'recovery'],
    response: `Backup status as of now: ERP Database and SCADA Configurations are current and meeting RPO targets. Historian Data Log is in WARNING (backup failed at 6:00 AM due to P1). DR Cloud Replica has not synced in **54 hours** — RPO target is 12 hours — this is an active compliance breach. If audited today, this would be a finding. Recommend manual sync trigger immediately and creating a P2 incident for the DR gap. The AD Directory State snapshot is current as of yesterday 11:30 PM.`
  },
  {
    keywords: ['plc', 'latency', 'network', 'bandwidth'],
    response: `PLC Network is showing **120ms ping** (baseline 14ms for SCADA Core) — an 8x increase that correlates with the OT Bus Latency spike visible in the 48-hour chart (30h-36h breach). The PLC Subnets segment is at 1.4 Mbps bandwidth — significantly lower than Corporate IT at 420 Mbps. Possible causes:
- Broadcast storm on the OT backbone.
- Unauthorized polling from the unknown IP detected in Zone 3.
Recommend isolating PLC Subnet and capturing traffic sample before the IDS alert is cleared.`
  }
];

function matchResponse(input: string, context: string): string {
  const lower = input.toLowerCase();
  const rules = context === 'cxo' ? CXO_RESPONSES : 
                context === 'floor' ? FLOOR_RESPONSES : ITOT_RESPONSES;
  
  for (const rule of rules) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return rule.response;
    }
  }
  
  return `I'm analyzing the latest ${context === 'cxo' ? 'enterprise' : context === 'floor' ? 'shift' : 'IT/OT'} data. Based on current telemetry, no specific anomaly matches your query. Please try asking about specific metrics: revenue, losses, equipment, shipments, network status, or active incidents.`;
}

export default function AICopilot() {
  const {
    selectedPlantId,
    selectedRole,
    countdown,
    isConnected,
    isCopilotOpen,
    setCopilotOpen,
    copilotQuery,
    copilotTab: storeCopilotTab,
    clearCopilotAction,
  } = useDashboardStore();
  const queryClient = useQueryClient();

  const [copilotTab, setCopilotTab] = useState<"overview" | "insights" | "actions" | "chat" | "reports">("overview");
  const [sessionId, setSessionId] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionStates, setActionStates] = useState<Record<string, "pending" | "approved" | "assigned">>({});
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilingType, setCompilingType] = useState<"daily" | "weekly" | "monthly">("daily");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sid = localStorage.getItem("forge_chat_session_id");
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("forge_chat_session_id", sid);
    }
    setSessionId(sid);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/chat/sessions/${sessionId}/history`);
        if (res.ok) {
          const history = await res.json();
          if (history.length > 0) {
            setMessages(history);
          } else {
            setMessages([{ id: "welcome", role: "assistant", content: getWelcomeMessage(selectedRole) }]);
          }
        }
      } catch (err) {
        console.warn("Error fetching history, loading welcome message:", err);
        setMessages([{ id: "welcome", role: "assistant", content: getWelcomeMessage(selectedRole) }]);
      }
    };
    fetchHistory();
  }, [sessionId, selectedRole]);

  useEffect(() => {
    if (copilotTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isGenerating, copilotTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCopilotOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setCopilotOpen]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const getStaticAlerts = (): AlertData[] => {
    return [
      {
        id: "alert-f2",
        severity: "critical",
        title: "Furnace-2 bearing degradation",
        body: "Furnace-2 bearing temperature has increased by 22% over 48 hours. Current: 92°C vs baseline 75°C. Bearing thermal wear projected in 2 days at 68%. Impact: ₹18.6 Lakhs. Recommended: inspect bearing and approve automatic preventative replacement by May 23, 2026.",
        actionText: "Investigate",
        query: "Furnace-2 bearing temperature has increased by 22% over 48 hours. Current: 92°C vs baseline 75°C. Bearing thermal wear projected in 2 days at 68%. Impact: ₹18.6 Lakhs. Recommended: inspect bearing and approve automatic preventative replacement by May 23, 2026."
      },
      {
        id: "alert-ship",
        severity: "high",
        title: "Iron ore shipment delayed",
        body: "ETA +2h | Production risk 7%",
        actionText: "View Impact",
        query: "Analyze delayed iron ore shipment: ETA +2h, production risk 7%. What is the impact on raw stockpile levels?"
      },
      {
        id: "alert-energy",
        severity: "medium",
        title: "Energy usage above baseline",
        body: "Pune energy intensity 520 kWh/ton vs 480 kWh/ton. 8.3% excess costs ₹1.8 Lakhs/day. Driver: thermal processes running during peak grid tariffs. Opportunity: Shift peak thermal furnace cycles to off-peak slots saves ₹54.0 Lakhs/month.",
        actionText: "Optimize",
        query: "Pune energy intensity 520 kWh/ton vs 480 kWh/ton. 8.3% excess costs ₹1.8 Lakhs/day. Driver: thermal processes running during peak grid tariffs. Opportunity: Shift peak thermal furnace cycles to off-peak slots saves ₹54.0 Lakhs/month."
      }
    ];
  };

  const getSummaryBullets = () => {
    return [
      "Revenue +8.2% MTD, target alignment locked.",
      "Profit margin stable at 14.2% (supply-hedged).",
      "Furnace-2 bearing temperature has increased by 22% over 48 hours. Current: 92°C vs baseline 75°C. Bearing thermal wear projected in 2 days at 68%. Impact: ₹18.6 Lakhs. Recommended: inspect bearing and approve automatic preventative replacement by May 23, 2026.",
      "Current shift 56.2% complete with 387T vs 620T. Pace 29.1 T/hr is 39.1% below required 47.8 T/hr. Primary cause: slag chute restriction on Line 3. Shortfall: 233T. Options: Clear Line 3 slag chute jam or Reassign Team A to HRC Coils.",
      "Pune energy intensity 520 kWh/ton vs 480 kWh/ton. 8.3% excess costs ₹1.8 Lakhs/day. Driver: thermal processes running during peak grid tariffs. Opportunity: Shift peak thermal furnace cycles to off-peak slots saves ₹54.0 Lakhs/month.",
      "Identified total savings opportunity of ₹18.6 Lakhs."
    ];
  };

  const getActions = (): ActionData[] => {
    return [
      {
        id: "act-f2",
        priority: "CRITICAL",
        action: "Replace Furnace-2 bearing housing",
        impact: "Saves ₹4.2L/month",
        owner: "Maintenance Team"
      },
      {
        id: "act-energy",
        priority: "HIGH PRIORITY",
        action: "Shift peak thermal furnace cycles to off-peak",
        impact: "Saves ₹1.8L/day",
        owner: "Operations Lead"
      },
      {
        id: "act-proc",
        priority: "MEDIUM PRIORITY",
        action: "Pre-order specialized Blast Furnace lining bricks",
        impact: "Avoids ₹65L breakdown",
        owner: "Procurement"
      }
    ];
  };

  const getQuickQuestions = () => {
    if (selectedRole === "technical") {
      return [
        "What caused the Historian P1 incident?",
        "Is Plant B's data reliable for AI?",
        "Show backup compliance status",
        "Investigate PLC latency spike",
        "Show open P1 & P2 incidents"
      ];
    }
    if (selectedRole === "floor") {
      return [
        "Why is production lagging?",
        "Furnace-2 speed constraint",
        "Iron ore shipment status",
        "Line 3 jam details",
        "Reassign shift team"
      ];
    }
    return [
      "Why did profit drop?",
      "Show biggest losses",
      "Predict next failure",
      "Forecast next month",
      "Energy optimization",
      "Compare plants"
    ];
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    setInput("");
    
    // Switch to Chat tab to display conversation
    setCopilotTab("chat");

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 11),
      role: "user",
      content: text
    };
    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);

    // Look for client-side keyword matches first to provide instant, high-quality answers
    const matchedReply = matchResponse(text, selectedRole);
    const genericResponsePrefix = "I'm analyzing the latest";
    const hasMatch = !matchedReply.startsWith(genericResponsePrefix);

    if (hasMatch) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 11),
          role: "assistant",
          content: matchedReply
        }]);
        setIsGenerating(false);
      }, 800);
      return;
    }

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          role_context: selectedRole,
          plant_id: selectedPlantId,
          content: text
        })
      });

      if (res.ok) {
        // Create an assistant message placeholder that we will stream into
        const assistantMsgId = Math.random().toString(36).substring(2, 11);
        const assistantMsg: ChatMessage = {
          id: assistantMsgId,
          role: "assistant",
          content: ""
        };
        setMessages(prev => [...prev, assistantMsg]);

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const decoder = new TextDecoder();
        let done = false;
        let accumulatedText = "";

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            accumulatedText += chunk;
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMsgId
                  ? { ...msg, content: accumulatedText }
                  : msg
              )
            );
          }
        }
      } else {
        throw new Error();
      }
    } catch {
      // Mock AI response fallback
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 11),
          role: "assistant",
          content: matchedReply
        }]);
      }, 800);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (copilotQuery) {
      setCopilotTab(storeCopilotTab || "chat");
      handleSendMessage(copilotQuery);
      clearCopilotAction();
    }
  }, [copilotQuery, storeCopilotTab, clearCopilotAction]);

  const handleActionClick = (actionId: string, type: "approved" | "assigned", name: string) => {
    playBeep("success");
    setActionStates(prev => ({ ...prev, [actionId]: type }));
    showSuccess(`Recommended action "${name}" has been ${type === "approved" ? "approved & scheduled" : "assigned to the field lead"}.`);
  };

  const handleTriggerReport = () => {
    setIsCompiling(true);
    playBeep("info");
    setTimeout(() => {
      setIsCompiling(false);
      playBeep("success");
      showSuccess(`AI ${compilingType.toUpperCase()} report successfully compiled & registered.`);
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isCopilotOpen ? (
        <>
          {/* Backdrop Blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCopilotOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[3px] pointer-events-auto"
          />

          {/* Sliding Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 h-full z-40 bg-[var(--bg-surface)] border-l border-[var(--border)] shadow-2xl flex flex-col w-full sm:w-[420px]"
          >
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)] flex flex-col gap-1.5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-xs font-semibold text-white tracking-wider uppercase font-mono">
                    AI Command Center
                  </span>
                </div>
                <button
                  onClick={() => setCopilotOpen(false)}
                  className="text-[var(--text-muted)] hover:text-white p-1 rounded transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Plant Meta Details Context */}
              <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-[var(--text-secondary)] uppercase pt-1 border-t border-[var(--border)] mt-1.5">
                <div>
                  <span>{getPlantName(selectedPlantId)}</span>
                  <span className="text-[var(--border-strong)] mx-1.5">·</span>
                  <span>Role: {selectedRole}</span>
                </div>
                <div className="text-right">
                  <span className="text-[var(--accent)] font-semibold">Confidence: 91%</span>
                </div>
              </div>
            </div>

            {/* Tab selector bar */}
            <div className="flex bg-[var(--bg-base)] border-b border-[var(--border)] text-[10px] font-mono font-bold uppercase tracking-wider overflow-x-auto flex-shrink-0 scrollbar-none">
              {(["overview", "insights", "actions", "chat", "reports"] as const).map((t) => {
                const isActive = copilotTab === t;
                return (
                  <button
                    key={t}
                    onClick={() => {
                      playBeep("info");
                      setCopilotTab(t);
                    }}
                    className={cn(
                      "flex-1 py-3 text-center px-2 border-b-2 transition-all cursor-pointer whitespace-nowrap",
                      isActive
                        ? "border-[var(--accent)] text-white bg-[var(--bg-surface)]"
                        : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            {/* Tab content area */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 pb-28 relative"
            >
              {/* Toast banner inside drawer */}
              <AnimatePresence>
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-[var(--status-green)] text-xs rounded flex items-start gap-2.5 z-50 absolute top-2 left-4 right-4"
                  >
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {copilotTab === "overview" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* AI Summary Card */}
                  <div className="bg-[var(--bg-surface)] p-4 border border-[var(--border-accent)] rounded-md space-y-2 relative overflow-hidden" style={{ borderColor: "rgba(245,158,11,0.2)", boxShadow: "0 0 10px rgba(245,158,11,0.03)" }}>
                    <div className="absolute top-0 left-0 w-[3px] h-full bg-[var(--accent)]" />
                    <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider font-mono block">
                      AI Summary Profile
                    </span>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                      {selectedRole === "technical" ? (
                        "IT/OT networks are online with uptime at 99.82%, but Historian DB sync is experiencing P1 timeouts. Pune Furnace-2 telemetries show anomalous 4.2mm/s vibration and high core thermal profiles requiring maintenance. Cloud backup replication has breached RPO targets by 54 hours, exposing compliance risks."
                      ) : selectedRole === "floor" ? (
                        "Current shift operations stand at 84% completion. The Line 3 slag jam was successfully resolved by operators, though Pune Furnace-2 speed limitations still constrain overall output pace. Incoming iron ore feedstock carrier is delayed, with approximately 6 hours of inventory safety runway remaining."
                      ) : (
                        "MTD revenue is tracking at ₹12.5 Cr against the ₹7.2 Cr target, yielding ₹2.4 Cr profit (19.2% margin). Plant B Furnace-2 bearing fatigue remains the primary risk to forecast stability, holding a potential ₹18.6L downtime exposure. Tariff optimal energy rescheduling represents a ₹54L/month savings opportunity."
                      )}
                    </p>
                  </div>

                  {/* 3 Metric Snapshot Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[var(--bg-elevated)] p-2.5 border border-[var(--border)] rounded flex flex-col justify-between">
                      <span className="text-[8px] font-mono font-bold uppercase text-[var(--text-muted)]">Risk Index</span>
                      <span className="text-sm font-mono text-[var(--status-red)] mt-1 font-bold">
                        {selectedRole === "technical" ? "51%" : "68%"}
                      </span>
                    </div>
                    <div className="bg-[var(--bg-elevated)] p-2.5 border border-[var(--border)] rounded flex flex-col justify-between">
                      <span className="text-[8px] font-mono font-bold uppercase text-[var(--text-muted)]">Savings Opp.</span>
                      <span className="text-sm font-mono text-[var(--status-green)] mt-1 font-bold">
                        {selectedRole === "technical" ? "₹7.1L" : "₹18.6L"}
                      </span>
                    </div>
                    <div className="bg-[var(--bg-elevated)] p-2.5 border border-[var(--border)] rounded flex flex-col justify-between">
                      <span className="text-[8px] font-mono font-bold uppercase text-[var(--text-muted)]">OEE Health</span>
                      <span className="text-sm font-mono text-[var(--accent)] mt-1 font-bold">
                        {selectedRole === "technical" ? "68%" : "84%"}
                      </span>
                    </div>
                  </div>

                  {/* Alerts */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono block">
                      Active Operational Alerts
                    </span>
                    {getStaticAlerts().slice(0, 2).map((alert) => (
                      <div key={alert.id} className="p-3 rounded border border-[var(--border)] border-l-[3px] border-l-[var(--status-amber)] bg-amber-500/2 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-mono font-bold text-[var(--status-amber)] uppercase">⚠️ ALERT</span>
                        </div>
                        <h4 className="text-xs font-bold text-white leading-tight">{alert.title}</h4>
                        <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">{alert.body.substring(0, 100)}...</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {copilotTab === "insights" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono block">
                    Telemetry Recommendations
                  </span>

                  {[
                    {
                      id: "rec-f2",
                      severity: "CRITICAL",
                      color: "text-red-400 bg-red-500/10 border-red-500/20",
                      title: "Replace Furnace-2 Bearing Housing",
                      desc: "Vibration is anomalous at 4.2mm/s (limit: 3.0). Replacement prevents ₹18.6L catastrophic spindle failure.",
                      actionText: "Investigate bearing anomaly",
                      query: "Provide diagnostics on Pune Furnace-2 spindle bearing friction."
                    },
                    {
                      id: "rec-energy",
                      severity: "HIGH PRIORITY",
                      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                      title: "Reschedule Peak Electric Arc Melting",
                      desc: "Move billet heating to off-peak slots (10:00 PM - 6:00 AM) to save ₹1.8L/day in peak utility surcharges.",
                      actionText: "Optimize energy tariffs",
                      query: "Optimize energy consumption for electric arc furnace."
                    },
                    {
                      id: "rec-dr",
                      severity: "HIGH PRIORITY",
                      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                      title: "Resolve DR Cloud Replica Sync Lag",
                      desc: "Database replica has been offline for 54 hours. Investigate OT network boundary routing failures.",
                      actionText: "Verify cloud backups",
                      query: "Analyze DR Cloud Replica backup replication failure."
                    }
                  ].map((rec) => (
                    <div key={rec.id} className="bg-[var(--bg-surface)] p-3 border border-[var(--border)] rounded-md space-y-2 hover:border-[var(--border-strong)] transition-all">
                      <div className="flex justify-between items-center">
                        <span className={cn("text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border", rec.color)}>
                          {rec.severity}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-tight">{rec.title}</h4>
                      <p className="text-[10.5px] text-[var(--text-secondary)] leading-relaxed">{rec.desc}</p>
                      <button
                        onClick={() => handleSendMessage(rec.query)}
                        className="w-full mt-1 py-1 text-center text-[10px] font-semibold bg-[var(--bg-hover)] hover:bg-[var(--border-strong)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)] rounded transition-all cursor-pointer font-mono"
                      >
                        [{rec.actionText}]
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}

              {copilotTab === "actions" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono block">
                    Pending Actions Center Registry
                  </span>

                  {getActions().map((act) => {
                    const isCritical = act.priority === "CRITICAL";
                    const isHigh = act.priority.includes("HIGH");
                    const badgeClass = isCritical 
                      ? "text-red-400 bg-red-500/10 border-red-500/20" 
                      : isHigh 
                      ? "text-amber-400 bg-amber-500/10 border-amber-500/20" 
                      : "text-blue-400 bg-blue-500/10 border-blue-500/20";

                    return (
                      <div key={act.id} className="bg-[var(--bg-surface)] p-3 border border-[var(--border)] rounded-md flex items-center justify-between gap-2.5">
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-xs font-bold text-white leading-tight truncate">{act.action}</h4>
                          <span className="text-[9px] font-mono text-[var(--text-muted)]">Owner: {act.owner}</span>
                        </div>
                        <span className={cn("text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border flex-shrink-0", badgeClass)}>
                          {act.priority.split(" ")[0]}
                        </span>
                      </div>
                    );
                  })}

                  <div className="pt-2">
                    <button
                      onClick={() => window.location.href = "/actions"}
                      className="w-full py-2 bg-[var(--accent)] hover:brightness-110 text-black font-semibold text-[11px] uppercase tracking-wider rounded transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 font-mono"
                    >
                      <span>Go to Actions Center</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {copilotTab === "chat" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Message History */}
                  <div className="space-y-3.5">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn("flex gap-2.5", msg.role === "user" ? "flex-row-reverse pl-8" : "pr-8")}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: "var(--bg-elevated)",
                            border: `1px solid ${msg.role === "user" ? "var(--border-strong)" : "var(--border-accent)"}`,
                            color: msg.role === "user" ? "var(--text-secondary)" : "var(--accent)",
                          }}
                        >
                          {msg.role === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        </div>
                        <div
                          className="flex-1 rounded p-3 border border-[var(--border)] leading-relaxed text-xs text-[var(--text-secondary)]"
                          style={{
                            background: "var(--bg-elevated)",
                            borderLeftWidth: msg.role === "assistant" ? 3 : 1,
                            borderLeftColor: msg.role === "assistant" ? "var(--accent)" : "var(--border)",
                          }}
                        >
                          <div className="whitespace-pre-line text-xs font-sans text-white">{renderMarkdown(msg.content)}</div>
                        </div>
                      </div>
                    ))}

                    {isGenerating && (
                      <div className="flex gap-2.5 pr-8">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--bg-elevated)] border border-[var(--border-accent)] text-[var(--accent)] flex-shrink-0">
                          <Bot className="w-3 h-3" />
                        </div>
                        <div className="flex-1 rounded p-3 border border-[var(--border)] border-l-[3px] border-l-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--text-muted)] text-[11px] flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin text-[var(--accent)]" />
                          <span>Generating operational analysis...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Suggested chips */}
                  <div className="pt-2.5 border-t border-[var(--border)] space-y-2">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                      Suggested Queries
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {getQuickQuestions().map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(q)}
                          className="px-2.5 py-1 text-[11px] rounded-full border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white transition-all cursor-pointer font-mono"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {copilotTab === "reports" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4 text-xs"
                >
                  {/* Compile Report selector */}
                  <div className="bg-[var(--bg-surface)] p-4 border border-[var(--border)] rounded-md space-y-3">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono block">
                      Trigger Compiler Engine
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(["daily", "weekly", "monthly"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setCompilingType(t)}
                          className={cn(
                            "py-1.5 text-center rounded border text-[10px] font-bold uppercase font-mono cursor-pointer transition-all",
                            compilingType === t
                              ? "bg-amber-500/10 border-[var(--accent)] text-[var(--accent)]"
                              : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:text-white"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleTriggerReport}
                      disabled={isCompiling}
                      className="w-full py-2 bg-[var(--accent)] hover:brightness-110 text-black font-bold uppercase tracking-wider rounded text-[10px] flex items-center justify-center gap-1.5 cursor-pointer border-none"
                    >
                      {isCompiling ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Compiling logs...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3 h-3" />
                          <span>Generate {compilingType} Report</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Registered Report List */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono block">
                      Compiled Report Archives
                    </span>
                    <div className="space-y-1.5">
                      {[
                        { id: "daily", name: "Daily Operations Summary", range: "Today · 45 KB" },
                        { id: "weekly", name: "Weekly Performance Review", range: "Past 7 Days · 120 KB" },
                        { id: "monthly", name: "Monthly Financial Audit", range: "Past 30 Days · 340 KB" }
                      ].map((rep) => (
                        <div
                          key={rep.id}
                          className="bg-[var(--bg-surface)] p-3 border border-[var(--border)] rounded hover:border-[var(--border-strong)] transition-all flex items-center justify-between cursor-pointer"
                          onClick={() => {
                            playBeep("info");
                            showSuccess(`Redirecting to Reports Hub for ${rep.name}.`);
                            window.location.href = "/reports";
                          }}
                        >
                          <div>
                            <h4 className="font-semibold text-white truncate max-w-[200px]">{rep.name}</h4>
                            <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1">{rep.range}</p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] hover:text-[var(--accent)] transition-all" />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sticky Chat Input (Always Visible at bottom) */}
            <div
              className="absolute bottom-0 left-0 w-full p-4 bg-[var(--bg-surface)] border-t border-[var(--border)] z-30"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(input);
                }}
                className="flex items-center gap-2"
              >
                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isGenerating}
                    placeholder="Ask about operations, revenue, downtime, inventory..."
                    className="w-full outline-none transition-all duration-150 pr-10 text-xs bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--border-strong)] rounded px-3 py-2 text-white"
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      showSuccess("Voice interface placeholder active");
                      playBeep("warning");
                    }}
                    className="absolute right-2.5 text-[var(--text-muted)] hover:text-white p-1 rounded transition-colors cursor-pointer"
                    title="Voice command placeholder"
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isGenerating}
                  className="flex items-center justify-center rounded border border-[var(--border)] w-9 h-9 transition-all"
                  style={{
                    background: input.trim() && !isGenerating ? "var(--accent)" : "var(--bg-elevated)",
                    color: input.trim() && !isGenerating ? "#000" : "var(--text-muted)",
                    cursor: input.trim() && !isGenerating ? "pointer" : "default",
                    flexShrink: 0,
                  }}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      ) : (
        /* Floating Toggle Tab / Button when closed */
        <button
          id="copilot-trigger-btn"
          onClick={() => setCopilotOpen(true)}
          className="fixed right-6 bottom-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--border-strong)] hover:border-[var(--accent)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-all duration-200 shadow-xl cursor-pointer group"
          title="Open AI Copilot"
        >
          <Bot className="w-4 h-4 text-[var(--accent)] animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
            Copilot
          </span>
        </button>
      )}
    </AnimatePresence>
  );
}
