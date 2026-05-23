import asyncio
import json
from typing import AsyncGenerator
from app.config import settings
import httpx

SYSTEM_PROMPTS = {
    "cxo": """You are Forge AI, an industrial intelligence copilot for a steel manufacturing 
enterprise. You are speaking with the CXO/Executive. Focus on: revenue, profit, plant 
utilization, costs, risks, and business outcomes. Never discuss machine-level details 
unless they directly affect business metrics. Be concise, confident, and data-driven. 
Always quantify impact in ₹ (Indian Rupees) and tons.""",

    "technical": """You are Forge AI, speaking with the Technical Manager. Focus on: OEE, 
equipment health, MTBF, MTTR, failure prediction, root cause analysis, sensor data, 
and maintenance planning. Be specific with machine names, measurements, and technical 
details. Always suggest specific actions.""",

    "floor": """You are Forge AI, speaking with the Floor Manager. Focus on: current shift 
performance, production pace, work orders, material flow, team allocation, and immediate 
actions needed in the next 2–4 hours. Use simple language. Be direct about priorities."""
}

MOCK_ANSWERS = {
    "pune": {
        "cxo": "Plant B (Pune) is dragging down overall performance. MTD OEE is at 67% compared to the target of 82%. This has resulted in a net profit loss of approximately ₹18.6L. The primary driver is a degraded bearing on Furnace-2 leading to unplanned downtime and high energy consumption (18% above budget). Recommended action is to approve the urgent maintenance order for Furnace-2.",
        "technical": "Furnace 2 (Plant B) shows a severe vibration anomaly, peaking at 3.8 mm/s against a 2.1 mm/s baseline. This indicates bearing wear with a 68% probability of failure within the next 10 days. MTBF has decreased to 218 hours. We recommend scheduling an immediate inspection and reducing furnace load by 20% to avoid a ₹12.4L unplanned outage.",
        "floor": "Today's target for Pune is 620 Tons, but we are at 387 Tons with 8 hours remaining in the shift. The current pace is 44 T/hr vs the required 48.5 T/hr. The bottleneck is the slowdown on Line 3 (bearing issue on Furnace-2 since 11:20 AM). We will likely miss the shift target by 85 tons. Reassign Team B to support Line 1, and prioritize urgent Work Order #554 (HRC Coil)."
    },
    "mumbai": {
        "cxo": "Plant A (Mumbai) is performing well, with MTD OEE at 82% and capacity utilization at 84%. Revenue generated is ₹12.5 Cr with a profit margin of 19.2%. The main risk is rising energy tariffs, which spiked energy spend by 5.3% this month (₹45.2 L). We recommend scheduling high-demand heats during off-peak power hours.",
        "technical": "OEE is stable at 82.4% with availability at 88%, performance at 91%, and quality at 97%. All critical PLCs are operating with less than 20ms latency. Mechanical inspections for BF-1 are upcoming in 18 days, which will replace conveyor belt joints. Energy intensity is running at 420 kWh/ton.",
        "floor": "Morning shift production is at 345 Tons, representing 98% of the target pace. Material inventory is healthy, with limestone at 12 days of runway. Next shipment of iron ore is scheduled for 2:30 PM. Focus on maintaining current speed on Casting Line 1."
    },
    "surat": {
        "cxo": "Plant C (Surat) remains our most efficient facility, operating at 91% OEE and yielding ₹4.2 Cr in MTD net profit. Energy intensity is at a record low of 380 kWh/ton. Operating costs are completely within budget boundaries, with zero logistics exceptions reported.",
        "technical": "Plant C is operating at near-perfect health, averaging 91.2% OEE. Sensor health is 99% with zero offline sensors. Rolling Mill-3 health score is 88%. Scheduled preventive maintenance is planned for next week to inspect roller alignments.",
        "floor": "Surat is ahead of target by 14 Tons. Shift target of 500 Tons is on track to be exceeded. Inbound logistics are green. Keep monitoring the cooling fan currents on Line 2, which shows a slight 2% rise."
    },
    "default": "I am analyzing the live telemetry for Forge AI. Plant OEE parameters, machine health profiles, and active work order priorities are currently synced. Let me know if you would like me to compile a specific Root Cause Analysis or OEE optimization recommendations."
}

