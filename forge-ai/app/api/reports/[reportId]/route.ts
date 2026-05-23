import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

interface RouteParams {
  params: Promise<{ reportId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { reportId } = await params;
    const { searchParams } = new URL(req.url);
    const plantId = searchParams.get("plant_id") || "all";

    // Fetch plant details
    let plantName = "All Plants";
    if (plantId && plantId !== "all") {
      try {
        const plants = await sql`SELECT name FROM plants WHERE id = ${plantId}`;
        if (plants.length > 0) {
          plantName = plants[0].name;
        }
      } catch (err) {
        console.warn("Could not query plant name for report context:", err);
      }
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Simple report templates based on id/type
    const report: any = {
      id: reportId,
      title: reportId.includes("daily") 
        ? `Daily Operations Summary — ${plantName}` 
        : reportId.includes("weekly") 
        ? `Weekly Performance Report — ${plantName}` 
        : `Monthly Review — ${plantName}`,
      plant_id: plantId,
      generated_by: "Forge AI Copilot",
      date: todayStr,
      sections: [
        {
          title: "1. AI Executive Summary",
          content: `Operations at ${plantName} for this period show stable output overall, but efficiency is impacted by equipment degradation on selected lines. Quality rates are maintaining a healthy 97.4% baseline, but availability fell to 84.1% due to unscheduled maintenance. Immediate attention should be placed on restoring normal furnace speeds.`,
          type: "text"
        },
        {
          title: "2. Production Metrics Breakdown",
          type: "table",
          headers: ["Line Name", "Target (T)", "Actual (T)", "Defects (T)", "OEE (%)"],
          rows: [
            ["Blast Furnace Line", "280.0", "262.4", "5.1", "81.2%"],
            ["Electric Arc Furnace Line", "240.0", "238.1", "2.4", "88.5%"],
            ["Rolling Mill Line", "320.0", "295.2", "8.2", "76.4%"],
            ["Finishing Line", "200.0", "198.0", "1.1", "90.2%"],
            ["Cold Rolling Line", "160.0", "154.5", "1.8", "86.1%"]
          ]
        },
        {
          title: "3. Unplanned Downtime Logs",
          type: "table",
          headers: ["Machine Name", "Cause Category", "Duration (mins)", "Impact (T)"],
          rows: plantName.toLowerCase().includes("pune") ? [
            ["Pune Furnace-2", "Mechanical (Bearing)", "120", "42.5 T"],
            ["Conveyor-1", "Electrical (Trip)", "45", "15.0 T"]
          ] : [
            ["BF-1 Conveyor", "Electrical", "35", "10.0 T"]
          ]
        },
        {
          title: "4. Top AI Action Items",
          type: "bullets",
          items: [
            "Replace bearing housing on Furnace-2 during upcoming shift rotation to avoid failure.",
            "Reschedule heavy furnace runs to off-peak hours (10:00 PM to 6:00 AM) to save ₹1.8L daily.",
            "Reallocate team members from line 4 finishing area to line 1 packing area to mitigate output gaps."
          ]
        }
      ]
    };

    // Attach corresponding ai_summary
    report.ai_summary = {
      key_findings: [
        `Operational report custom compiled for ${plantName}.`,
        "System health indicators check out within nominal bounds.",
        "Review recommended actions for optimization guidance."
      ],
      risks: [
        {
          severity: "medium",
          title: "Custom report baseline deviation",
          description: "Downtime trends tracking slightly above historical seasonal norm.",
          impact: "₹1.5L/week"
        }
      ],
      recommended_actions: [
        {
          priority: "medium",
          title: "Review line OEE parameters",
          description: "Perform secondary validation on lines with less than 82% availability.",
          owner: "Operations Lead",
          impact: "Efficiency stabilization"
        }
      ],
      savings_opportunity: {
        amount: "₹3.8 Lakhs",
        driver: "Custom parameter tuning",
        confidence: "85%"
      }
    };

    // Custom defaults for structured default reports
    if (reportId === "rep-daily-today") {
      report.ai_summary = {
        key_findings: [
          "Blast Furnace line output was 262.4 Tons, slightly underperforming target of 280.0 Tons (OEE at 81.2%).",
          "Quality defect rates remained stable at 1.8%, well within the 2.5% tolerance threshold.",
          "Energy consumption spiked +12% above baseline during peak rate hours (2 PM to 6 PM).",
          "Furnace-2 logged high thermal fatigue and bearing vibrations in the afternoon."
        ],
        risks: [
          {
            severity: "critical",
            title: "Furnace-2 bearing degradation",
            description: "Bearing temperature at 92°C with 68% failure probability inside 48 hours.",
            impact: "₹18.6L/month"
          },
          {
            severity: "medium",
            title: "Energy usage above baseline",
            description: "+12% peak rate consumption driving up marginal production costs.",
            impact: "₹1.8L/day"
          }
        ],
        recommended_actions: [
          {
            priority: "high",
            title: "Replace Furnace-2 bearing",
            description: "Perform preventive swap of the bearing housing during next shift handover.",
            owner: "Maintenance Team",
            impact: "₹4.2L/month savings"
          },
          {
            priority: "medium",
            title: "Shift heavy furnace loads",
            description: "Adjust timing of energy-intensive schedules to run during off-peak hours.",
            owner: "Operations Lead",
            impact: "₹1.8L/day savings"
          }
        ],
        savings_opportunity: {
          amount: "₹18.6 Lakhs",
          driver: "Furnace-2 downtime avoidance",
          confidence: "91%"
        }
      };
    } else if (reportId === "rep-weekly-last") {
      report.ai_summary = {
        key_findings: [
          "Weekly steel production reached 1,842 Tons, representing 94% of the weekly plan.",
          "Total unplanned downtime stood at 8.4 hours, primarily caused by Conveyor-1 electrical failures.",
          "Product quality yield improved to 98.1% due to sensor calibrations on finishing lines.",
          "Average plant availability was 84.1%, falling below the 88.0% OEE target."
        ],
        risks: [
          {
            severity: "high",
            title: "Conveyor-1 electrical switchgear trips",
            description: "Repeated voltage transients are causing belt shutdowns. Risk level is high.",
            impact: "₹5.2L/week"
          },
          {
            severity: "medium",
            title: "Iron ore logistics delay",
            description: "Shipment delayed by 2 hours at port; production risk increased to 7%.",
            impact: "₹2.2L/event"
          }
        ],
        recommended_actions: [
          {
            priority: "high",
            title: "Calibrate Conveyor-1 switchgear",
            description: "Conduct diagnostic testing and replace faulty trip coils in the power sub-panel.",
            owner: "Electrical Crew",
            impact: "₹2.5L/month savings"
          },
          {
            priority: "medium",
            title: "Optimize rolling mill changeovers",
            description: "Train operators on standardized roll change procedures to reduce changeover times.",
            owner: "Floor Lead",
            impact: "₹1.5L/week savings"
          }
        ],
        savings_opportunity: {
          amount: "₹5.2 Lakhs",
          driver: "Conveyor stabilization",
          confidence: "88%"
        }
      };
    } else if (reportId === "rep-monthly-last") {
      report.ai_summary = {
        key_findings: [
          "Total monthly revenue stood at ₹442.4 Cr, representing a 1.7% deviation from target (₹450 Cr).",
          "Net profit margins remained stable at 14.2% due to successful supply chain hedging.",
          "Unplanned downtime cost the plant ₹38.4L, with Furnace-2 thermal wear being the chief driver.",
          "Overall OEE averaged 81.5% across all 5 production lines, down from 83.2% last month."
        ],
        risks: [
          {
            severity: "high",
            title: "Blast furnace lining degradation",
            description: "Refractory lining thickness has reached near critical limits. Repair window: 42 days.",
            impact: "₹65.0L/repair"
          },
          {
            severity: "medium",
            title: "Carbon credit offset ceiling",
            description: "Emissions are +8% higher than projected monthly baseline, risking regulatory penalties.",
            impact: "₹12.0L potential fine"
          }
        ],
        recommended_actions: [
          {
            priority: "high",
            title: "Pre-order refractory brick set",
            description: "Order specialized refractory replacement parts to prevent delivery bottlenecks.",
            owner: "Procurement",
            impact: "Avoids ₹65L breakdown"
          },
          {
            priority: "medium",
            title: "Tune oxygen-to-fuel ratio",
            description: "Recalibrate the digital burner controllers on Furnace-1 to optimize combustion and reduce emissions.",
            owner: "Engineering",
            impact: "₹5.0L fine avoidance"
          }
        ],
        savings_opportunity: {
          amount: "₹65.0 Lakhs",
          driver: "Refractory failure avoidance",
          confidence: "95%"
        }
      };
    }

    return NextResponse.json(report, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      }
    });

  } catch (error: any) {
    console.error("Error retrieving report details:", error);
    return NextResponse.json(
      { error: "Failed to retrieve report details", details: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
