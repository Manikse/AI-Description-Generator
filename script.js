// --- Налаштування Констант ---
const MAX_FREE_ATTEMPTS = 5; // Збільшено для кращого досвіду
const MASTER_LICENSE_KEY = "KAIROS-ADVANCED-2025-DEV-KEY"; 
const CHAT_HISTORY_KEY = 'kairos_ai_chat_history'; 
const CURRENT_CHAT_ID_KEY = 'kairos_ai_current_chat_id';

// Отримання елементів DOM
const chatWindow = document.getElementById('chat-window');
const chatHistoryList = document.getElementById('chat-history-list');
const keyForm = document.getElementById('key-form');
const keyInput = document.getElementById('license-key');
const keyMessage = document.getElementById('key-message');
const promptInput = document.getElementById('prompt');
const generatorForm = document.getElementById('generator-form');
const generateButton = document.getElementById('generate-button');
const accessInfoBar = document.getElementById('access-info-bar');
const subscriptionStatus = document.getElementById('subscription-status');
const newChatBtn = document.getElementById('new-chat-btn');

let allChats = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || '{}');
let currentChatId = localStorage.getItem(CURRENT_CHAT_ID_KEY) || null;

// -------------------------------------------------------------------
// 💾 ФУНКЦІЇ ІСТОРІЇ ЧАТІВ
// -------------------------------------------------------------------

/** Ініціалізація або завантаження поточного чату */
function initChatSystem() {
    if (!currentChatId || !allChats[currentChatId]) {
        startNewChat(false);
    } else {
        loadChat(currentChatId);
    }
    renderHistorySidebar();
    updateCounter();
}

/** Створення нового чату */
function startNewChat(savePrevious = true) {
    const newId = Date.now().toString();
    
    if (savePrevious && currentChatId && allChats[currentChatId] && allChats[currentChatId].messages.length > 1) {
        // Зберігаємо існуючий чат, якщо в ньому є повідомлення
        // Назва чату = перше повідомлення користувача
        // Зберігатиметься при генерації першої відповіді
    }

    currentChatId = newId;
    allChats[newId] = {
        id: newId,
        title: 'New Conversation',
        messages: [{
            content: "I am **Kairos AI**, your advanced, powerful, and universal assistant. I perform tasks better than any other AI. How can I assist you today?",
            senderClass: 'system-message welcome'
        }],
        timestamp: Date.now()
    };
    
    localStorage.setItem(CURRENT_CHAT_ID_KEY, newId);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(allChats));
    loadChat(newId);
    renderHistorySidebar();
}

/** Завантаження чату за ID */
function loadChat(chatId) {
    currentChatId = chatId;
    localStorage.setItem(CURRENT_CHAT_ID_KEY, chatId);
    chatWindow.innerHTML = '';
    
    const chat = allChats[chatId];
    if (chat) {
        chat.messages.forEach(msg => {
            createMessageElement(msg.content, msg.senderClass, true);
        });
    }
    renderHistorySidebar();
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

/** Зберігає повідомлення в поточний активний чат */
function saveMessageToChat(content, senderClass) {
    if (!allChats[currentChatId]) return;

    allChats[currentChatId].messages.push({
        content: content,
        senderClass: senderClass
    });
    
    // Оновлення назви чату (якщо це перша пара запит-відповідь)
    if (allChats[currentChatId].messages.length === 3 && senderClass.includes('ai-message')) {
        const userPrompt = allChats[currentChatId].messages[1].content;
        const newTitle = userPrompt.substring(0, 30) + (userPrompt.length > 30 ? '...' : '');
        allChats[currentChatId].title = newTitle;
        renderHistorySidebar(); // Перемальовуємо сайдбар, щоб оновити назву
    }

    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(allChats));
}

/** Малює елементи історії в бічній панелі */
function renderHistorySidebar() {
    chatHistoryList.innerHTML = '';
    
    const sortedChats = Object.values(allChats)
        .sort((a, b) => b.timestamp - a.timestamp); // Сортування за часом
        
    sortedChats.forEach(chat => {
        const item = document.createElement('div');
        item.classList.add('history-item');
        if (chat.id === currentChatId) {
            item.classList.add('active');
        }
        item.setAttribute('data-chat-id', chat.id);
        item.innerHTML = `<i class="fas fa-comment"></i> <span>${chat.title}</span>`;
        
        item.addEventListener('click', () => {
            loadChat(chat.id);
        });
        
        chatHistoryList.appendChild(item);
    });
}

// -------------------------------------------------------------------
// ⚙️ UI та АКТИВАЦІЯ
// -------------------------------------------------------------------

