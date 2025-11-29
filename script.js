// --- Налаштування Лічильника та Ключа ---
const MAX_FREE_ATTEMPTS = 2;
const MASTER_LICENSE_KEY = "AI-DESC-GEN-GMRD-B19C77-2025NOV-74A82F";
const CHAT_HISTORY_KEY = 'ai_copuwriter_chat_history'; // Ключ для історії чату в localStorage

// Отримання елементів DOM
const chatWindow = document.getElementById('chat-window');
const keyForm = document.getElementById('key-form');
const keyInput = document.getElementById('license-key');
const keyMessage = document.getElementById('key-message');
const promptInput = document.getElementById('prompt');
const generatorForm = document.getElementById('generator-form');
const generateButton = document.getElementById('generate-button');
const accessSection = document.getElementById('access-section');
const aiModeSelect = document.getElementById('ai-mode'); // НОВИЙ ЕЛЕМЕНТ: Селектор режиму


// -------------------------------------------------------------------
// 💾 ФУНКЦІЇ ЗБЕРЕЖЕННЯ ІСТОРІЇ
// -------------------------------------------------------------------

/**
 * Створює елемент повідомлення та додає його у DOM.
 * @param {string} content - HTML-вміст повідомлення.
 * @param {string} senderClass - Клас(и) відправника ('user-message', 'ai-message mode-email', 'system-message').
 * @param {boolean} isInitialLoad - Прапорець, щоб не зберігати повідомлення при завантаженні.
 */
function createMessageElement(content, senderClass, isInitialLoad = false) {
    const messageContainer = document.createElement('div');
    
    // ВАЖЛИВА ЗМІНА: Додаємо всі класи, розділені пробілом
    messageContainer.classList.add(...senderClass.split(' ')); 
    
    // Якщо це AI-відповідь, додаємо кнопку "Copy"
    if (senderClass.includes('ai-message')) {
        messageContainer.innerHTML = `<p>${content}</p><button class="copy-btn">Copy</button>`;
    } else {
        messageContainer.innerHTML = `<p>${content}</p>`;
    }
    
    chatWindow.appendChild(messageContainer);
    
    // Якщо це не завантаження історії, зберігаємо повідомлення
    if (!isInitialLoad && senderClass !== 'system-message' && !senderClass.includes('error')) {
        saveMessage(content, senderClass);
    }

    chatWindow.scrollTop = chatWindow.scrollHeight;
    return messageContainer;
}

/** Зберігає повідомлення в localStorage. */
function saveMessage(content, senderClass) {
    const history = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || '[]');
    history.push({ content: content, senderClass: senderClass, timestamp: Date.now() });
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
}

/** Завантажує повідомлення з localStorage і відображає їх. */
function loadHistory() {
    const history = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || '[]');
    
    // Якщо історія є, приховуємо вітальне системне повідомлення
    if (history.length > 0) {
        const welcomeMessage = chatWindow.querySelector('.system-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
    }
    
    history.forEach(msg => {
        // Відновлюємо повідомлення без повторного збереження
        createMessageElement(msg.content, msg.senderClass, true); 
    });
}

// -------------------------------------------------------------------
// ⚙️ ІНШІ ФУНКЦІЇ (Лічильник та Активація)
// -------------------------------------------------------------------

// Функція оновлення лічильника
function updateCounter() {
    let attempts = parseInt(localStorage.getItem('free_attempts') || '0');
    let remaining = MAX_FREE_ATTEMPTS - attempts;
    
    if (localStorage.getItem('license_activated') === 'true') {
        accessSection.innerHTML = '<p style="color: green; font-weight: bold;">✅ Full Access Activated (Subscription Key).</p>';
        generatorForm.style.pointerEvents = 'auto'; 
        generateButton.disabled = false;
    } else if (remaining > 0) {
        accessSection.innerHTML = `<p>👉 **Free Trial:** ${remaining} generation(s) remaining. Get full access below.</p>`;
        generatorForm.style.pointerEvents = 'auto'; 
        generateButton.disabled = false;
    } else {
        accessSection.innerHTML = `<p style="color: red; font-weight: bold;">❌ Free trials used up. Activate your subscription key below!</p>`;
        generatorForm.style.pointerEvents = 'none';
        generateButton.disabled = true;
    }
}

// --- Ініціалізація та Логіка Активації ---

updateCounter();
loadHistory(); 

keyForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const inputKey = keyInput.value.trim();

    if (inputKey === MASTER_LICENSE_KEY) {
        localStorage.setItem('license_activated', 'true');
        keyMessage.textContent = '✅ Activated! You have full access.';
        keyMessage.style.color = 'green';
        keyForm.style.display = 'none';
        updateCounter();
    } else {
        keyMessage.textContent = '❌ Invalid subscription key. Please check and try again.';
        keyMessage.style.color = 'red';
    }
});


// -------------------------------------------------------------------
// 🤖 ЛОГІКА ГЕНЕРАЦІЇ ЧАТ-ПОВІДОМЛЕННЯ
// -------------------------------------------------------------------

generatorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    const mode = aiModeSelect.value; 
    // Клас для стилізації бульбашки AI
    const modeClass = mode !== 'generic' ? `mode-${mode}` : ''; 
    const finalSenderClass = `ai-message ${modeClass}`; // Фінальний клас для AI-відповіді

    const isActivated = localStorage.getItem('license_activated') === 'true';
    let attempts = parseInt(localStorage.getItem('free_attempts') || '0');

    if (!isActivated && attempts >= MAX_FREE_ATTEMPTS) {
        createMessageElement(`Subscription required. You have used ${MAX_FREE_ATTEMPTS} free generations.`, 'system-message error');
        updateCounter();
        return;
    }
    
    // 2. Відображення запиту користувача
    createMessageElement(prompt, 'user-message'); 
    promptInput.value = '';

    // 3. Індикатор завантаження
    // Використовуємо modeClass для стилізації індикатора
    const loadingMessage = createMessageElement(`<span class="loading-dots">Generating...</span>`, finalSenderClass, true); 
    
    generateButton.disabled = true;

    try {
        const response = await fetch('/.netlify/functions/generate-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Надсилаємо prompt і mode
            body: JSON.stringify({ prompt, mode }), 
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Server generation error.');
        }

        const generatedText = data.text || "Sorry, the AI did not return any text. Please try a different prompt.";
        
        // 4. Оновлення лічильника (ТІЛЬКИ при успіху)
        if (!isActivated) {
            attempts++;
            localStorage.setItem('free_attempts', attempts.toString());
        }

        // 5. Заміна індикатора на результат
        loadingMessage.innerHTML = `<p>${generatedText}</p><button class="copy-btn">Copy</button>`;
        // Класи вже встановлені на кроці 3.

        // Зберігаємо фінальну відповідь AI в історію, використовуючи modeClass
        saveMessage(generatedText, finalSenderClass); 
        
    } catch (error) {
        // Виведення помилки як системного повідомлення
        loadingMessage.classList.remove('ai-message', `mode-${mode}`); // Видаляємо всі AI/Mode класи
        loadingMessage.innerHTML = `<p>❌ Error: ${error.message}. Please check API key and try again.</p>`;
        loadingMessage.classList.add('system-message', 'error');
        
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
        
        if (textToCopy.trim().length > 0) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                alert('Text copied successfully!');
            }).catch(err => {
                console.error('Could not copy text: ', err);
            });
        }
    }
});