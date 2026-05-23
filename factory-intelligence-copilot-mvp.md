# FACTORY INTELLIGENCE COPILOT
## Refined MVP Specification — Agent-Ready Build Document
### Version 2.0 | May 2026

---

## PRODUCT OVERVIEW

**Product Name:** Forge AI — Factory Intelligence Copilot
**Tagline:** "Your factory thinks now."
**Category:** AI-Native Industrial Operations Intelligence Platform
**Target Industry:** Steel Manufacturing / Heavy Industry

Forge AI is not a dashboard. It is an AI-native operations copilot that sits on top of factory data and acts as the intelligent brain of a steel manufacturing enterprise. It monitors, predicts, explains, and recommends — continuously. Every screen is powered by a live AI layer that thinks alongside the operator, manager, and executive.

---

## PRODUCT PHILOSOPHY (READ BEFORE BUILDING ANYTHING)

These rules must be respected in every component, page, and interaction:

1. **AI is the product, not a feature.** Every view must surface AI insight, not just data.
2. **Explain, don't just alert.** The AI must always say *why*, not just *what*.
3. **Predict before problems occur.** At least one predictive insight must be visible on every dashboard.
4. **Copilot is always present.** The AI panel is never hidden, collapsed, or secondary.
5. **Data is always live.** All metrics update every 30 seconds via WebSocket. Show a live pulse indicator.
6. **Zero generic dashboards.** No chart without an AI annotation. No KPI without a trend direction.

---

## DESIGN SYSTEM

### Brand Identity

**Primary Palette:**
```
Background Base:      #0A0A0F   (near-black with blue undertone)
Surface 1:            #0F0F1A   (cards, panels)
Surface 2:            #14142A   (elevated elements)
Surface 3:            #1A1A35   (hover states)

Purple Primary:       #7C3AED   (Violet-600)
Purple Bright:        #8B5CF6   (Violet-500, glow effects)
Purple Glow:          #A78BFA   (Violet-400, text on dark)
Purple Muted:         #4C1D95   (borders, subtle fills)

Accent Cyan:          #06B6D4   (live indicators, real-time data)
Accent Emerald:       #10B981   (healthy/good states)
Accent Amber:         #F59E0B   (warning states)
Accent Rose:          #F43F5E   (critical/error states)

Text Primary:         #F1F5F9   (main text)
Text Secondary:       #94A3B8   (labels, captions)
Text Muted:           #475569   (disabled, placeholder)

Border Default:       rgba(124, 58, 237, 0.15)
Border Bright:        rgba(124, 58, 237, 0.4)
```

**Typography:**
```
Font Display:   'Inter' (headings, KPI numbers)
Font Mono:      'JetBrains Mono' (sensor values, code, IDs)
Font UI:        'Inter' (body, labels, captions)

Scale:
  xs:    11px / 0.6875rem
  sm:    12px / 0.75rem
  base:  14px / 0.875rem
  md:    16px / 1rem
  lg:    18px / 1.125rem
  xl:    24px / 1.5rem
  2xl:   30px / 1.875rem
  3xl:   36px / 2.25rem
  kpi:   42px / 2.625rem  (KPI numbers only)
```

### UI Language

**Glassmorphism Cards:**
```css
background: rgba(15, 15, 26, 0.8);
backdrop-filter: blur(16px);
border: 1px solid rgba(124, 58, 237, 0.2);
border-radius: 12px;
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.04);
```

**Purple Glow on Active/Hover:**
```css
box-shadow: 0 0 20px rgba(124, 58, 237, 0.3), 0 0 60px rgba(124, 58, 237, 0.1);
```

**AI Panel Accent:**
```css
border-left: 3px solid #7C3AED;
background: linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(15, 15, 26, 0.9) 100%);
```

**Live Pulse Indicator (animated):**
```css
/* Small pulsing dot for real-time data */
width: 8px; height: 8px;
border-radius: 50%;
background: #06B6D4;
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4);
```

**KPI Cards:**
- Background: Surface 1 with subtle radial gradient from purple at top-left
- Number: 42px bold Inter, Text Primary
- Delta badge: pill shape, green/red background with arrow icon
- Sparkline: 20px tall, fills bottom of card, purple/cyan gradient

**Charts:**
- Background: transparent (inherits card)
- Grid lines: rgba(255,255,255,0.04)
- Axis labels: Text Muted, 11px
- Line charts: purple-to-cyan gradient stroke, glow effect
- Bar charts: purple fill, 60% opacity bars with 100% hover
- Area charts: purple-to-transparent gradient fill

**Status Indicators:**
```
● #10B981  — Operational / Healthy
● #F59E0B  — Warning / Degraded
● #F43F5E  — Critical / Alert
● #06B6D4  — Live / Active
● #475569  — Offline / Idle
```

### Layout Architecture

Every dashboard follows this exact grid:

