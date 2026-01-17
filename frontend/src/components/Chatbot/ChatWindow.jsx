// frontend/src/components/Chatbot/ChatWindow.jsx

import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

const ChatWindow = ({ messages, onSendMessage, onClose, isLoading }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-2xl">
      {/* Header */}
      <div className="bg-gray-800 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Study Assistant</h3>
            <p className="text-xs text-gray-800">
              {isLoading ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="text-white hover:bg-gray-800 rounded-full p-2 transition-colors"
          aria-label="Close chat"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <span className="text-6xl mb-4">👋</span>
            <h4 className="text-lg font-semibold mb-2">
              Welcome to Study Assistant!
            </h4>
            <p className="text-sm max-w-xs mb-6">
              I can help you with your study sessions, resources, and progress.
              Ask me anything!
            </p>
            
            <div className="space-y-2 w-full max-w-xs">
              <p className="text-xs font-semibold text-gray-600 mb-2">
                Try asking:
              </p>
              {[
                'hello',
                'How\'s my progress?',
                'Show my study streak',
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSendMessage(suggestion)}
                  className="w-full text-left px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-sm transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble
                key={index}
                message={message}
                isUser={message.role === 'user'}
              />
            ))}
            
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-200 rounded-lg px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
    </div>
  );
};

export default ChatWindow;