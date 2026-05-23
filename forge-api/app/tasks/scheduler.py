from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.tasks.seed_realtime import simulate_telemetry_tick
import asyncio

# Setup scheduler
scheduler = AsyncIOScheduler()

async def run_tick_wrapper():
    try:
        await simulate_telemetry_tick()
    except Exception as e:
        print(f"Error executing telemetry simulation: {e}")

async def start_scheduler():
    # Schedule live simulation tick every 30 seconds
    scheduler.add_job(run_tick_wrapper, 'interval', seconds=30)
    scheduler.start()
    print("Background APScheduler started.")

async def stop_scheduler():
    scheduler.shutdown()
    print("Background APScheduler stopped.")
