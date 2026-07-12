// FRONTEND/JS_&_JSON/admin-dashboard.js

const API_BASE = '';
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

    if (name === "overview") loadProviderEarnings();
    if (name === "users") loadUsers();
    if (name === "skills") loadSkills();
    if (name === "messages") loadMessages();
    if (name === "reports") loadReports();
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

const deleteAllMessagesBtn = document.getElementById("deleteAllMessagesBtn");
if (deleteAllMessagesBtn) {
    deleteAllMessagesBtn.addEventListener("click", deleteAllMessages);
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

function formatCurrency(value) {
    const amount = Number(value || 0);
    return `Rs. ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateTime(value) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString();
}

async function loadProviderEarnings() {
    const tbody = document.getElementById("providerEarningsTableBody");
    tbody.innerHTML = `<tr><td colspan="7" class="loading-row">Loading provider earnings…</td></tr>`;

    document.getElementById("earningsTotalProvider").textContent = "—";
    document.getElementById("earningsTotalCommission").textContent = "—";
    document.getElementById("earningsCompletedSessions").textContent = "—";

    try {
        const data = await adminFetch("/admin/provider-earnings");
        if (!data || !data.success) {
            tbody.innerHTML = `<tr><td colspan="7" class="loading-row">Could not load provider earnings.</td></tr>`;
            return;
        }

        const summary = data.summary || {};
        document.getElementById("earningsTotalProvider").textContent = formatCurrency(summary.totalProviderEarnings || 0);
        document.getElementById("earningsTotalCommission").textContent = formatCurrency(summary.totalCommission || 0);
        document.getElementById("earningsCompletedSessions").textContent = summary.completedSessions || 0;

        if (!data.earnings || data.earnings.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="loading-row">No completed sessions available.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.earnings.map(earning => `
            <tr>
                <td data-label="Provider">${escapeHtml(earning.provider_name || "—")}</td>
                <td data-label="Skill">${escapeHtml(earning.skill_name || "—")}</td>
                <td data-label="Session Date">${formatDateTime(earning.booking_date)}</td>
                <td data-label="Session Duration">${Number(earning.duration_minutes || 0)} min</td>
                <td data-label="Session Price">${formatCurrency(earning.session_price)}</td>
                <td data-label="Platform Commission">${formatCurrency(earning.platform_commission)}</td>
                <td data-label="Provider Earned">${formatCurrency(earning.provider_earnings)}</td>
            </tr>
        `).join("");
    } catch (err) {
        console.error("Failed to load provider earnings:", err);
        tbody.innerHTML = `<tr><td colspan="7" class="loading-row">Could not connect to server.</td></tr>`;
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
                        <button class="btn-sm secondary" data-clear-user-messages="${u.user_id}">Clear Chats</button>
                    </td>
                </tr>
            `;
        }).join("");

        tbody.querySelectorAll("[data-delete-user]").forEach(btn => {
            btn.addEventListener("click", () => deleteUser(btn.dataset.deleteUser));
        });

        tbody.querySelectorAll("[data-clear-user-messages]").forEach(btn => {
            btn.addEventListener("click", () => clearUserMessages(btn.dataset.clearUserMessages));
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
                        <button class="btn-sm danger" data-delete-skill="${s.skill_id}">Delete</button>
                    </td>
                </tr>
            `;
        }).join("");

        tbody.querySelectorAll("[data-toggle-skill]").forEach(btn => {
            btn.addEventListener("click", () => toggleSkillStatus(btn.dataset.toggleSkill, btn.dataset.nextStatus));
        });

        tbody.querySelectorAll("[data-delete-skill]").forEach(btn => {
            btn.addEventListener("click", () => deleteSkill(btn.dataset.deleteSkill));
        });
    } catch (err) {
        console.error("Failed to load skills:", err);
        tbody.innerHTML = `<tr><td colspan="7" class="loading-row">Could not connect to server.</td></tr>`;
    }
}

async function deleteSkill(skillId) {
    if (!confirm("Delete this skill and all related bookings?")) return;
    try {
        const data = await adminFetch(`/admin/skills/${skillId}`, { method: "DELETE" });
        if (data && data.success) {
            loadSkills();
            loadStats();
        } else {
            alert(data?.message || "Failed to delete skill.");
        }
    } catch (err) {
        alert("Network error while deleting skill.");
    }
}

async function clearUserMessages(userId) {
    if (!confirm("Clear all chat history for this user?")) return;
    try {
        const data = await adminFetch(`/admin/messages/user/${userId}`, { method: "DELETE" });
        if (data && data.success) {
            loadUsers();
            loadStats();
            const activeSection = document.querySelector('.dashboard-section.active')?.id;
            if (activeSection === 'messages-section') loadMessages();
        } else {
            alert(data?.message || "Failed to clear user messages.");
        }
    } catch (err) {
        alert("Network error while clearing user messages.");
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

async function loadReports() {
    const tbody = document.getElementById("reportsTableBody");
    tbody.innerHTML = `<tr><td colspan="7" class="loading-row">Loading reports…</td></tr>`;

    try {
        const data = await adminFetch("/admin/reports");
        if (!data || !data.success) {
            tbody.innerHTML = `<tr><td colspan="7" class="loading-row">Could not load reports.</td></tr>`;
            return;
        }

        document.getElementById("reportsCount").textContent = data.reports.length;
        if (data.reports.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="loading-row">No reports found.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.reports.map(report => `
            <tr>
                <td data-label="Reporter">${escapeHtml(report.reporter_name)}</td>
                <td data-label="Reported User">${escapeHtml(report.reported_user_name)}</td>
                <td data-label="Reason">${escapeHtml(report.reason)}</td>
                <td data-label="Description">${escapeHtml(report.description || "—")}</td>
                <td data-label="Date">${new Date(report.created_at).toLocaleString()}</td>
                <td data-label="Status">${escapeHtml(report.status || "Pending")}</td>
                <td data-label="Action">
                    <button class="btn-sm toggle" data-review-report="${report.report_id}">Mark Reviewed</button>
                    <button class="btn-sm danger" data-delete-report="${report.report_id}">Delete</button>
                </td>
            </tr>
        `).join("");

        tbody.querySelectorAll("[data-review-report]").forEach(btn => {
            btn.addEventListener("click", () => reviewReport(btn.dataset.reviewReport));
        });

        tbody.querySelectorAll("[data-delete-report]").forEach(btn => {
            btn.addEventListener("click", () => deleteReport(btn.dataset.deleteReport));
        });
    } catch (err) {
        console.error("Failed to load reports:", err);
        tbody.innerHTML = `<tr><td colspan="7" class="loading-row">Could not connect to server.</td></tr>`;
    }
}

async function reviewReport(reportId) {
    try {
        const data = await adminFetch(`/admin/reports/${reportId}/status`, {
            method: "PUT",
            body: JSON.stringify({ status: "Reviewed" })
        });
        if (data && data.success) {
            loadReports();
            loadStats();
        } else {
            alert(data?.message || "Failed to update report.");
        }
    } catch (err) {
        alert("Network error while updating report.");
    }
}

async function deleteReport(reportId) {
    if (!confirm("Delete this report?")) return;
    try {
        const data = await adminFetch(`/admin/reports/${reportId}`, { method: "DELETE" });
        if (data && data.success) {
            loadReports();
            loadStats();
        } else {
            alert(data?.message || "Failed to delete report.");
        }
    } catch (err) {
        alert("Network error while deleting report.");
    }
}

async function loadMessages() {
    const tbody = document.getElementById("messagesTableBody");
    tbody.innerHTML = `<tr><td colspan="5" class="loading-row">Loading messages…</td></tr>`;

    try {
        const data = await adminFetch("/admin/messages");
        if (!data || !data.success) {
            tbody.innerHTML = `<tr><td colspan="5" class="loading-row">Could not load messages.</td></tr>`;
            return;
        }

        document.getElementById("messagesCount").textContent = data.messages.length;
        if (data.messages.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="loading-row">No messages found.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.messages.map(msg => `
            <tr>
                <td data-label="Sender">${escapeHtml(msg.sender_name)}</td>
                <td data-label="Receiver">${escapeHtml(msg.receiver_name)}</td>
                <td data-label="Message">${escapeHtml(msg.message_text)}</td>
                <td data-label="Sent At">${new Date(msg.sent_at).toLocaleString()}</td>
                <td data-label="Action">
                    <button class="btn-sm danger" data-delete-message="${msg.message_id}">Delete</button>
                </td>
            </tr>
        `).join("");

        tbody.querySelectorAll("[data-delete-message]").forEach(btn => {
            btn.addEventListener("click", () => deleteMessage(btn.dataset.deleteMessage));
        });
    } catch (err) {
        console.error("Failed to load messages:", err);
        tbody.innerHTML = `<tr><td colspan="5" class="loading-row">Could not connect to server.</td></tr>`;
    }
}

async function deleteMessage(messageId) {
    if (!confirm("Delete this message permanently?")) return;
    try {
        const data = await adminFetch(`/admin/messages/${messageId}`, { method: "DELETE" });
        if (data && data.success) {
            loadMessages();
            loadStats();
        } else {
            alert(data?.message || "Failed to delete message.");
        }
    } catch (err) {
        alert("Network error while deleting message.");
    }
}

async function deleteAllMessages() {
    if (!confirm("Delete every message in the system? This cannot be undone.")) return;
    try {
        const data = await adminFetch(`/admin/messages`, { method: "DELETE" });
        if (data && data.success) {
            loadMessages();
            loadStats();
        } else {
            alert(data?.message || "Failed to delete all messages.");
        }
    } catch (err) {
        alert("Network error while deleting all messages.");
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
loadProviderEarnings();
