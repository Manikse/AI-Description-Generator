// netlify/functions/generate-text.js

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'; 
const MODEL = "openai/gpt-3.5-turbo"; // Надійна Chat-модель

// Карта режимів для генерації системного prompt
const MODE_PROMPTS = {
    generic: "You are a professional marketing copywriter. Write a compelling and short product description.",
    email: "You are a professional email marketing specialist. Write a clear, concise, and persuasive email based on the user's request.",
    social: "You are a social media manager. Write an engaging and viral post (max 280 characters if for Twitter) with relevant emojis and hashtags.",
    slogan: "You are a creative advertising expert. Generate 3-5 short, catchy, and memorable slogans or headlines.",
};

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt, mode } = JSON.parse(event.body); 
        
        // Використовуємо OPENROUTER_API_KEY як стандартну назву. 
        // Якщо ви використовуєте іншу назву (наприклад, AI_GENERATOR), 
        // вам потрібно змінити рядок нижче на process.env.ВАША_НАЗВА_КЛЮЧА
        const apiKey = process.env.OPENROUTER_API_KEY || process.env.AI_GENERATOR;

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server Error: API Key (OPENROUTER_API_KEY or AI_GENERATOR) is missing or undefined in Netlify settings.' }),
            };
        }

        const base_prompt = MODE_PROMPTS[mode] || MODE_PROMPTS.generic;

        const system_instruction = `${base_prompt} **CRITICAL: Respond only with the generated text in the same language as the user's request. Do not include any introductory or concluding phrases.**`;
        
        // ВИКОРИСТАННЯ CHAT API
        const messages = [
            { role: "system", content: system_instruction },
            { role: "user", content: prompt }
        ];

        const openaiResponse = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // OpenRouter вимагає Authorization: Bearer <Key>
                'Authorization': `Bearer ${apiKey}`, 
            },
            body: JSON.stringify({
                model: MODEL,
                messages: messages, // Ключовий момент
                max_tokens: 500,
                temperature: 0.7,
            }),
        });

        const openaiData = await openaiResponse.json();

        if (!openaiResponse.ok) {
            console.error("OpenRouter Error:", openaiData);
            // Повертаємо деталі помилки з OpenRouter на фронтенд для діагностики
            throw new Error(openaiData.error?.message || `OpenRouter API returned an error (Status: ${openaiResponse.status}). Check API Key validity/credit.`);
        }
        
        const generatedText = openaiData.choices[0].message.content.trim();
        
        return {
            statusCode: 200,
            body: JSON.stringify({ text: generatedText }),
        };

    } catch (error) {
        console.error('Serverless Function Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Server Error: ${error.message}` }),
        };
    }
};