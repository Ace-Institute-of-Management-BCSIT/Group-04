// frontend/js/user-profile.js

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5-4-8-4z'/></svg>";

async function loadUserProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    const container = document.getElementById('profileContainer');

    if (!userId) {
        container.innerHTML = `<div class="card" style="padding:40px;text-align:center;color:red;">Invalid Profile</div>`;
        return;
    }

    container.innerHTML = `<div class="loading">Loading profile...</div>`;

    try {
        // Fetch the profile and that provider's skills in parallel
        const [profileRes, skillsRes] = await Promise.all([
            window.api.getUserProfile(userId),
            window.api.request(`/users/${userId}/skills`)
        ]);

        if (!profileRes.success) {
            container.innerHTML = `<div class="card" style="padding:40px;text-align:center;color:red;">
                ${profileRes.message || 'Profile not found'}
            </div>`;
            return;
        }

        const user = profileRes.user;
        const teaching = (skillsRes.success && skillsRes.skills) ? skillsRes.skills : [];

        const avatar = (user.avatar && !user.avatar.includes("pravatar.cc")) ? user.avatar : DEFAULT_AVATAR;

        let html = `
            <div class="profile-header card">
                <div class="profile-top">
                    <div class="avatar-large">
                        <img src="${avatar}" alt="${user.name}">
                    </div>
                    <div class="profile-info">
                        <h1>${user.name}</h1>
                        <div class="profile-meta">
                            <span> ${user.location}</span>
                            <span>Joined ${user.joined}</span>
                        </div>
                        <p class="bio">${user.bio}</p>
                        <div class="profile-actions">
                            <button class="btn btn-primary" id="sendMessageBtn">
                                <i class="fa-solid fa-message"></i> Send Message
                            </button>
                            <button class="btn btn-outline" id="requestBtn">Request Skill Exchange</button>
                        </div>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${user.rating}</div>
                        <div class="stat-label">(${user.reviews} reviews)</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${user.sessions}</div>
                        <div class="stat-label">Sessions</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${teaching.length}</div>
                        <div class="stat-label">Teaching</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">0</div>
                        <div class="stat-label">Learning</div>
                    </div>
                </div>
            </div>

            <div class="tabs">
                <button class="tab-btn active" data-tab="teaching">Teaching</button>
                <button class="tab-btn" data-tab="learning">Learning</button>
                <button class="tab-btn" data-tab="reviews">Reviews</button>
            </div>

            <div id="teaching-tab" class="tab-content active">
                <div class="skills-section card">
                    <h3>Skills I Can Teach</h3>
                    ${teaching.length > 0 ? teaching.map(skill => `
                        <div class="skill-item">
                            <div class="skill-info">
                                <span class="skill-tag teaching">${skill.skill_name}</span>
                                <span class="skill-level">${skill.skill_level}</span>
                            </div>
                            ${skill.description ? `<p class="skill-desc">${skill.description}</p>` : ''}
                        </div>
                    `).join('') : '<p style="color:#7f8c8d;">No skills added yet.</p>'}
                </div>
            </div>

            <div id="learning-tab" class="tab-content">
                <div class="card" style="padding:40px;text-align:center;">Learning skills coming soon...</div>
            </div>
            <div id="reviews-tab" class="tab-content">
                <div class="card" style="padding:40px;text-align:center;">Reviews coming soon...</div>
            </div>
        `;

        container.innerHTML = html;

        setupTabs();

        document.getElementById('sendMessageBtn').addEventListener('click', () => {
            window.location.href = `chat.html?user=${user.id}`;
        });

    } catch (error) {
        console.error("Failed to load profile:", error);
        container.innerHTML = `<div class="card" style="padding:40px;color:red;text-align:center;">Failed to load profile</div>`;
    }
}

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab + '-tab').classList.add('active');
        });
    });
}

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const savedTheme = localStorage.getItem('theme');
if (savedTheme) html.classList.toggle('dark', savedTheme === 'dark');

themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
});

loadUserProfile();