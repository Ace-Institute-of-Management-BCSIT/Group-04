// frontend/js/user-profile.js
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
        // For now using mock data. Later replace with api.getUserProfile(userId)
        const mockUsers = {
            1: {
                id: 1,
                name: "Suresh Shrestha",
                avatar: "?u=1",
                location: "Kathmandu, Nepal",
                joined: "June 2024",
                bio: "Full-stack developer with 5 years of experience. Passionate about teaching coding and making technology accessible to everyone.",
                rating: 4.9,
                reviews: 24,
                sessions: 163,
                teaching: [
                    { name: "Web Development", level: "Expert", progress: 95, sessions: 45 },
                    { name: "React", level: "Expert", progress: 85, sessions: 38 },
                    { name: "JavaScript", level: "Expert", progress: 98, sessions: 52 }
                ]
            },
            2: {
                id: 2,
                name: "Krish Shrestha",
                avatar: "?u=2",
                location: "Kathmandu, Nepal",
                joined: "June 2024",
                bio: "Full-stack developer with 5 years of experience. Passionate about teaching coding and making technology accessible to everyone.",
                rating: 4.9,
                reviews: 24,
                sessions: 163,
                teaching: [
                    { name: "Web Development", level: "Expert", progress: 95, sessions: 45 },
                    { name: "React", level: "Expert", progress: 85, sessions: 38 },
                    { name: "JavaScript", level: "Expert", progress: 98, sessions: 52 }
                ]
            }
            
            // Add more mock users as needed
        };

        const user = mockUsers[userId] || mockUsers[1];

        let html = `
            <div class="profile-header card">
                <div class="profile-top">
                    <div class="avatar-large">
                        <img src="${user.avatar}" alt="${user.name}">
                    </div>
                    <div class="profile-info">
                        <h1>${user.name}</h1>
                        <div class="profile-meta">
                            <span>📍 ${user.location}</span>
                            <span>Joined ${user.joined}</span>
                            <span>👥 In-Person</span>
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
                        <div class="stat-icon">⭐</div>
                        <div class="stat-value">${user.rating}</div>
                        <div class="stat-label">(${user.reviews} reviews)</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📅</div>
                        <div class="stat-value">${user.sessions}</div>
                        <div class="stat-label">Sessions</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🧠</div>
                        <div class="stat-value">4</div>
                        <div class="stat-label">Teaching</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📚</div>
                        <div class="stat-value">3</div>
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
                    ${user.teaching.map(skill => `
                        <div class="skill-item">
                            <div class="skill-info">
                                <span class="skill-tag teaching">${skill.name}</span>
                                <span class="skill-level">${skill.level}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress" style="width: ${skill.progress}%"></div>
                            </div>
                            <span class="sessions-count">${skill.sessions} sessions completed</span>
                        </div>
                    `).join('')}
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

        // Tab functionality
        setupTabs();

        // Button actions
        document.getElementById('sendMessageBtn').addEventListener('click', () => {
            window.location.href = `chat.html?user=${user.id}`;
        });

    } catch (error) {
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