class AIService:
    async def generate_summary(self, plant_name: str, role: str) -> str:
        # Check if keys are placeholders or missing
        use_mock = settings.ANTHROPIC_API_KEY in ["demo-anthropic-key", ""] or "sk-ant" not in settings.ANTHROPIC_API_KEY
        
        if use_mock:
            await asyncio.sleep(0.5) # Simulate latency
            plant_key = "pune" if "pune" in plant_name.lower() else ("surat" if "surat" in plant_name.lower() else "mumbai")
            return MOCK_ANSWERS[plant_key][role]
            
        # Real Anthropic call
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                }
                payload = {
                    "model": "claude-3-5-sonnet-20241022",
                    "max_tokens": 500,
                    "system": SYSTEM_PROMPTS.get(role, SYSTEM_PROMPTS["cxo"]),
                    "messages": [
                        {"role": "user", "content": f"Generate a 3-sentence summary of active issues at {plant_name}."}
                    ]
                }
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers=headers,
                    json=payload,
                    timeout=10.0
                )
                if response.status_code == 200:
                    data = response.json()
                    return data["content"][0]["text"]
        except Exception as e:
            print(f"Error in Anthropic API call: {e}")
            
        # Fallback to mock on error
        plant_key = "pune" if "pune" in plant_name.lower() else ("surat" if "surat" in plant_name.lower() else "mumbai")
        return MOCK_ANSWERS[plant_key][role]

    async def stream_chat(self, prompt: str, plant_name: str, role: str) -> AsyncGenerator[str, None]:
        use_mock = settings.ANTHROPIC_API_KEY in ["demo-anthropic-key", ""] or "sk-ant" not in settings.ANTHROPIC_API_KEY
        
        if use_mock:
            # Generate a context-appropriate answer
            response_text = MOCK_ANSWERS["default"]
            prompt_lower = prompt.lower()
            plant_key = "pune" if "pune" in plant_name.lower() or "b" in plant_name.lower() else ("surat" if "surat" in plant_name.lower() or "c" in plant_name.lower() else "mumbai")
            
            if "why" in prompt_lower or "drop" in prompt_lower or "profit" in prompt_lower or "underperform" in prompt_lower or "drag" in prompt_lower:
                if plant_key == "pune" or "plant b" in prompt_lower:
                    response_text = f"**Root Cause Analysis for Pune Underperformance:**\n\n1. **Equipment Bottleneck**: Furnace-2 bearing vibration is at 3.8 mm/s, causing rolling speeds to drop and creating a 20% throughput drag.\n2. **Energy Inefficiency**: Energy consumption is spike-loaded at peak hours, costing ₹45.2L (12% higher intensity than Mumbai).\n3. **Financial Impact**: Net Profit Margin is depressed at 11.2% (MTD loss of ₹18.6L).\n\n*Recommendation*: Execute the 'Schedule Inspection' action on Pune Furnace-2 to swap the bearing shell and rebalance night shift schedules."
                else:
                    response_text = f"Overall performance is led by Plant C (Surat) operating at 91% OEE. Plant B (Pune) is our primary bottleneck, lagging at 67% OEE due to bearing wear on Furnace-2. Energy expenses at Mumbai are up 5.3% due to high off-peak transition delays."
            elif "furnace" in prompt_lower or "vibration" in prompt_lower or "failure" in prompt_lower or "predict" in prompt_lower:
                response_text = f"**Predictive Alert: Furnace-2 Bearing Reliability**\n\n* **Telemetry Trend**: Vibration rose from 2.8 mm/s to 3.8 mm/s in 14 days (alert limit is 4.0 mm/s).\n* **Probability of Outage**: 68% within the next 10 days.\n* **Root Cause**: Intermittent cooling water pressure leading to thermo-mechanical strain.\n* **Suggested Mitigation**: Reduce furnace capacity load by 20% immediately and schedule an inspection during the Shift A changeover."
            elif "target" in prompt_lower or "pace" in prompt_lower or "prioritize" in prompt_lower or "shift" in prompt_lower:
                response_text = f"**Shift Control Briefing:**\n\n1. **Pace Target**: Current production rate is 44 T/hr against the 48.5 T/hr required to meet today's 620-ton ceiling.\n2. **Work Order Priority**: Prioritize **WO-0554 (80T HRC Coil)** because it has a delay penalty clause firing at 4:00 PM.\n3. **Staff Allocation**: Move 3 technicians from the idle conveyer line (Team B) to Casting Line 1 to support raw feed preheating."
            elif "energy" in prompt_lower or "electricity" in prompt_lower or "cost" in prompt_lower:
                response_text = f"**Energy Consumption Summary:**\n\n* Total MTD Spend: ₹45.2L.\n* Peak Hour Tariff Penalties: Plant B (Pune) had 12 separate spikes this week, adding ₹3.4L in load penalties.\n* Energy Intensity: Surat is running at 380 kWh/ton, Mumbai at 420 kWh/ton, and Pune at 495 kWh/ton. We advise rescheduling Pune Furnace reheating runs to avoid the 3 PM–6 PM peak tariff window."
            else:
                # Default customized by role
                response_text = f"Forge AI synced with **{plant_name}** under **{role.upper()}** dashboard scope. " + MOCK_ANSWERS[plant_key][role]
            
            # Stream the mock response character by character
            words = response_text.split(" ")
            for i in range(len(words)):
                yield words[i] + " "
                await asyncio.sleep(0.04) # Simulate network streaming
            return
            
        # Real Anthropic Streaming call
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                }
                payload = {
                    "model": "claude-3-5-sonnet-20241022",
                    "max_tokens": 1000,
                    "system": SYSTEM_PROMPTS.get(role, SYSTEM_PROMPTS["cxo"]) + f"\nActive Plant Context: {plant_name}",
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": True
                }
                
                # Streaming request
                async with client.stream("POST", "https://api.anthropic.com/v1/messages", headers=headers, json=payload, timeout=20.0) as response:
                    if response.status_code == 200:
                        async for line in response.aiter_lines():
                            if line.startswith("data:"):
                                line_data = line[5:].strip()
                                if line_data == "[DONE]":
                                    break
                                try:
                                    event = json.loads(line_data)
                                    if event.get("type") == "content_block_delta":
                                        yield event["delta"]["text"]
                                except Exception:
                                    pass
                    else:
                        yield "AI Service encountered a connection issue (HTTP " + str(response.status_code) + "). Falling back to local assistant mode..."
                        async for chunk in self.stream_chat(prompt, plant_name, role):
                            yield chunk
        except Exception as e:
            print(f"Error in stream_chat: {e}")
            yield "AI service fallback activated. "
            # Fallback to mock
            plant_key = "pune" if "pune" in plant_name.lower() or "b" in plant_name.lower() else ("surat" if "surat" in plant_name.lower() or "c" in plant_name.lower() else "mumbai")
            for word in MOCK_ANSWERS[plant_key][role].split(" "):
                yield word + " "
                await asyncio.sleep(0.02)

ai_service = AIService()
