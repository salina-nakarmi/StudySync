// frontend/src/components/Chatbot/ChatbotWidget.jsx

import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import { useAuth } from '@clerk/clerk-react'; 

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const { getToken } = useAuth();

  const handleSendMessage = async (userMessage) => {
    const userMsg = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const token = await getToken();
      
      const response = await fetch('http://localhost:8000/api/chatbot/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Save session_id from backend response
      if (data.sessionId && !sessionId) {
        console.log(`📝 New session started: ${data.session_id}`);
        setSessionId(data.session_id);
      }
      
      const botMsg = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      const errorMsg = {
        role: 'assistant',
        content: 'Sorry, I encountered an error connecting to the AI. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating chat button (when closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gray-800 text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-110 z-50"
          aria-label="Open chat"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              {messages.filter(m => m.role === 'assistant').length}
            </span>
          )}
        </button>
      )}

      {/* Chat window (when open) */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-full sm:w-96 max-w-[calc(100vw-3rem)] h-[600px] z-50">
          <ChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            onClose={() => setIsOpen(false)}
            isLoading={isLoading}
          />
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;