// FRONTEND/JS_&_JSON/notifications.js
// Drop-in notification bell for every page.
// Just add:  <script src="../JS_&_JSON/notifications.js"></script>
// after auth.js in every HTML file. It self-injects and self-polls.

(function () {
    'use strict';

    // ── How often to poll the backend (ms) ──────────────────────────────────
    const POLL_INTERVAL = 30000; // 30 seconds

    // ── localStorage key for seeker "last seen" statuses ────────────────────
    const SEEKER_SEEN_KEY = 'skillswap_seen_bookings';

    let pollTimer = null;
    let dropdownOpen = false;

    // ────────────────────────────────────────────────────────────────────────
    // 1. INJECT THE BELL INTO THE NAVBAR
    // ────────────────────────────────────────────────────────────────────────
    function injectBell() {
        if (document.getElementById('notifBellWrapper')) return; // already injected

        const themeToggle = document.querySelector('.theme-toggle');
        if (!themeToggle) return; // navbar not in DOM yet

        const wrapper = document.createElement('div');
        wrapper.id = 'notifBellWrapper';
        wrapper.style.cssText = 'position:relative; display:inline-flex; align-items:center;';

        wrapper.innerHTML = `
            <button id="notifBellBtn" title="Notifications"
                style="background:none; border:none; cursor:pointer; color:var(--foreground, #fff);
                       font-size:1.15rem; padding:6px 8px; border-radius:8px; position:relative;
                       transition: background 0.2s;"
                onmouseover="this.style.background='rgba(255,255,255,0.08)'"
                onmouseout="this.style.background='none'">
                <i class="fa-regular fa-bell"></i>
                <span id="notifBadge" style="display:none; position:absolute; top:2px; right:2px;
                      min-width:17px; height:17px; border-radius:50%; background:#e74c3c;
                      color:#fff; font-size:10px; font-weight:700; line-height:17px;
                      text-align:center; border:2px solid var(--background, #0f1117);
                      padding:0 3px; box-sizing:border-box;"></span>
            </button>

            <div id="notifDropdown" style="display:none; position:absolute; top:calc(100% + 10px);
                 right:0; width:320px; background:var(--card, #1a1f2e);
                 border:1px solid var(--border, rgba(255,255,255,0.1)); border-radius:12px;
                 box-shadow:0 8px 32px rgba(0,0,0,0.4); z-index:9999; overflow:hidden;">
                <div style="padding:14px 16px; border-bottom:1px solid var(--border, rgba(255,255,255,0.1));
                            display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:var(--foreground, #fff); font-size:0.95rem;">Notifications</strong>
                    <button id="notifMarkRead" style="background:none; border:none; cursor:pointer;
                            color:#2ecc71; font-size:0.78rem; font-weight:600;">
                        Mark all read
                    </button>
                </div>
                <div id="notifList" style="max-height:340px; overflow-y:auto;">
                    <div style="padding:24px; text-align:center; color:var(--muted-foreground, #7f8c8d); font-size:0.88rem;">
                        Loading…
                    </div>
                </div>
            </div>
        `;

        // Insert right before the theme toggle button
        themeToggle.parentNode.insertBefore(wrapper, themeToggle);

        // Wire up toggle
        document.getElementById('notifBellBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown();
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (dropdownOpen && !wrapper.contains(e.target)) {
                closeDropdown();
            }
        });

        // Mark all read
        document.getElementById('notifMarkRead').addEventListener('click', (e) => {
            e.stopPropagation();
            markAllRead();
        });
    }

    function toggleDropdown() {
        if (dropdownOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }

    function openDropdown() {
        const dd = document.getElementById('notifDropdown');
        if (dd) { dd.style.display = 'block'; dropdownOpen = true; }
        fetchAndRender(); // refresh when opened
    }

    function closeDropdown() {
        const dd = document.getElementById('notifDropdown');
        if (dd) { dd.style.display = 'none'; dropdownOpen = false; }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. FETCH NOTIFICATIONS FROM EXISTING ENDPOINTS
    // ────────────────────────────────────────────────────────────────────────
    async function fetchAndRender() {
        if (!window.api || !window.api.token) return; // not logged in

        const role = localStorage.getItem('skillSwapUserRole') || '';
        const isProvider = role === 'Skill Provider' || role === 'skill-provider';

        try {
            if (isProvider) {
                await handleProviderNotifs();
            } else {
                await handleSeekerNotifs();
            }
        } catch (e) {
            // silently fail — background polling shouldn't show errors
        }
    }

    // Provider: show all Pending incoming requests
    async function handleProviderNotifs() {
        const data = await window.api.request('/bookings/incoming');
        if (!data.success) return;

        const pending = (data.bookings || []).filter(b => b.status === 'Pending');
        updateBadge(pending.length);
        renderList(pending.map(b => ({
            icon: '📩',
            iconColor: '#f39c12',
            title: `${b.seeker_name} wants: <strong>${b.skill_name}</strong>`,
            subtitle: formatDate(b.booking_date) + ' at ' + b.booking_time.slice(0, 5),
            status: 'Pending',
            statusColor: '#f39c12',
            link: 'profile.html'
        })), 'pending booking requests', 'No pending requests right now.');
    }

    // Seeker: show bookings whose status changed since last visit
    async function handleSeekerNotifs() {
        const data = await window.api.request('/bookings/my');
        if (!data.success) return;

        const bookings = data.bookings || [];
        const seen = JSON.parse(localStorage.getItem(SEEKER_SEEN_KEY) || '{}');

        // Build notification items for anything that changed
        const notifs = [];
        bookings.forEach(b => {
            const prevStatus = seen[b.booking_id];
            const changed = prevStatus && prevStatus !== b.status;
            const isNew = !prevStatus && b.status !== 'Pending';

            if (changed || isNew) {
                const isAccepted = b.status === 'Accepted';
                notifs.push({
                    icon: isAccepted ? '✅' : '❌',
                    iconColor: isAccepted ? '#2ecc71' : '#e74c3c',
                    title: `<strong>${b.provider_name}</strong> ${isAccepted ? 'accepted' : 'declined'} your request`,
                    subtitle: `Skill: ${b.skill_name} · ${formatDate(b.booking_date)}`,
                    status: b.status,
                    statusColor: isAccepted ? '#2ecc71' : '#e74c3c',
                    link: 'profile.html'
                });
            }
        });

        updateBadge(notifs.length);
        renderList(notifs, 'status updates', 'No new updates on your requests.');
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. RENDER THE DROPDOWN LIST
    // ────────────────────────────────────────────────────────────────────────
    function renderList(items, label, emptyMsg) {
        const list = document.getElementById('notifList');
        if (!list) return;

        if (items.length === 0) {
            list.innerHTML = `
                <div style="padding:28px 16px; text-align:center;">
                    <div style="font-size:2rem; margin-bottom:8px;">🔔</div>
                    <p style="color:var(--muted-foreground, #7f8c8d); font-size:0.88rem; margin:0;">${emptyMsg}</p>
                </div>`;
            return;
        }

        list.innerHTML = items.map((item, i) => `
            <a href="${item.link}" style="display:flex; align-items:flex-start; gap:12px; padding:14px 16px;
               border-bottom:1px solid var(--border, rgba(255,255,255,0.07)); text-decoration:none;
               transition:background 0.15s; cursor:pointer;"
               onmouseover="this.style.background='rgba(255,255,255,0.05)'"
               onmouseout="this.style.background='none'">
                <div style="width:36px; height:36px; border-radius:50%; background:${item.iconColor}22;
                            display:flex; align-items:center; justify-content:center;
                            font-size:1rem; flex-shrink:0; margin-top:2px;">
                    ${item.icon}
                </div>
                <div style="flex:1; min-width:0;">
                    <p style="margin:0 0 3px 0; font-size:0.88rem; color:var(--foreground, #fff);
                               line-height:1.4;">${item.title}</p>
                    <p style="margin:0; font-size:0.78rem; color:var(--muted-foreground, #7f8c8d);">${item.subtitle}</p>
                </div>
                <span style="background:${item.statusColor}22; color:${item.statusColor}; padding:2px 8px;
                      border-radius:20px; font-size:0.72rem; font-weight:600; white-space:nowrap; flex-shrink:0;">
                    ${item.status}
                </span>
            </a>
        `).join('');
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. BADGE + MARK ALL READ
    // ────────────────────────────────────────────────────────────────────────
    function updateBadge(count) {
        const badge = document.getElementById('notifBadge');
        if (!badge) return;
        if (count > 0) {
            badge.style.display = 'block';
            badge.textContent = count > 9 ? '9+' : count;
        } else {
            badge.style.display = 'none';
        }
    }

    function markAllRead() {
        // For seekers: snapshot current statuses as "seen"
        window.api.request('/bookings/my').then(data => {
            if (!data.success) return;
            const seen = {};
            (data.bookings || []).forEach(b => { seen[b.booking_id] = b.status; });
            localStorage.setItem(SEEKER_SEEN_KEY, JSON.stringify(seen));
            updateBadge(0);
            renderList([], '', 'All caught up!');
        }).catch(() => {});

        // For providers: just clear the badge (they handle it by going to profile)
        updateBadge(0);
        const list = document.getElementById('notifList');
        if (list) {
            list.innerHTML = `<div style="padding:28px 16px; text-align:center; color:var(--muted-foreground, #7f8c8d); font-size:0.88rem;">All caught up! ✓</div>`;
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 5. HELPERS
    // ────────────────────────────────────────────────────────────────────────
    function formatDate(dateStr) {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function startPolling() {
        if (pollTimer) clearInterval(pollTimer);
        fetchAndRender(); // immediate first check
        pollTimer = setInterval(fetchAndRender, POLL_INTERVAL);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 6. INIT — wait for auth.js to finish and user to be logged in
    // ────────────────────────────────────────────────────────────────────────
    function init() {
        if (!localStorage.getItem('skillSwapLoggedIn')) return; // not logged in, skip
        injectBell();
        startPolling();
    }

    // Wait for DOM + auth.js
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Small delay to let auth.js run updateNavbarVisibility first
        setTimeout(init, 300);
    }

    // Re-init on storage change (login/logout from another tab)
    window.addEventListener('storage', () => {
        if (localStorage.getItem('skillSwapLoggedIn')) {
            init();
        } else {
            if (pollTimer) clearInterval(pollTimer);
            const bell = document.getElementById('notifBellWrapper');
            if (bell) bell.remove();
        }
    });

})();