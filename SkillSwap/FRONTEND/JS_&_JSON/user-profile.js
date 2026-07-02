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

        // FIX 2: expose skills globally so the request modal dropdown can use them
        window._profileSkills = teaching;

        const avatar = (user.avatar && !user.avatar.includes("pravatar.cc")) ? user.avatar : DEFAULT_AVATAR;

        container.innerHTML = `
            <div class="profile-header card">
                <div class="profile-top">
                    <div class="avatar-large">
                        <img src="${avatar}" alt="${user.name}">
                    </div>
                    <div class="profile-info">
                        <h1>${user.name}</h1>
                        <div class="profile-meta">
                            <span>${user.location}</span>
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

        setupTabs();

        // FIX 1: listeners attached AFTER HTML is rendered, inside loadUserProfile
        document.getElementById('sendMessageBtn').addEventListener('click', () => {
            window.location.href = `message.html?to=${user.id}`;
        });

        document.getElementById('requestBtn').addEventListener('click', () => {
            if (!document.getElementById('requestModal')) {
                document.body.insertAdjacentHTML('beforeend', `
                <div id="requestModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%;
                     background:rgba(0,0,0,0.6); z-index:1000; justify-content:center; align-items:center; padding:15px;">
                    <div style="background:var(--card-bg, #1a1f2e); width:100%; max-width:460px; border-radius:16px;
                                padding:30px; box-shadow:0 8px 32px rgba(0,0,0,0.4); position:relative;">

                        <button id="closeRequestModal" style="position:absolute; top:14px; right:16px;
                                background:none; border:none; font-size:1.4rem; cursor:pointer; color:#7f8c8d;">x</button>

                        <h3 style="margin:0 0 6px 0; font-size:1.3rem; color:var(--text, #fff);">Request Skill Exchange</h3>
                        <p style="margin:0 0 22px 0; color:#7f8c8d; font-size:0.88rem;">
                            Pick a skill, date, and time. The provider will accept or reject your request.
                        </p>

                        <div style="margin-bottom:15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.9rem; color:var(--text,#fff);">
                                Skill <span style="color:#e74c3c;">*</span>
                            </label>
                            <select id="requestSkillSelect"
                                style="width:100%; padding:10px 12px; border:1px solid #2ecc71; border-radius:8px;
                                       font-size:0.95rem; background:var(--input-bg,#12172a); color:var(--text,#fff);
                                       outline:none; cursor:pointer; box-sizing:border-box;">
                                <option value="">Select a skill</option>
                            </select>
                        </div>

                        <div style="margin-bottom:15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.9rem; color:var(--text,#fff);">
                                Date <span style="color:#e74c3c;">*</span>
                            </label>
                            <input type="date" id="requestDate"
                                style="width:100%; padding:10px 12px; border:1px solid #444; border-radius:8px;
                                       font-size:0.95rem; background:var(--input-bg,#12172a); color:var(--text,#fff);
                                       outline:none; box-sizing:border-box;">
                        </div>

                        <div style="margin-bottom:22px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.9rem; color:var(--text,#fff);">
                                Time <span style="color:#e74c3c;">*</span>
                            </label>
                            <input type="time" id="requestTime"
                                style="width:100%; padding:10px 12px; border:1px solid #444; border-radius:8px;
                                       font-size:0.95rem; background:var(--input-bg,#12172a); color:var(--text,#fff);
                                       outline:none; box-sizing:border-box;">
                        </div>

                        <div id="requestError" style="display:none; color:#e74c3c; font-size:0.85rem;
                             margin-bottom:12px; padding:8px 12px; background:rgba(231,76,60,0.1); border-radius:6px;"></div>

                        <div style="display:flex; gap:10px; justify-content:flex-end;">
                            <button id="cancelRequestBtn"
                                style="background:#2a2f3e; color:#aaa; border:none; padding:10px 20px;
                                       border-radius:8px; cursor:pointer; font-weight:600; font-size:0.9rem;">
                                Cancel
                            </button>
                            <button id="submitRequestBtn"
                                style="background:#2ecc71; color:white; border:none; padding:10px 22px;
                                       border-radius:8px; cursor:pointer; font-weight:600; font-size:0.9rem;">
                                Send Request
                            </button>
                        </div>
                    </div>
                </div>`);

                document.getElementById('closeRequestModal').addEventListener('click', closeRequestModal);
                document.getElementById('cancelRequestBtn').addEventListener('click', closeRequestModal);
                document.getElementById('requestModal').addEventListener('click', (e) => {
                    if (e.target.id === 'requestModal') closeRequestModal();
                });

                document.getElementById('submitRequestBtn').addEventListener('click', async () => {
                    const skillId   = document.getElementById('requestSkillSelect').value;
                    const date      = document.getElementById('requestDate').value;
                    const time      = document.getElementById('requestTime').value;
                    const errorBox  = document.getElementById('requestError');
                    const submitBtn = document.getElementById('submitRequestBtn');

                    errorBox.style.display = 'none';

                    if (!skillId || !date || !time) {
                        errorBox.textContent = 'Please fill in all fields.';
                        errorBox.style.display = 'block';
                        return;
                    }

                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Sending...';

                    try {
                        const result = await window.api.request('/bookings', {
                            method: 'POST',
                            body: JSON.stringify({ skill_id: skillId, booking_date: date, booking_time: time })
                        });

                        if (result.success) {
                            closeRequestModal();
                            alert('Request sent! The provider will accept or reject it.');
                        } else {
                            errorBox.textContent = result.message || 'Failed to send request.';
                            errorBox.style.display = 'block';
                        }
                    } catch (err) {
                        errorBox.textContent = 'Cannot connect to server.';
                        errorBox.style.display = 'block';
                    } finally {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Send Request';
                    }
                });
            }

            populateSkillDropdown();
            openRequestModal();
        });

    } catch (error) {
        console.error("Failed to load profile:", error);
        container.innerHTML = `<div class="card" style="padding:40px;color:red;text-align:center;">Failed to load profile</div>`;
    }
}

function openRequestModal() {
    document.getElementById('requestDate').value = '';
    document.getElementById('requestTime').value = '';
    document.getElementById('requestError').style.display = 'none';
    document.getElementById('requestModal').style.display = 'flex';
}

function closeRequestModal() {
    document.getElementById('requestModal').style.display = 'none';
}

function populateSkillDropdown() {
    const select = document.getElementById('requestSkillSelect');
    if (!window._profileSkills || window._profileSkills.length === 0) {
        select.innerHTML = '<option value="">No skills available</option>';
        return;
    }
    select.innerHTML = window._profileSkills.map(s =>
        `<option value="${s.skill_id}">${s.skill_name} (${s.skill_level})</option>`
    ).join('');
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