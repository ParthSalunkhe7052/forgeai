import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const plantId = searchParams.get("plant_id") || "pune-uuid";

    // Resolve plant name to handle UI logic consistency (like Pune alerts)
    let plantName = "";
    try {
      const plants = await sql`SELECT name FROM plants WHERE id = ${plantId}`;
      if (plants.length > 0) {
        plantName = plants[0].name.toLowerCase();
      }
    } catch (err) {
      console.warn("Could not fetch plant name:", err);
    }

    const isPune = plantId === "pune-uuid" || plantId.includes("pune") || plantName.includes("pune");

    // 1. Production Records query (Today's shift)
    let producedToday = 387.0;
    let targetToday = 620.0;
    let defectToday = 8.1;
    
    try {
      const prodRes = await sql`
        SELECT sum(actual_tons) as actual, sum(target_tons) as target, sum(defect_tons) as defect
        FROM production_records
        WHERE plant_id = ${plantId} AND date = current_date
      `;
      if (prodRes.length > 0 && prodRes[0].actual !== null) {
        producedToday = Number(prodRes[0].actual);
        targetToday = Number(prodRes[0].target);
        defectToday = Number(prodRes[0].defect);
      }
    } catch (err) {
      console.warn("Error querying production records:", err);
    }

    const defectRate = producedToday > 0 ? (defectToday / producedToday) * 100.0 : 2.1;
    const remaining = Math.max(0, targetToday - producedToday);
    const requiredPace = remaining / 8.0; // 8 shift hours total, remaining pace calculation

    // 2. Inbound / Outbound counts today
    let inboundCount = 3;
    let outboundCount = 2;
    try {
      const countsRes = await sql`
        SELECT 
          sum(case when shipment_type = 'inbound' then 1 else 0 end) as inbound,
          sum(case when shipment_type = 'outbound' then 1 else 0 end) as outbound
        FROM shipments
        WHERE plant_id = ${plantId} AND scheduled_date = current_date
      `;
      if (countsRes.length > 0 && countsRes[0].inbound !== null) {
        inboundCount = Number(countsRes[0].inbound) || 3;
        outboundCount = Number(countsRes[0].outbound) || 2;
      }
    } catch (err) {
      console.warn("Error querying shipment counts:", err);
    }

    // 3. Floor Map Nodes (Status layout representation)
    const floorNodes = [
      { id: "node-bf1", name: "BF-1", type: "furnace", status: "operational", health: 94, output: "32 T/hr" },
      { id: "node-bf2", name: "BF-2", type: "furnace", status: isPune ? "degraded" : "operational", health: isPune ? 67 : 92, output: "18 T/hr" },
      { id: "node-eaf1", name: "EAF-1", type: "furnace", status: "operational", health: 91, output: "28 T/hr" },
      { id: "node-line1", name: "Line 1", type: "line", status: "operational", health: 95, output: "45 T/hr" },
      { id: "node-line2", name: "Line 2", type: "line", status: "operational", health: 92, output: "40 T/hr" },
      { id: "node-line3", name: "Line 3", type: "line", status: isPune ? "critical" : "operational", health: isPune ? 55 : 89, output: "15 T/hr" },
      { id: "node-crane-a", name: "Crane A", type: "crane", status: "operational", health: 88, output: "Active" },
      { id: "node-crane-b", name: "Crane B", type: "crane", status: "operational", health: 90, output: "Active" }
    ];

    // 4. Live Work Orders
    let workOrders: any[] = [];
    try {
      const woRes = await sql`
        SELECT order_number, product_type, quantity_tons, priority, status, assigned_team
        FROM work_orders
        WHERE plant_id = ${plantId} AND status IN ('in_progress', 'pending')
        ORDER BY 
          case when priority = 'urgent' then 1
               when priority = 'high' then 2
               when priority = 'normal' then 3
               else 4 end ASC
      `;
      workOrders = woRes.map((wo) => ({
        order_number: wo.order_number,
        product_type: wo.product_type,
        quantity_tons: Number(wo.quantity_tons),
        priority: wo.priority.toUpperCase(),
        status: wo.status.toUpperCase(),
        assigned_team: wo.assigned_team
      }));
    } catch (err) {
      console.warn("Error querying work orders:", err);
    }

    if (workOrders.length === 0) {
      workOrders = [
        { order_number: "WO-0554", product_type: "HRC Coil", quantity_tons: 80, priority: "URGENT", status: "IN PROGRESS", assigned_team: "Team B" },
        { order_number: "WO-0551", product_type: "TMT Rebar", quantity_tons: 120, priority: "HIGH", status: "IN PROGRESS", assigned_team: "Team A" },
        { order_number: "WO-0548", product_type: "Billets", quantity_tons: 50, priority: "NORMAL", status: "QUEUED", assigned_team: "Team C" }
      ];
    }

    // 5. Shipment Schedule
    let shipments: any[] = [];
    try {
      const shipRes = await sql`
        SELECT shipment_type, material_type, quantity_tons, status
        FROM shipments
        WHERE plant_id = ${plantId} AND scheduled_date = current_date
      `;
      shipments = shipRes.map((s) => ({
        type: s.shipment_type.toUpperCase(),
        material: s.material_type.replace("_", " ").replace(/\w\S*/g, (w: string) => w.replace(/^\w/, (c: string) => c.toUpperCase())),
        quantity: `${Math.round(Number(s.quantity_tons))}T`,
        eta: s.status === "delayed" ? "02:30 PM" : "04:00 PM",
        status: s.status.toUpperCase()
      }));
    } catch (err) {
      console.warn("Error querying shipments:", err);
    }

    if (shipments.length === 0) {
      shipments = [
        { type: "INBOUND", material: "Iron Ore", quantity: "240T", eta: "2:30 PM", status: isPune ? "DELAYED" : "ON TRACK" },
        { type: "INBOUND", material: "Limestone", quantity: "45T", eta: "5:00 PM", status: "ON TRACK" },
        { type: "OUTBOUND", material: "HRC Coils", quantity: "180T", eta: "4:00 PM", status: "READY" }
      ];
    }

    // 6. Material Inventory Stocks
    let inventory: any[] = [];
    try {
      const invRes = await sql`
        SELECT material_type, quantity_tons, reorder_level
        FROM inventory
        WHERE plant_id = ${plantId}
      `;
      inventory = invRes.map((iv) => {
        const qty = Number(iv.quantity_tons);
        const reorder = Number(iv.reorder_level);
        let pct = (qty / (reorder * 2)) * 100.0;
        pct = Math.min(100.0, Math.max(5.0, pct));
        
        return {
          material: iv.material_type.replace("_", " ").replace(/\w\S*/g, (w: string) => w.replace(/^\w/, (c: string) => c.toUpperCase())),
          level: Math.round(qty),
          reorder: Math.round(reorder),
          pct: Math.round(pct),
          status: qty < reorder * 1.1 ? "alert" : "normal"
        };
      });
    } catch (err) {
      console.warn("Error querying inventory:", err);
    }

    if (inventory.length === 0) {
      inventory = [
        { material: "Iron Ore Sinter", level: 1420, reorder: 800, pct: 78, status: "normal" },
        { material: "Coking Coal", level: 980, reorder: 600, pct: 65, status: "normal" },
        { material: "Scrap Metal", level: 320, reorder: 400, pct: 32, status: "alert" },
        { material: "Flux Agents", level: 210, reorder: 150, pct: 58, status: "normal" }
      ];
    }

    // 7. Timeline definition
    const timeline = {
      shift_hours: 8,
      hours_completed: 4.5,
      actual_tons: Math.round(producedToday),
      target_tons: Math.round(targetToday),
      pace_projection: Math.round(producedToday * 1.08),
      downtime_blocks: [
        { start_hour: 1.5, duration_hours: 0.5, type: "break", label: "Scheduled Break" },
        { start_hour: 3.0, duration_hours: 0.75, type: "mechanical", label: "Line 3 Jam" }
      ]
    };

    return NextResponse.json({
      kpis: {
        target: { value: `${Math.round(targetToday)} T`, sub: "Morning Shift" },
        produced: { value: `${Math.round(producedToday)} T`, pct: Math.round((producedToday / targetToday) * 100.0) || 62, sub: "Current shift duration" },
        remaining: { value: `${Math.round(remaining)} T`, sub: `Required pace: ${requiredPace.toFixed(1)} T/hr`, status: isPune ? "warning" : "normal" },
        defect_rate: { value: `${defectRate.toFixed(1)}%`, sub: `${Math.round(defectToday)} T rejected today`, status: defectRate > 2.0 ? "critical" : "normal" },
        inbound: { value: `${inboundCount} shipments`, sub: "Next: Iron Ore 240T", status: isPune ? "warning" : "normal" },
        outbound: { value: `${outboundCount} loads`, sub: "Next: 4:00 PM (JSW)", status: "normal" }
      },
      widgets: {
        timeline: timeline,
        floor_map: floorNodes,
        work_orders: workOrders,
        shipments: shipments,
        inventory: inventory
      }
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      }
    });
  } catch (error: any) {
    console.error("Error generating Floor Dashboard:", error);
    return NextResponse.json(
      { error: "Failed to generate Floor Dashboard", details: error.message },
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
