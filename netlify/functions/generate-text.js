// netlify/functions/generate-text.js

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'; 
// Модель підвищена для кращої генерації коду
const MODEL = "openai/gpt-4o"; 

const KAIROS_SYSTEM_INSTRUCTION = `You are Kairos AI, an advanced, intelligent, and helpful AI assistant designed to perform tasks better than ChatGPT. You are highly versatile and can understand and generate content on a wide range of topics, formats, and styles.
Your core capabilities include:
1.  **Code Generation:** When asked for code (Python, JavaScript, HTML, CSS, bash, etc.), you MUST provide it inside **Markdown Code Blocks** (use triple backticks \`\`\` and specify the language).
2.  **Detailed Explanation:** Provide comprehensive, accurate, and creative answers.
3.  **Adaptability:** Adjust your style and tone to the user's request.

Your responses must be:
- **Comprehensive:** Provide thorough and complete answers.
- **CRITICAL:** Respond ONLY with the generated text. Do NOT include any introductory or concluding phrases like "Here is...", "I can help with...", "Hope this helps!", or conversational filler that is not part of the direct answer. Focus on delivering the requested content directly. Use Markdown for formatting, especially for code.`;


exports.handler = async (event) => {
    // Перевірка методу запиту
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body); 
        
        // Перевірка змінних оточення (використовує AI_GENERATOR або OPENROUTER_API_KEY)
        const apiKey = process.env.AI_GENERATOR || process.env.OPENROUTER_API_KEY; 

        if (!apiKey) {
            // Повертаємо валідний JSON, навіть при помилці ключа
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server Error: API Key (AI_GENERATOR or OPENROUTER_API_KEY) is missing in Netlify settings.' }),
            };
        }

        const messages = [
            { role: "system", content: KAIROS_SYSTEM_INSTRUCTION },
            { role: "user", content: prompt }
        ];

        // Запит до OpenRouter API
        const openaiResponse = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`, 
            },
            body: JSON.stringify({
                model: MODEL,
                messages: messages, 
                max_tokens: 1500, 
                temperature: 0.7, 
            }),
        });

        const openaiData = await openaiResponse.json();

        // Обробка помилок API
        if (!openaiResponse.ok) {
            console.error("OpenRouter Error:", openaiData);
            // Це захищає від JSON-помилки на фронтенді, завжди повертаємо JSON
            return {
                statusCode: 500,
                body: JSON.stringify({ error: openaiData.error?.message || `OpenRouter API returned an error (Status: ${openaiResponse.status}). Check API Key validity/credit.` }),
            };
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