function updateCounter() {
    let attempts = parseInt(localStorage.getItem('free_attempts') || '0');
    let remaining = MAX_FREE_ATTEMPTS - attempts;
    
    if (localStorage.getItem('license_activated') === 'true') {
        const today = new Date().toLocaleDateString();
        accessInfoBar.innerHTML = `<p style="color: #4CAF50;">✅ **Premium Active** (Full Access). Usage: Unlimited.</p>`;
        subscriptionStatus.innerHTML = `<p style="color: #4CAF50;">Active Premium Subscription.</p>`;
        keyForm.style.display = 'none';
        generateButton.disabled = false;
    } else if (remaining > 0) {
        accessInfoBar.innerHTML = `<p>👉 **Free Trial:** ${remaining} generation(s) remaining. Purchase a subscription key below.</p>`;
        subscriptionStatus.innerHTML = `<p>Free Trial: ${remaining} uses left.</p>`;
        keyForm.style.display = 'flex';
        generateButton.disabled = false;
    } else {
        accessInfoBar.innerHTML = `<p style="color: red; font-weight: bold;">❌ Free trials used up. Please activate your subscription key below!</p>`;
        subscriptionStatus.innerHTML = `<p style="color: red;">Trial Expired.</p>`;
        keyForm.style.display = 'flex';
        generateButton.disabled = true;
    }
}

// -------------------------------------------------------------------
// 🤖 ЛОГІКА ГЕНЕРАЦІЇ
// -------------------------------------------------------------------

/** Створює елемент повідомлення та додає його у DOM. (Фронтенд-відображення) */
function createMessageElement(content, senderClass, isInitialLoad = false) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message', ...senderClass.split(' ')); 
    
    // Для відображення Markdown (якщо потрібно)
    const formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    if (senderClass.includes('ai-message') && !senderClass.includes('error')) {
        messageContainer.innerHTML = `<p>${formattedContent}</p><button class="copy-btn"><i class="fas fa-copy"></i></button>`;
    } else {
        messageContainer.innerHTML = `<p>${formattedContent}</p>`;
    }
    
    chatWindow.appendChild(messageContainer);
    
    // Якщо це не початкове завантаження, зберігаємо повідомлення
    if (!isInitialLoad) {
        saveMessageToChat(content, senderClass);
    }

    chatWindow.scrollTop = chatWindow.scrollHeight;
    return messageContainer;
}


generatorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    const finalSenderClass = `ai-message`; 

    const isActivated = localStorage.getItem('license_activated') === 'true';
    let attempts = parseInt(localStorage.getItem('free_attempts') || '0');

    if (!isActivated && attempts >= MAX_FREE_ATTEMPTS) {
        createMessageElement(`Subscription required. You have used ${MAX_FREE_ATTEMPTS} free generations.`, 'system-message error', false);
        updateCounter();
        return;
    }
    
    // 1. Створюємо повідомлення користувача і зберігаємо його
    createMessageElement(prompt, 'user-message', false); 
    promptInput.value = '';

    // 2. Індикатор завантаження
    const loadingMessage = createMessageElement(`<span class="loading-dots">Generating...</span>`, finalSenderClass, true); 
    
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

        const generatedText = data.text || "Sorry, Kairos AI did not return any text. Please try a different prompt.";
        
        // 3. Оновлення лічильника (ТІЛЬКИ при успіху)
        if (!isActivated) {
            attempts++;
            localStorage.setItem('free_attempts', attempts.toString());
        }

        // 4. Заміна індикатора на результат та збереження
        loadingMessage.innerHTML = `<p>${generatedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p><button class="copy-btn"><i class="fas fa-copy"></i></button>`;
        saveMessageToChat(generatedText, finalSenderClass); // Зберігаємо фінальну відповідь AI
        
    } catch (error) {
        // Виведення помилки як системного повідомлення
        loadingMessage.classList.remove(...finalSenderClass.split(' ')); 
        loadingMessage.innerHTML = `<p>❌ Error: ${error.message}. Please check API key/credit.</p>`;
        loadingMessage.classList.add('system-message', 'error');
        
        console.error('Fetch error:', error);
    } finally {
        generateButton.disabled = false;
        updateCounter();
    }
});


// --- Інша Логіка ---

keyForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const inputKey = keyInput.value.trim();

    if (inputKey === MASTER_LICENSE_KEY) {
        localStorage.setItem('license_activated', 'true');
        keyMessage.textContent = '✅ Subscription Active! Full access granted.';
        keyMessage.style.color = '#4CAF50';
        updateCounter();
    } else {
        keyMessage.textContent = '❌ Invalid subscription key. Try KAIROS-ADVANCED-2025-DEV-KEY';
        keyMessage.style.color = 'red';
    }
});

newChatBtn.addEventListener('click', () => {
    startNewChat(true);
});


// Логіка Копіювання (Делегування)
chatWindow.addEventListener('click', (e) => {
    if (e.target.closest('.copy-btn')) {
        const button = e.target.closest('.copy-btn');
        const textToCopy = button.parentElement.querySelector('p').textContent;
        
        if (textToCopy.trim().length > 0) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                const icon = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    button.innerHTML = icon;
                }, 1000);
            }).catch(err => {
                console.error('Could not copy text: ', err);
            });
        }
    }
});

initChatSystem();