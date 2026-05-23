import { NextResponse } from "next/server";

export async function GET() {
  try {
    const today = new Date();
    const todayStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const prevWeek = new Date(today);
    prevWeek.setDate(today.getDate() - 7);
    const prevMonth = new Date(today);
    prevMonth.setDate(today.getDate() - 30);

    const reports = [
      {
        id: "rep-daily-today",
        title: `Daily Operations Summary — ${todayStr}`,
        type: "daily",
        date_range: today.toISOString().split("T")[0],
        generated_at: today.toISOString(),
        size: "45 KB",
        status: "ready",
        ai_summary: {
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
        }
      },
      {
        id: "rep-weekly-last",
        title: `Weekly Performance Report — Week ${Math.floor(today.getDate() / 7) + 1}`,
        type: "weekly",
        date_range: `${prevWeek.toISOString().split("T")[0]} to ${today.toISOString().split("T")[0]}`,
        generated_at: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        size: "120 KB",
        status: "ready",
        ai_summary: {
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
        }
      },
      {
        id: "rep-monthly-last",
        title: `Monthly Financial & Operations Review — ${prevMonth.toLocaleString("en-US", { month: "long", year: "numeric" })}`,
        type: "monthly",
        date_range: "Past 30 Days",
        generated_at: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        size: "340 KB",
        status: "ready",
        ai_summary: {
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
        }
      }
    ];

    return NextResponse.json(reports, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to list reports", details: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
