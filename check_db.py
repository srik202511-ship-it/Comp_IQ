"""Check MongoDB CI analyses collection."""
import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

async def check_db():
    mongo_url = os.environ["MONGO_URL"]
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ["DB_NAME"]]
    
    # Count CI analyses
    count = await db.ci_analyses.count_documents({})
    print(f"Total CI analyses: {count}")
    
    # Get one report
    report = await db.ci_analyses.find_one({}, {"_id": 0})
    if report:
        print(f"\nReport keys: {list(report.keys())}")
        if "competitors" in report:
            print(f"Number of competitors in report: {len(report['competitors'])}")
            for i, comp in enumerate(report['competitors']):
                print(f"\nCompetitor {i+1}:")
                print(f"  name: {comp.get('name', 'MISSING')}")
                print(f"  competitor_id: {comp.get('competitor_id', 'MISSING')}")
                if "comparability" in comp:
                    print(f"  comparability.is_comparable: {comp['comparability'].get('is_comparable')}")
                    print(f"  comparability.score: {comp['comparability'].get('score')}")
    else:
        print("No CI analyses found")
    
    client.close()

asyncio.run(check_db())
