// frontend/src/components/Chatbot/ChatWindow.jsx

import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

const ChatWindow = ({ messages, onSendMessage, onClose, onClear, isLoading }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl bg-[#111827] px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h3 className="font-semibold text-[18px] leading-none">Study Assistant</h3>
            <p className="text-xs text-slate-300">
              {isLoading ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Clear button */}
          {messages.length > 0 && onClear && (
            <button
              onClick={onClear}
              className="rounded-lg p-2 text-white/90 transition-colors hover:bg-white/10"
              title="Clear conversation"
            >
              🔄
            </button>
          )}

        <button
          onClick={onClose}
          className="rounded-full p-2 text-white/90 transition-colors hover:bg-white/10"
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
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-white px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-gray-500">
            <span className="mb-4 text-6xl">👋</span>
            <h4 className="mb-2 text-lg font-semibold">
              Welcome to Study Assistant!
            </h4>
            <p className="text-sm max-w-xs mb-6">
              I can help you with your study sessions, resources, and progress.
              Ask me anything!
            </p>
            
            <div className="grid w-full max-w-[320px] grid-cols-2 gap-2">
              <p className="col-span-2 mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
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
                  className="min-h-[56px] rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
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
                <div className="rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3">
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