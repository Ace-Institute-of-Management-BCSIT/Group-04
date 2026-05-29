// Mock Data
const users = [ /* ... same as original ... */ 
    { id: 1, name: "Sarah Chen", location: "San Francisco, CA", teaching: ["Web Development", "React", "JavaScript"], learning: ["UI/UX Design", "Photography"], availability: "Virtual", rating: 4.9, reviews: 24, bio: "Full-stack developer with 5 years of experience. Love teaching coding!" },
    { id: 2, name: "Marcus Johnson", location: "New York, NY", teaching: ["Guitar", "Music Theory", "Songwriting"], learning: ["Spanish", "Cooking"], availability: "In-Person", rating: 5.0, reviews: 18, bio: "Professional musician teaching guitar for 10 years." },
    { id: 3, name: "Emily Rodriguez", location: "Austin, TX", teaching: ["Yoga", "Meditation", "Wellness"], learning: ["Video Editing", "Content Creation"], availability: "Both", rating: 4.8, reviews: 31, bio: "Certified yoga instructor. Passionate about wellness." },
    { id: 4, name: "David Kim", location: "Seattle, WA", teaching: ["Korean Language", "Cooking"], learning: ["Graphic Design", "Marketing"], availability: "Virtual", rating: 4.7, reviews: 15, bio: "Native Korean speaker. Love sharing my culture!" },
    { id: 5, name: "Aisha Patel", location: "Boston, MA", teaching: ["Data Science", "Python", "Machine Learning"], learning: ["Public Speaking", "Writing"], availability: "Virtual", rating: 4.9, reviews: 27, bio: "Data scientist making ML accessible to everyone!" },
    { id: 6, name: "Jake Morrison", location: "Denver, CO", teaching: ["Photography", "Photo Editing"], learning: ["Rock Climbing", "Hiking"], availability: "In-Person", rating: 4.8, reviews: 22, bio: "Landscape photographer sharing my passion!" }
];

let filteredUsers = [...users];

function renderUserCards() {
    const container = document.getElementById('userCards');
    const resultsCount = document.getElementById('resultsCount');
    
    resultsCount.textContent = `Found ${filteredUsers.length} ${filteredUsers.length === 1 ? 'match' : 'matches'}`;
    
    container.innerHTML = filteredUsers.map(user => `
        <div class="user-card">
            <div class="user-header">
                <div class="avatar"></div>
                <div class="user-info">
                    <h3>${user.name}</h3>
                    <div class="user-meta">📍 ${user.location}</div>
                    <div class="rating">⭐ ${user.rating} (${user.reviews})</div>
                </div>
            </div>
            <p class="user-bio">${user.bio}</p>
            <div class="skill-section">
                <strong>Can teach:</strong>
                <div class="skill-tags">${user.teaching.map(skill => `<span class="skill-tag teaching">${skill}</span>`).join('')}</div>
            </div>
            <div class="skill-section">
                <strong>Wants to learn:</strong>
                <div class="skill-tags">${user.learning.map(skill => `<span class="skill-tag learning">${skill}</span>`).join('')}</div>
            </div>
            <div class="availability">${user.availability === 'Virtual' ? '💻' : user.availability === 'In-Person' ? '👥' : '💻 👥'} ${user.availability}</div>
            <div class="card-actions">
                <button class="btn btn-primary">View Profile</button>
                <button class="btn btn-outline">Message</button>
            </div>
        </div>
    `).join('');
}

function filterUsers() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const location = document.getElementById('locationFilter').value;
    const availability = document.getElementById('availabilityFilter').value;
    
    filteredUsers = users.filter(user => {
        const matchesSearch = !searchQuery || 
            user.name.toLowerCase().includes(searchQuery) ||
            user.teaching.some(s => s.toLowerCase().includes(searchQuery)) ||
            user.learning.some(s => s.toLowerCase().includes(searchQuery));
        const matchesLocation = location === 'all' || user.location.includes(location);
        const matchesAvailability = availability === 'all' || user.availability === availability || user.availability === 'Both';
        return matchesSearch && matchesLocation && matchesAvailability;
    });
    renderUserCards();
}

// Theme
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const savedTheme = localStorage.getItem('theme');
if (savedTheme) html.classList.toggle('dark', savedTheme === 'dark');
else html.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);

themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
});

// Init
document.getElementById('searchInput').addEventListener('input', filterUsers);
document.getElementById('locationFilter').addEventListener('change', filterUsers);
document.getElementById('availabilityFilter').addEventListener('change', filterUsers);
renderUserCards();