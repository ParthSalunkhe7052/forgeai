import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const plantId = searchParams.get("plant_id") || "pune-uuid";

    let plantName = "";
    try {
      const plants = await sql`SELECT name FROM plants WHERE id = ${plantId}`;
      if (plants.length > 0) {
        plantName = plants[0].name.toLowerCase();
      }
    } catch (err) {
      console.warn("Could not query plant name:", err);
    }

    const isPune = plantId === "pune-uuid" || plantId.includes("pune") || plantName.includes("pune");

    // 1. OEE metrics (7 days avg)
    let oeeVal = isPune ? 65.4 : 82.5;
    let availability = isPune ? 72.0 : 88.0;
    let performance = isPune ? 90.0 : 91.0;
    let quality = isPune ? 95.0 : 97.0;

    try {
      const oeeRes = await sql`
        SELECT avg(oee_score) as oee, avg(availability) as avail, avg(performance) as perf, avg(quality) as qual
        FROM production_records
        WHERE plant_id = ${plantId} AND date >= current_date - interval '7 days'
      `;
      if (oeeRes.length > 0 && oeeRes[0].oee !== null) {
        oeeVal = Number(oeeRes[0].oee);
        availability = Number(oeeRes[0].avail);
        performance = Number(oeeRes[0].perf);
        quality = Number(oeeRes[0].qual);
      }
    } catch (err) {
      console.warn("Error querying OEE records:", err);
    }

    // 2. Downtime this week
    let totalDtMins = 142 * 60;
    let plannedDtMins = 40 * 60;
    try {
      const dtRes = await sql`
        SELECT 
          sum(duration_minutes) as total,
          sum(case when cause_category = 'planned' then duration_minutes else 0 end) as planned
        FROM downtime_events
        WHERE plant_id = ${plantId} AND started_at >= current_date - interval '7 days'
      `;
      if (dtRes.length > 0 && dtRes[0].total !== null) {
        totalDtMins = Number(dtRes[0].total) || totalDtMins;
        plannedDtMins = Number(dtRes[0].planned) || plannedDtMins;
      }
    } catch (err) {
      console.warn("Error querying downtime events:", err);
    }
    const unplannedDtMins = Math.max(0, totalDtMins - plannedDtMins);

    // 3. Machines query
    let machines: any[] = [];
    try {
      machines = await sql`
        SELECT id, name, machine_type, health_score, status, next_maintenance
        FROM machines
        WHERE plant_id = ${plantId}
        ORDER BY health_score ASC
      `;
    } catch (err) {
      console.warn("Error querying machines:", err);
    }

    if (machines.length === 0) {
      machines = [
        { id: "m-1", name: isPune ? "Pune Furnace-2" : "Mumbai Furnace-1", machine_type: "furnace", health_score: isPune ? 67.0 : 94.0, status: isPune ? "DEGRADED" : "OPERATIONAL", next_maintenance: "2026-05-20" },
        { id: "m-2", name: "BF-1 Conveyer", machine_type: "conveyor", health_score: 91.5, status: "OPERATIONAL", next_maintenance: "2026-06-15" }
      ];
    }

    const avgMtbf = 218.0;
    const avgMttr = 4.2;

    // 4. Open incidents count
    let incidentsCount = isPune ? 7 : 2;
    try {
      const incRes = await sql`
        SELECT count(*) as count 
        FROM ai_insights 
        WHERE plant_id = ${plantId} AND insight_type = 'alert' AND is_active = true
      `;
      if (incRes.length > 0 && incRes[0].count !== null) {
        incidentsCount = Number(incRes[0].count) || incidentsCount;
      }
    } catch (err) {
      console.warn("Error querying incidents count:", err);
    }

    // 5. OEE Trend (30 Days)
    const oeeTrend = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const dayDate = new Date();
      dayDate.setDate(today.getDate() - (30 - i));
      
      let dayOee = oeeVal + (Math.random() * 5.0 - 2.5);
      if (isPune && i >= 16) {
        dayOee -= (i - 16) * 0.4;
      }
      dayOee = Math.min(100, Math.max(45, dayOee));

      oeeTrend.push({
        date: dayDate.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
        oee: Math.round(dayOee * 10) / 10,
        availability: Math.round(dayOee * 1.05 * 10) / 10,
        performance: Math.round(dayOee * 1.02 * 10) / 10,
        quality: Math.round(dayOee * 1.06 * 10) / 10,
        target: 80.0
      });
    }

    // 6. Downtime by Machine
    const downtimeByMachine = machines.map((m) => {
      const isTarget = isPune && m.name === "Pune Furnace-2";
      return {
        name: m.name.split(" ").slice(-1)[0],
        unplanned: isTarget ? 84 : Math.floor(Math.random() * 25 + 5),
        planned: Math.floor(Math.random() * 15 + 5)
      };
    });

    // 7. Sensor availability grid heatmap (last 14 days)
    const sensorHeatmap = machines.slice(0, 6).map((m) => {
      const history = [];
      for (let i = 0; i < 14; i++) {
        const dayDate = new Date();
        dayDate.setDate(today.getDate() - (14 - i));
        
        let status = "green";
        const isTarget = isPune && m.name === "Pune Furnace-2";
        if (isTarget && i >= 11) {
          status = "red";
        } else if (isTarget && i >= 7) {
          status = "amber";
        } else if (Math.random() < 0.05) {
          status = Math.random() < 0.5 ? "amber" : "red";
        }

        history.push({
          day: dayDate.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
          status: status
        });
      }

      return {
        machine: m.name.split(" ").slice(-1)[0],
        history: history
      };
    });

    // 8. Equipment Health Score Ranking
    const equipmentHealth = machines.map((m) => {
      return {
        id: m.id,
        name: m.name,
        type: m.machine_type.charAt(0).toUpperCase() + m.machine_type.slice(1),
        health: Math.round(Number(m.health_score)),
        status: m.status.toUpperCase(),
        trend: m.health_score > 85 ? "up" : "down",
        next_maintenance: m.next_maintenance ? new Date(m.next_maintenance).toISOString().split("T")[0] : "N/A"
      };
    });

    // 9. PLCs status grid
    const plcs = [
      { name: "PLC-Furnace-Core", status: "online", latency: "14ms", packet_loss: "0.0%" },
      { name: "PLC-Casting-Feed", status: "online", latency: "18ms", packet_loss: "0.1%" },
      { name: "PLC-Rolling-Speed", status: "online", latency: "22ms", packet_loss: "0.0%" },
      { name: "PLC-Cooling-Valve", status: isPune ? "degraded" : "online", latency: isPune ? "120ms" : "15ms", packet_loss: isPune ? "1.2%" : "0.0%" }
    ];

    return NextResponse.json({
      kpis: {
        oee: { value: `${oeeVal.toFixed(1)}%`, breakdown: `A:${availability.toFixed(0)}% | P:${performance.toFixed(0)}% | Q:${quality.toFixed(0)}%`, delta: "-3.2% this week", trend: "down" },
        downtime: { value: `${Math.round(totalDtMins / 60)} hrs`, breakdown: `Planned: ${Math.round(plannedDtMins / 60)}h | Unplanned: ${Math.round(unplannedDtMins / 60)}h`, delta: "+18 hrs vs last week", trend: "down_bad" },
        mtbf: { value: `${Math.round(avgMtbf)} hrs`, delta: "-12 hrs vs last month", trend: "down" },
        mttr: { value: `${avgMttr.toFixed(1)} hrs`, delta: "+0.8 hrs vs last month", trend: "down_bad" },
        sensor_health: { value: "94.2%", breakdown: isPune ? "3 offline | 2 degraded" : "0 offline | 1 degraded", trend: isPune ? "down" : "stable" },
        incidents: { value: String(incidentsCount), breakdown: incidentsCount > 2 ? `Critical: 2 | Warning: ${incidentsCount - 2}` : "Critical: 0 | Warning: 1", delta: "+3 vs yesterday", trend: "down_bad" }
      },
      charts: {
        oee_trend: oeeTrend,
        downtime_by_machine: downtimeByMachine,
        sensor_heatmap: sensorHeatmap,
        equipment_health: equipmentHealth,
        plcs: plcs
      }
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      }
    });
  } catch (error: any) {
    console.error("Error generating Technical Dashboard:", error);
    return NextResponse.json(
      { error: "Failed to generate Technical Dashboard", details: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
