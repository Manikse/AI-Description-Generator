// netlify/functions/generate-text.js (ЗАЛИШАЄТЬСЯ ЯК У ПОПЕРЕДНЬОМУ ПОВІДОМЛЕННІ)

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'; 
const MODEL = "openai/gpt-3.5-turbo"; // Або будь-яка інша потужна модель на OpenRouter

const KAIROS_SYSTEM_INSTRUCTION = `You are Kairos AI, an advanced, intelligent, and helpful AI assistant designed to perform tasks better than ChatGPT. You are highly versatile and can understand and generate content on a wide range of topics, formats, and styles.
Your capabilities include, but are not limited to:
- Writing creative content (stories, poems, scripts, code)
- Summarizing complex information
- Answering questions across various domains
- Generating different types of text formats (emails, social media posts, slogans, articles)
- Providing explanations and tutorials
- Engaging in natural, coherent conversations.

Your responses should be:
- **Comprehensive:** Provide thorough and complete answers.
- **Accurate:** Ensure factual correctness.
- **Creative:** Offer innovative and engaging content when appropriate.
- **User-friendly:** Be clear, concise, and easy to understand.
- **Adaptable:** Adjust your style and tone to the user's request.
- **CRITICAL:** Respond ONLY with the generated text in the same language as the user's request. Do NOT include any introductory or concluding phrases like "Here is...", "I can help with...", "Hope this helps!", or conversational filler that is not part of the direct answer. Focus on delivering the requested content directly.`;


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
                body: JSON.stringify({ error: 'Server Error: API Key (AI_GENERATOR or OPENROUTER_API_KEY) is missing or undefined in Netlify settings.' }),
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
                max_tokens: 1000, 
                temperature: 0.8,
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