```
┌─────────────────────────────────────────────────────────────────┐
│  TOPBAR: Logo | Role Selector | Plant Selector | Live Status    │
├─────────────────────────────────────────────────────────────────┤
│  SIDEBAR (collapsed icon | expanded label)                       │
│  ┌──────────────────────────────────────┬──────────────────────┐│
│  │  MAIN CONTENT AREA (70%)             │  AI COPILOT (30%)    ││
│  │                                      │                      ││
│  │  KPI Row (4–6 cards)                 │  AI Summary Card     ││
│  │                                      │  ─────────────────   ││
│  │  Charts Row (2 charts)               │  Recommendations     ││
│  │                                      │  (3–5 cards)         ││
│  │  Charts Row (2 charts)               │  ─────────────────   ││
│  │                                      │  Alerts & Signals    ││
│  │  Table / Widget Row                  │  ─────────────────   ││
│  │                                      │  AI Chat Interface   ││
│  └──────────────────────────────────────┴──────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Sidebar items:**
- Overview (home icon)
- CXO Dashboard
- Technical Dashboard
- Floor Dashboard
- Reports
- Settings

**Topbar right section:**
- Plant selector dropdown (Plant A / B / C)
- Live pulse dot + "LIVE" text in cyan
- Last refresh timestamp
- User avatar + role badge

---

## TECH STACK

### Frontend
```
Framework:        Next.js 15 (App Router, React Server Components)
Language:         TypeScript 5.x (strict mode)
Styling:          Tailwind CSS v4
UI Components:    shadcn/ui (customized to design system)
Charts:           Recharts 2.x
Animations:       Framer Motion 11
Data Fetching:    TanStack Query v5
Real-Time:        Socket.IO client (WebSocket fallback)
State:            Zustand (lightweight global state)
Forms:            React Hook Form + Zod
Icons:            Lucide React
Fonts:            next/font (Inter + JetBrains Mono)
```

### Backend
```
Framework:        FastAPI (Python 3.12)
Validation:       Pydantic v2
ORM:              SQLAlchemy 2.0 (async)
WebSocket:        FastAPI WebSocket (native)
Task Queue:       APScheduler (periodic data refresh)
AI Orchestration: LangChain + LangGraph
LLM:              Anthropic Claude claude-sonnet-4-20250514 (primary) with OpenAI GPT-4o fallback
Vector DB:        pgvector (PostgreSQL extension)
Auth:             Clerk (JWT verification in FastAPI middleware)
```

### Infrastructure
```
Database:         PostgreSQL 16 (Supabase hosted)
Vector Search:    pgvector extension on same DB
Cache:            Redis (Upstash serverless)
File Storage:     Supabase Storage (for reports)
Frontend Host:    Vercel
Backend Host:     Railway (or Fly.io)
Containerization: Docker + docker-compose for local dev
Observability:    Sentry (errors) + Vercel Analytics
```

### AI Layer
```
Primary LLM:      Claude claude-sonnet-4-20250514 (executive summaries, RCA, recommendations)
Streaming:        Anthropic streaming API for chat
Rules Engine:     Custom Python rules evaluated every 30s
Analytics Engine: Custom Python calculations (OEE, MTBF, MTTR, etc.)
Embeddings:       text-embedding-3-small (factory context RAG)
LLM Observability: LangSmith
```

---

## DATABASE SCHEMA

### Core Tables

```sql
-- Plants
CREATE TABLE plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  location VARCHAR(200),
  capacity_tons_per_day INTEGER,
  status VARCHAR(20) DEFAULT 'operational', -- operational | maintenance | offline
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production Lines
CREATE TABLE production_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID REFERENCES plants(id),
  name VARCHAR(100) NOT NULL,
  line_type VARCHAR(50), -- rolling | casting | finishing | annealing
  capacity_tons_per_hour DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'running', -- running | idle | maintenance | fault
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Machines
CREATE TABLE machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID REFERENCES plants(id),
  line_id UUID REFERENCES production_lines(id),
  name VARCHAR(100) NOT NULL,
  machine_type VARCHAR(50), -- furnace | conveyor | roller | crane | sensor
  manufacturer VARCHAR(100),
  installation_date DATE,
  last_maintenance DATE,
  next_maintenance DATE,
  health_score DECIMAL(5,2), -- 0–100
  status VARCHAR(20) DEFAULT 'operational',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sensor Readings (time-series, partitioned by day)
CREATE TABLE sensor_readings (
  id BIGSERIAL,
  machine_id UUID REFERENCES machines(id),
  sensor_type VARCHAR(50), -- temperature | vibration | pressure | current | flow
  value DECIMAL(12,4),
  unit VARCHAR(20),
  quality_score DECIMAL(3,2), -- 0–1, data quality
  recorded_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- Production Records
CREATE TABLE production_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID REFERENCES plants(id),
  line_id UUID REFERENCES production_lines(id),
  shift VARCHAR(10), -- morning | evening | night
  date DATE NOT NULL,
  target_tons DECIMAL(10,2),
  actual_tons DECIMAL(10,2),
  defect_tons DECIMAL(10,2),
  scrap_tons DECIMAL(10,2),
  oee_score DECIMAL(5,2), -- 0–100
  availability DECIMAL(5,2),
  performance DECIMAL(5,2),
  quality DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Downtime Events
CREATE TABLE downtime_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID REFERENCES machines(id),
  plant_id UUID REFERENCES plants(id),
  cause_category VARCHAR(50), -- mechanical | electrical | process | planned | external
  cause_detail TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER, -- calculated
  impact_tons DECIMAL(10,2),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Logs
CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID REFERENCES machines(id),
  maintenance_type VARCHAR(30), -- preventive | corrective | predictive
  technician VARCHAR(100),
  work_order VARCHAR(50),
  description TEXT,
  parts_replaced TEXT[],
  cost_inr DECIMAL(15,2),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  next_scheduled TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Energy Consumption
CREATE TABLE energy_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID REFERENCES plants(id),
  line_id UUID REFERENCES production_lines(id),
  recorded_hour TIMESTAMPTZ NOT NULL,
  kwh_consumed DECIMAL(12,2),
  cost_inr DECIMAL(12,2),
  peak_demand_kw DECIMAL(10,2),
  energy_intensity DECIMAL(8,4) -- kwh per ton
);

-- Inventory
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID REFERENCES plants(id),
  material_type VARCHAR(50), -- iron_ore | coal | limestone | billets | finished_steel
  material_grade VARCHAR(50),
  quantity_tons DECIMAL(12,2),
  reorder_level DECIMAL(10,2),
  unit_cost_inr DECIMAL(12,2),
  supplier VARCHAR(100),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Shipments
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID REFERENCES plants(id),
  shipment_type VARCHAR(10), -- inbound | outbound
  material_type VARCHAR(50),
  quantity_tons DECIMAL(10,2),
  origin VARCHAR(200),
  destination VARCHAR(200),
  carrier VARCHAR(100),
  scheduled_date DATE,
  actual_date DATE,
  status VARCHAR(20), -- scheduled | in_transit | delayed | delivered | cancelled
  delay_reason TEXT,
  value_inr DECIMAL(15,2)
);

