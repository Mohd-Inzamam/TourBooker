import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Minus, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { sendChatMessage } from '../services/ai.service';
import '../styles/chatbot.css';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Hello! ✦ I'm your AI travel assistant. Ask me about tours, destinations, or help finding the perfect adventure for you!",
  timestamp: new Date(),
};

const QUICK_CHIPS = [
  'Find tours in Paris',
  'Best adventure tours',
  'Tours under ₹2000',
  'Luxury experiences',
];

const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ChatbotWidget = () => {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasChatted, setHasChatted] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Stop pulse after 3 cycles (~6 seconds)
  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 7000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  if (!isAuthenticated || (user?.role && user?.role !== 'user')) return null;

  const sendMessage = async (text) => {
    const content = text.trim();
    if (!content || isTyping) return;

    const userMsg = { role: 'user', content, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue('');
    setHasChatted(true);
    setIsTyping(true);

    // Build history for API (exclude timestamps)
    const conversationHistory = updatedMessages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await sendChatMessage(content, conversationHistory);
      const reply = res.data?.reply || res.reply || "I'm sorry, I couldn't process your request.";
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: reply, timestamp: new Date() },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  return (
    <>
      {/* ── Chat Panel ── */}
      <div className={`ag-chat-panel ${isOpen ? 'open' : ''}`} role="dialog" aria-label="AI Travel Assistant">
        {/* Header */}
        <div className="ag-chat-header">
          <div className="ag-chat-header-left">
            <div className="ag-chat-star">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="ag-chat-header-title">AI Travel Assistant</p>
              <p className="ag-chat-header-sub">Ask me anything about tours</p>
            </div>
          </div>
          <button className="ag-chat-minimize" onClick={() => setIsOpen(false)} aria-label="Minimize chat">
            <Minus size={14} />
          </button>
        </div>

        {/* Messages */}
        <div className="ag-chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ag-chat-bubble-wrap ${msg.role}`}>
              <div className={`ag-chat-bubble ${msg.role}`}>{msg.content}</div>
              <span className="ag-chat-timestamp">{formatTime(msg.timestamp)}</span>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="ag-chat-bubble-wrap assistant">
              <div className="ag-typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick chips — only before first message */}
        {!hasChatted && (
          <div className="ag-chat-chips">
            {QUICK_CHIPS.map(chip => (
              <button
                key={chip}
                className="ag-chat-chip"
                onClick={() => sendMessage(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="ag-chat-input-area">
          <input
            ref={inputRef}
            type="text"
            className="ag-chat-input"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            maxLength={500}
          />
          <button
            className="ag-chat-send"
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* ── Trigger Button ── */}
      <button
        className={`ag-chat-trigger ${showPulse && !isOpen ? 'pulse' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Open AI Travel Assistant"
      >
        {isOpen ? <Minus size={24} /> : <MessageCircle size={28} />}
        <span className="ag-chat-tooltip">Ask our AI Travel Assistant</span>
      </button>
    </>
  );
};

export default ChatbotWidget;
