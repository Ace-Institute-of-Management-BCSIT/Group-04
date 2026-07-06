// FRONTEND/JS_&_JSON/message.js

const API_BASE = 'https://skillswap-backend-7kc7.onrender.com/api';
const token = localStorage.getItem('token');

let currentUser = null;
let currentChatId = null;
let conversations = [];
let socket = null;

async function loadCurrentUser() {
    const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) currentUser = data.user;
}

async function loadConversations() {
    const res = await fetch(`${API_BASE}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    conversations = data.success ? data.conversations : [];
}

// If we arrived via ?to=<id> and there's no existing conversation yet,
// pull that person's basic info so they still show up in the sidebar.
async function ensureChatPartner(id) {
    if (conversations.some(c => c.user_id == id)) return;

    const res = await fetch(`${API_BASE}/users/profile/${id}`);
    const data = await res.json();
    if (data.success) {
        conversations.unshift({
            user_id: data.user.id,
            full_name: data.user.name,
            avatar: data.user.avatar,
            last_message: "Tap to start chatting",
            last_time: null
        });
    }
}

function renderChatList() {
    const chatList = document.getElementById('chatList');
    chatList.innerHTML = conversations.map(c => `
        <div class="chat-item ${currentChatId == c.user_id ? 'active' : ''}" data-id="${c.user_id}">
            <div class="chat-avatar">${c.avatar ? `<img src="${c.avatar}" alt="">` : '👤'}</div>
            <div class="chat-info">
                <h4>${c.full_name}</h4>
                <p>${c.last_message || 'Tap to start chatting'}</p>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', () => openChat(parseInt(item.dataset.id)));
    });
}

function renderMessages(messages) {
    const messagesArea = document.getElementById('messagesArea');
    messagesArea.innerHTML = messages.map(m => `
        <div class="message ${m.sender_id == currentUser.id ? 'sent' : 'received'}">
            <p>${m.message_text}</p>
            <small class="message-time">${new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
        </div>
    `).join('');
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

async function openChat(otherUserId) {
    currentChatId = otherUserId;

    const partner = conversations.find(c => c.user_id == otherUserId);
    document.getElementById('chatName').textContent = partner ? partner.full_name : 'Chat';
    const chatAvatar = document.getElementById('chatAvatar');
    chatAvatar.innerHTML = (partner && partner.avatar)
        ? `<img src="${partner.avatar}" alt="">`
        : '👤';


    renderChatList();

    const res = await fetch(`${API_BASE}/messages/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    renderMessages(data.success ? data.messages : []);
}

function appendIfRelevant(msg) {
    // Update the relevant sidebar preview regardless of which chat is open
    const otherId = msg.sender_id == currentUser.id ? msg.receiver_id : msg.sender_id;
    const convo = conversations.find(c => c.user_id == otherId);
    if (convo) {
        convo.last_message = msg.message_text;
        convo.last_time = msg.sent_at;
    }
    renderChatList();

    if (otherId != currentChatId) return; // message belongs to a different chat

    const messagesArea = document.getElementById('messagesArea');
    const isSent = msg.sender_id == currentUser.id;
    messagesArea.insertAdjacentHTML('beforeend', `
        <div class="message ${isSent ? 'sent' : 'received'}">
            <p>${msg.message_text}</p>
            <small class="message-time">${new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
        </div>
    `);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text || !currentChatId || !socket) return;

    socket.emit("send_message", { receiverId: currentChatId, message: text });
    input.value = '';
}

async function initMessages() {
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    await loadCurrentUser();
    await loadConversations();

    // ← CHANGED: no URL passed — connects to whatever origin served this page
    // (works identically on localhost:5000 and http://<your-ip>:5000)
    socket = io({ auth: { token } });
    socket.on("receive_message", appendIfRelevant);
    socket.on("connect_error", (err) => console.error("Socket auth failed:", err.message));

    const params = new URLSearchParams(window.location.search);
    const toId = params.get('to');

    if (toId) {
        await ensureChatPartner(toId);
        openChat(parseInt(toId));
    } else {
        renderChatList();
        if (conversations.length > 0) openChat(conversations[0].user_id);
    }

    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

window.addEventListener('DOMContentLoaded', initMessages);