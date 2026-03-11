const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3001;
const STATS_FILE = path.join(__dirname, 'token-stats.json');

app.use(cors());
app.use(express.json());

const DEFAULT_STATS = {
  totalRequests: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  requests: []
};

async function loadStats() {
  try {
    const data = await fs.readFile(STATS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return DEFAULT_STATS;
  }
}

async function saveStats(stats) {
  await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2));
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sqlContent, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    let userMessage = message;
    if (sqlContent) {
      userMessage = `SQL语句:\n\`\`\`sql\n${sqlContent}\n\`\`\`\n\n用户问题: ${message}`;
    }

    const messages = [
      { role: 'system', content: '你是一个专业的SQL分析师，擅长分析SQL语句的健壮性、性能和潜在问题。请用中文回答。' },
      ...(history || []).slice(-10),
      { role: 'user', content: userMessage }
    ];

    const response = await axios.post(
      'https://api.siliconflow.cn/v1/chat/completions',
      {
        model: 'THUDM/glm-4-9b-chat',
        messages,
        temperature: 0.7,
        max_tokens: 2048
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0]?.message?.content || '';
    const usage = response.data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    const stats = await loadStats();
    stats.totalRequests += 1;
    stats.totalInputTokens += usage.prompt_tokens;
    stats.totalOutputTokens += usage.completion_tokens;
    stats.requests.push({
      timestamp: new Date().toISOString(),
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      message: message.substring(0, 100)
    });
    await saveStats(stats);

    res.json({
      response: aiResponse,
      usage: {
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens
      }
    });
  } catch (error) {
    console.error('Chat error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await loadStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

app.post('/api/stats/reset', async (req, res) => {
  try {
    await saveStats(DEFAULT_STATS);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset stats' });
  }
});

app.listen(PORT, () => {
  console.log(`AI Assistant server running on http://localhost:${PORT}`);
});
