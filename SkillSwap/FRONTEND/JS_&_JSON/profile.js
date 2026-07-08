// FRONTEND/JS_&_JSON/profile.js

async function loadMyProfile() {
    const container = document.getElementById("profileContainer");
    if (!container) return;

    container.innerHTML = `<div class="loading">Loading your profile...</div>`;

    try {
        const response = await window.api.getCurrentUser();
        
        if (!response.success) {
            container.innerHTML = `<div style="color:#e74c3c; padding:40px; text-align:center;">
                <h3>⚠️ Error Loading Profile</h3>
                <p>${response.message || 'Please try again'}</p>
            </div>`;
            return;
        }

        const user = response.user;

        const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5-4-8-4z'/></svg>";
        const userAvatar = (user.avatar && !user.avatar.includes("pravatar.cc")) ? user.avatar : defaultAvatar;

        const isProvider = user.role === 'Skill Provider' || user.role === 'skill-provider';
        const isSeeker   = user.role === 'Skill Seeker'   || user.role === 'skill-seeker';

        container.innerHTML = `
            <div class="profile-dashboard-layout" style="display: flex; gap: 30px; margin-top: 30px; flex-wrap: wrap;">
                
                <div class="profile-sidebar-card" style="flex: 1; min-width: 300px; background: var(--card); border: 1px solid var(--border); padding: 30px; border-radius: 12px; box-shadow: var(--shadow); text-align: center;">
                    <div style="position:relative; background: var(--secondary); width: 130px; height: 130px; border-radius: 50%; margin: 0 auto 15px auto; display: flex; align-items: center; justify-content: center; border: 5px solid var(--primary); overflow: hidden;">
                        <img id="profileAvatarDisplay" src="${userAvatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <h2 style="margin: 10px 0 5px 0; font-size: 1.6rem; color: var(--foreground);">${user.name}</h2>
                    <span style="background: var(--primary); color: white; padding: 5px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                        ${user.role ? user.role.toUpperCase() : 'MEMBER'}
                    </span>
                    <p style="font-size: 0.9rem; color: var(--muted-foreground); margin: 15px 0 5px 0;"><i class="fa-regular fa-calendar"></i> Joined ${user.joined}</p>
                    <p style="font-size: 0.9rem; color: var(--muted-foreground); margin: 5px 0 15px 0;"><i class="fa-solid fa-phone"></i> ${user.phone || 'No phone added'}</p>
                    <button id="openEditModalBtn" style="width: 100%; background: #3498db; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; margin-top: 15px;">
                        Edit Profile
                    </button>
                </div>

                <div class="profile-main-panels" style="flex: 2; min-width: 320px; display: flex; flex-direction: column; gap: 20px;">
                    
                    <div style="background: var(--card); border: 1px solid var(--border); padding: 25px; border-radius: 12px; box-shadow: var(--shadow);">
                        <h3 style="color: var(--foreground);">Biography</h3>
                        <p style="color: var(--muted-foreground); line-height: 1.6;">${user.bio || 'No bio added yet.'}</p>
                    </div>

                    ${isProvider ? `
                    <div style="background: var(--card); border: 1px solid var(--border); padding: 25px; border-radius: 12px; box-shadow: var(--shadow);">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                            <h3 style="color: var(--foreground); margin:0;">My Skills</h3>
                            <button id="addSkillBtn" style="background:#2ecc71;color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;">+ Add Skill</button>
                        </div>
                        <div id="skillsList" style="color: var(--muted-foreground);">No skills added yet.</div>
                    </div>

                    <div style="background: var(--card); border: 1px solid var(--border); padding: 25px; border-radius: 12px; box-shadow: var(--shadow);">
                        <h3 style="color: var(--foreground); margin-top:0;">Incoming Requests</h3>
                        <div id="incomingRequestsList" style="color: var(--muted-foreground);">Loading...</div>
                    </div>` : ''}

                    ${isSeeker ? `
                    <div style="background: var(--card); border: 1px solid var(--border); padding: 25px; border-radius: 12px; box-shadow: var(--shadow);">
                        <h3 style="color: var(--foreground); margin-top:0;">My Requests</h3>
                        <div id="myRequestsList" style="color: var(--muted-foreground);">Loading...</div>
                    </div>` : ''}
                </div>
            </div>

            <div id="editProfileModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center; padding: 15px;">
                <div style="background: var(--card); border: 1px solid var(--border); width: 100%; max-width: 500px; border-radius: 12px; padding: 25px; box-shadow: var(--shadow);">
                    <h3 style="margin-top: 0; margin-bottom: 20px; color: var(--foreground);">Edit Profile</h3>
                    <form id="editProfileForm">
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; color: var(--foreground);">Full Name</label>
                            <input type="text" id="inputName" value="${user.name}" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:6px; background: var(--background); color: var(--foreground); box-sizing: border-box;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; color: var(--foreground);">Phone Number</label>
                            <input type="text" id="inputPhone" value="${user.phone || ''}" placeholder="e.g. +977 98XXXXXXXX" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:6px; background: var(--background); color: var(--foreground); box-sizing: border-box;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; color: var(--foreground);">Location</label>
                            <input type="text" id="inputLocation" value="${user.location || ''}" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:6px; background: var(--background); color: var(--foreground); box-sizing: border-box;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; color: var(--foreground);">Profile Picture</label>
                            <input type="file" id="inputAvatarFile" accept="image/*" style="width:100%; padding:8px; border:1px solid var(--border); border-radius:6px; background: var(--background); color: var(--foreground); box-sizing: border-box;">
                            <input type="hidden" id="currentAvatarData" value="${user.avatar || ''}">
                        </div>
                        <div style="margin-bottom: 20px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; color: var(--foreground);">Bio</label>
                            <textarea id="inputBio" rows="4" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:6px; background: var(--background); color: var(--foreground); box-sizing: border-box;">${user.bio || ''}</textarea>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 10px;">
                            <button type="button" id="closeEditModalBtn" style="background:var(--secondary); color: var(--foreground); border:none; padding:10px 18px; border-radius:6px; cursor:pointer;">Cancel</button>
                            <button type="submit" style="background:#2ecc71; color:white; border:none; padding:10px 18px; border-radius:6px; cursor:pointer;">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        bindModalControls();
        bindAddSkillButton();
        loadMySkills();
        loadIncomingRequests();
        loadMyRequests();

    } catch (err) {
        console.error(err);
        container.innerHTML = `<div style="color:#e74c3c;padding:40px;text-align:center;">Failed to load profile.</div>`;
    }
}

function showSessionModal(booking) {
    const existing = document.getElementById('sessionModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'sessionModal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.65); display:flex; align-items:center; justify-content:center; z-index:1100; padding:20px;';
    modal.innerHTML = `
        <div style="background:var(--card); border:1px solid var(--border); width:min(95vw, 420px); border-radius:16px; padding:24px; box-shadow:var(--shadow); position:relative;">
            <button id="closeSessionModal" style="position:absolute; top:12px; right:12px; border:none; background:none; font-size:1.2rem; cursor:pointer; color:var(--muted-foreground);">×</button>
            <h3 style="margin:0 0 8px 0; color:var(--foreground);">Skill Session QR</h3>
            <p style="margin:0 0 16px 0; color:var(--muted-foreground); font-size:0.92rem;">Scan this code to start or complete the exchange.</p>
            <div id="sessionQrContainer" style="display:flex; justify-content:center; margin-bottom:12px;"></div>
            <p style="margin:8px 0 0 0; color:var(--muted-foreground); font-size:0.82rem; word-break:break-all;">${booking.sessionUrl}</p>
        </div>
    `;
    document.body.appendChild(modal);

    const qrContainer = document.getElementById('sessionQrContainer');
    if (window.QRCode) {
        new window.QRCode(qrContainer, {
            text: booking.sessionUrl,
            width: 220,
            height: 220,
            colorDark: '#111827',
            colorLight: '#ffffff'
        });
    } else {
        qrContainer.innerHTML = '<p style="color:#e74c3c;">QR library unavailable.</p>';
    }

    document.getElementById('closeSessionModal').onclick = () => modal.remove();
}

async function triggerSessionAction(bookingId, action, token = null) {
    try {
        const result = await window.api.request(`/bookings/${bookingId}/session-control`, {
            method: 'POST',
            body: JSON.stringify({ action, token })
        });

        if (result.success) {
            if (action === 'start') {
                const sessionUrl = `${window.location.origin}/session/verify/${bookingId}?token=${encodeURIComponent(result.booking.session_token || '')}`;
                showSessionModal({ sessionUrl });
            } else {
                alert('Session completed successfully.');
            }
            loadIncomingRequests();
            loadMyRequests();
        } else {
            alert(result.message || 'Could not update session.');
        }
    } catch (err) {
        alert('Cannot connect to server.');
    }
}

// ====================== MY REQUESTS (Seeker only) ======================

async function loadMyRequests() {
    const container = document.getElementById('myRequestsList');
    if (!container) return; // provider — div doesn't exist, quietly exit

    try {
        const data = await window.api.request('/bookings/my');

        if (!data.success || data.bookings.length === 0) {
            container.innerHTML = '<p style="color:var(--muted-foreground);">You have not sent any requests yet.</p>';
            // Clear unseen flags since there's nothing to see
            localStorage.removeItem('lastSeenBookings');
            return;
        }

        // Mark all current bookings as seen (clears the navbar notification dot)
        const currentStatuses = JSON.stringify(
            data.bookings.map(b => ({ id: b.booking_id, status: b.status }))
        );
        localStorage.setItem('lastSeenBookings', currentStatuses);
        updateNavNotificationDot(false);

        container.innerHTML = data.bookings.map(b => {
            const statusColor = {
                'Pending':   '#f39c12',
                'Accepted':  '#2ecc71',
                'Cancelled': '#e74c3c',
                'Completed': '#3498db'
            }[b.status] || '#7f8c8d';

            const statusIcon = {
                'Pending':   '⏳',
                'Accepted':  '✅',
                'Cancelled': '❌',
                'Completed': '🎉'
            }[b.status] || '';
            const sessionLabel = b.session_status === 'Active' ? 'In Session' : (b.session_status === 'Completed' ? 'Completed' : 'Not Started');
            const sessionAction = b.session_status === 'Completed'
                ? ''
                : (b.session_status === 'Active'
                    ? `<button onclick="triggerSessionAction(${b.booking_id}, 'complete')" style="background:#3498db; color:white; border:none; padding:7px 12px; border-radius:8px; cursor:pointer; font-size:0.78rem; font-weight:600;">Complete</button>`
                    : (b.status === 'Accepted' ? `<button onclick="triggerSessionAction(${b.booking_id}, 'start')" style="background:#2ecc71; color:white; border:none; padding:7px 12px; border-radius:8px; cursor:pointer; font-size:0.78rem; font-weight:600;">Open QR</button>` : ''));

            return `
            <div style="padding:16px 0; border-bottom:1px solid var(--border);
                  display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:42px; height:42px; border-radius:50%; overflow:hidden; background:var(--secondary);
                                flex-shrink:0; display:flex; align-items:center; justify-content:center;">
                        ${b.provider_avatar
                            ? `<img src="${b.provider_avatar}" style="width:100%;height:100%;object-fit:cover;">`
                            : `<span style="font-size:1.1rem;">👤</span>`}
                    </div>
                    <div>
                        <strong style="font-size:0.95rem; color:var(--foreground);">${b.provider_name}</strong>
                        <p style="margin:2px 0 0 0; font-size:0.82rem; color:var(--muted-foreground);">
                            Skill: <strong>${b.skill_name}</strong> &nbsp;·&nbsp;
                            ${new Date(b.booking_date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                            at ${b.booking_time.slice(0,5)}
                        </p>
                        <p style="margin:2px 0 0 0; font-size:0.78rem; color:var(--muted-foreground);">Session: ${sessionLabel}</p>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <span style="background:${statusColor}22; color:${statusColor}; padding:5px 14px;
                          border-radius:20px; font-size:0.82rem; font-weight:600; white-space:nowrap;">
                        ${statusIcon} ${b.status}
                    </span>
                    ${sessionAction}
                </div>
            </div>`;
        }).join('');

    } catch (err) {
        container.innerHTML = '<p style="color:#e74c3c;">Failed to load your requests.</p>';
    }
}

// ====================== NAVBAR NOTIFICATION DOT ======================

function updateNavNotificationDot(show) {
    // Find the profile button in the navbar and add/remove a red dot
    let dot = document.getElementById('navNotificationDot');
    const profileBtn = document.getElementById('profileBtn');
    if (!profileBtn) return;

    if (show) {
        if (!dot) {
            dot = document.createElement('span');
            dot.id = 'navNotificationDot';
            dot.style.cssText = `
                position:absolute; top:2px; right:2px;
                width:9px; height:9px; border-radius:50%;
                background:#e74c3c; border:2px solid var(--background);
            `;
            profileBtn.style.position = 'relative';
            profileBtn.appendChild(dot);
        }
    } else {
        if (dot) dot.remove();
    }
}

async function checkForNewNotifications() {
    // Only run for seekers — silently exits if /bookings/my isn't relevant
    try {
        const data = await window.api.request('/bookings/my');
        if (!data.success || !data.bookings.length) return;

        const lastSeen = JSON.parse(localStorage.getItem('lastSeenBookings') || '[]');
        const current  = data.bookings.map(b => ({ id: b.booking_id, status: b.status }));

        // Check if any booking has a different status compared to last time the seeker visited their profile
        const hasNew = current.some(curr => {
            const prev = lastSeen.find(l => l.id === curr.id);
            return !prev || prev.status !== curr.status;
        });

        updateNavNotificationDot(hasNew);
    } catch (e) {
        // silently fail — this is a background check
    }
}

// ====================== INCOMING REQUESTS (Provider only) ======================

async function loadIncomingRequests() {
    const container = document.getElementById('incomingRequestsList');
    if (!container) return;

    try {
        const data = await window.api.request('/bookings/incoming');

        if (!data.success || data.bookings.length === 0) {
            container.innerHTML = '<p style="color:var(--muted-foreground);">No incoming requests yet.</p>';
            return;
        }

        container.innerHTML = data.bookings.map(b => {
            const statusColor = {
                'Pending':   '#f39c12',
                'Accepted':  '#2ecc71',
                'Cancelled': '#e74c3c',
                'Completed': '#3498db'
            }[b.status] || '#7f8c8d';

            const isPending = b.status === 'Pending';
            const sessionLabel = b.session_status === 'Active' ? 'In Session' : (b.session_status === 'Completed' ? 'Completed' : 'Not Started');
            const sessionButton = b.session_status === 'Completed'
                ? ''
                : (b.session_status === 'Active'
                    ? `<button onclick="triggerSessionAction(${b.booking_id}, 'complete')"
                        style="background:#3498db; color:white; border:none; padding:7px 12px;
                               border-radius:8px; cursor:pointer; font-size:0.82rem; font-weight:600;">
                        Complete Session
                    </button>`
                    : (b.status === 'Accepted' ? `<button onclick="triggerSessionAction(${b.booking_id}, 'start')"
                        style="background:#2ecc71; color:white; border:none; padding:7px 12px;
                               border-radius:8px; cursor:pointer; font-size:0.82rem; font-weight:600;">
                        Start Session
                    </button>` : ''));

            return `
            <div id="booking-${b.booking_id}" style="padding:16px 0; border-bottom:1px solid var(--border);
                  display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:42px; height:42px; border-radius:50%; overflow:hidden; background:var(--secondary);
                                flex-shrink:0; display:flex; align-items:center; justify-content:center;">
                        ${b.seeker_avatar
                            ? `<img src="${b.seeker_avatar}" style="width:100%;height:100%;object-fit:cover;">`
                            : `<span style="font-size:1.1rem;">👤</span>`}
                    </div>
                    <div>
                        <strong style="font-size:0.95rem; color:var(--foreground);">${b.seeker_name}</strong>
                        <p style="margin:2px 0 0 0; font-size:0.82rem; color:var(--muted-foreground);">
                            Wants: <strong>${b.skill_name}</strong> &nbsp;·&nbsp;
                            ${new Date(b.booking_date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                            at ${b.booking_time.slice(0,5)}
                        </p>
                        <p style="margin:2px 0 0 0; font-size:0.78rem; color:var(--muted-foreground);">Session: ${sessionLabel}</p>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <span style="background:${statusColor}22; color:${statusColor}; padding:4px 12px;
                          border-radius:20px; font-size:0.78rem; font-weight:600;">${b.status}</span>
                    ${isPending ? `
                    <button onclick="updateBooking(${b.booking_id}, 'Accepted')"
                        style="background:#2ecc71; color:white; border:none; padding:7px 14px;
                               border-radius:8px; cursor:pointer; font-size:0.82rem; font-weight:600;">
                        Accept
                    </button>
                    <button onclick="updateBooking(${b.booking_id}, 'Cancelled')"
                        style="background:#e74c3c; color:white; border:none; padding:7px 14px;
                               border-radius:8px; cursor:pointer; font-size:0.82rem; font-weight:600;">
                        Reject
                    </button>` : ''}
                    ${sessionButton}
                </div>
            </div>`;
        }).join('');

    } catch (err) {
        container.innerHTML = '<p style="color:#e74c3c;">Failed to load requests.</p>';
    }
}

async function updateBooking(bookingId, status) {
    try {
        const result = await window.api.request(`/bookings/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        if (result.success) {
            loadIncomingRequests();
        } else {
            alert(result.message || 'Failed to update booking.');
        }
    } catch (err) {
        alert('Cannot connect to server.');
    }
}

// ====================== ADD SKILL MODAL ======================

function bindAddSkillButton() {
    const btn = document.getElementById('addSkillBtn');
    if (!btn) return;

    if (!document.getElementById('addSkillModal')) {
        const modalHTML = `
        <div id="addSkillModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%;
             background:rgba(0,0,0,0.5); z-index:1001; justify-content:center; align-items:center; padding:15px;">
            <div style="background:var(--card); border: 1px solid var(--border); width:100%; max-width:460px; border-radius:16px; padding:30px; box-shadow: var(--shadow); position:relative;">
                <button id="closeAddSkillModal" style="position:absolute; top:14px; right:16px; background:none; border:none; font-size:1.4rem; cursor:pointer; color:var(--muted-foreground); line-height:1;">×</button>
                <h3 style="margin:0 0 6px 0; font-size:1.4rem; color: var(--foreground);">Add a New Skill</h3>
                <p style="margin:0 0 22px 0; color:var(--muted-foreground); font-size:0.9rem;">Share what you can offer to the SkillSwap community.</p>
                <div style="margin-bottom:15px;">
                    <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.9rem; color: var(--foreground);">Skill Name <span style="color:#e74c3c;">*</span></label>
                    <input type="text" id="skillNameInput" placeholder="e.g. Web Development, Graphic Design…"
                        style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:8px; font-size:0.95rem; box-sizing:border-box; outline:none; background: var(--background); color: var(--foreground);"
                        onfocus="this.style.borderColor='#2ecc71'" onblur="this.style.borderColor='var(--border)'">
                </div>
                <div style="margin-bottom:15px;">
                    <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.9rem; color: var(--foreground);">Proficiency Level</label>
                    <select id="skillLevelInput"
                        style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:8px; font-size:0.95rem; box-sizing:border-box; background:var(--background); color: var(--foreground); outline:none; cursor:pointer;"
                        onfocus="this.style.borderColor='#2ecc71'" onblur="this.style.borderColor='var(--border)'">
                        <option value="Beginner">🌱 Beginner</option>
                        <option value="Intermediate" selected>⚡ Intermediate</option>
                        <option value="Advanced">🔥 Advanced</option>
                        <option value="Expert">🏆 Expert</option>
                    </select>
                </div>
                <div style="margin-bottom:22px;">
                    <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.9rem; color: var(--foreground);">Short Description</label>
                    <textarea id="skillDescInput" rows="3" placeholder="Briefly describe your experience with this skill…"
                        style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:8px; font-size:0.95rem; box-sizing:border-box; resize:vertical; outline:none; background: var(--background); color: var(--foreground);"></textarea>
                </div>
                <div id="addSkillError" style="display:none; color:#e74c3c; font-size:0.85rem; margin-bottom:12px; padding:8px 12px; background:#fdf0f0; border-radius:6px;"></div>
                <div style="display:flex; gap:10px; justify-content:flex-end;">
                    <button id="cancelAddSkillBtn" style="background:var(--secondary); color:var(--foreground); border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:600; font-size:0.9rem;">Cancel</button>
                    <button id="submitAddSkillBtn" style="background:#2ecc71; color:white; border:none; padding:10px 22px; border-radius:8px; cursor:pointer; font-weight:600; font-size:0.9rem;">
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
                body: JSON.stringify({ skill_name: skillName, skill_level: level, description: desc, status: 'active' })
            });

            if (data.success) {
                alert("Skill added successfully!");
                closeModal();
                loadMySkills();
            } else {
                errorBox.textContent   = data.message || 'Failed to add skill.';
                errorBox.style.display = 'block';
            }
        } catch (e) {
            errorBox.textContent   = 'Cannot connect to server. Make sure the backend is running.';
            errorBox.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            document.getElementById('addSkillBtnText').textContent = '+ Add Skill';
        }
    });
}

// ====================== EDIT PROFILE MODAL ======================

function bindModalControls() {
    const modal    = document.getElementById("editProfileModal");
    const openBtn  = document.getElementById("openEditModalBtn");
    const closeBtn = document.getElementById("closeEditModalBtn");
    const form     = document.getElementById("editProfileForm");

    if (openBtn)  openBtn.addEventListener("click", () => modal.style.display = "flex");
    if (closeBtn) closeBtn.addEventListener("click", () => modal.style.display = "none");

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById("inputAvatarFile");
            let avatarFinalValue = document.getElementById("currentAvatarData").value;

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
                alert("Could not update profile data records.");
            }
        });
    }
}

// ====================== MY SKILLS LIST ======================

async function loadMySkills() {
    const skillsList = document.getElementById('skillsList');
    if (!skillsList) return;

    try {
        const data = await window.api.request('/users/skills');
        if (data.success && data.skills && data.skills.length > 0) {
            skillsList.innerHTML = data.skills.map(skill => `
                <div style="padding:14px 0; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <strong style="font-size:1rem; color: var(--foreground);">${skill.skill_name}</strong>
                        <span style="margin-left:10px; background:#e8f8f0; color:#2ecc71; padding:2px 10px; border-radius:20px; font-size:0.78rem; font-weight:600;">${skill.skill_level}</span>
                        <p style="margin:5px 0 0 0; color:var(--muted-foreground); font-size:0.88rem;">${skill.description || ''}</p>
                    </div>
                </div>
            `).join('');
        } else {
            skillsList.innerHTML = '<p style="color:var(--muted-foreground);">No skills added yet.</p>';
        }
    } catch (e) {
        skillsList.innerHTML = '<p style="color:#e74c3c;">Failed to load skills.</p>';
    }
}

// ====================== INITIALIZE ======================

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
        loadMyProfile();
        checkForNewNotifications();
    });
} else {
    loadMyProfile();
    checkForNewNotifications();
}