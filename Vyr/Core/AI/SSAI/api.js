/* ============================================
   VYR - SIMPLE SELECT AI - BACKEND API
   Version: 1.0
   Author: Vyr Team
============================================ */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== CONFIGURATION =====
const API_CONFIG = {
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    apiKey: 'sk-b8311abde61d41f2a66a44b0cd390d22',
    model: 'deepseek-chat',
    systemPrompt: `You are a strict binary decision engine.

Your only task is to determine whether the user's statement or request is factually correct, logically valid, or achievable based on reliable general knowledge.

Rules you must follow:
- Respond with exactly one word: Yes or No
- Do not explain, justify, or add any text
- Do not use punctuation or formatting
- Do not attempt to be helpful or polite
- If there is any uncertainty, ambiguity, missing information, contradiction, or unverifiable claim, answer No
- Prefer correctness over completeness at all times
- If the statement cannot be confirmed with high confidence, answer No
- Never assume user intent
- Never fill in missing details

User input:`
};

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== API ENDPOINT =====
app.post('/api/ssai', async (req, res) => {
    try {
        const { message } = req.body;

        // Validation
        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'پیام نمی‌تواند خالی باشد'
            });
        }

        // Call DeepSeek API
        const response = await fetch(API_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: API_CONFIG.systemPrompt
                    },
                    {
                        role: 'user',
                        content: message.trim()
                    }
                ],
                temperature: 0,
                max_tokens: 10
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('DeepSeek API Error:', response.status, errorData);
            return res.status(response.status).json({
                success: false,
                error: 'خطا در ارتباط با سرویس AI'
            });
        }

        const data = await response.json();
        const rawAnswer = data.choices[0].message.content.trim();

        // Extract Yes or No
        let answer;
        if (rawAnswer.toLowerCase().includes('yes')) {
            answer = 'Yes';
        } else if (rawAnswer.toLowerCase().includes('no')) {
            answer = 'No';
        } else {
            answer = rawAnswer;
        }

        // Success response
        res.json({
            success: true,
            answer: answer
        });

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({
            success: false,
            error: 'خطای سرور. لطفاً دوباره تلاش کنید.'
        });
    }
});

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Vyr SSAI API',
        timestamp: new Date().toISOString()
    });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║     🎯 Vyr SSAI API Server            ║
    ║     Running on port ${PORT}              ║
    ║     http://localhost:${PORT}             ║
    ╚════════════════════════════════════════╝
    `);
});
