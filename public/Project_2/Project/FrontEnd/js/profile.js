let currentUser = null;

async function loadProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch('http://localhost:5000/api/profile/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error();

        currentUser = await res.json();

        // Fill the form
        document.getElementById('fullName').textContent = currentUser.full_name;
        document.getElementById('userEmail').textContent = currentUser.email;
        document.getElementById('userLocation').textContent = currentUser.location || '';
        
        document.getElementById('full_name').value = currentUser.full_name || '';
        document.getElementById('location').value = currentUser.location || '';
        document.getElementById('bio').value = currentUser.bio || '';
        document.getElementById('hourly_rate').value = currentUser.hourly_rate || 500;

        if (currentUser.profile_picture) {
            document.getElementById('profilePic').src = currentUser.profile_picture;
        }
    } catch (err) {
        alert("Failed to load profile");
    }
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('full_name', document.getElementById('full_name').value);
    formData.append('location', document.getElementById('location').value);
    formData.append('bio', document.getElementById('bio').value);
    formData.append('hourly_rate', document.getElementById('hourly_rate').value);

    const fileInput = document.getElementById('picUpload');
    if (fileInput.files[0]) {
        formData.append('profile_picture', fileInput.files[0]);
    }

    const token = localStorage.getItem('token');

    try {
        const res = await fetch('http://localhost:5000/api/profile/me', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (res.ok) {
            alert('Profile updated successfully!');
            loadProfile(); // Refresh
        } else {
            alert('Failed to update profile');
        }
    } catch (err) {
        alert('Error updating profile');
    }
});

// Handle profile picture preview
document.getElementById('picUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            document.getElementById('profilePic').src = ev.target.result;
        };
        reader.readAsDataURL(file);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadNavbar();
    loadProfile();
});