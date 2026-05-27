const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('id');

let currentProfileUser = null;

async function loadUserProfile() {
    if (!userId) {
        alert("No user ID provided");
        window.location.href = "find-skills.html";
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // For now, we'll use a mock response since backend /users/:id may not be implemented yet
        // In full version, change to: fetch(`/api/users/${userId}`)
        
        const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error();

        currentProfileUser = await res.json();

        // Populate data
        document.getElementById('fullName').textContent = currentProfileUser.full_name;
        document.getElementById('userLocation').textContent = currentProfileUser.location || 'No location set';
        document.getElementById('bio').textContent = currentProfileUser.bio || 'This user has not added a bio yet.';

        if (currentProfileUser.profile_picture) {
            document.getElementById('profilePic').src = currentProfileUser.profile_picture;
        }

    } catch (err) {
        console.error(err);
        // Fallback mock data for development
        document.getElementById('fullName').textContent = "Sarah Chen";
        document.getElementById('userLocation').textContent = "San Francisco, CA";
        document.getElementById('bio').textContent = "Full-stack developer passionate about teaching React and modern JavaScript.";
    }
}

function startChat() {
    if (userId) {
        window.location.href = `chat.html?with=${userId}`;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadNavbar();
    loadUserProfile();
});