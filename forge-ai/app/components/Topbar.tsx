"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useDashboardStore } from "../store/useDashboardStore";
import { Bell, ChevronDown, Factory, Check } from "lucide-react";
import { cn } from "@/app/utils/cn";
import { motion, AnimatePresence } from "framer-motion";

export interface PlantData {
  id: string;
  name: string;
  location: string;
  capacity_tons_per_day: number;
  status: string;
  machine_count: number;
  oee: number;
}

const PAGE_TITLES: Record<string, string> = {
  cxo: "Executive Control Center",
  technical: "IT & Operations Technology Hub",
  floor: "Factory Floor Operations",
  reports: "Reports Hub",
  actions: "AI Actions Center",
};

export default function Topbar() {
  const {
    selectedPlantId,
    selectedRole,
    countdown,
    isConnected,
    setPlantId,
  } = useDashboardStore();

  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: plants = [], isLoading } = useQuery<PlantData[]>({
    queryKey: ["plants"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/plants");
        if (!res.ok) throw new Error("Failed to fetch plants");
        return await res.json();
      } catch (err) {
        console.warn("Falling back to mock plants:", err);
        return [
          {
            id: "mumbai-uuid",
            name: "Plant A — Mumbai",
            location: "Mumbai, Maharashtra",
            capacity_tons_per_day: 800,
            status: "operational",
            machine_count: 20,
            oee: 82.5,
          },
          {
            id: "pune-uuid",
            name: "Plant B — Pune",
            location: "Pune, Maharashtra",
            capacity_tons_per_day: 600,
            status: "partially degraded",
            machine_count: 20,
            oee: 65.4,
          },
          {
            id: "surat-uuid",
            name: "Plant C — Surat",
            location: "Surat, Gujarat",
            capacity_tons_per_day: 500,
            status: "operational",
            machine_count: 20,
            oee: 89.2,
          },
        ];
      }
    },
  });

  React.useEffect(() => {
    if (
      (selectedRole === "technical" || selectedRole === "floor") &&
      selectedPlantId === "all" &&
      plants.length > 0
    ) {
      const defaultPlant =
        plants.find((p) => p.name.includes("Pune")) || plants[0];
      setPlantId(defaultPlant.id);
    }
  }, [selectedRole, selectedPlantId, plants, setPlantId]);

  const selectedPlant = selectedPlantId === "all"
    ? { id: "all", name: "Enterprise (All Plants)", location: "All Locations", status: "operational", oee: 84.0 }
    : plants.find(p => p.id === selectedPlantId) || plants[0];

  return (
    <header
      className="flex items-center justify-between w-full px-6"
      style={{
        height: 52,
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      {/* Left: Page title */}
      <h1
        style={{
          fontSize: 15,
          fontWeight: 500,
          color: "var(--text-primary)",
          letterSpacing: 0,
        }}
      >
        {PAGE_TITLES[selectedRole] ?? "Forge AI"}
      </h1>

      {/* Right: Controls */}
      <div className="flex items-center gap-5">
        {/* Plant selector */}
        <div ref={dropdownRef} className="relative flex flex-col" style={{ gap: 1 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontFamily: "'DM Mono', monospace",
              lineHeight: 1,
              marginBottom: 2
            }}
          >
            TARGET SITE
          </span>
          <button
            onClick={() => !isLoading && setIsOpen(!isOpen)}
            className="flex items-center justify-between gap-2 px-3 py-1 border rounded-md transition-all duration-150 cursor-pointer select-none"
            style={{
              fontSize: 11,
              fontWeight: 500,
              fontFamily: "'DM Mono', monospace",
              background: "var(--bg-elevated)",
              borderColor: isOpen ? "var(--border-accent)" : "var(--border-strong)",
              color: "var(--text-primary)",
              minWidth: 195,
              height: 24,
              boxShadow: isOpen ? "0 0 10px rgba(245, 158, 11, 0.15)" : "none",
            }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Factory size={11} className={selectedPlant?.status === "partially degraded" ? "text-amber-500" : "text-emerald-500"} />
              <span className="truncate">{selectedPlant?.name ?? "Loading..."}</span>
            </div>
            <ChevronDown size={11} className={cn("transition-transform duration-200 text-muted", isOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.12, ease: "easeOut" }}
                className="absolute z-50 right-0 w-64 mt-1 rounded-md border shadow-xl overflow-hidden glassmorphism"
                style={{
                  top: "100%",
                  background: "rgba(20, 20, 20, 0.95)",
                  borderColor: "var(--border-strong)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div className="py-1 max-h-60 overflow-y-auto">
                  {selectedRole === "cxo" && (
                    <button
                      onClick={() => {
                        setPlantId("all");
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#1f1f1f] transition-colors duration-100"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-medium text-white">Enterprise (All Plants)</span>
                          <span className="text-[10px] text-gray-500 font-mono">Aggregated metrics</span>
                        </div>
                      </div>
                      {selectedPlantId === "all" && <Check size={11} className="text-[#F59E0B]" />}
                    </button>
                  )}
                  {plants.map((plant) => {
                    const isDegraded = plant.status === "partially degraded";
                    return (
                      <button
                        key={plant.id}
                        onClick={() => {
                          setPlantId(plant.id);
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#1f1f1f] transition-colors duration-100 border-t border-[#1f1f1f]"
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            isDegraded ? "bg-amber-500" : "bg-emerald-500"
                          )} />
                          <div className="flex flex-col">
                            <span className="text-xs font-mono font-medium text-white truncate max-w-[180px]">{plant.name}</span>
                            <span className="text-[10px] text-gray-500 font-mono">{plant.location} • OEE: {plant.oee}%</span>
                          </div>
                        </div>
                        {selectedPlantId === plant.id && <Check size={11} className="text-[#F59E0B]" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 28,
            background: "var(--border)",
            flexShrink: 0,
          }}
        />

        {/* Sync timer */}
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: "var(--text-muted)",
            letterSpacing: "0.04em",
          }}
        >
          SYNC {countdown}s
        </span>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <div
            className="live-dot rounded-full flex-shrink-0"
            style={{
              width: 6,
              height: 6,
              background: isConnected
                ? "var(--status-blue)"
                : selectedRole === "technical"
                ? "var(--status-amber)"
                : "var(--status-muted)",
            }}
          />
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: selectedRole === "technical" ? "var(--status-amber)" : "var(--text-muted)",
            }}
          >
            {isConnected ? "LIVE" : selectedRole === "technical" ? "MOCK DATA" : "OFFLINE"}
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 28,
            background: "var(--border)",
            flexShrink: 0,
          }}
        />

        {/* Notification bell */}
        <button
          className="relative transition-colors duration-150 cursor-pointer"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--text-secondary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
        >
          <Bell className="w-4 h-4" />
        </button>



        {/* User avatar */}
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0 select-none"
          style={{
            width: 28,
            height: 28,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-strong)",
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            fontWeight: 500,
            color: "var(--text-secondary)",
          }}
        >
          OP
        </div>
      </div>
    </header>
  );
}
