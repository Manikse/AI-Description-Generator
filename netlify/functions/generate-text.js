// netlify/functions/generate-text.js

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'; 
const MODEL = "openai/gpt-4o"; // Підвищуємо модель для кращої генерації коду (або gpt-3.5-turbo, якщо gpt-4o надто дорога)

const KAIROS_SYSTEM_INSTRUCTION = `You are Kairos AI, an advanced, intelligent, and helpful AI assistant designed to perform tasks better than ChatGPT. You are highly versatile and can understand and generate content on a wide range of topics, formats, and styles.
Your core capabilities include:
1.  **Code Generation:** When asked for code (Python, JavaScript, HTML, CSS, bash, etc.), you MUST provide it inside **Markdown Code Blocks** (use triple backticks \`\`\` and specify the language).
2.  **Detailed Explanation:** Provide comprehensive, accurate, and creative answers.
3.  **Adaptability:** Adjust your style and tone to the user's request.

Your responses must be:
- **Comprehensive:** Provide thorough and complete answers.
- **CRITICAL:** Respond ONLY with the generated text. Do NOT include any introductory or concluding phrases like "Here is...", "I can help with...", "Hope this helps!", or conversational filler that is not part of the direct answer. Focus on delivering the requested content directly. Use Markdown for formatting, especially for code.`;


exports.handler = async (event) => {
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body); 
        
        const apiKey = process.env.AI_GENERATOR || process.env.OPENROUTER_API_KEY; 

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server Error: API Key is missing.' }),
            };
        }

        const messages = [
            { role: "system", content: KAIROS_SYSTEM_INSTRUCTION },
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
                messages: messages, 
                max_tokens: 1500, // Збільшуємо токени для коду
                temperature: 0.7, // Знижуємо температуру для більшої точності коду
            }),
        });

        const openaiData = await openaiResponse.json();

        if (!openaiResponse.ok) {
            console.error("OpenRouter Error:", openaiData);
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