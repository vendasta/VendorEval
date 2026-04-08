import React, { useState, useRef, useEffect } from 'react';
import { chatMessage } from '../api/client';

export default function ChatInterface({ evaluationId, vendors = [], recommendation }) {
  const winnerName = recommendation?.vendor_name || recommendation?.winner || 'the top vendor';
  const winnerScore = recommendation?.overall_score || recommendation?.score || 'N/A';
  const vendorCount = vendors.length;

  const initialMessage = {
    role: 'assistant',
    content: `I've analyzed ${vendorCount} vendor proposal${vendorCount !== 1 ? 's' : ''}. ${winnerName} scores highest at ${winnerScore}/100. Ask me anything about this evaluation.`,
  };

  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickActions = [
    `Why did ${winnerName} win?`,
    'What are the biggest risks?',
    'Compare pricing',
    'What should I negotiate?',
    'Show critical red flags',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await chatMessage(evaluationId, text.trim());
      const assistantMsg = {
        role: 'assistant',
        content: data.response || data.message || data.reply || 'I couldn\'t generate a response. Please try again.',
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your question. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '600px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
      padding: '16px 20px',
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e5e7eb',
      fontSize: '15px',
      fontWeight: 600,
      color: '#0f1b2d',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    headerDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#16a34a',
    },
    messageList: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    messageBubble: (isUser) => ({
      maxWidth: '80%',
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      padding: '12px 16px',
      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
      backgroundColor: isUser ? '#2563eb' : '#f3f4f6',
      color: isUser ? '#ffffff' : '#374151',
      fontSize: '14px',
      lineHeight: '1.6',
      whiteSpace: 'pre-wrap',
    }),
    quickActions: {
      display: 'flex',
      gap: '8px',
      padding: '12px 20px',
      overflowX: 'auto',
      borderTop: '1px solid #f3f4f6',
      flexWrap: 'wrap',
    },
    quickChip: {
      padding: '6px 14px',
      fontSize: '13px',
      color: '#2563eb',
      backgroundColor: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: '20px',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      fontFamily: 'inherit',
      transition: 'background-color 0.15s',
    },
    inputRow: {
      display: 'flex',
      gap: '8px',
      padding: '16px 20px',
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#ffffff',
    },
    textInput: {
      flex: 1,
      padding: '10px 16px',
      fontSize: '14px',
      border: '1px solid #d1d5db',
      borderRadius: '24px',
      outline: 'none',
      fontFamily: 'inherit',
    },
    sendBtn: {
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: '#2563eb',
      border: 'none',
      borderRadius: '24px',
      cursor: 'pointer',
      transition: 'background-color 0.15s',
    },
    sendBtnDisabled: {
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: '#93c5fd',
      border: 'none',
      borderRadius: '24px',
      cursor: 'not-allowed',
    },
    loadingDots: {
      display: 'flex',
      gap: '4px',
      alignItems: 'center',
      padding: '12px 16px',
      alignSelf: 'flex-start',
    },
    dot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#9ca3af',
      animation: 'chatPulse 1.2s infinite ease-in-out',
    },
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes chatPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div style={styles.header}>
        <div style={styles.headerDot} />
        AI Analysis Assistant
      </div>

      <div style={styles.messageList}>
        {messages.map((msg, idx) => (
          <div key={idx} style={styles.messageBubble(msg.role === 'user')}>
            {msg.content}
          </div>
        ))}
        {loading && (
          <div style={styles.loadingDots}>
            <div style={{ ...styles.dot, animationDelay: '0s' }} />
            <div style={{ ...styles.dot, animationDelay: '0.2s' }} />
            <div style={{ ...styles.dot, animationDelay: '0.4s' }} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 1 && (
        <div style={styles.quickActions}>
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              style={styles.quickChip}
              onClick={() => sendMessage(action)}
              disabled={loading}
            >
              {action}
            </button>
          ))}
        </div>
      )}

      <form style={styles.inputRow} onSubmit={handleSubmit}>
        <input
          style={styles.textInput}
          placeholder="Ask about this evaluation..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          style={loading || !input.trim() ? styles.sendBtnDisabled : styles.sendBtn}
          type="submit"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
