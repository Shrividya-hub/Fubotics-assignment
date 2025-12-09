# Fubotics Software & AI Assignment – Chat App

A simple full-stack AI chat web app:

- Frontend: React (Vite)
- Backend: Node.js + Express
- Storage: JSON file (`messages.json`) for persistent chat history
- AI Integration: OpenAI Chat Completions API with graceful fallback when quota is exceeded

## Features

- Chat-style UI with user + AI messages
- Messages stored on the backend and reloaded on page refresh
- AI reply generated on each user message (real API call, with fallback text if the API is unavailable)
- Single deployed URL serving both frontend and backend

## Run Locally

```bash
npm install
npm run build
npm start
