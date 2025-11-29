// netlify/functions/generate-text.js

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'; // ЗМІНА URL ДЛЯ CHAT-МОДЕЛІ
const MODEL = "openai/gpt-3.5-turbo"; // ЗМІНА НА CHAT-МОДЕЛЬ

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
        const apiKey = process.env.OPENROUTER_API_KEY; 

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'OpenRouter API Key is missing in Netlify settings.' }),
            };
        }

        const base_prompt = MODE_PROMPTS[mode] || MODE_PROMPTS.generic;

        // Фінальна інструкція. Вона також включає інструкцію про мову.
        const system_instruction = `${base_prompt} **CRITICAL: Respond only with the generated text in the same language as the user's request. Do not include any introductory or concluding phrases.**`;
        
        // Створення масиву messages для Chat API
        const messages = [
            { role: "system", content: system_instruction },
            { role: "user", content: prompt }
        ];

        const openaiResponse = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`, 
            },
            body: JSON.stringify({
                model: MODEL,
                messages: messages, // ВИКОРИСТОВУЄМО messages ЗАМІСТЬ prompt
                max_tokens: 500,
                temperature: 0.7,
            }),
        });

        const openaiData = await openaiResponse.json();

        if (!openaiResponse.ok) {
            console.error("OpenRouter Error:", openaiData);
            // Повертаємо більш детальну помилку з API
            throw new Error(openaiData.error?.message || `OpenRouter API returned an error (Status: ${openaiResponse.status}).`);
        }
        
        // Результат тепер знаходиться у openaiData.choices[0].message.content
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