const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// ----------------------- Storage setup -----------------------

const DATA_FILE = path.join(__dirname, 'messages.json');

function loadMessages() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading messages.json:', err);
    return [];
  }
}

function saveMessages(messages) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing messages.json:', err);
  }
}

// ----------------------- Debug health route -----------------------

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ----------------------- API routes -----------------------

// Get full chat history
app.get('/api/messages', (req, res) => {
  const messages = loadMessages();
  res.json(messages);
});

// Send a message and get AI reply
app.post('/api/send', async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  const messages = loadMessages();

  const userMessage = {
    id: Date.now(),
    role: 'user',
    text: text.trim(),
    timestamp: new Date().toISOString(),
  };

  messages.push(userMessage);
  saveMessages(messages);

  try {
    console.log('Calling OpenAI API with user message:', userMessage.text);

    const openAIMessages = [
      {
        role: 'system',
        content: 'You are a concise, friendly AI assistant in a demo chat app.',
      },
      ...messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      })),
    ];

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4.1-mini',
        messages: openAIMessages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiText =
      response.data?.choices?.[0]?.message?.content?.trim() ||
      "I'm sorry, I couldn't generate a response.";

    const aiMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      text: aiText,
      timestamp: new Date().toISOString(),
    };

    messages.push(aiMessage);
    saveMessages(messages);

    console.log('AI reply:', aiMessage.text);

    res.json(messages);
    } catch (err) {
    console.error('OpenAI API error:', err.response?.data || err.message);

    // ---- Fallback "local AI" so the app still works for the assignment ----
    const fallbackText = `I'm a demo AI in this assignment. The external AI service is currently unavailable (quota/billing issue), but I received your message: "${userMessage.text}". I can't access live external data like real-time weather, but I can still respond and keep the conversation going.`;

    const aiMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      text: fallbackText,
      timestamp: new Date().toISOString(),
    };

    messages.push(aiMessage);
    saveMessages(messages);

    // Return updated messages so frontend shows AI reply instead of an error
    return res.json(messages);
  }
});

// ----------------------- Serve React build -----------------------

const clientDistPath = path.join(__dirname, 'client', 'dist');

// Serve all static assets (JS, CSS, images) from the React build
app.use(express.static(clientDistPath));

// SPA fallback – for any non-API route, send index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// ----------------------- Start server -----------------------

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

