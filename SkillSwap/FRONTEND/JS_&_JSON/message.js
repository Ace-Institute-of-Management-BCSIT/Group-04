// FRONTEND/JS_&_JSON/message.js

let currentChatId = null;
let currentUser = {
    id: 1,
    name: "Suresh Shrestha",
    role: "skill-provider"
};

// Mock contacts (your friends)
const contacts = [
    { id: 2, name: "Krish Shrestha", avatar: "🎸", role: "skill-seeker" },
    { id: 3, name: "Grishma Adhikari", avatar: "🧘", role: "skill-provider" },
    { id: 4, name: "Aisha Patel", avatar: "📊", role: "skill-seeker" }
];

// Load messages from localStorage (shared on same browser, but we can simulate)
function getMessages(chatId) {
    const key = `chat_${chatId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
}

function saveMessage(chatId, message, isSent) {
    const key = `chat_${chatId}`;
    let messages = getMessages(chatId);
    messages.push({
        text: message,
        isSent: isSent,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem(key, JSON.stringify(messages));
}

function loadChatList() {
    const chatList = document.getElementById('chatList');
    chatList.innerHTML = contacts.map(contact => `
        <div class="chat-item ${currentChatId === contact.id ? 'active' : ''}" data-id="${contact.id}">
            <div class="chat-avatar">${contact.avatar}</div>
            <div class="chat-info">
                <h4>${contact.name}</h4>
                <p>Tap to start chatting</p>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', () => {
            currentChatId = parseInt(item.dataset.id);
            loadSelectedChat();
            loadChatList();
        });
    });
}

function loadSelectedChat() {
    const contact = contacts.find(c => c.id === currentChatId);
    if (!contact) return;

    document.getElementById('chatName').textContent = contact.name;
    document.getElementById('chatAvatar').textContent = contact.avatar;

    const messagesArea = document.getElementById('messagesArea');
    const messages = getMessages(currentChatId);

    messagesArea.innerHTML = messages.map(msg => `
        <div class="message ${msg.isSent ? 'sent' : 'received'}">
            <p>${msg.text}</p>
            <small class="message-time">${msg.time}</small>
        </div>
    `).join('');

    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();

    if (!text || !currentChatId) return;

    saveMessage(currentChatId, text, true);
    loadSelectedChat();
    input.value = '';

    // Simulate reply from other user
    setTimeout(() => {
        const replies = ["Got it!", "When are you free?", "Sounds good 👍", "Let's do it!"];
        const replyText = replies[Math.floor(Math.random() * replies.length)];
        saveMessage(currentChatId, replyText, false);
        loadSelectedChat();
    }, 700);
}

function initMessages() {
    loadChatList();

    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Auto open first chat
    if (contacts.length > 0) {
        currentChatId = contacts[0].id;
        loadSelectedChat();
    }
}

window.addEventListener('DOMContentLoaded', initMessages);