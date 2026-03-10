/* ==========================================
   1. GESTION DE LA GALERIE DYNAMIQUE
   ========================================== */
const galleryData = {
    tresses: [
        { src: '4.jpeg', title: 'Tresses Royales' },
        { src: '10.jpeg', title: 'Nattes Couchées' },
        { src: '11.jpeg', title: 'Box Braids Gold' },
        { src: '12.jpeg', title: 'Tresses Fulani' }
    ],
    chignon: [
        { src: '2.jpeg', title: 'Chignon Mariage' },
        { src: '5.jpeg', title: 'Chignon Bas Chic' },
        { src: '13.jpeg', title: 'Bun Stylisé' }
    ],
    coupe: [
        { src: '3.jpeg', title: 'Carré Plongeant' },
        { src: '8.jpeg', title: 'Coupe Pixie' },
        { src: '14.jpeg', title: 'Dégradé Moderne' }
    ]
};

function expandGallery(category) {
    const container = document.getElementById('gallery-content');
    const view = document.getElementById('expanded-view');
    if (!container || !view) return;

    container.innerHTML = '';
    if (!galleryData[category]) return;

    galleryData[category].forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'gallery-item-expanded';
        div.style.animation = `slideUp 0.5s ease forwards ${index * 0.1}s`;
        div.style.opacity = "0"; 
        div.innerHTML = `
            <img src="${item.src}" alt="${item.title}" style="cursor:zoom-in">
            <span class="img-caption" style="display:block; text-align:center; margin-top:10px; font-size:0.9rem; color:#c7a447;">${item.title}</span>
        `;
        container.appendChild(div);
    });

    view.classList.add('active');
    document.body.style.overflow = 'hidden'; 
}

function closeGallery() {
    const view = document.getElementById('expanded-view');
    if (view) {
        view.classList.remove('active');
        document.body.style.overflow = 'auto'; 
    }
}

/* ==========================================
   2. LE BOT "SMART" AVEC SUGGESTIONS
   ========================================== */
const botData = {
    salutations: {
        keywords: ['bonjour', 'salut', 'coucou', 'hello', 'bjr'],
        responses: ["Enchantée ! Je suis l'assistant de Patricia. Comment puis-je vous sublimer ?", "Bienvenue ! Prête pour un nouveau look ?"]
    },
    services: {
        keywords: ['coiffure', 'tresses', 'chignon', 'coupe', 'tissage', 'catalogue'],
        responses: ["Patricia est experte en tresses, chignons et coupes. Allez voir nos 'Collections' pour vous inspirer !"]
    },
    tarifs: {
        keywords: ['prix', 'tarif', 'combien', 'coûte', 'fcfa'],
        responses: ["Nos tarifs dépendent de la coiffure. Patricia peut vous faire un devis rapide via WhatsApp !"]
    },
    rdv: {
        keywords: ['rdv', 'rendez-vous', 'réserver', 'prendre'],
        responses: ["Excellente idée ! Cliquez sur 'Prendre RDV' ou contactez Patricia sur WhatsApp."]
    }
};

// --- CONFIGURATION DES SUGGESTIONS ---
const quickReplies = [
    { label: "💇‍♀️ Nos Coiffures", cmd: "coiffures" },
    { label: "💰 Les Tarifs", cmd: "tarifs" },
    { label: "📅 Prendre RDV", cmd: "rdv" },
    { label: "📍 Localisation", cmd: "où êtes-vous ?" }
];

const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendMsg');
const botWindow = document.getElementById('botWindow');
const botToggle = document.getElementById('botToggle');

// Fonction pour afficher les bulles de suggestions
function displaySuggestions() {
    const suggestContainer = document.createElement('div');
    suggestContainer.className = 'suggestion-wrapper';
    
    quickReplies.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'suggest-btn';
        btn.innerText = item.label;
        btn.onclick = () => {
            userInput.value = item.cmd;
            handleSend();
            suggestContainer.remove(); // Supprime après clic pour garder le chat propre
        };
        suggestContainer.appendChild(btn);
    });
    chatMessages.appendChild(suggestContainer);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

if (botToggle && botWindow) {
    botToggle.onclick = () => {
        botWindow.classList.toggle('active');
        const dot = document.querySelector('.notification-dot');
        if (dot) dot.style.display = 'none';
        
        // Affiche les suggestions automatiquement après 1 seconde à l'ouverture
        if (botWindow.classList.contains('active') && chatMessages.children.length < 2) {
            setTimeout(displaySuggestions, 1000);
        }
    };
}

function handleSend() {
    const val = userInput.value.trim();
    if (!val) return;
    
    appendMessage(val, 'user');
    userInput.value = '';
    
    setTimeout(() => {
        appendMessage(getSmartResponse(val), 'bot');
        // On propose à nouveau les suggestions après la réponse si besoin
        setTimeout(displaySuggestions, 1500);
    }, 800);
}

function getSmartResponse(msg) {
    const text = msg.toLowerCase();
    for (let category in botData) {
        if (botData[category].keywords.some(key => text.includes(key))) {
            const res = botData[category].responses;
            return res[Math.floor(Math.random() * res.length)];
        }
    }
    return "Je ne suis pas sûre de comprendre, mais Patricia peut vous répondre directement sur WhatsApp !";
}

function appendMessage(text, type) {
    if (!chatMessages) return;
    const div = document.createElement('div');
    div.className = `msg ${type}-msg`;
    div.innerText = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
}

if (sendBtn && userInput) {
    sendBtn.onclick = handleSend;
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeGallery();
        if (botWindow) botWindow.classList.remove('active');
    }
});