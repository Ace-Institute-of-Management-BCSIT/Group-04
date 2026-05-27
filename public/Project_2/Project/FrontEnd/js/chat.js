let currentPartnerId = null;
let currentUserId = null; // Will be set from token in real app

async function loadConversations() {
    // Mock conversations for now (replace with real API later)
    const mockConversations = [
        { id: 2, name: "Sarah Chen", lastMessage: "Hey, are you free this weekend?" },
        { id: 3, name: "Marcus Johnson", lastMessage: "Thanks for the guitar tips!" },
    ];

    const container = document.getElementById('conversationsList');
    container.innerHTML = mockConversations.map(conv => `
        <div class="conversation-item" onclick="openChat(${conv.id}, '${conv.name}')">
            <strong>${conv.name}</strong>
            <p style="margin: 4px 0 0; font-size: 0.9rem; color: var(--muted-foreground);">${conv.lastMessage}</p>
        </div>
    `).join('');
}

async function openChat(partnerId, partnerName) {
    currentPartnerId = partnerId;
    
    // Highlight active chat
    document.querySelectorAll('.conversation-item').forEach(el => {
        el.classList.toggle('active', el.onclick.toString().includes(partnerId));
    });

    document.getElementById('chatHeader').innerHTML = `
        <strong>Chat with ${partnerName}</strong>
    `;

    // Mock messages
    const mockMessages = [
        { sender_id: partnerId, message: "Hi! Are you interested in learning React?" },
        { sender_id: 999, message: "Yes! When are you free?" },
    ];

    renderMessages(mockMessages);
}

function renderMessages(messages) {
    const container = document.getElementById('messagesArea');
    container.innerHTML = messages.map(msg => `
        <div class="message ${msg.sender_id === currentPartnerId ? 'received' : 'sent'}">
            ${msg.message}
        </div>
    `).join('');
    
    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const messageText = input.value.trim();
    
    if (!messageText || !currentPartnerId) return;

    // Add message to UI immediately
    const container = document.getElementById('messagesArea');
    container.innerHTML += `
        <div class="message sent">${messageText}</div>
    `;
    container.scrollTop = container.scrollHeight;

    input.value = '';

    // TODO: Send to backend later
    console.log(`Message sent to user ${currentPartnerId}: ${messageText}`);
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadNavbar();
    await loadConversations();

    // Allow sending message with Enter key
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
});