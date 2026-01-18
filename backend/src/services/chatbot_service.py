from openai import AsyncOpenAI
import os

class ChatbotService:
    def __init__(self):
        # Initialize Groq client (uses OpenAI-compatible API)
        self.client = AsyncOpenAI(
            api_key=os.getenv("GROQ_API_KEY"),
            base_url="https://api.groq.com/openai/v1"
        )
    
    async def get_simple_response(self, user_message: str) -> str:
        """
        Simple test: Send message to Groq and get response
        No user context yet - just testing connectivity
        """
        try:
            # Call Groq API
            response = await self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",  # Fast Groq model
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful and friendly study assistant. Keep responses concise and encouraging."
                    },
                    {
                        "role": "user",
                        "content": user_message
                    }
                ],
                temperature=0.7,
                max_tokens=200  # Short responses for testing
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"❌ Groq API Error: {e}")
            raise Exception(f"Failed to get response from AI: {str(e)}")