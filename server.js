// server.js
const express = require('express');
const cors = require('cors');

// const fetch = require('node-fetch');
require('dotenv').config();

// Enable CORS for all origins (development only)
const app = express();
app.use(cors());
app.use(express.json());

// Proxy endpoint for Claude API
app.post('/api/chat', async (req, res) => {
  try {
    
// remove apiKey from req.body
//    const { apiKey, messages, tools, system } = req.body;
    const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
    const { messages, tools, system } = req.body;
    console.log('📨 Proxying request to Claude API...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: system,
        messages: messages,
        tools: tools
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Claude API error:', data);
      return res.status(response.status).json(data);
    }

    console.log('✅ Claude API success');
    res.json(data);

  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
});