let allUsers = [];

async function loadUsers() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch('http://localhost:5000/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load users');

        const data = await res.json();
        allUsers = data.users || [];
        renderUserCards(allUsers);
    } catch (err) {
        console.error(err);
        alert("Failed to load users. Make sure backend is running.");
    }
}

function renderUserCards(users) {
    const container = document.getElementById('userCards');
    const countEl = document.getElementById('resultsCount');

    countEl.textContent = `Found ${users.length} matches`;

    if (users.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding:40px;">No users found.</p>`;
        return;
    }

    container.innerHTML = users.map(user => `
        <div class="user-card">
            <div class="user-header">
                <img src="${user.profile_picture || '../assets/default-avatar.png'}" class="avatar" alt="${user.full_name}">
                <div>
                    <h3>${user.full_name}</h3>
                    <div class="user-meta">📍 ${user.location || 'Unknown'}</div>
                    <div>⭐ 4.8 • ₹${user.hourly_rate || 500}/hr</div>
                </div>
            </div>
            <p class="user-bio">${user.bio || 'Passionate about sharing knowledge.'}</p>
            
            <div class="card-actions">
                <button onclick="viewProfile(${user.id})" class="btn btn-primary">View Profile</button>
                <button onclick="startChat(${user.id})" class="btn btn-outline">Message</button>
            </div>
        </div>
    `).join('');
}

function filterUsers() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allUsers.filter(user => 
        user.full_name.toLowerCase().includes(query)
    );
    renderUserCards(filtered);
}

// Navigation functions
function viewProfile(id) {
    window.location.href = `user-profile.html?id=${id}`;
}

function startChat(id) {
    window.location.href = `chat.html?with=${id}`;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadNavbar();
    await loadUsers();

    // Search listeners
    document.getElementById('searchInput').addEventListener('input', filterUsers);
});