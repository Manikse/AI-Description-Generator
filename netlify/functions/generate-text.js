// netlify/functions/generate-text.js

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/completions'; 
const MODEL = "openai/gpt-3.5-turbo-instruct"; 

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
        // Отримуємо prompt ТА НОВИЙ mode
        const { prompt, mode } = JSON.parse(event.body); 
        const apiKey = process.env.OPENROUTER_API_KEY; 

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'OpenRouter API Key is missing in Netlify settings.' }),
            };
        }

        // Вибір системної інструкції на основі режиму (mode)
        const base_prompt = MODE_PROMPTS[mode] || MODE_PROMPTS.generic;

        // Фінальна інструкція
        const system_prompt = `${base_prompt} **CRITICAL: Respond only with the generated text in the same language as the user's request.**`;
        
        const fullPrompt = `${system_prompt}\n\nUser Request: ${prompt}`;

        const openaiResponse = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`, 
                // Додаємо, щоб показати, що це платний користувач (для статистики OpenRouter)
                 'OpenRouter-Client-Keys': process.env.MASTER_LICENSE_KEY 
            },
            body: JSON.stringify({
                model: MODEL,
                prompt: fullPrompt,
                max_tokens: 500, // Збільшуємо токени для довших запитів (як лист)
                temperature: 0.7,
                stop: ["\n\n"],
            }),
        });

        const openaiData = await openaiResponse.json();

        if (!openaiResponse.ok) {
            console.error("OpenRouter Error:", openaiData);
            throw new Error(openaiData.error?.message || 'OpenRouter API returned an error.');
        }

        const generatedText = openaiData.choices[0].text.trim();
        
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