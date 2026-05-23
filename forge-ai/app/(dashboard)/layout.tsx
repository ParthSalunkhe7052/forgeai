"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useDashboardStore, RoleType } from "../store/useDashboardStore";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AICopilot from "../components/AICopilot";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const {
    selectedPlantId,
    selectedRole,
    setRole,
    setCountdown,
    setIsConnected,
    setLiveDashboardData,
  } = useDashboardStore();

  // Sync active route with the Zustand role
  useEffect(() => {
    if (pathname.startsWith("/cxo")) {
      setRole("cxo");
    } else if (pathname.startsWith("/technical")) {
      setRole("technical");
    } else if (pathname.startsWith("/floor")) {
      setRole("floor");
    } else if (pathname.startsWith("/reports")) {
      setRole("reports" as RoleType);
    }
  }, [pathname, setRole]);

  // Manage WebSocket / HTTP Polling Connection
  useEffect(() => {
    setLiveDashboardData(null);
    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let pollingInterval: NodeJS.Timeout | null = null;
    let isMounted = true;
    let hasFailed = false;

    async function runPollingTick() {
      if (!isMounted) return;
      try {
        let endpoint = `/api/dashboard/${selectedRole}`;
        if (selectedRole === "reports") {
          endpoint = `/api/plants`;
        }
        const sep = endpoint.includes("?") ? "&" : "?";
        const url = `${endpoint}${selectedPlantId ? `${sep}plant_id=${selectedPlantId}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("HTTP fallback fetch failed");
        const data = await res.json();
        
        if (isMounted) {
          setIsConnected(true);
          if (selectedRole !== "reports") {
            setLiveDashboardData(data);
          }
          setCountdown(30);
        }
      } catch (err) {
        console.warn("HTTP fallback sync failed:", err);
        if (isMounted) {
          setIsConnected(false);
        }
      }
    }

    function startPollingFallback() {
      if (pollingInterval) clearInterval(pollingInterval);
      runPollingTick(); // run once immediately
      pollingInterval = setInterval(runPollingTick, 30000);
    }

    function connect() {
      if (!isMounted) return;
      // If we already failed once, directly go to polling rather than spamming WS connections
      if (hasFailed) {
        startPollingFallback();
        return;
      }

      const wsBase = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
      const wsUrl = `${wsBase}/ws/live/${selectedPlantId}?role=${selectedRole}`;
      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          if (isMounted) {
            setIsConnected(true);
            setCountdown(30);
          }
        };

        socket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === "metrics_update") {
              setLiveDashboardData(payload.data);
              setCountdown(30);
            }
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        socket.onclose = () => {
          if (isMounted) {
            hasFailed = true;
            setIsConnected(false);
            startPollingFallback();
          }
        };

        socket.onerror = () => {
          socket?.close();
        };
      } catch (e) {
        hasFailed = true;
        startPollingFallback();
      }
    }

    connect();

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (pollingInterval) {
            // Polling interval will update data and reset countdown
          }
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      isMounted = false;
      if (socket) {
        try {
          socket.close();
        } catch (e) {}
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pollingInterval) clearInterval(pollingInterval);
      clearInterval(countdownInterval);
    };
  }, [selectedPlantId, selectedRole, setIsConnected, setLiveDashboardData, setCountdown]);

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Topbar Header */}
        <Topbar />

        {/* Main Dashboard Pages */}
        <main
          className="flex-1 overflow-y-auto px-6 py-6"
          style={{ background: "var(--bg-base)" }}
        >
          <div className="max-w-[1600px] mx-auto w-full h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Global AI Copilot Drawer */}
      <AICopilot />
    </div>
  );
}
