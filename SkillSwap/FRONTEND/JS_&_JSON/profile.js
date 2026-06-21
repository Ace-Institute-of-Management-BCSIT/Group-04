// FRONTEND/JS_&_JSON/profile.js

async function loadMyProfile() {
    const container = document.getElementById("profileContainer");
    if (!container) return;

    container.innerHTML = `<div class="loading">Loading your profile...</div>`;

    try {
        const response = await window.api.getCurrentUser();
        
        if (!response.success) {
            container.innerHTML = `<div style="color:red; padding:40px; text-align:center;">
                <h3>⚠️ Error Loading Profile</h3>
                <p>${response.message || 'Please try again'}</p>
            </div>`;
            return;
        }

        const user = response.user;

        // Clean offline default SVG silhouette string used when avatar is missing or set to online random generation links
        const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5-4-8-4z'/></svg>";
        
        // Check if user avatar is missing or contains the online fallback link, if so use the empty layout string
        const userAvatar = (user.avatar && !user.avatar.includes("pravatar.cc")) ? user.avatar : defaultAvatar;

        container.innerHTML = `
            <div class="profile-dashboard-layout" style="display: flex; gap: 30px; margin-top: 30px; flex-wrap: wrap;">
                
                <div class="profile-sidebar-card" style="flex: 1; min-width: 300px; background: var(--card-bg, #ffffff); padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center;">
                    <div class="avatar-container" style="margin-bottom: 15px; position:relative; background: #f1f5f9; width: 130px; height: 130px; border-radius: 50%; margin: 0 auto 15px auto; display: flex; align-items: center; justify-content: center; border: 5px solid #2ecc71; overflow: hidden;">
                        <img id="profileAvatarDisplay" src="${userAvatar}" alt="Avatar" 
                             style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <h2 style="margin: 10px 0 5px 0; font-size: 1.6rem;">${user.name}</h2>
                    <span style="background: #2ecc71; color: white; padding: 5px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                        ${user.role ? user.role.toUpperCase() : 'MEMBER'}
                    </span>
                    <p style="font-size: 0.9rem; color: #7f8c8d; margin: 15px 0 5px 0;"><i class="fa-regular fa-calendar"></i> Joined ${user.joined}</p>
                    <p style="font-size: 0.9rem; color: #7f8c8d; margin: 5px 0 15px 0;"><i class="fa-solid fa-phone"></i> ${user.phone || 'No phone added'}</p>
                    
                    <button id="openEditModalBtn" style="width: 100%; background: #3498db; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; margin-top: 15px;">
                        Edit Profile
                    </button>
                </div>

                <div class="profile-main-panels" style="flex: 2; min-width: 320px; display: flex; flex-direction: column; gap: 20px;">
                    
                    <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                        <h3>Biography</h3>
                        <p style="color: #555; line-height: 1.6;">${user.bio || 'No bio added yet.'}</p>
                    </div>

                    ${user.role === 'Skill Provider' || user.role === 'skill-provider' ? `
                    <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                            <h3>My Skills</h3>
                            <button id="addSkillBtn" style="background:#2ecc71;color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;">+ Add Skill</button>
                        </div>
                        <div id="skillsList">No skills added yet.</div>
                    </div>` : ''}
                </div>
            </div>

            <div id="editProfileModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center; padding: 15px;">
                <div style="background: white; width: 100%; max-width: 500px; border-radius: 12px; padding: 25px; box-shadow: 0 5px 25px rgba(0,0,0,0.2);">
                    <h3 style="margin-top: 0; margin-bottom: 20px;">Edit Profile</h3>
                    <form id="editProfileForm">
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600;">Full Name</label>
                            <input type="text" id="inputName" value="${user.name}" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600;">Phone Number</label>
                            <input type="text" id="inputPhone" value="${user.phone || ''}" placeholder="e.g. +1 555-0199" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600;">Location</label>
                            <input type="text" id="inputLocation" value="${user.location || ''}" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600;">Profile Picture</label>
                            <input type="file" id="inputAvatarFile" accept="image/*" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px;">
                            <input type="hidden" id="currentAvatarData" value="${user.avatar || ''}">
                        </div>
                        <div style="margin-bottom: 20px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600;">Bio</label>
                            <textarea id="inputBio" rows="4" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:6px;">${user.bio || ''}</textarea>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 10px;">
                            <button type="button" id="closeEditModalBtn" style="background:#bdc3c7; color:white; border:none; padding:10px 18px; border-radius:6px; cursor:pointer;">Cancel</button>
                            <button type="submit" style="background:#2ecc71; color:white; border:none; padding:10px 18px; border-radius:6px; cursor:pointer;">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        bindModalControls();
        bindAddSkillButton();
        loadMySkills();


    } catch (err) {
        console.error(err);
        container.innerHTML = `<div style="color:red;padding:40px;text-align:center;">Failed to load profile.</div>`;
    }
}

// Add Skill Function - Modal version
function bindAddSkillButton() {
    const btn = document.getElementById('addSkillBtn');
    if (!btn) return;

    // Inject the Add Skill modal into the page (once)
    if (!document.getElementById('addSkillModal')) {
        const modalHTML = `
        <div id="addSkillModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%;
             background:rgba(0,0,0,0.5); z-index:1001; justify-content:center; align-items:center; padding:15px;">
            <div style="background:white; width:100%; max-width:460px; border-radius:16px; padding:30px;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.25); position:relative;">
                
                <button id="closeAddSkillModal" style="position:absolute; top:14px; right:16px; background:none;
                        border:none; font-size:1.4rem; cursor:pointer; color:#7f8c8d; line-height:1;">×</button>
                
                <h3 style="margin:0 0 6px 0; font-size:1.4rem;">Add a New Skill</h3>
                <p style="margin:0 0 22px 0; color:#7f8c8d; font-size:0.9rem;">
                    Share what you can offer to the SkillSwap community.
                </p>

                <div style="margin-bottom:15px;">
                    <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.9rem;">
                        Skill Name <span style="color:#e74c3c;">*</span>
                    </label>
                    <input type="text" id="skillNameInput" placeholder="e.g. Web Development, Graphic Design…"
                        style="width:100%; padding:10px 12px; border:1px solid #ddd; border-radius:8px;
                               font-size:0.95rem; box-sizing:border-box; outline:none;
                               transition: border-color 0.2s;"
                        onfocus="this.style.borderColor='#2ecc71'"
                        onblur="this.style.borderColor='#ddd'">
                </div>

                <div style="margin-bottom:15px;">
                    <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.9rem;">
                        Proficiency Level
                    </label>
                    <select id="skillLevelInput"
                        style="width:100%; padding:10px 12px; border:1px solid #ddd; border-radius:8px;
                               font-size:0.95rem; box-sizing:border-box; background:white; outline:none;
                               cursor:pointer; transition: border-color 0.2s;"
                        onfocus="this.style.borderColor='#2ecc71'"
                        onblur="this.style.borderColor='#ddd'">
                        <option value="Beginner">🌱 Beginner</option>
                        <option value="Intermediate" selected>⚡ Intermediate</option>
                        <option value="Advanced">🔥 Advanced</option>
                        <option value="Expert">🏆 Expert</option>
                    </select>
                </div>

                <div style="margin-bottom:22px;">
                    <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.9rem;">
                        Short Description
                    </label>
                    <textarea id="skillDescInput" rows="3"
                        placeholder="Briefly describe your experience with this skill…"
                        style="width:100%; padding:10px 12px; border:1px solid #ddd; border-radius:8px;
                               font-size:0.95rem; box-sizing:border-box; resize:vertical; outline:none;
                               transition: border-color 0.2s;"
                        onfocus="this.style.borderColor='#2ecc71'"
                        onblur="this.style.borderColor='#ddd'"></textarea>
                </div>

                <div id="addSkillError" style="display:none; color:#e74c3c; font-size:0.85rem;
                     margin-bottom:12px; padding:8px 12px; background:#fdf0f0; border-radius:6px;"></div>

                <div style="display:flex; gap:10px; justify-content:flex-end;">
                    <button id="cancelAddSkillBtn"
                        style="background:#f1f3f5; color:#555; border:none; padding:10px 20px;
                               border-radius:8px; cursor:pointer; font-weight:600; font-size:0.9rem;">
                        Cancel
                    </button>
                    <button id="submitAddSkillBtn"
                        style="background:#2ecc71; color:white; border:none; padding:10px 22px;
                               border-radius:8px; cursor:pointer; font-weight:600; font-size:0.9rem;
                               display:flex; align-items:center; gap:8px;">
                        <span id="addSkillBtnText">+ Add Skill</span>
                    </button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    const modal     = document.getElementById('addSkillModal');
    const closeBtn  = document.getElementById('closeAddSkillModal');
    const cancelBtn = document.getElementById('cancelAddSkillBtn');
    const submitBtn = document.getElementById('submitAddSkillBtn');
    const errorBox  = document.getElementById('addSkillError');

const openModal  = () => {
        document.getElementById('skillNameInput').value  = '';
        document.getElementById('skillLevelInput').value = 'Intermediate';
        document.getElementById('skillDescInput').value  = '';
        errorBox.style.display = 'none';
        modal.style.display    = 'flex';
        submitBtn.disabled = false;
        document.getElementById('addSkillBtnText').textContent = '+ Add Skill';
        document.getElementById('skillNameInput').focus();
    };
    const closeModal = () => modal.style.display = 'none';

    btn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    submitBtn.addEventListener('click', async () => {
        const skillName = document.getElementById('skillNameInput').value.trim();
        const level     = document.getElementById('skillLevelInput').value;
        const desc      = document.getElementById('skillDescInput').value.trim();

        if (!skillName) {
            errorBox.textContent   = 'Please enter a skill name.';
            errorBox.style.display = 'block';
            document.getElementById('skillNameInput').focus();
            return;
        }

        submitBtn.disabled = true;
        document.getElementById('addSkillBtnText').textContent = 'Adding…';
        errorBox.style.display = 'none';

        try {
            const data = await window.api.request('/users/skills', {
                method: 'POST',
                body: JSON.stringify({
                    skill_name: skillName,
                    skill_level: level,
                    description: desc,
                    status: 'active'
                })
            });

            console.log('SKILL RESPONSE:', data); 

            if (data.success) {
    alert("Skill added successfully!");
    closeModal();
    loadMySkills();
            } else {
                errorBox.textContent   = data.message || 'Failed to add skill.';
                errorBox.style.display = 'block';
            }
        }
        catch (e) {
            errorBox.textContent   = 'Cannot connect to server. Make sure the backend is running.';
            errorBox.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            document.getElementById('addSkillBtnText').textContent = '+ Add Skill';
        }
    });
} // ← closing brace for bindAddSkillButton

// Modal Controls
function bindModalControls() {
    const modal   = document.getElementById("editProfileModal");
    const openBtn = document.getElementById("openEditModalBtn");
    const closeBtn = document.getElementById("closeEditModalBtn");
    const form    = document.getElementById("editProfileForm");

    if (openBtn)  openBtn.addEventListener("click", () => modal.style.display = "flex");
    if (closeBtn) closeBtn.addEventListener("click", () => modal.style.display = "none");

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const fileInput = document.getElementById("inputAvatarFile");
            let avatarFinalValue = document.getElementById("currentAvatarData").value;

            // Handle transforming local file to Base64 string data if an update exists
            if (fileInput && fileInput.files.length > 0) {
                const selectedFile = fileInput.files[0];
                
                try {
                    avatarFinalValue = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = (error) => reject(error);
                        reader.readAsDataURL(selectedFile);
                    });
                } catch (fileErr) {
                    console.error("File Conversion Error: ", fileErr);
                    alert("Error reading file selection.");
                    return;
                }
            }

            const updatedFields = {
                full_name: document.getElementById("inputName").value.trim(),
                phone: document.getElementById("inputPhone").value.trim(),
                location: document.getElementById("inputLocation").value.trim(),
                avatar: avatarFinalValue,
                bio: document.getElementById("inputBio").value.trim()
            };

            try {
                const result = await window.api.updateProfile(updatedFields);

                if (result.success) {
                    alert("Profile updated successfully!");
                    modal.style.display = "none";
                    loadMyProfile();
                } else {
                    alert("Failed to update profile: " + result.message);
                }
            } catch (err) {
                console.error("API Update Error:", err);
                alert("Could not update profile data records.");
            }
        });
    }
}
async function loadMySkills() {
    const skillsList = document.getElementById('skillsList');
    if (!skillsList) return;

    try {
        const data = await window.api.request('/users/skills');

        if (data.success && data.skills && data.skills.length > 0) {
            skillsList.innerHTML = data.skills.map(skill => `
                <div style="padding:14px 0; border-bottom:1px solid #f0f0f0; display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <strong style="font-size:1rem;">${skill.skill_name}</strong>
                        <span style="margin-left:10px; background:#e8f8f0; color:#2ecc71; padding:2px 10px;
                              border-radius:20px; font-size:0.78rem; font-weight:600;">
                            ${skill.skill_level}
                        </span>
                        <p style="margin:5px 0 0 0; color:#7f8c8d; font-size:0.88rem;">${skill.description || ''}</p>
                    </div>
                </div>
            `).join('');
        } else {
            skillsList.innerHTML = '<p style="color:#7f8c8d;">No skills added yet.</p>';
        }
    } catch (e) {
        skillsList.innerHTML = '<p style="color:#e74c3c;">Failed to load skills.</p>';
    }
}
// Initialize
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', loadMyProfile);
} else {
    loadMyProfile();
}