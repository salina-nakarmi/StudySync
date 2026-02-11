"""
Quick Test Script for Dashboard Endpoint
Run this after updating your backend to verify the recent_sessions work correctly
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
# You'll need to get a valid token from your frontend or login endpoint
AUTH_TOKEN = "YOUR_AUTH_TOKEN_HERE"

def test_dashboard():
    """Test the dashboard endpoint"""
    
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    
    print("🧪 Testing Dashboard Endpoint...")
    print(f"URL: {BASE_URL}/api/dashboard")
    print("-" * 50)
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/dashboard",
            headers=headers
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ SUCCESS! Dashboard Response:")
            print(json.dumps(data, indent=2))
            
            # Check for recent_sessions
            if "recent_sessions" in data:
                sessions = data["recent_sessions"]
                print(f"\n📊 Recent Sessions: {len(sessions)} found")
                
                if len(sessions) > 0:
                    print("\nFirst Session Details:")
                    first = sessions[0]
                    print(f"  - Duration: {first['duration_seconds']}s ({first['duration_seconds'] // 60}m)")
                    print(f"  - Notes: {first['session_notes']}")
                    print(f"  - Created: {first['created_at']}")
                else:
                    print("  ⚠️ No sessions yet (this is OK if you haven't logged any)")
            else:
                print("\n❌ ERROR: 'recent_sessions' not found in response")
                print("Make sure you updated the dashboard endpoint!")
        else:
            print(f"\n❌ ERROR: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Could not connect to backend")
        print(f"Make sure your backend is running on {BASE_URL}")
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

if __name__ == "__main__":
    print("=" * 50)
    print("Dashboard Endpoint Test")
    print("=" * 50)
    
    if AUTH_TOKEN == "YOUR_AUTH_TOKEN_HERE":
        print("\n⚠️ WARNING: You need to set a valid AUTH_TOKEN")
        print("\nHow to get a token:")
        print("1. Open your frontend in browser")
        print("2. Open DevTools (F12) → Network tab")
        print("3. Make any API request")
        print("4. Check the 'Authorization' header in the request")
        print("5. Copy the Bearer token and paste it in this script")
    else:
        test_dashboard()