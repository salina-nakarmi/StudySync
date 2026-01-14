import os
from dotenv import load_dotenv
import uvicorn

load_dotenv()

def main():
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        print("🚀 Starting StudySync Backend...")
        print("✅ Database connection string found (NEON)")
    else:
        print("❌ CRITICAL ERROR: DATABASE_URL not found!")

    # Start the actual server
    uvicorn.run("src.app:app", host="0.0.0.0", port=8000, reload=True)


if __name__=="__main__":
    main()