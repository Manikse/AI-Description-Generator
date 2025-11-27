// netlify/functions/generate-text.js

// const fetch = require('node-fetch'); 
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/completions'; 
const MODEL = "openai/gpt-3.5-turbo"; 

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        const apiKey = process.env.OPENROUTER_API_KEY; 

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'OpenRouter API Key is missing in Netlify settings.' }),
            };
        }

        // ОНОВЛЕНО: Інструкція AI відповідати тією ж мовою, що й запит користувача
        const system_prompt = "You are a professional marketing copywriter. Write a compelling and short product description. **CRITICAL: Respond in the same language as the user's request.**";
        
        const fullPrompt = `${system_prompt}\n\nUser Request: ${prompt}`;

        const openaiResponse = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`, 
            },
            body: JSON.stringify({
                model: MODEL,
                prompt: fullPrompt,
                max_tokens: 400,
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