-- Financial Records
CREATE TABLE financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID REFERENCES plants(id),
  month DATE NOT NULL,
  revenue_inr DECIMAL(15,2),
  cost_of_goods_inr DECIMAL(15,2),
  energy_cost_inr DECIMAL(15,2),
  maintenance_cost_inr DECIMAL(15,2),
  labor_cost_inr DECIMAL(15,2),
  logistics_cost_inr DECIMAL(15,2),
  gross_profit_inr DECIMAL(15,2),
  net_profit_inr DECIMAL(15,2),
  tons_produced DECIMAL(10,2),
  tons_sold DECIMAL(10,2)
);

-- Work Orders
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID REFERENCES plants(id),
  line_id UUID REFERENCES production_lines(id),
  order_number VARCHAR(50) UNIQUE,
  product_type VARCHAR(100),
  quantity_tons DECIMAL(10,2),
  priority VARCHAR(10), -- urgent | high | normal | low
  status VARCHAR(20), -- pending | in_progress | completed | cancelled
  assigned_team VARCHAR(100),
  due_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- AI Insights Cache
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID REFERENCES plants(id),
  insight_type VARCHAR(30), -- recommendation | alert | summary | prediction | rca
  role_target VARCHAR(20), -- cxo | technical | floor | all
  title VARCHAR(200),
  body TEXT NOT NULL,
  severity VARCHAR(10), -- info | warning | critical | opportunity
  confidence_score DECIMAL(3,2), -- 0–1
  data_snapshot JSONB,
  embedding vector(1536),
  is_active BOOLEAN DEFAULT TRUE,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Chat History
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id VARCHAR(100), -- Clerk user ID
  role VARCHAR(10), -- user | assistant
  content TEXT NOT NULL,
  role_context VARCHAR(20), -- cxo | technical | floor
  plant_id UUID REFERENCES plants(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## SEED DATA REQUIREMENTS

### Data Volume
```
Plants:              3 (Plant A — Mumbai, Plant B — Pune, Plant C — Surat)
Production Lines:    5 per plant (15 total)
Machines:            20+ per plant (60+ total)
Historical Period:   90 days of daily records
Sensor Readings:     Every 5 minutes per machine = ~500K rows
Financial Records:   Monthly for 12 months
Work Orders:         50 active per plant
Shipments:           30 per plant (mix inbound/outbound)
Downtime Events:     200 per plant over 90 days
Maintenance Logs:    150 per plant over 90 days
```

### Plants Configuration

**Plant A — Mumbai (Flagship)**
- Status: Operational
- Capacity: 800 tons/day
- Lines: Blast Furnace Line, Electric Arc Furnace Line, Rolling Mill, Finishing Line, Cold Rolling
- Furnaces: BF-1, BF-2 (large), EAF-1, EAF-2
- OEE: ~82% (healthy but improvable)

**Plant B — Pune (Underperforming)**
- Status: Partially degraded
- Capacity: 600 tons/day
- Lines: Same types but older equipment
- Furnace 2 has a developing bearing issue (vibration anomaly trending up)
- OEE: ~67% (pull this plant into AI alerts)
- High downtime, high energy per ton

**Plant C — Surat (New, High Efficiency)**
- Status: Operational, modern
- Capacity: 500 tons/day
- OEE: ~91%
- Best energy intensity

### Realistic Data Patterns
- Production follows shifts (3 shifts × 8 hours)
- Night shift has ~8% lower OEE
- Mondays have highest planned maintenance
- Energy spikes at peak demand hours (10am–12pm, 3pm–6pm)
- Furnace temperature readings: 1400–1650°C with ±5% variation
- Vibration baseline: 2.1 mm/s, alert threshold: 4.0 mm/s
- Plant B Furnace 2 vibration: trending from 2.8 → 4.2 mm/s over 14 days
- Revenue seasonality: Q3 slightly lower, Q4 strong

---

## APPLICATION ROUTES AND PAGES

```
/                         → Redirect to /login
/login                    → Auth page (Clerk hosted UI, custom styled)
/onboarding               → Role + plant selection after first login
/dashboard/cxo            → CXO Executive Dashboard
/dashboard/technical      → Technical Manager Dashboard
/dashboard/floor          → Floor Manager Dashboard
/reports                  → Report center (daily/weekly/monthly)
/reports/[reportId]       → Single report view
/chat                     → Full-screen AI chat interface
/settings                 → User + plant settings
/settings/notifications   → Alert preferences
```

---

## DETAILED COMPONENT SPECS

### Global Components

#### TopBar
```
Left:   Logo (purple gradient "⬡ Forge AI") | Product name
Center: Breadcrumb with current dashboard name
Right:  
  - Plant Selector (dropdown with status dots per plant)
  - Refresh Indicator (animated when fetching, "30s" countdown)
  - Live Indicator (pulsing cyan dot + "LIVE" text)
  - Notification Bell (badge count)
  - User Avatar + Role Badge (CXO | TECHNICAL | FLOOR)
```

#### Sidebar
```
Width: 64px (collapsed) / 220px (expanded)
Toggle: Click logo area or hamburger
Items (icon + label):
  - Overview
  - CXO (crown icon)
  - Technical (cpu icon)
  - Floor (factory icon)
  - Reports (file-text icon)
  - AI Chat (sparkles icon)
  - Settings (settings icon)
Bottom: 
  - Theme indicator (always dark)
  - App version
```

#### AI Copilot Panel (30% right column — always visible)
```
Header:
  - "⚡ AI Copilot" with purple glow badge
  - Model indicator: "Powered by Claude"
  - Context: current dashboard name

Section 1 — Executive Summary (auto-generated every 5min):
  Collapsible card with AI-generated paragraph
  Include: period covered, key finding, risk level badge

Section 2 — Recommendations (3–5 cards):
  Each card:
    - Severity badge (critical | warning | opportunity)
    - Short title (1 line)
    - Explanation (2–3 lines)
    - Action button ("Apply" or "Learn More")
    - Confidence percentage

Section 3 — Live Signals:
  Scrollable list of real-time alerts from rules engine
  Each: icon + message + timestamp + machine/plant tag

Section 4 — AI Chat:
  Input: "Ask about this plant..."
  Message history (last 10 messages visible, scrollable)
  Submit button with keyboard shortcut (Cmd+Enter)
  Streaming response (typewriter effect)
  Context-aware: knows which dashboard + plant is active
```

---

## DASHBOARD 1: CXO EXECUTIVE DASHBOARD

### URL: `/dashboard/cxo`

### KPI Row (6 cards)
```
1. Revenue (MTD)
   Value: ₹12.5 Cr
   Delta: +8.2% vs last month (green)
   Sparkline: 30-day revenue trend

2. Net Profit (MTD)
   Value: ₹2.4 Cr
   Delta: +3.1% vs last month
   Margin %: 19.2% in secondary text

3. Plant Utilization
   Value: 82%
   Delta: -2.1% vs last week
   Gauge: mini circular progress

4. Production Output (MTD)
   Value: 11,840 T
   Delta: vs target 12,400 T
   Progress bar: 95.5% of target

5. Energy Cost (MTD)
   Value: ₹45.2 L
   Delta: +5.3% vs last month (red, unfavorable)
   Sub: ₹3.82 / kWh average

6. Operational Losses (MTD)
   Value: ₹18.6 L
   Sub: Breakdown: Downtime 42% | Energy 28% | Defects 30%
   Delta: -12% vs last month (good)
```

### Charts Section

**Row 1:**
```
Left (60%): Revenue & Profit Trend (12-month dual-axis line chart)
  - Line 1: Revenue (purple, solid)
  - Line 2: Net Profit (cyan, dashed)
  - Area fill under revenue
  - Vertical annotation line: "Furnace B upgrade" event
  - AI annotation bubble: "Revenue dip in Oct linked to Plant B downtime"

Right (40%): Loss Sources (Donut chart)
  - Segments: Downtime | Energy Waste | Defects | Scrap | Logistics
  - Center: Total ₹18.6L
  - Legend with % and ₹ value per segment
  - Hover: expand detail
```

**Row 2:**
```
Left (50%): Factory Comparison (Grouped bar chart)
  - X: Plants A, B, C
  - Bars: Revenue | OEE | Utilization (3 grouped bars per plant)
  - Toggle: switch between metrics
  - Plant B bars clearly lower — visual cue for problem

Right (50%): Energy Cost Trend (Line chart, 30 days)
  - Line: Daily energy cost in lakhs
  - Threshold line: Budget limit (amber dashed)
  - Highlighted zones: Peak hours surcharges
  - AI note: "Plant B accounts for 38% of total energy spend at 12% lower efficiency"
```

**Row 3:**
```
Full width: Revenue Forecast (next 30 days)
  - Historical actuals + forecast line with confidence band (shaded purple)
  - Scenarios: Base | Optimistic | Pessimistic (toggle)
  - AI note on forecast: what assumptions were made
```

### CXO AI Chat — Suggested Prompts (shown as chips):
```
"Why did profit drop in November?"
"Which plant is dragging overall performance?"
"What's our largest operational risk this month?"
"Forecast next month's revenue"
"Where should we invest to improve margins?"
"Compare energy efficiency across all plants"
```

---

## DASHBOARD 2: TECHNICAL MANAGER DASHBOARD

### URL: `/dashboard/technical`

### KPI Row (6 cards)
```
1. OEE (Overall Equipment Effectiveness)
   Value: 78.4%
   Sub: Availability 88% | Performance 91% | Quality 97%
   Delta: -3.2% this week

2. Total Downtime (This Week)
   Value: 142 hrs
   Delta: +18 hrs vs last week (red)
   Sub: Planned 40hrs | Unplanned 102hrs

3. MTBF (Mean Time Between Failures)
   Value: 218 hrs
   Delta: -12 hrs vs last month
   Sub: Target: 240 hrs

4. MTTR (Mean Time To Repair)
   Value: 4.2 hrs
   Delta: +0.8 hrs vs last month (red)
   Sub: Target: <3.5 hrs

5. Sensor Health
   Value: 94.2%
   Sub: 3 offline | 2 degraded
   Color: Amber (not green)

6. Open Incidents
   Value: 7
   Sub: Critical: 2 | Warning: 5
   Delta: +3 vs yesterday (red)
```

### Charts Section

**Row 1:**
```
Left (50%): OEE Trend (30-day line chart)
  - Three lines: Availability, Performance, Quality
  - OEE composite as bold purple line
  - Target line (dashed amber)
  - Annotations at dip points with cause tags

Right (50%): Downtime by Machine (Horizontal bar chart, top 10)
  - Sorted by hours descending
  - Color: planned (purple muted) | unplanned (rose)
  - Furnace 2 Plant B clearly highlighted as top offender
```

**Row 2:**
```
Left (40%): Sensor Availability Grid (heatmap-style)
  - Rows: Machines
  - Columns: Last 14 days
  - Cell color: green/amber/red = online/degraded/offline
  - Click cell: drill into sensor detail

Right (60%): Equipment Health Score Ranking (Table + mini bars)
  Machine       | Plant | Health | Trend  | Next Maint
  BF-1          | A     | 94%   | ↑+1%  | 18 days
  EAF-1         | A     | 91%   | →0%   | 32 days
  Furnace-2     | B     | 67%   | ↓-8%  | OVERDUE (red)
  Rolling-Mill-3| C     | 88%   | ↑+2%  | 22 days
  [+15 more rows with pagination]
```

**Row 3:**
```
Left (50%): Maintenance Calendar (mini calendar view)
  - Color coded: green=done, amber=upcoming, red=overdue
  - Click day: show work orders for that day
  - Integration with work orders table

Right (50%): Network & PLC Status (status panel grid)
  - Each PLC: name | status dot | latency | last ping
  - Network segments: status + packet loss %
  - Alert if latency >100ms or packet loss >1%
```

### Technical AI Insights (in Copilot Panel)
```
CRITICAL INSIGHT (red badge):
Title: "Furnace 2 — Bearing Failure Risk"
Body: "Vibration readings on Furnace 2 (Plant B) have increased 17% over 14 days,
       from baseline 2.1 mm/s to 3.8 mm/s today. Pattern matches bearing wear 
       degradation profile. Estimated failure probability: 68% within 10 days.
       Likely root cause: cooling water flow inconsistency causing thermal stress 
       on bearing housing. Estimated revenue impact if unplanned failure: ₹12.4L."
Actions: [Schedule Inspection] [Reduce Load 20%] [View Sensor Data]

OPPORTUNITY (green badge):
Title: "OEE can improve +4.2% with shift rebalancing"
Body: "Night shift consistently underperforms day shift by 8.3%. Analysis shows
       the gap is primarily in the Performance factor (tooling setup delays).
       Suggested: move senior operator Shift B crew to night rotation."
```

### Technical AI Chat — Suggested Prompts:
```
"Predict next machine failure across all plants"
"Root cause analysis for yesterday's Line 3 outage"
"Which machine is responsible for most downtime this month?"
"Why did OEE drop on Plant B this week?"
"Show maintenance schedule for Furnace 2"
"What's causing the vibration spike on Furnace 2?"
```

---

## DASHBOARD 3: FLOOR MANAGER DASHBOARD

### URL: `/dashboard/floor`

### KPI Row (6 cards, shift-focused)
```
1. Today's Target
   Value: 620 T
   Sub: Shift: Morning | Date: Today

2. Produced So Far
   Value: 387 T
   Progress bar under: 62.4% of target
   Sub: At current pace: 8hrs remaining

3. Remaining to Target
   Value: 233 T
   Sub: Required pace: 48.5 T/hr
   Color: Amber (current pace is 44 T/hr — below needed)

4. Defect Rate (Today)
   Value: 2.1%
   Delta: +0.4% vs target (red)
   Sub: 8.1 T rejected today

5. Incoming Materials
   Value: 3 shipments
   Sub: Next: Iron Ore 240T — ETA 2:30 PM
   Color: Green (on schedule)

6. Outgoing Shipments
   Value: 2 loads
   Sub: Next departure: 4:00 PM, Customer: JSW
   Status: On Track
```

### Main Widgets

**Row 1 (Full width):**
```
Production Progress Timeline (horizontal Gantt-like bar)
  - Shows shift duration (8hrs)
  - Actual production filled (purple)
  - Target line (white dashed vertical at 100%)
  - Pace projection line (shows where we'll end up)
  - Events marked: downtime blocks (red), breaks (grey)
  - Current time indicator (cyan vertical line)
```

**Row 2:**
```
Left (55%): FACTORY FLOOR MAP — Digital Twin View
  Visual grid representing the factory floor layout
  
  Layout (SVG-based, interactive):
  ┌────────────────────────────────────────────┐
  │  [BF-1 🟢]  [BF-2 🟡]  [EAF-1 🟢]        │
  │                                            │
  │  ══════════════ Conveyor ════════════════  │
  │                                            │
  │  [Line 1 🟢]  [Line 2 🟢]  [Line 3 🔴]   │
  │                                            │
  │  [Crane A 🟢]  [Crane B 🟢]               │
  │                                            │
  │  [Finished Goods Bay]  [Raw Material Bay]  │
  └────────────────────────────────────────────┘

  Each node:
    - Machine name
    - Status color ring (green/amber/red/grey)
    - Click → side panel with live sensor readings
    - Pulsing animation on active machines
    - Tooltip: health %, current output, last reading

Right (45%): Live Work Orders Table
  # | Order    | Product     | Qty   | Priority | Status      | Team
  1 | WO-0554  | HRC Coil    | 80T   | URGENT   | In Progress | Team B
  2 | WO-0551  | TMT Rebar   | 120T  | High     | In Progress | Team A
  3 | WO-0548  | Billets     | 50T   | Normal   | Queued      | Team C
  [Color coded rows by priority]
  [Status badges: animated green for in-progress]
```

**Row 3:**
```
Left (50%): Shipment Schedule (today)
  TYPE     | MATERIAL    | QTY   | ETA/ETD    | STATUS
  Inbound  | Iron Ore    | 240T  | 2:30 PM   | On Track 🟢
  Inbound  | Limestone   | 45T   | 5:00 PM   | Delayed 🔴 (+2hrs)
  Outbound | HRC Coils   | 180T  | 4:00 PM   | Ready 🟢
  Outbound | TMT Rebar   | 95T   | Tomorrow  | In Queue ⚪

Right (50%): Incoming Material Schedule
  Shows inventory levels + incoming restocks
  Progress bars per material: current vs reorder level vs max capacity
  Alert if any material <10% above reorder level
```

### Floor AI Assistant (in Copilot Panel)
```
ALERT (amber):
"Current production pace is 7% below target. At 44 T/hr vs required 48.5 T/hr,
 Line 3 slowdown (bearing issue since 11:20 AM) is the primary bottleneck.
 Risk: You may miss today's target by approximately 85 tons."

RECOMMENDATION 1:
"Reassign Team B from idle WO-0549 to support Line 1 throughput boost."

RECOMMENDATION 2:
"Prioritize Work Order #554 (HRC Coil) — customer delivery penalty applies
 if not shipped by 4:00 PM."

RECOMMENDATION 3:
"Request expedited delivery on incoming Iron Ore shipment (currently delayed +2hrs).
 Current ore inventory: 6.2 hrs of runway."
```

### Floor AI Chat — Suggested Prompts:
```
"Will we hit today's production target?"
"Which work order should I prioritize right now?"
"Where is the current bottleneck on the floor?"
"What's the status of the Line 3 issue?"
"Which shipment is at risk of delay?"
"How should I reallocate teams for this shift?"
```

---

## REPORTS PAGE

### URL: `/reports`

### Report Types
```
1. Daily Operations Summary (auto-generated every morning at 7:00 AM)
2. Weekly Performance Report (every Monday)
3. Monthly Executive Report (1st of every month)
4. Custom Date Range Report (user-generated)
5. Incident Report (triggered by events)
6. Maintenance Report
7. Energy Report
```

### Report Layout
```
Header:
  Logo | Report Title | Date Range | Plant(s) | Generated By

Sections (for Daily Ops example):
  1. AI Executive Summary (GPT-generated paragraph)
  2. Production KPIs vs Targets (table)
  3. Downtime Events (table with root causes)
  4. Top 3 Recommendations
  5. Charts (production, OEE, energy)
  6. Tomorrow's Priorities (AI-generated)

Actions:
  [Download PDF] [Send Email] [Share Link] [Schedule]
```

---

## AI SYSTEM ARCHITECTURE

### Layer 1: Rules Engine (Python, runs every 30 seconds)

```python
RULES = [
  # Machine health rules
  { "id": "R001", "name": "Low Machine Health",
    "condition": lambda m: m.health_score < 70,
    "severity": "critical",
    "message": "Machine {name} health score below 70% — schedule inspection",
    "roles": ["technical", "floor"] },

  { "id": "R002", "name": "Vibration Anomaly",
    "condition": lambda s: s.vibration_mm_s > 3.5,
    "severity": "warning",
    "message": "Vibration on {machine} at {value} mm/s — 67% above baseline",
    "roles": ["technical"] },

  { "id": "R003", "name": "Overdue Maintenance",
    "condition": lambda m: m.next_maintenance < today,
    "severity": "critical",
    "message": "{machine} maintenance overdue by {days} days",
    "roles": ["technical", "floor"] },

  # Production rules
  { "id": "R010", "name": "Pace Below Target",
    "condition": lambda p: p.current_pace < p.required_pace * 0.92,
    "severity": "warning",
    "message": "Production pace {current} T/hr vs required {required} T/hr",
    "roles": ["floor"] },

  { "id": "R011", "name": "Defect Rate High",
    "condition": lambda p: p.defect_rate > 0.03,
    "severity": "warning",
    "message": "Defect rate {rate}% exceeds 3% threshold",
    "roles": ["floor", "technical"] },

  # Energy rules
  { "id": "R020", "name": "Energy Cost Spike",
    "condition": lambda e: e.cost_per_ton > e.budget_per_ton * 1.15,
    "severity": "warning",
    "message": "Energy cost ₹{cost}/ton — 15% above budget",
    "roles": ["cxo", "technical"] },

  # Inventory rules
  { "id": "R030", "name": "Low Inventory",
    "condition": lambda i: i.quantity_tons < i.reorder_level * 1.1,
    "severity": "warning",
    "message": "{material} inventory at {hours} hrs of runway",
    "roles": ["floor", "cxo"] },

  # Shipment rules
  { "id": "R040", "name": "Shipment Delayed",
    "condition": lambda s: s.status == "delayed",
    "severity": "warning",
    "message": "Inbound {material} shipment delayed {hours} hrs",
    "roles": ["floor"] },
]
```

### Layer 2: Analytics Engine (Python calculations)

```python
class AnalyticsEngine:
    def calculate_oee(self, plant_id, period):
        # OEE = Availability × Performance × Quality
        availability = (planned_time - downtime) / planned_time
        performance = actual_output / (theoretical_rate × run_time)
        quality = (actual_output - defects) / actual_output
        return availability * performance * quality * 100

    def calculate_mtbf(self, machine_id, period):
        # Mean Time Between Failures
        total_uptime = sum(uptime_periods)
        failure_count = count_failures(machine_id, period)
        return total_uptime / failure_count if failure_count > 0 else None

    def calculate_mttr(self, machine_id, period):
        # Mean Time To Repair
        downtime_events = get_downtime_events(machine_id, period)
        return mean([e.duration_minutes / 60 for e in downtime_events])

    def calculate_plant_utilization(self, plant_id, period):
        actual_hours = get_production_hours(plant_id, period)
        max_hours = get_calendar_hours(period)
        return (actual_hours / max_hours) * 100

    def predict_machine_failure(self, machine_id):
        # Simple regression on sensor trend data
        recent_readings = get_sensor_readings(machine_id, days=14)
        vibration_trend = linear_regression(recent_readings['vibration'])
        threshold = 4.0  # mm/s
        days_to_threshold = (threshold - current_value) / daily_increase
        probability = sigmoid_failure_curve(days_to_threshold)
        return { "days": days_to_threshold, "probability": probability }

    def forecast_revenue(self, plant_id, months_ahead):
        # Time-series forecasting (exponential smoothing)
        historical = get_financial_records(plant_id, months=12)
        return exponential_smoothing_forecast(historical, months_ahead)
```

### Layer 3: LLM Layer (Claude claude-sonnet-4-20250514)

```python
SYSTEM_PROMPTS = {
  "cxo": """You are Forge AI, an industrial intelligence copilot for a steel manufacturing 
  enterprise. You are speaking with the CXO/Executive. Focus on: revenue, profit, plant 
  utilization, costs, risks, and business outcomes. Never discuss machine-level details 
  unless they directly affect business metrics. Be concise, confident, and data-driven. 
  Always quantify impact in ₹ (Indian Rupees) and tons. Current plant data: {plant_context}""",

  "technical": """You are Forge AI, speaking with the Technical Manager. Focus on: OEE, 
  equipment health, MTBF, MTTR, failure prediction, root cause analysis, sensor data, 
  and maintenance planning. Be specific with machine names, measurements, and technical 
  details. Always suggest specific actions. Current plant data: {plant_context}""",

  "floor": """You are Forge AI, speaking with the Floor Manager. Focus on: current shift 
  performance, production pace, work orders, material flow, team allocation, and immediate 
  actions needed in the next 2–4 hours. Use simple language. Be direct about priorities. 
  Current shift data: {shift_context}"""
}

async def generate_executive_summary(plant_data, role):
    prompt = f"""Based on this factory data, generate a 3-sentence executive summary 
    for the {role}. Be specific with numbers. Identify the #1 problem and #1 opportunity.
    
    Data: {json.dumps(plant_data)}"""
    
    # Stream response for chat, single response for summary panels
    response = await anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=500,
        system=SYSTEM_PROMPTS[role],
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text
```

---

## API SPECIFICATIONS

### Base URL: `https://api.forgeai.com/v1`

### Authentication
All endpoints require Bearer token from Clerk. Role is extracted from JWT claims.

### Key Endpoints

```
GET  /plants                          → List all plants with status
GET  /plants/{id}/summary             → Plant-level KPI summary
GET  /plants/{id}/oee                 → OEE breakdown (params: period, line_id)
GET  /plants/{id}/production          → Production records (params: date, shift)
GET  /plants/{id}/downtime            → Downtime events (params: period, machine_id)
GET  /plants/{id}/energy              → Energy records (params: period)
GET  /plants/{id}/machines            → Machine list with health scores
GET  /plants/{id}/machines/{mid}/sensors → Sensor readings (params: type, period)
GET  /plants/{id}/inventory           → Current inventory levels
GET  /plants/{id}/shipments           → Shipment schedule (params: type, date_range)
GET  /plants/{id}/work-orders         → Active work orders
GET  /plants/{id}/maintenance         → Maintenance calendar
GET  /plants/{id}/financial           → Financial records (params: period)
GET  /plants/{id}/alerts              → Active alerts from rules engine
GET  /plants/{id}/insights            → Cached AI insights (params: role, type)
POST /ai/summary                      → Generate AI summary (body: plant_id, role, context)
POST /ai/recommendation               → Get AI recommendation (body: alert_id or data)
POST /chat/message                    → Send chat message, get streaming response
GET  /chat/sessions/{id}/history      → Chat history for session
POST /reports/generate                → Trigger report generation
GET  /reports                         → List available reports
GET  /reports/{id}                    → Download/view specific report
GET  /dashboard/cxo                   → Aggregated CXO data (all plants, all KPIs)
GET  /dashboard/technical             → Technical dashboard data
GET  /dashboard/floor                 → Floor dashboard data (shift-aware)
WS   /ws/live/{plant_id}             → WebSocket for real-time updates
```

### WebSocket Protocol

```json
// Client connects: ws://api.forgeai.com/ws/live/{plant_id}?role=cxo&token=...

// Server pushes every 30s:
{
  "type": "metrics_update",
  "timestamp": "2026-05-21T10:30:00Z",
  "data": {
    "kpis": { "oee": 78.4, "production_today": 387, ... },
    "alerts": [{ "id": "...", "severity": "warning", "message": "..." }],
    "machine_statuses": [{ "id": "...", "status": "running", "health": 94 }]
  }
}

// Server pushes immediately on event:
{
  "type": "alert",
  "severity": "critical",
  "alert_id": "...",
  "message": "Furnace 2 vibration exceeded threshold",
  "timestamp": "..."
}

// Client sends:
{
  "type": "subscribe",
  "channels": ["kpis", "alerts", "machines"],
  "plant_id": "..."
}
```

---

## FOLDER STRUCTURE

### Frontend (Next.js)
```
forge-ai/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                 ← Shared layout with sidebar + topbar
│   │   ├── dashboard/
│   │   │   ├── cxo/page.tsx
│   │   │   ├── technical/page.tsx
│   │   │   └── floor/page.tsx
│   │   ├── reports/
│   │   │   ├── page.tsx
│   │   │   └── [reportId]/page.tsx
│   │   ├── chat/page.tsx
│   │   └── settings/page.tsx
│   ├── globals.css
│   └── layout.tsx                     ← Root layout (fonts, providers)
├── components/
│   ├── layout/
│   │   ├── Topbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── AICopilotPanel.tsx         ← The persistent AI panel (30%)
│   ├── kpi/
│   │   ├── KPICard.tsx
│   │   ├── KPISparkline.tsx
│   │   └── KPIGrid.tsx
│   ├── charts/
│   │   ├── RevenueChart.tsx
│   │   ├── OEETrendChart.tsx
│   │   ├── DowntimeBarChart.tsx
│   │   ├── EnergyChart.tsx
│   │   ├── PlantComparisonChart.tsx
│   │   ├── ForecastChart.tsx
│   │   └── SensorHeatmap.tsx
│   ├── floor/
│   │   ├── FactoryFloorMap.tsx        ← SVG digital twin
│   │   ├── ProductionTimeline.tsx
│   │   ├── WorkOrderTable.tsx
│   │   └── ShipmentSchedule.tsx
│   ├── ai/
│   │   ├── AIChat.tsx
│   │   ├── AISummaryCard.tsx
│   │   ├── RecommendationCard.tsx
│   │   └── AlertSignalList.tsx
│   ├── ui/                            ← shadcn/ui customized components
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── progress.tsx
│   │   └── ...
│   └── shared/
│       ├── LiveIndicator.tsx
│       ├── StatusDot.tsx
│       ├── PlantSelector.tsx
│       └── RefreshCountdown.tsx
├── lib/
│   ├── api.ts                         ← API client (TanStack Query)
│   ├── websocket.ts                   ← WebSocket hook
│   ├── store.ts                       ← Zustand global state
│   ├── utils.ts                       ← formatters, helpers
│   └── constants.ts                   ← colors, thresholds
├── hooks/
│   ├── useDashboardData.ts
│   ├── useWebSocket.ts
│   ├── useAIChat.ts
│   └── usePlant.ts
├── types/
│   ├── plant.ts
│   ├── machine.ts
│   ├── production.ts
│   └── ai.ts
├── public/
│   └── fonts/
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

### Backend (FastAPI)
```
forge-api/
├── app/
│   ├── main.py                        ← FastAPI app + router mounting
│   ├── config.py                      ← Settings (pydantic-settings)
│   ├── database.py                    ← Async SQLAlchemy session
│   ├── models/                        ← SQLAlchemy ORM models
│   │   ├── plant.py
│   │   ├── machine.py
│   │   ├── production.py
│   │   ├── financial.py
│   │   └── ai_insight.py
│   ├── schemas/                       ← Pydantic v2 schemas
│   │   ├── plant.py
│   │   ├── dashboard.py
│   │   └── ai.py
│   ├── routers/
│   │   ├── plants.py
│   │   ├── dashboard.py
│   │   ├── ai.py
│   │   ├── chat.py
│   │   ├── reports.py
│   │   └── websocket.py
│   ├── services/
│   │   ├── analytics.py               ← OEE, MTBF, MTTR, utilization
│   │   ├── rules_engine.py            ← Rules evaluation
│   │   ├── ai_service.py              ← Claude API calls
│   │   ├── report_service.py          ← Report generation
│   │   └── prediction_service.py     ← Failure + demand prediction
│   ├── middleware/
│   │   ├── auth.py                    ← Clerk JWT verification
│   │   └── cors.py
│   └── tasks/
│       ├── scheduler.py               ← APScheduler jobs
│       ├── refresh_insights.py        ← Regenerate AI insights every 5min
│       └── seed_realtime.py           ← Simulate live sensor updates
├── scripts/
│   └── seed_data.py                   ← 90-day historical seed script
├── alembic/                           ← DB migrations
├── tests/
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

---

## ENVIRONMENT VARIABLES

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://api.forgeai.com/v1
NEXT_PUBLIC_WS_URL=wss://api.forgeai.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

### Backend (.env)
```
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/forgeai
REDIS_URL=redis://...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...          # Fallback
CLERK_SECRET_KEY=sk_...
CLERK_JWKS_URL=https://...
LANGSMITH_API_KEY=ls__...
SENTRY_DSN=https://...
CORS_ORIGINS=["https://forgeai.vercel.app"]
```

---

## MVP IMPLEMENTATION PRIORITY

### Phase 1 — Core Shell (Week 1)
```
✅ Next.js project setup with design system (colors, typography, Tailwind config)
✅ Layout: Topbar, Sidebar, 70/30 split with AI panel placeholder
✅ FastAPI skeleton with routers
✅ Database schema + Alembic migrations
✅ Seed script (historical 90-day data, 3 plants)
✅ Authentication (Clerk) — login page + role-based redirect
✅ Plant selector connected to real data
```

### Phase 2 — CXO Dashboard (Week 2)
```
✅ All 6 KPI cards with real data
✅ Revenue & Profit trend chart
✅ Loss Sources donut chart
✅ Plant Comparison chart
✅ WebSocket live updates for KPIs
✅ AI Summary panel (static/mock first, then GPT)
✅ CXO AI Chat (streaming)
```

### Phase 3 — Technical Dashboard (Week 3)
```
✅ OEE calculation + display
✅ Equipment Health table
✅ Downtime by machine chart
✅ Sensor heatmap
✅ Maintenance calendar
✅ Failure prediction (rule-based first, then ML)
✅ Technical AI Chat
```

### Phase 4 — Floor Dashboard (Week 4)
```
✅ Production timeline widget
✅ Factory floor SVG map (digital twin)
✅ Work orders table
✅ Shipment schedule
✅ Floor AI assistant
✅ Floor AI Chat
```

### Phase 5 — Reports + Polish (Week 5)
```
✅ Report generation (PDF via puppeteer or weasyprint)
✅ Daily/weekly auto-generation via APScheduler
✅ Rules engine fully wired to UI alerts
✅ AI insights regeneration loop
✅ Performance optimization
✅ Mobile-responsive layout
✅ Full QA pass
```

---

## QUALITY BAR — DEFINITION OF DONE

A screen is only "done" when:

- [ ] All data is real (from DB / seed data), no hardcoded values in UI
- [ ] WebSocket updates reflect on screen within 1s of data change
- [ ] AI panel shows role-appropriate insights (not generic)
- [ ] AI chat works with streaming response
- [ ] All KPI cards show delta vs previous period
- [ ] Charts have AI annotations where meaningful
- [ ] Consistent with design system (colors, spacing, typography)
- [ ] No layout shift on load (use skeleton loaders)
- [ ] Responsive at 1280px minimum (designed for 1440px)
- [ ] Error states handled (empty state, loading state, error state for every data component)

---

## NOTES FOR THE AI CODING AGENT

1. **Start with `seed_data.py`** before building any UI — you need real data to test against.
2. **Build the design system first** — set up Tailwind config with all colors before building components.
3. **The AI panel is NOT optional** — build it in the layout from day one, even with placeholder content.
4. **Use TanStack Query** for all data fetching — it handles caching, refetching, and loading states cleanly.
5. **WebSocket hook** should be a singleton — wrap in Zustand store, not per-component.
6. **Chart data** must come from API, never be generated client-side randomly.
7. **AI summaries** can be generated on page load (POST /ai/summary) and cached in ai_insights table — do not call the LLM on every page visit.
8. **Streaming chat** — use `fetch` with `ReadableStream`, not `axios`, for streaming LLM responses.
9. **Factory floor map** — build as a React SVG component, not an image — machine status must be live.
10. **Claude model string** — always use `claude-sonnet-4-20250514`, never hardcode "GPT-5".

---

*End of Specification — Forge AI Factory Intelligence Copilot MVP v2.0*
