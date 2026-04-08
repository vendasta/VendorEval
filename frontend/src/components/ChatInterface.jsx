import React, { useState, useRef, useEffect, useMemo } from 'react';
import { chatMessage } from '../api/client';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function formatTime(date) {
  if (!date) return '';
  const now = new Date();
  const diff = now - date;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatInterface({ evaluationId, vendors = [], recommendation }) {
  const winnerName =
    recommendation?.recommended_vendor?.name || recommendation?.vendor_name || recommendation?.winner || 'the top vendor';
  const winnerScore =
    recommendation?.recommended_vendor?.overall_score || recommendation?.overall_score || recommendation?.score || 'N/A';
  const vendorCount = vendors.length;

  const userName = useMemo(() => {
    try {
      const raw = localStorage.getItem('vendoreval_user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.name || parsed.full_name || parsed.username || null;
    } catch {
      return null;
    }
  }, []);

  const userInitials = getInitials(userName);

  const initialMessage = useMemo(
    () => ({
      role: 'assistant',
      content: `I've analyzed ${vendorCount} vendor proposal${vendorCount !== 1 ? 's' : ''}. ${winnerName} scores highest at ${winnerScore}/100. Ask me anything about this evaluation.`,
      time: new Date(),
    }),
    [vendorCount, winnerName, winnerScore],
  );

  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const hasUserMessages = messages.some((m) => m.role === 'user');

  const quickActions = [
    `Why did ${winnerName} win?`,
    'What are the biggest risks?',
    'Compare costs',
    'Negotiation tips',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await chatMessage(evaluationId, trimmed);
      const assistantMsg = {
        role: 'assistant',
        content:
          data.content ||
          data.response ||
          data.message ||
          data.reply ||
          "I couldn't generate a response. Please try again.",
        time: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, I encountered an error processing your question. Please try again.',
          time: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="chat">
      <div className="chat__messages">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}`}
            >
              <div className="chat-message__avatar">
                {isUser ? (
                  <div className="avatar avatar--sm avatar--navy">
                    {userInitials}
                  </div>
                ) : (
                  <div className="avatar avatar--sm avatar--blue">AI</div>
                )}
              </div>

              <div>
                <div className="chat-message__bubble">{msg.content}</div>
                <div className="chat-message__time">
                  {formatTime(msg.time)}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="chat-message chat-message--assistant">
            <div className="chat-message__avatar">
              <div className="avatar avatar--sm avatar--blue">AI</div>
            </div>
            <div className="chat-typing">
              <div className="chat-typing__dot" />
              <div className="chat-typing__dot" />
              <div className="chat-typing__dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {!hasUserMessages && (
        <div className="chat__chips">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              className="chat-chip"
              onClick={() => sendMessage(action)}
              disabled={loading}
            >
              {action}
            </button>
          ))}
        </div>
      )}

      <form className="chat__input-row" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="chat__input"
          placeholder="Ask about this evaluation..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          className="chat__send-btn"
          type="submit"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
