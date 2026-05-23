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
      return "Forge AI diagnostics online. Pune Furnace-2 is reporting anomalous vibrations (3.8 mm/s). How can I assist you with analyzing root causes or forecasting failures?";
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
        let reply = "Furnace-2 bearing temperature has increased by 22% over 48 hours. Current: 92°C vs baseline 75°C. Bearing thermal wear projected in 2 days at 68%. Impact: ₹18.6 Lakhs. Recommended: inspect bearing and approve automatic preventative replacement by May 23, 2026.";
        if (text.toLowerCase().includes("energy") || text.toLowerCase().includes("utility") || text.toLowerCase().includes("tariff")) {
          reply = "Pune energy intensity 520 kWh/ton vs 480 kWh/ton. 8.3% excess costs ₹1.8 Lakhs/day. Driver: thermal processes running during peak grid tariffs. Opportunity: Shift peak thermal furnace cycles to off-peak slots saves ₹54.0 Lakhs/month.";
        } else if (
          text.toLowerCase().includes("profit") ||
          text.toLowerCase().includes("loss") ||
          text.toLowerCase().includes("why did profit drop") ||
          text.toLowerCase().includes("shortfall") ||
          text.toLowerCase().includes("production") ||
          text.toLowerCase().includes("shift") ||
          text.toLowerCase().includes("pace")
        ) {
          reply = "Current shift 56.2% complete with 387T vs 620T. Pace 29.1 T/hr is 39.1% below required 47.8 T/hr. Primary cause: slag chute restriction on Line 3. Shortfall: 233T. Options: Clear Line 3 slag chute jam or Reassign Team A to HRC Coils.";
        }
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 11),
          role: "assistant",
          content: reply
        }]);
      }, 1000);
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

              {/* TABS BODY */}
              {copilotTab === "overview" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Overview Stats Dashboard */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[var(--bg-elevated)] p-3.5 border border-[var(--border)] rounded flex flex-col justify-between">
                      <span className="text-[9px] font-mono font-bold uppercase text-[var(--text-secondary)]">Operational Risk</span>
                      <span className="text-xl font-light font-mono text-[var(--status-red)] mt-1.5">68%</span>
                    </div>
                    <div className="bg-[var(--bg-elevated)] p-3.5 border border-[var(--border)] rounded flex flex-col justify-between" style={{ borderColor: "var(--border-accent)", boxShadow: "0 0 8px var(--accent-glow)" }}>
                      <span className="text-[9px] font-mono font-bold uppercase text-[var(--accent)]">Savings Opp.</span>
                      <span className="text-xl font-light font-mono text-white mt-1.5">₹18.6L</span>
                    </div>
                  </div>

                  {/* Alerts */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono block">
                      Active Alerts (Top 3)
                    </span>
                    {getStaticAlerts().map((alert) => {
                      const isCritical = alert.severity === "critical";
                      const isHigh = alert.severity === "high";
                      const colorClass = isCritical 
                        ? "border-l-[3px] border-l-[var(--status-red)] bg-red-500/4" 
                        : isHigh 
                        ? "border-l-[3px] border-l-[var(--status-amber)] bg-amber-500/4" 
                        : "border-l-[3px] border-l-[var(--status-blue)] bg-blue-500/4";
                      
                      const label = isCritical ? "🔴 Critical" : isHigh ? "🟠 High" : "🟡 Medium";

                      return (
                        <div key={alert.id} className={cn("p-3 rounded border border-[var(--border)] flex flex-col justify-between gap-1.5", colorClass)}>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-mono font-bold uppercase">{label}</span>
                            <span className="text-[9px] font-mono text-[var(--text-muted)]">Locked</span>
                          </div>
                          <h4 className="text-xs font-bold text-white leading-tight">{alert.title}</h4>
                          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mt-0.5">{alert.body}</p>
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleSendMessage(alert.query)}
                              className="px-2 py-0.5 text-[9px] font-mono border border-[var(--border-strong)] hover:border-[var(--accent)] hover:text-[var(--accent)] rounded bg-[var(--bg-surface)] cursor-pointer"
                            >
                              [{alert.actionText}]
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Bullets */}
                  <div className="bg-[var(--bg-surface)] p-4 border border-[var(--border)] rounded-md space-y-2.5">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono block border-b border-[var(--border)] pb-1.5">
                      Today's Executive Summary
                    </span>
                    <ul className="space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                      {getSummaryBullets().map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[var(--accent)] font-mono mt-0.5">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}

              {copilotTab === "insights" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4 text-xs"
                >
                  {/* Root Cause Analysis */}
                  <div className="bg-[var(--bg-surface)] p-4 border border-[var(--border)] rounded-md space-y-2.5">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono block border-b border-[var(--border)] pb-1.5">
                      Root Cause Analysis (RCA)
                    </span>
                    <div className="space-y-2">
                      <div>
                        <p className="font-semibold text-white">Top Downtime Driver:</p>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Furnace-2 bearing friction (72% downtime correlation).</p>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Top Isolated Anomalies:</p>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Thermal spikes on Electric Arc Furnace line (+8.4% above limit).</p>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Failing Sensors Prognostics:</p>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">T-42 vibration sensor reporting high noise signal (94% failure risk).</p>
                      </div>
                    </div>
                  </div>

                  {/* Trend Analysis */}
                  <div className="bg-[var(--bg-surface)] p-4 border border-[var(--border)] rounded-md space-y-2.5">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono block border-b border-[var(--border)] pb-1.5">
                      OEE & Output Trends
                    </span>
                    <div className="space-y-1.5 leading-relaxed text-[var(--text-secondary)]">
                      <p className="flex justify-between">
                        <span>Rolling Mill Line OEE:</span>
                        <span className="text-[var(--status-red)] font-mono font-bold">▼ -5.3% (weekly)</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Slag Quality Yield:</span>
                        <span className="text-[var(--status-green)] font-mono font-bold">▲ +4.2% (weekly)</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Finishing Line Availability:</span>
                        <span className="text-white font-mono">90.2% (Target Alignment)</span>
                      </p>
                    </div>
                  </div>

                  {/* Forecasts */}
                  <div className="bg-[var(--bg-surface)] p-4 border border-[var(--border)] rounded-md space-y-2.5">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono block border-b border-[var(--border)] pb-1.5">
                      Failure & Financial Forecasts
                    </span>
                    <div className="space-y-2 text-[var(--text-secondary)]">
                      <p>
                        <strong className="text-white">Refractory wear limit warning:</strong> Blast Furnace lining requires replacement inside 42 days. Estimating repair outage impact at ₹65.0L.
                      </p>
                      <p>
                        <strong className="text-white">MTD Revenue Outlook:</strong> Projecting ₹448.2 Cr by calendar end. Deviation within nominal bounds (-1.7%).
                      </p>
                    </div>
                  </div>

                  {/* Plant Comparisons */}
                  <div className="bg-[var(--bg-surface)] p-4 border border-[var(--border)] rounded-md space-y-2.5">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono block border-b border-[var(--border)] pb-1.5">
                      Inter-Plant OEE Comparison
                    </span>
                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-white">Plant B (Pune):</span>
                        <span className="text-[var(--status-amber)] font-mono">81.5% (Underperforming)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white">Plant A (Mumbai):</span>
                        <span className="text-[var(--status-green)] font-mono">88.2% (Optimal Baseline)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white">Plant C (Surat):</span>
                        <span className="text-[var(--text-secondary)] font-mono">84.1% (Nominal Target)</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {copilotTab === "actions" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono block">
                    Prioritized AI Action Items
                  </span>

                  {getActions().map((act) => {
                    const actionKey = `drawer-${act.id}`;
                    const currentStatus = actionStates[actionKey] || "pending";
                    const isCritical = act.priority === "CRITICAL";
                    const isHigh = act.priority.includes("HIGH");
                    const badgeClass = isCritical 
                      ? "text-red-400 bg-red-500/10 border-red-500/20" 
                      : isHigh 
                      ? "text-amber-400 bg-amber-500/10 border-amber-500/20" 
                      : "text-blue-400 bg-blue-500/10 border-blue-500/20";

                    return (
                      <div key={act.id} className="bg-[var(--bg-surface)] p-3 border border-[var(--border)] rounded-md space-y-2.5 hover:border-[var(--border-strong)] transition-all">
                        <div className="flex justify-between items-center">
                          <span className={cn("text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border", badgeClass)}>
                            {act.priority}
                          </span>
                          <span className="text-[9px] font-mono text-[var(--text-secondary)] font-semibold text-[var(--status-green)]">
                            {act.impact}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white leading-tight">{act.action}</h4>
                        <p className="text-[10px] font-mono text-[var(--text-muted)]">Owner: {act.owner}</p>

                        <div className="flex gap-2 pt-1">
                          {currentStatus === "pending" ? (
                            <>
                              <button
                                onClick={() => handleActionClick(actionKey, "approved", act.action)}
                                className="flex-1 py-1 text-center text-xs font-semibold bg-[var(--accent)] hover:brightness-115 text-black rounded transition-all cursor-pointer border-none"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleActionClick(actionKey, "assigned", act.action)}
                                className="flex-1 py-1 text-center text-xs font-semibold bg-[var(--bg-hover)] hover:bg-[var(--border-strong)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)] rounded transition-all cursor-pointer"
                              >
                                Assign
                              </button>
                            </>
                          ) : (
                            <div className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[var(--status-green)] text-[10px] font-bold font-mono">
                              <Check className="w-3.5 h-3.5" />
                              <span>DECISION {currentStatus.toUpperCase()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                          <p className="whitespace-pre-line text-xs font-sans text-white">{msg.content}</p>
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
