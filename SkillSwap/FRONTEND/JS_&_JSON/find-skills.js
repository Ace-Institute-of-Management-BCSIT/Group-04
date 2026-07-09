// frontend/js/find-skills.js

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5-4-8-4z'/></svg>";

let allUsers = [];      // real skill providers, grouped from /api/skills
let filteredUsers = [];

// The backend returns one row per skill. Group rows by provider_id
// so each card represents one person with a list of skills they teach.
function groupSkillsByProvider(skills) {
    const map = new Map();

    skills.forEach(skill => {
        if (!map.has(skill.provider_id)) {
            map.set(skill.provider_id, {
                id: skill.provider_id,
                name: skill.provider_name,
                avatar: skill.avatar,
                bio: skill.provider_bio,
                location: skill.location || "Kathmandu",
                rating: skill.rating || 4.8,
                reviews: skill.total_reviews || 0,
                teaching: []
            });
        }
        map.get(skill.provider_id).teaching.push({
            name: skill.skill_name,
            price: skill.price_per_session || 0,
            category: skill.category || ''
        });
    });

    return Array.from(map.values());
}

async function loadSkills() {
    const container = document.getElementById('userCards');
    container.innerHTML = `<div class="loading">Loading skill providers...</div>`;

    try {
        // Adjust this call if your window.api helper has a different signature.
        const data = await window.api.request('/skills');

        if (!data.success) {
            container.innerHTML = `<p style="text-align:center; color:#e74c3c;">Could not load skill providers.</p>`;
            return;
        }

        allUsers = groupSkillsByProvider(data.skills || []);
        filteredUsers = [...allUsers];
        renderUserCards();
    } catch (err) {
        console.error("Failed to load skills:", err);
        container.innerHTML = `<p style="text-align:center; color:#e74c3c;">
            Cannot connect to server. Make sure the backend is running.
        </p>`;
    }
}

function renderUserCards() {
    const container = document.getElementById('userCards');
    const resultsCount = document.getElementById('resultsCount');

    resultsCount.textContent = `Found ${filteredUsers.length} ${filteredUsers.length === 1 ? 'match' : 'matches'}`;

    if (filteredUsers.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#7f8c8d; grid-column: 1 / -1;">
            No skill providers found yet.
        </p>`;
        return;
    }

    container.innerHTML = filteredUsers.map(user => `
        <div class="user-card">
            <div class="user-header">
                <div class="avatar" style="background-image: url('${user.avatar || DEFAULT_AVATAR}'); background-size: cover; background-position: center;"></div>
                <div class="user-info">
                    <h3>${user.name}</h3>
                    <div class="user-meta">
                        <span> ${user.location}</span>
                    </div>
                    <div class="rating">⭐ ${user.rating} (${user.reviews})</div>
                </div>
            </div>
            <p class="user-bio">${user.bio || 'No bio added yet.'}</p>
            <div class="skill-section">
                <strong>Can teach:</strong>
                <div class="skill-tags">${user.teaching.map(skill => {
                    const categoryLabel = skill.category ? ` [${skill.category}]` : '';
                    return `<span class="skill-tag teaching">${skill.name}${categoryLabel} — Rs. ${skill.price}/hr</span>`;
                }).join('')}</div>
            </div>
            <div class="card-actions">
                <button class="btn btn-primary view-profile-btn" data-id="${user.id}">View Profile</button>
                <button class="btn btn-outline message-btn" data-id="${user.id}">Message</button>
            </div>
        </div>
    `).join('');
}

// Event Delegation (Best Practice)
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('view-profile-btn')) {
        const userId = e.target.dataset.id;
        window.location.href = `user-profile.html?id=${userId}`;
    }

    if (e.target.classList.contains('message-btn')) {
    const userId = e.target.dataset.id;
    window.location.href = `message.html?to=${userId}`;  
}
});

function filterUsers() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const location = document.getElementById('locationFilter').value;

    filteredUsers = allUsers.filter(user => {
        const matchesSearch = !searchQuery ||
            user.name.toLowerCase().includes(searchQuery) ||
            user.teaching.some(s => s.name.toLowerCase().includes(searchQuery));

        const matchesLocation = location === 'all' || String(user.location || '').includes(location);
        return matchesSearch && matchesLocation;
    });

    renderUserCards();
}

// Theme Toggle
(function () {
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    html.classList.toggle('dark', savedTheme === 'dark');
} else {
    html.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
}

themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
});

// Initialize
document.getElementById('searchInput').addEventListener('input', filterUsers);
document.getElementById('locationFilter').addEventListener('change', filterUsers);
loadSkills();
})();