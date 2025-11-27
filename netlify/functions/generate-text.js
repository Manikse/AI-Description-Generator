// netlify/functions/generate-text.js

// const fetch = require('node-fetch'); // Розкоментуйте, якщо потрібно
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/completions'; 
const MODEL = "openai/gpt-3.5-turbo-instruct"; // Або "mistralai/mistral-7b-instruct" для більш дешевої моделі

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        const apiKey = process.env.OPENROUTER_API_KEY; // Ваш ключ OpenRouter з Netlify

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'OpenRouter API Key is missing in Netlify settings.' }),
            };
        }

        // Створюємо інструкцію для моделі
        const system_prompt = "You are a professional marketing copywriter. Write a compelling and short product description.";
        
        // Комбінуємо системну інструкцію та запит користувача
        const fullPrompt = `${system_prompt}\n\nUser Request: ${prompt}`;

        const openaiResponse = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`, 
            },
            body: JSON.stringify({
                model: MODEL,
                
                // ВИПРАВЛЕНО: Використовуємо поле 'prompt' для Completion моделей
                prompt: fullPrompt,
                
                max_tokens: 400,
                temperature: 0.7,
                stop: ["\n\n"], // Додаємо, щоб модель не генерувала зайвого
            }),
        });

        const openaiData = await openaiResponse.json();

        if (!openaiResponse.ok) {
            console.error("OpenRouter Error:", openaiData);
            throw new Error(openaiData.error?.message || 'OpenRouter API returned an error.');
        }

        // Отримання згенерованого тексту з об'єкта 'choices' (для Completion)
        const generatedText = openaiData.choices[0].text.trim(); // <-- Змінено на '.text'
        
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