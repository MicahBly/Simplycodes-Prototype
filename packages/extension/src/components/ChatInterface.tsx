import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types';
import clsx from 'clsx';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInterface({ 
  messages, 
  onSendMessage, 
  isLoading, 
  disabled 
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (input.trim() && !isLoading && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestedQuestions = [
    "What's the best deal on this page?",
    "Are there any free shipping codes?",
    "Which coupon saves me the most?",
    "Tell me about this product",
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-white/50 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              AI Shopping Assistant
            </h3>
            <p className="text-sm text-white/70 mb-6">
              Ask me about products, deals, or shopping advice!
            </p>
            
            {/* Suggested questions */}
            <div className="space-y-2">
              {suggestedQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => !disabled && onSendMessage(question)}
                  className="block w-full text-left px-4 py-2 text-sm 
                           bg-sc-card hover:bg-sc-gray-800 rounded-lg 
                           transition-colors text-white/80 hover:text-white"
                  disabled={disabled}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={clsx(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={clsx(
                    'chat-bubble',
                    message.role === 'user' 
                      ? 'chat-bubble-user' 
                      : 'chat-bubble-assistant'
                  )}
                >
                  {message.content}
                  
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium mb-1">Sources:</p>
                      {message.citations.map((citation, idx) => (
                        <div key={idx} className="text-xs text-gray-600">
                          [{citation.type}] {citation.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="chat-bubble chat-bubble-assistant">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" 
                         style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" 
                         style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" 
                         style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "AI model loading..." : "Ask about deals, products, or shopping..."}
            disabled={disabled || isLoading}
            rows={1}
            className="flex-1 px-3 py-2 border border-sc-gray-700 bg-sc-card text-white rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-sc-green 
                     focus:border-transparent resize-none disabled:bg-sc-gray-800
                     disabled:text-white/40 placeholder-white/50"
          />
          <button
            type="submit"
            disabled={disabled || isLoading || !input.trim()}
            className="btn-primary px-4 py-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}