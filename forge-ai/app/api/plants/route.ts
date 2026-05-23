import { NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

export async function GET() {
  try {
    const plants = await sql`
      SELECT id, name, location, capacity_tons_per_day, status 
      FROM plants 
      ORDER BY name ASC
    `;
    
    // Add default metrics needed by the frontend Topbar
    const plantsWithMetrics = plants.map((plant) => {
      let oee = 82.5;
      if (plant.name.includes("Pune")) oee = 65.4;
      else if (plant.name.includes("Surat")) oee = 89.2;
      
      return {
        ...plant,
        capacity_tons_per_day: Number(plant.capacity_tons_per_day),
        machine_count: 20,
        oee: oee
      };
    });

    return NextResponse.json(plantsWithMetrics, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      }
    });
  } catch (error: any) {
    console.error("Error fetching plants:", error);
    return NextResponse.json(
      { error: "Failed to fetch plants", details: error.message },
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
