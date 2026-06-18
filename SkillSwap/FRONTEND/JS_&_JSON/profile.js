// FRONTEND/JS_&_JSON/profile.js

// Primary entry point to load profile and metrics
async function loadMyProfile() {
    const container = document.getElementById("profileContainer");
    if (!container) return;

    try {
        // Contact the api.js utility wrapper to fetch backend session data
        const response = await window.api.getCurrentUser();
        
        if (!response.success) {
            container.innerHTML = `<div class="error-msg" style="color:red; padding:20px; text-align:center;">
                <h3>⚠️ Error Loading Profile</h3>
                <p>${response.message}</p>
            </div>`;
            return;
        }

        const user = response.user;

        // Inject HTML code representing user info card, metrics dashboard, and edit forms
        container.innerHTML = `
            <div class="profile-dashboard-layout" style="display: flex; gap: 30px; margin-top: 30px; flex-wrap: wrap;">
                
                <div class="profile-sidebar-card" style="flex: 1; min-width: 300px; background: var(--card-bg, #ffffff); padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center;">
                    <div class="avatar-container" style="margin-bottom: 15px;">
                        <img id="profileAvatarDisplay" src="${user.avatar}" alt="User Avatar" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid #2ecc71;">
                    </div>
                    <h2 style="margin: 10px 0 5px 0; font-size: 1.5rem; color: var(--text-color, #2c3e50);">${user.name}</h2>
                    <span style="background: #2ecc71; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-block; margin-bottom: 15px;">
                        <i class="fa-solid fa-id-badge"></i> ${user.role ? user.role.toUpperCase() : 'MEMBER'}
                    </span>
                    <p style="font-size: 0.9rem; color: #7f8c8d; margin-bottom: 20px;"><i class="fa-regular fa-calendar"></i> Joined ${user.joined}</p>
                    
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    
                    <div class="contact-details-list" style="text-align: left; font-size: 0.95rem;">
                        <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                            <i class="fa-regular fa-envelope" style="color: #2ecc71; font-size: 1.2rem; width: 20px;"></i>
                            <div>
                                <small style="color: #95a5a6; display: block; font-size: 0.75rem;">EMAIL ADDRESS</small>
                                <span style="color: #34495e; font-weight: 500;">${user.email}</span>
                            </div>
                        </div>
                        <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                            <i class="fa-solid fa-phone" style="color: #2ecc71; font-size: 1.2rem; width: 20px;"></i>
                            <div>
                                <small style="color: #95a5a6; display: block; font-size: 0.75rem;">PHONE NUMBER</small>
                                <span style="color: #34495e; font-weight: 500;">${user.phone || 'Not Provided'}</span>
                            </div>
                        </div>
                        <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                            <i class="fa-solid fa-location-dot" style="color: #2ecc71; font-size: 1.2rem; width: 20px;"></i>
                            <div>
                                <small style="color: #95a5a6; display: block; font-size: 0.75rem;">LOCATION</small>
                                <span style="color: #34495e; font-weight: 500;">${user.location || 'Not Configured'}</span>
                            </div>
                        </div>
                    </div>

                    <button id="openEditModalBtn" style="width: 100%; background: #3498db; color: white; border: none; padding: 12px; margin-top: 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
                        <i class="fa-solid fa-user-pen"></i> Edit Profile Details
                    </button>
                </div>

                <div class="profile-main-panels" style="flex: 2; min-width: 320px; display: flex; flex-direction: column; gap: 20px;">
                    
                    <div class="stats-counter-row" style="display: flex; gap: 15px; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 140px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); display: flex; align-items: center; gap: 15px;">
                            <div style="background: #f1c40f22; padding: 15px; border-radius: 8px;"><i class="fa-solid fa-star" style="color: #f1c40f; font-size: 1.5rem;"></i></div>
                            <div><h3 style="margin:0; font-size: 1.6rem;">${Number(user.rating).toFixed(1)}</h3><p style="margin:0; color:#7f8c8d; font-size:0.85rem;">Average Rating</p></div>
                        </div>
                        <div style="flex: 1; min-width: 140px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); display: flex; align-items: center; gap: 15px;">
                            <div style="background: #2ecc7122; padding: 15px; border-radius: 8px;"><i class="fa-regular fa-comments" style="color: #2ecc71; font-size: 1.5rem;"></i></div>
                            <div><h3 style="margin:0; font-size: 1.6rem;">${user.reviews}</h3><p style="margin:0; color:#7f8c8d; font-size:0.85rem;">Reviews Given</p></div>
                        </div>
                        <div style="flex: 1; min-width: 140px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); display: flex; align-items: center; gap: 15px;">
                            <div style="background: #e67e2222; padding: 15px; border-radius: 8px;"><i class="fa-solid fa-handshake" style="color: #e67e22; font-size: 1.5rem;"></i></div>
                            <div><h3 style="margin:0; font-size: 1.6rem;">${user.sessions}</h3><p style="margin:0; color:#7f8c8d; font-size:0.85rem;">Total Sessions</p></div>
                        </div>
                    </div>

                    <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                        <h3 style="margin-top: 0; color: #2c3e50;"><i class="fa-solid fa-circle-info" style="color:#2ecc71;"></i> Biography / Introduction</h3>
                        <p style="color: #555; line-height: 1.6; font-size: 0.98rem; margin-bottom: 0;">
                            ${user.bio || 'No personalized biography added yet. Click on the Edit Profile option to detail your skillsets!'}
                        </p>
                    </div>
                </div>
            </div>

            <div id="editProfileModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center; padding: 15px;">
                <div style="background: white; width: 100%; max-width: 500px; border-radius: 12px; padding: 25px; box-shadow: 0 5px 25px rgba(0,0,0,0.2); position: relative;">
                    <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 1.3rem;"><i class="fa-solid fa-user-gear" style="color:#3498db;"></i> Update Profile Information</h3>
                    
                    <form id="editProfileForm">
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.85rem; color:#34495e;">FULL NAME</label>
                            <input type="text" id="inputName" value="${user.name}" required style="width:100%; padding:10px; border:1px solid #ccc; border-radius:6px; font-size:0.95rem;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.85rem; color:#34495e;">PHONE NUMBER</label>
                            <input type="text" id="inputPhone" value="${user.phone || ''}" placeholder="e.g. +1 555-0199" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:6px; font-size:0.95rem;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.85rem; color:#34495e;">LOCATION (CITY, COUNTRY)</label>
                            <input type="text" id="inputLocation" value="${user.location || ''}" placeholder="e.g. London, UK" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:6px; font-size:0.95rem;">
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.85rem; color:#34495e;">UPLOAD PROFILE IMAGE</label>
                            <input type="file" id="inputAvatarFile" accept="image/*" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:0.95rem;">
                            <small style="color: #7f8c8d; display:block; margin-top:4px;">Leave empty to keep your current avatar picture.</small>
                            <input type="hidden" id="currentAvatarData" value="${user.avatar}">
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.85rem; color:#34495e;">SHORT BIO</label>
                            <textarea id="inputBio" rows="4" placeholder="Briefly describe your skillswap expertise..." style="width:100%; padding:10px; border:1px solid #ccc; border-radius:6px; font-size:0.95rem; resize:vertical;">${user.bio || ''}</textarea>
                        </div>
                        
                        <div style="display: flex; justify-content: flex-end; gap: 10px;">
                            <button type="button" id="closeEditModalBtn" style="background:#bdc3c7; color:white; border:none; padding:10px 18px; border-radius:6px; cursor:pointer; font-weight:600;">Cancel</button>
                            <button type="submit" style="background:#2ecc71; color:white; border:none; padding:10px 18px; border-radius:6px; cursor:pointer; font-weight:600;">Save Profile</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Bind operational overlay event triggers
        bindModalControls();

    } catch (err) {
        console.error("Dashboard Compilation Failure:", err);
        container.innerHTML = `<div class="error-msg" style="color:red; padding:20px; text-align:center;">Critical rendering crash occurred.</div>`;
    }
}

// Logic loops managing popup transitions and submit hooks
function bindModalControls() {
    const modal = document.getElementById("editProfileModal");
    const openBtn = document.getElementById("openEditModalBtn");
    const closeBtn = document.getElementById("closeEditModalBtn");
    const form = document.getElementById("editProfileForm");

    if (!modal || !openBtn) return;

    openBtn.addEventListener("click", () => { modal.style.display = "flex"; });
    closeBtn.addEventListener("click", () => { modal.style.display = "none"; });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fileInput = document.getElementById("inputAvatarFile");
        let avatarFinalValue = document.getElementById("currentAvatarData").value;

        // FIXED: Convert local device file into a database-ready Base64 text string
        if (fileInput && fileInput.files.length > 0) {
            const selectedFile = fileInput.files[0];
            
            // Wait for file conversion to complete cleanly
            avatarFinalValue = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result); // Resolves into base64 text
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(selectedFile);
            });
        }

        // Package matching inputs
        const updatedFields = {
            full_name: document.getElementById("inputName").value.trim(),
            phone: document.getElementById("inputPhone").value.trim(),
            location: document.getElementById("inputLocation").value.trim(),
            avatar: avatarFinalValue, // Holds our Base64 text string
            bio: document.getElementById("inputBio").value.trim()
        };

        // Transfer details to updateProfile method inside api.js
        const result = await window.api.updateProfile(updatedFields);

        if (result.success) {
            alert("Success! Profile details updated.");
            modal.style.display = "none";
            loadMyProfile(); // Rerender layout matching new parameters
        } else {
            alert("Failed to modify database records: " + result.message);
        }
    });
}

// Ensure execution flow hooks safely across DOM transitions
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', loadMyProfile);
} else {
    loadMyProfile();
}