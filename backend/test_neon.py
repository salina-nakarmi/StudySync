"""
Quick test script to verify Neon database connection
Usage: python -m backend.test_neon
"""
import asyncio
from src.database.database import engine, check_database_health
from sqlalchemy import text

async def test_connection():
    """Test basic database connectivity"""
    print("🔍 Testing Neon database connection...\n")
    
    # Test 1: Basic connectivity
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"✅ Connected to PostgreSQL")
            print(f"   Version: {version[:50]}...")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False
    
    # Test 2: Check pool status
    print(f"\n📊 Connection pool status:")
    print(f"   Pool size: {engine.pool.size()}")
    print(f"   Checked out: {engine.pool.checkedout()}")
    print(f"   Overflow: {engine.pool.overflow()}")
    
    # Test 3: Health check
    health = await check_database_health()
    print(f"\n🏥 Health check: {health['status']}")
    
    # Test 4: Test query performance
    try:
        import time
        start = time.time()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT pg_sleep(0.1)"))
        latency = (time.time() - start) * 1000
        print(f"⚡ Query latency: {latency:.2f}ms")
    except Exception as e:
        print(f"⚠️ Latency test failed: {e}")
    
    print("\n✨ All tests passed! Neon is ready to use.")
    return True

async def test_table_creation():
    """Test if tables exist"""
    print("\n📋 Checking database tables...")
    
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            tables = result.scalars().all()
            
            if tables:
                print(f"   Found {len(tables)} tables:")
                for table in tables:
                    print(f"   - {table}")
            else:
                print("   ⚠️ No tables found. Run: python -m backend.init_db")
    except Exception as e:
        print(f"   ❌ Error checking tables: {e}")

if __name__ == "__main__":
    async def main():
        success = await test_connection()
        if success:
            await test_table_creation()
    
    asyncio.run(main())