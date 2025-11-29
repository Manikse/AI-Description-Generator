// --- Налаштування Констант ---
const MAX_FREE_ATTEMPTS = 5; 
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

// Налаштування Marked.js для рендерингу Markdown (включаючи блоки коду)
marked.setOptions({
    breaks: true,
    highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    }
});


// -------------------------------------------------------------------
// 💾 ФУНКЦІЇ ІСТОРІЇ ЧАТІВ
// -------------------------------------------------------------------

function initChatSystem() {
    if (!currentChatId || !allChats[currentChatId]) {
        startNewChat(false);
    } else {
        loadChat(currentChatId);
    }
    renderHistorySidebar();
    updateCounter();
}

function startNewChat(savePrevious = true) {
    const newId = Date.now().toString();
    
    // Перевіряємо, чи потрібно зберігати попередній чат
    if (savePrevious && currentChatId && allChats[currentChatId] && allChats[currentChatId].messages.length <= 1) {
        // Якщо попередній чат порожній, просто видаляємо його
        delete allChats[currentChatId];
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

function loadChat(chatId) {
    currentChatId = chatId;
    localStorage.setItem(CURRENT_CHAT_ID_KEY, chatId);
    chatWindow.innerHTML = '';
    
    const chat = allChats[chatId];
    if (chat) {
        chat.messages.forEach(msg => {
            // Використовуємо createMessageElement з false, щоб не зберігати повторно
            createMessageElement(msg.content, msg.senderClass, true); 
        });
    }
    renderHistorySidebar();
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

/** НОВА ФУНКЦІЯ: Видалення чату */
function deleteChat(chatId) {
    if (confirm(`Are you sure you want to delete chat: ${allChats[chatId].title}?`)) {
        delete allChats[chatId];
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(allChats));

        // Якщо видаляємо поточний чат, починаємо новий
        if (chatId === currentChatId) {
            startNewChat(false);
        } else {
            renderHistorySidebar();
        }
    }
}

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
        renderHistorySidebar(); 
    }

    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(allChats));
}

/** Малює елементи історії в бічній панелі з кнопкою видалення */
function renderHistorySidebar() {
    chatHistoryList.innerHTML = '';
    
    const sortedChats = Object.values(allChats)
        .filter(chat => chat.messages.length > 1) // Не відображаємо порожні чати (крім поточного)
        .sort((a, b) => b.timestamp - a.timestamp); 
        
    sortedChats.forEach(chat => {
        const item = document.createElement('div');
        item.classList.add('history-item');
        if (chat.id === currentChatId) {
            item.classList.add('active');
        }
        item.setAttribute('data-chat-id', chat.id);
        
        // Відображення тексту
        item.innerHTML = `<i class="fas fa-comment"></i> <span>${chat.title}</span>`;
        
        // Додаємо кнопку видалення
        const deleteBtn = document.createElement('i');
        deleteBtn.classList.add('fas', 'fa-trash', 'delete-chat-btn');
        deleteBtn.title = 'Delete Chat';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Запобігаємо завантаженню чату
            deleteChat(chat.id);
        });
        
        item.appendChild(deleteBtn);

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
    
    // КРИТИЧНО: Використовуємо marked.js для обробки коду та Markdown
    const htmlContent = marked.parse(content);
    
    if (senderClass.includes('ai-message') && !senderClass.includes('error')) {
        messageContainer.innerHTML = `<div class="ai-content-wrapper"><p class="parsed-content">${htmlContent}</p><button class="copy-btn" title="Copy"><i class="fas fa-copy"></i></button></div>`;
    } else {
        messageContainer.innerHTML = `<p>${htmlContent}</p>`;
    }
    
    chatWindow.appendChild(messageContainer);
    
    // Запускаємо Highlight.js для підсвічування коду
    messageContainer.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
    
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
    
    createMessageElement(prompt, 'user-message', false); 
    promptInput.value = '';

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
        
        if (!isActivated) {
            attempts++;
            localStorage.setItem('free_attempts', attempts.toString());
        }

        // 4. Заміна індикатора на результат та збереження
        loadingMessage.remove(); // Видаляємо індикатор
        const finalMessage = createMessageElement(generatedText, finalSenderClass, false); // Створюємо новий з правильним вмістом
        
    } catch (error) {
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
        // Шукаємо текст у блоці з класом .parsed-content
        const textToCopy = button.parentElement.querySelector('.parsed-content').textContent; 
        
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