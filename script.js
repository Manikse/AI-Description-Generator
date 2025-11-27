// --- Налаштування Лічильника та Ключа ---
const MAX_FREE_ATTEMPTS = 2; // Дозволяємо 2 безкоштовні спроби
const MASTER_LICENSE_KEY = "AI-DESC-GEN-GMRD-B19C77-2025NOV-74A82F"; // Ваш існуючий ключ

const outputDiv = document.getElementById('output');
const generatorSection = document.getElementById('generator-section');
const keyMessage = document.getElementById('key-message');
const keyForm = document.getElementById('key-form');
const keyInput = document.getElementById('license-key');
const promptInput = document.getElementById('prompt');
const generateButton = document.getElementById('generate-button');
const accessSection = document.getElementById('access-section');
const copyButton = document.getElementById('copy-button'); // Додано тут для scope

// Функція оновлення лічильника
function updateCounter() {
    let attempts = parseInt(localStorage.getItem('free_attempts') || '0');
    let remaining = MAX_FREE_ATTEMPTS - attempts;
    
    // Якщо активовано ключем, не показуємо лічильник
    if (localStorage.getItem('license_activated') === 'true') {
        // Оновлено: використовуємо англійську
        accessSection.innerHTML = '<p style="color: green;">✅ Full Access Activated (Subscription Key).</p>';
    } else if (remaining > 0) {
        // Оновлено: використовуємо англійську
        accessSection.innerHTML = `<p>👉 Try ${remaining} generation(s) for free. Get full access below.</p>`;
    } else {
        // Оновлено: використовуємо англійську
        accessSection.innerHTML = `<p style="color: red;">❌ Free trials used up. Please activate your subscription key below!</p>`;
        generatorSection.style.display = 'none';
    }
}

// Перевірка активації при завантаженні
if (localStorage.getItem('license_activated') === 'true' || 
    parseInt(localStorage.getItem('free_attempts') || '0') < MAX_FREE_ATTEMPTS) {
    generatorSection.style.display = 'block';
} else {
    generatorSection.style.display = 'none';
}
updateCounter();


// --- Логіка Активації Ключа ---

keyForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const inputKey = keyInput.value.trim();

    if (inputKey === MASTER_LICENSE_KEY) {
        localStorage.setItem('license_activated', 'true');
        generatorSection.style.display = 'block';
        keyMessage.textContent = '✅ Activated! You have full access.';
        keyMessage.style.color = 'green';
        keyForm.style.display = 'none'; // Ховаємо форму ключа
        updateCounter();
    } else {
        keyMessage.textContent = '❌ Invalid subscription key. Please check and try again.';
        keyMessage.style.color = 'red';
    }
});


// --- Логіка Генерації Тексту та Лічильник ---

document.getElementById('generator-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const isActivated = localStorage.getItem('license_activated') === 'true';
    let attempts = parseInt(localStorage.getItem('free_attempts') || '0');

    if (!isActivated && attempts >= MAX_FREE_ATTEMPTS) {
        outputDiv.innerHTML = `<p style="color: red;">Subscription required. You have used ${MAX_FREE_ATTEMPTS} free generations.</p>`;
        generatorSection.style.display = 'none';
        updateCounter();
        return;
    }
    
    const prompt = promptInput.value;

    // Оновлено: використовуємо англійську
    outputDiv.innerHTML = '<p>🚀 Generating copy, please wait...</p>'; 
    generateButton.disabled = true;
    copyButton.style.display = 'none';

    try {
        const response = await fetch('/.netlify/functions/generate-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Оновлено: використовуємо англійську
            throw new Error(data.error || 'Server generation error.');
        }

        if (!isActivated) {
            attempts++;
            localStorage.setItem('free_attempts', attempts.toString());
        }

        outputDiv.textContent = data.text;
        copyButton.style.display = 'block';
        
    } catch (error) {
        // Оновлено: використовуємо англійську
        outputDiv.innerHTML = `<p style="color: red;">❌ Error: ${error.message}. Please try again or check API key.</p>`; 
        console.error('Fetch error:', error);
    } finally {
        generateButton.disabled = false;
        updateCounter();
    }
});

// Логіка копіювання
document.getElementById('copy-button').addEventListener('click', () => {
    const textToCopy = document.getElementById('output').textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Text copied successfully!');
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
});