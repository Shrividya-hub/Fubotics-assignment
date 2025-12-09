import { useEffect, useState, useRef } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load chat history on first render
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch('/api/messages');
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load chat history.');
      }
    };

    fetchMessages();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');

    const trimmed = input.trim();
    if (!trimmed) return;

    setIsSending(true);

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: trimmed }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to send message.');
      }

      const data = await res.json();
      setMessages(data);
      setInput('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="app-root">
      <div className="chat-card">
        <header className="chat-header">
          <div>
            <h1 className="chat-title">Fubotics AI Chat</h1>
            <p className="chat-subtitle">
              Software &amp; AI Assignment – Chat with persistent history
            </p>
          </div>
        </header>

        <main className="chat-main">
          <div className="messages-container">
            {messages.length === 0 && (
              <div className="empty-state">
                <p>Start the conversation by sending a message 👋</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id + msg.timestamp}
                className={`message-row ${
                  msg.role === 'user' ? 'message-row-user' : 'message-row-ai'
                }`}
              >
                <div
                  className={`avatar ${
                    msg.role === 'user' ? 'avatar-user' : 'avatar-ai'
                  }`}
                >
                  {msg.role === 'user' ? 'U' : 'AI'}
                </div>
                <div
                  className={`message-bubble ${
                    msg.role === 'user'
                      ? 'bubble-user'
                      : 'bubble-ai'
                  }`}
                >
                  <p className="message-text">{msg.text}</p>
                  <span className="message-meta">
                    {msg.role === 'user' ? 'You' : 'AI'} ·{' '}
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="chat-footer">
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={handleSend} className="input-row">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSending}
              className="chat-input"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="send-button"
            >
              {isSending ? 'Thinking...' : 'Send'}
            </button>
          </form>
          <p className="footer-note">
            Messages are stored in the backend and reloaded on refresh.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
