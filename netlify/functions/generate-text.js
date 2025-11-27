// Підключення Node-fetch, якщо воно не вбудоване у ваш Node.js середовище Netlify.
// Якщо ви використовуєте останню версію Node, воно може бути доступне глобально.
// const fetch = require('node-fetch'); // Розкоментуйте, якщо Netlify вимагає

const OPENAI_API_URL = 'https://api.openai.com/v1/completions'; 
const MODEL = "gpt-3.5-turbo-instruct"; // Рекомендована швидка та розумна модель

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        const apiKey = process.env.OPENAI_API_KEY; // Ключ з Netlify Environment Variables

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'OpenAI API Key не налаштовано на сервері.' }),
            };
        }

        const openaiResponse = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: MODEL,
                prompt: prompt,
                max_tokens: 400, // Максимальна довжина відповіді
                temperature: 0.8, // Творчість
                n: 1, // Кількість відповідей
                stop: ["\n\n"], // Зупинка генерації
            }),
        });

        const openaiData = await openaiResponse.json();

        if (!openaiResponse.ok) {
            console.error("OpenAI Error:", openaiData);
            throw new Error(openaiData.error?.message || 'OpenAI API повернув помилку.');
        }

        // Отримання згенерованого тексту
        const generatedText = openaiData.choices[0].text.trim();

        return {
            statusCode: 200,
            body: JSON.stringify({ text: generatedText }),
        };

    } catch (error) {
        console.error('Serverless Function Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Помилка: ${error.message}` }),
        };
    }
};