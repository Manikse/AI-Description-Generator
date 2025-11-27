// --- Налаштування Лічильника та Ключа ---
const MAX_FREE_ATTEMPTS = 2;
const MASTER_LICENSE_KEY = "AI-DESC-GEN-GMRD-B19C77-2025NOV-74A82F";

const chatWindow = document.getElementById('chat-window');
const keyForm = document.getElementById('key-form');
const keyInput = document.getElementById('license-key');
const keyMessage = document.getElementById('key-message');
const promptInput = document.getElementById('prompt');
const generatorForm = document.getElementById('generator-form');
const generateButton = document.getElementById('generate-button');
const accessSection = document.getElementById('access-section');


// Функція створення елемента повідомлення
function createMessageElement(content, senderClass) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message', senderClass);
    messageContainer.innerHTML = `<p>${content}</p>`;
    chatWindow.appendChild(messageContainer);
    
    // Скрол вниз до останнього повідомлення
    chatWindow.scrollTop = chatWindow.scrollHeight;
    
    return messageContainer;
}

// Функція оновлення лічильника
function updateCounter() {
    let attempts = parseInt(localStorage.getItem('free_attempts') || '0');
    let remaining = MAX_FREE_ATTEMPTS - attempts;
    
    if (localStorage.getItem('license_activated') === 'true') {
        accessSection.innerHTML = '<p style="color: green; font-weight: bold;">✅ Full Access Activated (Subscription Key).</p>';
    } else if (remaining > 0) {
        accessSection.innerHTML = `<p>👉 **Free Trial:** ${remaining} generation(s) remaining. Get full access below.</p>`;
    } else {
        accessSection.innerHTML = `<p style="color: red; font-weight: bold;">❌ Free trials used up. Activate your subscription key below!</p>`;
        generatorForm.style.pointerEvents = 'none'; // Блокуємо форму вводу
        generateButton.disabled = true;
    }
}

// --- Ініціалізація та Логіка Активації ---

updateCounter();

keyForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const inputKey = keyInput.value.trim();

    if (inputKey === MASTER_LICENSE_KEY) {
        localStorage.setItem('license_activated', 'true');
        keyMessage.textContent = '✅ Activated! You have full access.';
        keyMessage.style.color = 'green';
        keyForm.style.display = 'none';
        generatorForm.style.pointerEvents = 'auto'; // Розблоковуємо
        generateButton.disabled = false;
        updateCounter();
    } else {
        keyMessage.textContent = '❌ Invalid subscription key. Please check and try again.';
        keyMessage.style.color = 'red';
    }
});


// --- Логіка Генерації Чат-Повідомлення ---

generatorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    // 1. Перевірка доступу
    const isActivated = localStorage.getItem('license_activated') === 'true';
    let attempts = parseInt(localStorage.getItem('free_attempts') || '0');

    if (!isActivated && attempts >= MAX_FREE_ATTEMPTS) {
        createMessageElement(`Subscription required. You have used ${MAX_FREE_ATTEMPTS} free generations.`, 'system-message error');
        updateCounter();
        return;
    }
    
    // 2. Відображення запиту користувача
    createMessageElement(prompt, 'user-message');
    promptInput.value = ''; // Очищаємо інпут

    // 3. Індикатор завантаження
    const loadingMessage = createMessageElement('<span class="loading-dots">Generating...</span>', 'ai-message');
    
    generateButton.disabled = true;

    try {
        const response = await fetch('/.netlify/functions/generate-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Server generation error.');
        }

        // 4. Оновлення лічильника
        if (!isActivated) {
            attempts++;
            localStorage.setItem('free_attempts', attempts.toString());
        }

        // 5. Заміна індикатора на результат
        loadingMessage.innerHTML = `<p>${data.text}</p><button class="copy-btn">Copy</button>`;
        loadingMessage.classList.add('ai-message');
        
    } catch (error) {
        // Виведення помилки у вікно чату
        loadingMessage.innerHTML = `<p style="color: red;">❌ Error: ${error.message}. Please check API key.</p>`;
        loadingMessage.classList.add('error');
        console.error('Fetch error:', error);
    } finally {
        generateButton.disabled = false;
        updateCounter();
    }
});

// --- Логіка Копіювання (Делегування) ---
chatWindow.addEventListener('click', (e) => {
    if (e.target.classList.contains('copy-btn')) {
        const textToCopy = e.target.parentElement.querySelector('p').textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('Text copied successfully!');
        }).catch(err => {
            console.error('Could not copy text: ', err);
        });
    }
});