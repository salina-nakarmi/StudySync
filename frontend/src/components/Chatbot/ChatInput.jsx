// frontend/src/components/Chatbot/ChatInput.jsx

import React, { useState } from 'react';

const ChatInput = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 rounded-2xl bg-gray-100 p-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          disabled={disabled}
          className="flex-1 rounded-full border border-transparent bg-transparent px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
        />
        
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || disabled}
          className="rounded-full bg-[#a7b0c0] px-5 py-2 text-white transition-colors hover:bg-[#969fb2] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatInput;