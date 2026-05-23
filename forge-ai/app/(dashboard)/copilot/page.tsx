"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDashboardStore } from "../../store/useDashboardStore";
import {
  Send,
  User,
  Bot,
  Loader2,
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
  ShieldAlert,
  Sliders,
  DollarSign,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/app/utils/cn";
import { MOCK_DATA, formatCurrency } from "@/app/lib/mock-data/constants";

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
  description: string;
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
      return "Welcome to Forge AI Situation Room (Executive View). I have analyzed the 90-day financial and operations ledger. Pune Plant B exhibits availability deviations due to Furnace-2 fatigue. Ask me to project net margin savings, run carbon offset models, or compare plant utilization values.";
    case "technical":
      return "Forge Engineering & Telemetry Assistant online. Sensor vibration transients verified. Furnace-2 bearing is reporting high mechanical load, driving 68% failure probability. How can I assist you with diagnostic root causes, sensor failure forecasts, or repair workflows?";
    case "floor":
      return "Floor assistant active. Production schedule and logistics are online. Stockpile balances are loaded. Ask me to draft equipment work orders, check steel inventory, or review shift availability charts.";
    default:
      return "Forge AI Command Workspace active. Ask about factory operations, revenue, downtime, or inventory logs.";
  }
};

const getPlantName = (plantId: string) => {
  if (plantId === "all") return "All Plants";
  if (plantId.includes("pune") || plantId === "pune-uuid") return "Plant B – Pune";
  if (plantId.includes("mumbai") || plantId === "mumbai-uuid") return "Plant A – Mumbai";
  if (plantId.includes("surat") || plantId === "surat-uuid") return "Plant C – Surat";
  return "Plant B – Pune";
};

