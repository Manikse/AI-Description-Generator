// --- Налаштування Ключа (Тільки для MVP/тестування) ---
// У реальному житті цей ключ має бути перевірений на бекенді.
// Ключ, який ви дасте користувачу після покупки через Gumroad.
const MASTER_LICENSE_KEY = "AI-DESC-GEN-GMRD-B19C77-2025NOV-74A82F"; 

document.getElementById('key-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const inputKey = document.getElementById('license-key').value.trim();
    const keyMessage = document.getElementById('key-message');
    const generatorSection = document.getElementById('generator-section');

    if (inputKey === MASTER_LICENSE_KEY) {
        // Успішна активація
        localStorage.setItem('license_activated', 'true');
        generatorSection.style.display = 'block';
        keyMessage.textContent = '✅ Активовано! Можете починати генерацію.';
        keyMessage.style.color = 'green';
        document.getElementById('generator-access').style.display = 'none'; // Ховаємо форму ключа
    } else {
        // Помилка
        keyMessage.textContent = '❌ Невірний ліцензійний ключ. Перевірте та спробуйте ще раз.';
        keyMessage.style.color = 'red';
        generatorSection.style.display = 'none';
    }
});

// Перевірка при завантаженні сторінки
if (localStorage.getItem('license_activated') === 'true') {
    document.getElementById('generator-section').style.display = 'block';
    document.getElementById('generator-access').style.display = 'none';
}

// --- Логіка Генерації Тексту ---

document.getElementById('generator-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = document.getElementById('prompt').value;
    const outputDiv = document.getElementById('output');
    const generateButton = document.getElementById('generate-button');
    const copyButton = document.getElementById('copy-button');

    outputDiv.innerHTML = '<p>🚀 Генерація тексту, зачекайте...</p>';
    generateButton.disabled = true;
    copyButton.style.display = 'none';

    try {
        // Звернення до Netlify Function
        const response = await fetch('/.netlify/functions/generate-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Помилка генерації на сервері.');
        }

        // Відображаємо результат
        outputDiv.textContent = data.text; // Використовуємо textContent для чистого виводу
        copyButton.style.display = 'block';

    } catch (error) {
        outputDiv.innerHTML = `<p style="color: red;">❌ Помилка: ${error.message}. Перевірте API-ключ та ліміти.</p>`;
        console.error('Fetch error:', error);
    } finally {
        generateButton.disabled = false;
    }
});


// --- Логіка Копіювання ---
document.getElementById('copy-button').addEventListener('click', () => {
    const textToCopy = document.getElementById('output').textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Текст скопійовано!');
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
});