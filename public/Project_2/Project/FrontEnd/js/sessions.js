async function loadSessions() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch('http://localhost:5000/api/sessions', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const sessions = await res.json();
        renderSessions(sessions);
    } catch (err) {
        console.error(err);
        document.getElementById('sessionsList').innerHTML = `
            <p style="grid-column: 1/-1; text-align: center; padding: 40px;">
                No sessions yet. Schedule your first one!
            </p>`;
    }
}

function renderSessions(sessions) {
    const container = document.getElementById('sessionsList');
    
    if (sessions.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding:60px;">No sessions found.</p>`;
        return;
    }

    container.innerHTML = sessions.map(session => `
        <div class="session-card">
            <h3>${session.title}</h3>
            <p><strong>With:</strong> ${session.teacher_name || session.learner_name}</p>
            <p><strong>Date:</strong> ${session.scheduled_date} at ${session.scheduled_time}</p>
            <p><strong>Status:</strong> <span style="color: ${session.status === 'completed' ? 'green' : 'orange'}">${session.status}</span></p>
            <p><strong>Price:</strong> ₹${session.price}</p>
            ${session.qr_code ? `<img src="${session.qr_code}" width="160" style="margin-top:12px;">` : ''}
        </div>
    `).join('');
}

// Modal Controls
function showScheduleModal() {
    document.getElementById('scheduleModal').style.display = 'flex';
}

function hideScheduleModal() {
    document.getElementById('scheduleModal').style.display = 'none';
}

// Handle Schedule Form
document.getElementById('scheduleForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const formData = {
        teacher_id: document.getElementById('teacherId').value,
        skill: document.getElementById('skill').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        duration: document.getElementById('duration').value,
        location: document.getElementById('location').value,
        price: parseFloat(document.getElementById('price').value)
    };

    try {
        const res = await fetch('http://localhost:5000/api/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            alert('Session scheduled successfully!');
            hideScheduleModal();
            loadSessions();
        } else {
            alert('Failed to schedule session');
        }
    } catch (err) {
        alert('Error connecting to server');
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadNavbar();
    loadSessions();
});