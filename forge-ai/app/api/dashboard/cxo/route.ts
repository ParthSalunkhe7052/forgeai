import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const plantId = searchParams.get("plant_id") || "all";

    // 1. Resolve Plant Name from UUID in database
    let plantName = "";
    if (plantId && plantId !== "all") {
      try {
        const plants = await sql`SELECT name FROM plants WHERE id = ${plantId}`;
        if (plants.length > 0) {
          plantName = plants[0].name.toLowerCase();
        }
      } catch (err) {
        console.warn("Could not query plant from DB:", err);
      }
    }

    const isPune = plantId === "pune-uuid" || plantId.includes("pune") || plantName.includes("pune");
    const isMumbai = plantId === "mumbai-uuid" || plantId.includes("mumbai") || plantName.includes("mumbai");
    const isSurat = plantId === "surat-uuid" || plantId.includes("surat") || plantName.includes("surat");

    // 2. Compute Default Fallback Scales
    let defaultRev = 125000000.0;
    let defaultProf = 24000000.0;
    let defaultEnergy = 4520000.0;
    let defaultTons = 11840.0;
    let lossesMtd = 1860000.0;
    let healthScore = 84;
    let riskScore = 34;

    let healthBreakdown = {
      oee: { weight: 30, value: 82, status: "optimal" },
      finance: { weight: 30, value: 95, status: "optimal" },
      energy: { weight: 20, value: 80, status: "optimal" },
      safety: { weight: 20, value: 100, status: "optimal" }
    };
    
    let riskBreakdown = {
      equipment: { weight: 40, value: 34, status: "stable" },
      supply: { weight: 30, value: 24, status: "stable" },
      energy: { weight: 20, value: 35, status: "warning" },
      safety: { weight: 10, value: 15, status: "stable" }
    };

    let savingsValue = "₹18.6 Lakhs";
    let savingsConf = "87%";
    let savingsDelta = "-5.3%";
    let topDriver = "Furnace-2 downtime";
    let topConcern = "Furnace-2 bearing thermal wear & OEE drop";
    let recommendedDecision = "Approve automatic preventative replacement & dispatch parts";
    let savingsHistory = [13.5, 14.0, 14.2, 14.8, 15.4, 15.8, 16.4, 17.1, 17.7, 18.2, 18.5, 18.6];

    if (isPune) {
      defaultRev = 39000000.0;
      defaultProf = 7000000.0;
      defaultEnergy = 1600000.0;
      defaultTons = 3800.0;
      lossesMtd = 710000.0;
      healthScore = 68;
      riskScore = 51;
      healthBreakdown = {
        oee: { weight: 30, value: 58, status: "degraded" },
        finance: { weight: 30, value: 75, status: "amber" },
        energy: { weight: 20, value: 60, status: "amber" },
        safety: { weight: 20, value: 80, status: "amber" }
      };
      riskBreakdown = {
        equipment: { weight: 40, value: 68, status: "critical" },
        supply: { weight: 30, value: 45, status: "warning" },
        energy: { weight: 20, value: 35, status: "warning" },
        safety: { weight: 10, value: 30, status: "warning" }
      };
      savingsValue = "₹7.1 Lakhs";
      savingsConf = "88%";
      savingsDelta = "-5.3%";
      topDriver = "Furnace-2 downtime";
      topConcern = "Furnace-2 bearing thermal wear & OEE drop";
      recommendedDecision = "Approve automatic preventative replacement & dispatch parts";
      savingsHistory = [2.2, 2.5, 2.4, 2.8, 3.2, 3.5, 4.1, 4.8, 5.2, 5.7, 6.8, 7.1];
    } else if (isMumbai) {
      defaultRev = 61000000.0;
      defaultProf = 12000000.0;
      defaultEnergy = 2100000.0;
      defaultTons = 5600.0;
      lossesMtd = 820000.0;
      healthScore = 84;
      riskScore = 23;
      healthBreakdown = {
        oee: { weight: 30, value: 83, status: "optimal" },
        finance: { weight: 30, value: 95, status: "optimal" },
        energy: { weight: 20, value: 82, status: "optimal" },
        safety: { weight: 20, value: 100, status: "optimal" }
      };
      riskBreakdown = {
        equipment: { weight: 40, value: 25, status: "stable" },
        supply: { weight: 30, value: 15, status: "stable" },
        energy: { weight: 20, value: 35, status: "warning" },
        safety: { weight: 10, value: 10, status: "stable" }
      };
      savingsValue = "₹8.2 Lakhs";
      savingsConf = "91%";
      savingsDelta = "-3.1%";
      topDriver = "Peak-hour energy tariff";
      topConcern = "Peak-hour energy billing above target threshold";
      recommendedDecision = "Reschedule peak arc furnace melting to off-peak slots";
      savingsHistory = [7.5, 7.6, 7.8, 7.9, 8.0, 8.1, 8.2, 8.1, 8.2, 8.3, 8.2, 8.2];
    } else if (isSurat) {
      defaultRev = 25000000.0;
      defaultProf = 5000000.0;
      defaultEnergy = 820000.0;
      defaultTons = 2440.0;
      lossesMtd = 330000.0;
      healthScore = 94;
      riskScore = 10;
      healthBreakdown = {
        oee: { weight: 30, value: 89, status: "optimal" },
        finance: { weight: 30, value: 96, status: "optimal" },
        energy: { weight: 20, value: 92, status: "optimal" },
        safety: { weight: 20, value: 100, status: "optimal" }
      };
      riskBreakdown = {
        equipment: { weight: 40, value: 10, status: "stable" },
        supply: { weight: 30, value: 10, status: "stable" },
        energy: { weight: 20, value: 15, status: "stable" },
        safety: { weight: 10, value: 0, status: "stable" }
      };
      savingsValue = "₹3.3 Lakhs";
      savingsConf = "93%";
      savingsDelta = "-1.8%";
      topDriver = "Raw material quality variance";
      topConcern = "Slight raw material stockpile degradation risk";
      recommendedDecision = "Recalibrate furnace chemistry inputs for grade Fe-62";
      savingsHistory = [2.8, 2.9, 3.0, 3.1, 3.0, 3.2, 3.1, 3.2, 3.3, 3.2, 3.3, 3.3];
    }

    // 3. Query Database for Financial aggregates (this month)
    let revenueMtd = defaultRev;
    let netProfitMtd = defaultProf;
    let energyCostMtd = defaultEnergy;
    let producedMtd = defaultTons;

    try {
      let finQuery = sql`
        SELECT 
          sum(revenue_inr) as revenue,
          sum(net_profit_inr) as net_profit,
          sum(energy_cost_inr) as energy_cost,
          sum(tons_produced) as tons
        FROM financial_records
        WHERE month >= date_trunc('month', current_date)
      `;
      
      if (plantId && plantId !== "all") {
        finQuery = sql`
          SELECT 
            sum(revenue_inr) as revenue,
            sum(net_profit_inr) as net_profit,
            sum(energy_cost_inr) as energy_cost,
            sum(tons_produced) as tons
          FROM financial_records
          WHERE month >= date_trunc('month', current_date) AND plant_id = ${plantId}
        `;
      }
      
      const finRes = await finQuery;
      if (finRes.length > 0 && finRes[0].revenue !== null) {
        revenueMtd = Number(finRes[0].revenue);
        netProfitMtd = Number(finRes[0].net_profit);
        energyCostMtd = Number(finRes[0].energy_cost);
        producedMtd = Number(finRes[0].tons);
      }
    } catch (err) {
      console.warn("Could not aggregate financial records, falling back to mock:", err);
    }

    // 4. Plant Utilization Avg
    let utilizationAvg = isPune ? 81.5 : 84.0;
    try {
      let plantList = [];
      if (plantId && plantId !== "all") {
        plantList = await sql`SELECT id FROM plants WHERE id = ${plantId}`;
      } else {
        plantList = await sql`SELECT id FROM plants`;
      }
      
      if (plantList.length > 0) {
        // Query average OEE score from production records for the last 30 days
        const oeeQuery = await sql`
          SELECT avg(oee_score) as oee
          FROM production_records
          WHERE date >= current_date - interval '30 days'
          ${plantId !== "all" ? sql`AND plant_id = ${plantId}` : sql``}
        `;
        if (oeeQuery.length > 0 && oeeQuery[0].oee !== null) {
          utilizationAvg = Number(oeeQuery[0].oee);
        }
      }
    } catch (err) {
      console.warn("Could not query utilization, falling back:", err);
    }

    // 5. 12-Month Historical Trend
    let revenueProfitTrend: any[] = [];
    try {
      let histQuery = sql`
        SELECT month, sum(revenue_inr) as revenue, sum(net_profit_inr) as net_profit
        FROM financial_records
        ${plantId !== "all" ? sql`WHERE plant_id = ${plantId}` : sql``}
        GROUP BY month
        ORDER BY month ASC
      `;
      const histRes = await histQuery;
      
      revenueProfitTrend = histRes.map((r) => {
        const dateObj = new Date(r.month);
        const mStr = dateObj.toLocaleString("en-US", { month: "short" });
        return {
          month: mStr,
          revenue: Math.round((Number(r.revenue) / 10000000.0) * 100) / 100, // in Cr
          profit: Math.round((Number(r.net_profit) / 10000000.0) * 100) / 100 // in Cr
        };
      });
    } catch (err) {
      console.warn("Failed to load historical trend:", err);
    }

    // Default mock historical trend if DB fails or empty
    if (revenueProfitTrend.length === 0) {
      const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
      const scale = defaultRev / 125000000.0;
      revenueProfitTrend = months.map((m, idx) => {
        return {
          month: m,
          revenue: Math.round((10.5 + idx * 0.4 + (Math.random() * 1.0 - 0.5)) * scale * 100) / 100,
          profit: Math.round((2.0 + idx * 0.1 + (Math.random() * 0.4 - 0.2)) * scale * 100) / 100
        };
      });
    }

    const revHist = revenueProfitTrend.map((item) => item.revenue);
    const profHist = revenueProfitTrend.map((item) => item.profit);

    // 6. Loss Sources Donut Chart
    const lossSources = [
      { name: "Downtime", value: 42, cost: Math.round(lossesMtd * 0.42) },
      { name: "Energy Waste", value: 28, cost: Math.round(lossesMtd * 0.28) },
      { name: "Defects", value: 30, cost: Math.round(lossesMtd * 0.30) }
    ];

    // 7. Factory Comparison Grouped Bar Chart
    let plantComparison: any[] = [];
    try {
      const allPlants = await sql`SELECT id, name FROM plants`;
      for (const p of allPlants) {
        // MTD Revenue Estimate from DB
        const revRes = await sql`
          SELECT sum(revenue_inr) as rev
          FROM financial_records
          WHERE plant_id = ${p.id} AND month >= date_trunc('month', current_date)
        `;
        
        let pRev = 40.0; // Fallback in Cr
        if (revRes.length > 0 && revRes[0].rev !== null) {
          pRev = Number(revRes[0].rev) / 10000000.0;
        } else {
          if (p.name.includes("Mumbai")) pRev = 6.1;
          else if (p.name.includes("Pune")) pRev = 3.9;
          else if (p.name.includes("Surat")) pRev = 2.5;
        }

        // Calculate average OEE
        const oeeRes = await sql`
          SELECT avg(oee_score) as oee
          FROM production_records
          WHERE plant_id = ${p.id} AND date >= current_date - interval '30 days'
        `;
        const oee = oeeRes.length > 0 && oeeRes[0].oee !== null ? Number(oeeRes[0].oee) : 80;

        // Calculate utilization
        let util = 84;
        if (p.name.includes("Mumbai")) util = 86;
        else if (p.name.includes("Pune")) util = 81.5;
        else if (p.name.includes("Surat")) util = 83.8;

        plantComparison.push({
          name: p.name.split(" — ")[1] || p.name,
          revenue: Math.round(pRev * 10) / 10,
          oee: Math.round(oee * 10) / 10,
          utilization: util
        });
      }
    } catch (err) {
      console.warn("Failed comparison chart generation:", err);
      // Fallback
      plantComparison = [
        { name: "Mumbai", revenue: 6.1, oee: 83.0, utilization: 86.0 },
        { name: "Pune", revenue: 3.9, oee: 58.0, utilization: 81.5 },
        { name: "Surat", revenue: 2.5, oee: 89.0, utilization: 83.8 }
      ];
    }

    // 8. Energy Cost Trend (30 days)
    const energyTrend = [];
    const baseCost = plantId !== "all" ? 1.3 : 3.8; // lakhs
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const dayDate = new Date();
      dayDate.setDate(today.getDate() - (30 - i));
      const isPeakDay = dayDate.getDay() === 1 || dayDate.getDay() === 3 || dayDate.getDay() === 5;
      const peakCharge = isPeakDay ? 0.4 : 0.1;
      
      energyTrend.push({
        date: dayDate.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
        cost: Math.round((baseCost + peakCharge + (Math.random() * 0.4 - 0.2)) * 100) / 100,
        limit: plantId !== "all" ? 1.8 : 4.2
      });
    }

    // 9. Revenue Forecast (Jun forward)
    const forecastData = [];
    const historyMonths = ["Jan", "Feb", "Mar", "Apr", "May"];
    const scale = defaultRev / 125000000.0;
    
    // History
    historyMonths.forEach((m, idx) => {
      forecastData.push({
        month: m,
        actual: Math.round((11.2 + idx * 0.3) * scale * 100) / 100,
        forecast: null,
        pessimistic: null,
        optimistic: null
      });
    });
    
    // Future (June)
    const forecastVal = Math.round(12.8 * scale * 100) / 100;
    forecastData.push({
      month: "Jun (FC)",
      actual: null,
      forecast: forecastVal,
      pessimistic: Math.round(forecastVal * 0.93 * 100) / 100,
      optimistic: Math.round(forecastVal * 1.05 * 100) / 100
    });

    const isPuneForDelta = plantId === "pune-uuid" || plantId.includes("pune") || plantName.includes("pune");
    const deltaRevenue = isPuneForDelta ? "+4.8% vs last month" : "+8.2% vs last month";
    const deltaProfit = isPuneForDelta ? "-1.2% vs last month" : "+3.1% vs last month";
    const trendProfit = isPuneForDelta ? "down" : "up";
    const deltaProduction = isPuneForDelta ? "88.2% of target (4.3k T)" : "95.5% of target (12.4k T)";
    const energyDelta = isPuneForDelta ? "+18.2% vs last month" : "+5.3% vs last month";
    const energyRate = isPuneForDelta ? "₹4.12/kWh" : "₹3.82/kWh";

    return NextResponse.json({
      kpis: {
        revenue: {
          value: `₹${(revenueMtd / 10000000.0).toFixed(1)} Cr`,
          delta: deltaRevenue,
          trend: "up",
          history: revHist
        },
        net_profit: {
          value: `₹${(netProfitMtd / 10000000.0).toFixed(1)} Cr`,
          delta: deltaProfit,
          margin: `${((netProfitMtd / revenueMtd) * 100).toFixed(1)}%`,
          trend: trendProfit,
          history: profHist
        },
        utilization: {
          value: `${utilizationAvg.toFixed(1)}%`,
          delta: "-2.1% vs last week",
          trend: "down"
        },
        production: {
          value: `${Math.round(producedMtd).toLocaleString()} T`,
          delta: deltaProduction,
          trend: "up"
        },
        energy_cost: {
          value: `₹${(energyCostMtd / 100000.0).toFixed(1)} L`,
          delta: energyDelta,
          rate: energyRate,
          trend: "down_bad"
        },
        losses: {
          value: `₹${(lossesMtd / 100000.0).toFixed(1)} L`,
          delta: "-12.0% vs last month",
          trend: "up_good"
        },
        health: {
          value: healthScore,
          breakdown: healthBreakdown
        },
        risk: {
          value: riskScore,
          breakdown: riskBreakdown
        },
        savings_opportunity: {
          value: savingsValue,
          confidence: savingsConf,
          delta: savingsDelta,
          top_driver: topDriver,
          top_concern: topConcern,
          recommended_decision: recommendedDecision,
          history: savingsHistory
        }
      },
      charts: {
        revenue_profit_trend: revenueProfitTrend,
        loss_sources: lossSources,
        plant_comparison: plantComparison,
        energy_trend: energyTrend,
        revenue_forecast: forecastData
      }
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      }
    });
  } catch (error: any) {
    console.error("Error generating CXO Dashboard:", error);
    return NextResponse.json(
      { error: "Failed to generate CXO Dashboard", details: error.message },
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
