// FRONTEND/JS_&_JSON/admin-dashboard.js

const API_BASE = "";
const adminToken = localStorage.getItem("adminToken");

if (!adminToken) {
    window.location.href = "admin.html";
}

function adminHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
    };
}

async function adminFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { ...adminHeaders(), ...(options.headers || {}) }
    });

    if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminName");
        window.location.href = "admin.html";
        return null;
    }

    return res.json();
}

// ===== Section switching =====
function showSection(name) {
    document.querySelectorAll(".dashboard-section").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));

    document.getElementById(`${name}-section`)?.classList.add("active");
    document.querySelector(`.nav-link[data-section="${name}"]`)?.classList.add("active");

    if (name === "users") loadUsers();
    if (name === "skills") loadSkills();
}

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        showSection(link.dataset.section);
    });
});

// ===== Logout =====
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    window.location.href = "admin.html";
});

// ===== Admin identity =====
function loadAdminIdentity() {
    const storedName = localStorage.getItem("adminName");
    if (storedName) {
        document.getElementById("adminName").textContent = storedName;
    }
}

// ===== Overview stats =====
async function loadStats() {
    try {
        const data = await adminFetch("/admin/stats");
        if (!data || !data.success) return;

        document.getElementById("statUsers").textContent = data.stats.totalUsers;
        document.getElementById("statProviders").textContent = data.stats.totalProviders;
        document.getElementById("statSkills").textContent = data.stats.activeSkills;
        document.getElementById("statMessages").textContent = data.stats.totalMessages;
    } catch (err) {
        console.error("Failed to load stats:", err);
    }
}

// ===== Users table =====
async function loadUsers() {
    const tbody = document.getElementById("usersTableBody");
    tbody.innerHTML = `<tr><td colspan="7" class="loading-row">Loading users…</td></tr>`;

    try {
        const data = await adminFetch("/admin/users");
        if (!data || !data.success) {
            tbody.innerHTML = `<tr><td colspan="7" class="loading-row">Could not load users.</td></tr>`;
            return;
        }

        document.getElementById("usersCount").textContent = data.users.length;

        if (data.users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="loading-row">No users yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.users.map(u => {
            const roleClass = u.role === "Skill Provider" ? "provider" : "seeker";
            const joined = u.joined_date ? new Date(u.joined_date).toLocaleDateString() : "—";
            return `
                <tr>
                    <td data-label="Name">${escapeHtml(u.full_name)}</td>
                    <td data-label="Email">${escapeHtml(u.email)}</td>
                    <td data-label="Phone">${escapeHtml(u.phone || "—")}</td>
                    <td data-label="Role"><span class="role-pill ${roleClass}">${escapeHtml(u.role)}</span></td>
                    <td data-label="Location">${escapeHtml(u.location || "—")}</td>
                    <td data-label="Joined">${joined}</td>
                    <td data-label="Action">
                        <button class="btn-sm danger" data-delete-user="${u.user_id}">Remove</button>
                    </td>
                </tr>
            `;
        }).join("");

        tbody.querySelectorAll("[data-delete-user]").forEach(btn => {
            btn.addEventListener("click", () => deleteUser(btn.dataset.deleteUser));
        });
    } catch (err) {
        console.error("Failed to load users:", err);
        tbody.innerHTML = `<tr><td colspan="7" class="loading-row">Could not connect to server.</td></tr>`;
    }
}

async function deleteUser(userId) {
    if (!confirm("Remove this user? This cannot be undone.")) return;

    try {
        const data = await adminFetch(`/admin/users/${userId}`, { method: "DELETE" });
        if (data && data.success) {
            loadUsers();
            loadStats();
        } else {
            alert(data?.message || "Failed to remove user.");
        }
    } catch (err) {
        alert("Network error while removing user.");
    }
}

// ===== Skills table =====
async function loadSkills() {
    const tbody = document.getElementById("skillsTableBody");
    tbody.innerHTML = `<tr><td colspan="7" class="loading-row">Loading skills…</td></tr>`;

    try {
        const data = await adminFetch("/admin/skills");
        if (!data || !data.success) {
            tbody.innerHTML = `<tr><td colspan="7" class="loading-row">Could not load skills.</td></tr>`;
            return;
        }

        document.getElementById("skillsCount").textContent = data.skills.length;

        if (data.skills.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="loading-row">No skills listed yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.skills.map(s => {
            const isActive = s.status === "active";
            const nextStatus = isActive ? "inactive" : "active";
            const price = s.price_per_session ? `Rs. ${Number(s.price_per_session).toLocaleString()}` : "Free";
            return `
                <tr>
                    <td data-label="Skill">${escapeHtml(s.skill_name)}</td>
                    <td data-label="Provider">${escapeHtml(s.provider_name)}</td>
                    <td data-label="Category">${escapeHtml(s.category || "General")}</td>
                    <td data-label="Level">${escapeHtml(s.skill_level)}</td>
                    <td data-label="Price">${price}</td>
                    <td data-label="Status"><span class="status-pill ${isActive ? "active" : "inactive"}">${s.status}</span></td>
                    <td data-label="Action">
                        <button class="btn-sm toggle" data-toggle-skill="${s.skill_id}" data-next-status="${nextStatus}">
                            ${isActive ? "Deactivate" : "Activate"}
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

        tbody.querySelectorAll("[data-toggle-skill]").forEach(btn => {
            btn.addEventListener("click", () => toggleSkillStatus(btn.dataset.toggleSkill, btn.dataset.nextStatus));
        });
    } catch (err) {
        console.error("Failed to load skills:", err);
        tbody.innerHTML = `<tr><td colspan="7" class="loading-row">Could not connect to server.</td></tr>`;
    }
}

async function toggleSkillStatus(skillId, nextStatus) {
    try {
        const data = await adminFetch(`/admin/skills/${skillId}/status`, {
            method: "PUT",
            body: JSON.stringify({ status: nextStatus })
        });
        if (data && data.success) {
            loadSkills();
            loadStats();
        } else {
            alert(data?.message || "Failed to update skill status.");
        }
    } catch (err) {
        alert("Network error while updating skill.");
    }
}

// ===== Utility =====
function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// ===== Init =====
loadAdminIdentity();
loadStats();