export default function CopilotWorkspace() {
  const { selectedPlantId, selectedRole } = useDashboardStore();
  const [sessionId, setSessionId] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionStates, setActionStates] = useState<Record<string, "pending" | "approved" | "assigned">>({});
  const [compilingType, setCompilingType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [isCompiling, setIsCompiling] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
        console.warn("Failed to fetch chat history:", err);
        setMessages([{ id: "welcome", role: "assistant", content: getWelcomeMessage(selectedRole) }]);
      }
    };
    fetchHistory();
  }, [sessionId, selectedRole]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    setInput("");

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
      // Mock fallback
      setTimeout(() => {
        let reply = "Furnace-2 bearing temperature has increased by 22% over 48 hours. Current: 92°C vs baseline 75°C. Bearing thermal wear projected in 2 days at 68%. Impact: ₹18.6 Lakhs. Recommended: inspect bearing and approve automatic preventative replacement by May 23, 2026.";
        if (text.toLowerCase().includes("energy") || text.toLowerCase().includes("optimize")) {
          reply = "Pune energy intensity 520 kWh/ton vs 480 kWh/ton. 8.3% excess costs ₹1.8 Lakhs/day. Driver: thermal processes running during peak grid tariffs. Opportunity: Shift peak thermal furnace cycles to off-peak slots saves ₹54.0 Lakhs/month.";
        } else if (
          text.toLowerCase().includes("profit") ||
          text.toLowerCase().includes("loss") ||
          text.toLowerCase().includes("why did profit drop") ||
          text.toLowerCase().includes("shortfall") ||
          text.toLowerCase().includes("production") ||
          text.toLowerCase().includes("shift")
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

  const handleAction = (actionId: string, type: "approved" | "assigned", name: string) => {
    playBeep("success");
    setActionStates(prev => ({ ...prev, [actionId]: type }));
    showSuccess(`Recommended action "${name}" has been ${type === "approved" ? "approved & scheduled" : "assigned to the field crew"}.`);
  };

  const handleCompile = () => {
    setIsCompiling(true);
    playBeep("info");
    setTimeout(() => {
      setIsCompiling(false);
      playBeep("success");
      showSuccess(`AI ${compilingType.toUpperCase()} report successfully compiled & registered.`);
    }, 2000);
  };

  const getActions = (): ActionData[] => {
    return [
      {
        id: "workspace-f2",
        priority: "CRITICAL",
        action: "Perform emergency mechanical bearing swap on Furnace-2",
        impact: `Saves ${formatCurrency(MOCK_DATA.plantB.furnace2.impact_unplanned_lakhs, "Lakhs")} in potential catastrophic downtime`,
        owner: "Maintenance Crew",
        description: "Vibration threshold exceeded 3.8 mm/s limit. Bearing temp critical at 92°C."
      },
      {
        id: "workspace-energy",
        priority: "HIGH PRIORITY",
        action: "Reschedule melting cycles to off-peak slots",
        impact: "Saves ₹1.8L/day in peak tariff rates",
        owner: "Operations Lead",
        description: "Peak usage is currently +12% above seasonal baselines between 2 PM and 6 PM."
      },
      {
        id: "workspace-brick",
        priority: "MEDIUM PRIORITY",
        action: "Trigger procurement order for Blast Furnace refractory lining bricks",
        impact: "Avoids ₹65.0L catastrophic repair delay",
        owner: "Procurement Team",
        description: "Lining refractory depth predicted to reach limit within 42 days."
      }
    ];
  };

  const getQuickPrompts = () => {
    return [
      "Why did profit drop?",
      "Show biggest losses",
      "Predict next failure",
      "Forecast next month",
      "Energy optimization",
      "Compare Pune vs Mumbai"
    ];
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--accent)] animate-pulse" /> AI Command Workspace
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-mono">
            Plant context: <span className="text-white">{getPlantName(selectedPlantId)}</span> · Target profile: <span className="text-white">{selectedRole.toUpperCase()}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-mono bg-[var(--bg-surface)] px-4 py-2 rounded border border-[var(--border)]">
          <span className="text-[var(--text-secondary)]">AI confidence:</span>
          <span className="text-[var(--accent)] font-bold">91%</span>
          <span className="text-[var(--border-strong)]">|</span>
          <span className="text-[var(--text-secondary)]">Telemetry:</span>
          <span className="text-[var(--status-green)] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-green)] live-dot" /> ACTIVE
          </span>
        </div>
      </div>

      {/* Success alert banner */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-[var(--status-green)] text-xs rounded flex items-center gap-2.5"
          >
            <Check className="w-4 h-4 flex-shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Dedicated Conversational Experience */}
        <div className="lg:col-span-6 flex flex-col rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] h-[640px] overflow-hidden relative">
          {/* Chat Header */}
          <div className="p-4 border-b border-[var(--border)] flex items-center gap-2 bg-[var(--bg-elevated)]/30 flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--text-secondary)]">
              Operational Discussion Feed
            </span>
          </div>

          {/* Messages area */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 pb-24"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse pl-10" : "pr-10")}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] flex-shrink-0">
                  {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-[var(--accent)]" />}
                </div>
                <div
                  className="flex-1 rounded-md p-3.5 border text-xs leading-relaxed"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: msg.role === "assistant" ? "var(--border-accent)" : "var(--border)",
                    borderLeft: msg.role === "assistant" ? "3px solid var(--accent)" : "1px solid var(--border)",
                  }}
                >
                  <p className="whitespace-pre-line text-white">{msg.content}</p>
                </div>
              </div>
            ))}

            {isGenerating && (
              <div className="flex gap-3 pr-10">
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--bg-elevated)] border border-[var(--border-accent)] text-[var(--accent)] flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-[var(--accent)]" />
                </div>
                <div className="flex-1 rounded-md p-3.5 border border-l-[3px] border-l-[var(--accent)] border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] text-[11px] flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
                  <span>Synthesizing multi-plant telemetry variables...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips Bar */}
          <div className="absolute bottom-[72px] left-0 w-full px-4 py-2 bg-[var(--bg-surface)]/90 backdrop-blur-sm border-t border-[var(--border)] flex gap-2 overflow-x-auto scrollbar-none z-20">
            {getQuickPrompts().map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="px-3 py-1.5 rounded-full border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white transition-all text-[11px] font-mono whitespace-nowrap cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat input footer */}
          <div className="absolute bottom-0 left-0 w-full p-3.5 border-t border-[var(--border)] bg-[var(--bg-elevated)]/60 z-30">
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
                  placeholder="Ask about operations, revenue projections, downtime causes, inventory..."
                  className="w-full text-xs bg-[var(--bg-base)] border border-[var(--border)] hover:border-[var(--border-strong)] rounded px-3.5 py-2.5 text-white outline-none focus:border-[var(--accent)] pr-10"
                />
                <button
                  type="button"
                  onClick={() => {
                    showSuccess("Voice interface placeholder online");
                    playBeep("warning");
                  }}
                  className="absolute right-3 text-[var(--text-muted)] hover:text-white p-1 rounded transition-colors cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isGenerating}
                className="flex items-center justify-center rounded border border-[var(--border)] w-10 h-10 transition-all cursor-pointer"
                style={{
                  background: input.trim() && !isGenerating ? "var(--accent)" : "var(--bg-surface)",
                  color: input.trim() && !isGenerating ? "#000" : "var(--text-muted)",
                }}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Deep Analysis Workspace (Insights, Actions, Forecasts, Reports) */}
        <div className="lg:col-span-6 space-y-6 overflow-y-auto h-[640px] pr-1">
          
          {/* Insights Widget */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-[var(--accent)]" /> AI Operations Insights
              </h3>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">RCA & Plant Comparisons</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-[var(--bg-elevated)]/60 p-3.5 border border-[var(--border)] rounded space-y-2">
                <h4 className="font-bold text-white font-mono uppercase tracking-wider text-[10px]">Root Cause Analysis</h4>
                <div className="space-y-2 text-[var(--text-secondary)] text-[11px] leading-relaxed">
                  <p>• <strong className="text-white">Downtime:</strong> Furnace-2 bearing wear matches 72% of plant downtime events.</p>
                  <p>• <strong className="text-white">Anomalies:</strong> Electric Arc Furnace line logged thermal peaks +8.4% above bounds.</p>
                  <p>• <strong className="text-white">Sensor wear:</strong> High friction signatures isolated on T-42 vibration sensor.</p>
                </div>
              </div>

              <div className="bg-[var(--bg-elevated)]/60 p-3.5 border border-[var(--border)] rounded space-y-2">
                <h4 className="font-bold text-white font-mono uppercase tracking-wider text-[10px]">OEE & Plant comparison</h4>
                <div className="space-y-2 text-[11px] text-[var(--text-secondary)]">
                  <div className="flex justify-between border-b border-[var(--border)]/40 pb-1">
                    <span>Plant B (Pune):</span>
                    <span className="text-[var(--status-amber)] font-mono">81.5% OEE (Underperforming)</span>
                  </div>
                  <div className="flex justify-between border-b border-[var(--border)]/40 pb-1">
                    <span>Plant A (Mumbai):</span>
                    <span className="text-[var(--status-green)] font-mono">88.2% OEE (Stable Baseline)</span>
                  </div>
                  <div className="flex justify-between pb-0.5">
                    <span>Plant C (Surat):</span>
                    <span className="text-[var(--text-secondary)] font-mono">84.1% OEE (Nominal Target)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Workspace Widget */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-[var(--accent)]" /> Prioritized Operational Actions
              </h3>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">Approval & Assignment workflows</span>
            </div>

            <div className="space-y-3">
              {getActions().map((act) => {
                const actionKey = `workspace-page-${act.id}`;
                const currentStatus = actionStates[actionKey] || "pending";
                const isCritical = act.priority === "CRITICAL";
                const isHigh = act.priority.includes("HIGH");
                const badgeClass = isCritical 
                  ? "text-red-400 bg-red-500/10 border-red-500/20" 
                  : isHigh 
                  ? "text-amber-400 bg-amber-500/10 border-amber-500/20" 
                  : "text-blue-400 bg-blue-500/10 border-blue-500/20";

                return (
                  <div key={act.id} className="bg-[var(--bg-elevated)] p-4 border border-[var(--border)] rounded hover:border-[var(--border-strong)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 md:max-w-[70%]">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border", badgeClass)}>
                          {act.priority}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--status-green)] font-semibold">
                          {act.impact}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white">{act.action}</h4>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{act.description}</p>
                      <p className="text-[9px] font-mono text-[var(--text-muted)] pt-0.5">Owner: {act.owner}</p>
                    </div>

                    <div className="flex gap-2 flex-shrink-0 md:flex-col md:w-28">
                      {currentStatus === "pending" ? (
                        <>
                          <button
                            onClick={() => handleAction(actionKey, "approved", act.action)}
                            className="flex-1 py-1.5 text-center text-xs font-bold bg-[var(--accent)] hover:brightness-110 text-black rounded transition-all cursor-pointer border-none"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(actionKey, "assigned", act.action)}
                            className="flex-1 py-1.5 text-center text-xs font-bold bg-[var(--bg-surface)] hover:bg-[var(--border-strong)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)] rounded transition-all cursor-pointer"
                          >
                            Assign
                          </button>
                        </>
                      ) : (
                        <div className="w-full flex items-center justify-center gap-1.5 py-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[var(--status-green)] text-[10px] font-bold font-mono uppercase">
                          <Check className="w-3.5 h-3.5" />
                          <span>{currentStatus}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Forecasts & Predictions Widget */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[var(--accent)]" /> Predictive Forecasting Models
              </h3>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">Revenue & Outages</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-[var(--text-secondary)]">
              <div className="bg-[var(--bg-elevated)]/60 p-3.5 border border-[var(--border)] rounded space-y-1">
                <h4 className="font-bold text-white font-mono uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-[var(--status-red)]" /> Asset Outage Timeline
                </h4>
                <p className="text-[11px] mt-1.5">
                  Refractory lining degradation predicts Blast Furnace shut down in <strong className="text-white">42 days</strong>. Outage estimated at ₹65.0L in capital expenses.
                </p>
              </div>

              <div className="bg-[var(--bg-elevated)]/60 p-3.5 border border-[var(--border)] rounded space-y-1">
                <h4 className="font-bold text-white font-mono uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-[var(--status-green)]" /> Revenue Prognosis
                </h4>
                <p className="text-[11px] mt-1.5">
                  Month-end revenue forecast stands at <strong className="text-white">₹448.2 Cr</strong>. Deviations minimized by locked supply agreements.
                </p>
              </div>
            </div>
          </div>

          {/* Reports Compile Widget */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[var(--accent)]" /> Analytical Compilation Desk
              </h3>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">Custom Reports Compiler</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-[var(--bg-elevated)]/60 p-4 border border-[var(--border)] rounded">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                  Select report timeframe scope
                </label>
                <div className="flex gap-2">
                  {(["daily", "weekly", "monthly"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setCompilingType(t)}
                      className={cn(
                        "px-3 py-1 rounded text-[10px] border font-bold uppercase font-mono cursor-pointer transition-all",
                        compilingType === t
                          ? "bg-amber-500/10 border-[var(--accent)] text-[var(--accent)]"
                          : "bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-white"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCompile}
                disabled={isCompiling}
                className="rounded py-2 px-4 text-xs font-bold bg-[var(--accent)] hover:brightness-110 text-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md border-none self-center sm:self-auto"
              >
                {isCompiling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Compiling...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Compile report</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
