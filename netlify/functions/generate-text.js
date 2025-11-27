// const fetch = require('node-fetch'); // Розкоментуйте, якщо потрібно
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/completions'; 
const MODEL = "openai/gpt-3.5-turbo-instruct"; // Або "mistralai/mistral-7b-instruct" для більш дешевої моделі

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        const apiKey = process.env.OPENROUTER_API_KEY; // <-- Змінено на OPENROUTER ключ

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'OpenRouter API Key is missing in Netlify settings.' }),
            };
        }

        const system_prompt = "You are a professional marketing copywriter. Write a compelling and short product description.";
        
        // OpenRouter підтримує формат Chat Completion, навіть для старих моделей
        const openaiResponse = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // OpenRouter використовує Authorization header, як і OpenAI
                'Authorization': `Bearer ${apiKey}`, 
            },
            body: JSON.stringify({
                model: MODEL,
                // Використовуємо формат messages, що є кращим для інструкцій
                messages: [
                    { role: "system", content: system_prompt },
                    { role: "user", content: prompt }
                ],
                max_tokens: 400,
                temperature: 0.7,
            }),
        });

        const openaiData = await openaiResponse.json();

        if (!openaiResponse.ok) {
            console.error("OpenRouter Error:", openaiData);
            throw new Error(openaiData.error?.message || 'OpenRouter API returned an error.');
        }

        // Отримання згенерованого тексту з формату chat completions
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