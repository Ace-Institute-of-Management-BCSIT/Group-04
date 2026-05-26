// Mock Data
const users = [
    {
        id: 1,
        name: "Sarah Chen",
        location: "San Francisco, CA",
        teaching: ["Web Development", "React", "JavaScript"],
        learning: ["UI/UX Design", "Photography"],
        availability: "Virtual",
        rating: 4.9,
        reviews: 24,
        bio: "Full-stack developer with 5 years of experience. Love teaching coding!"
    },
    {
        id: 2,
        name: "Marcus Johnson",
        location: "New York, NY",
        teaching: ["Guitar", "Music Theory", "Songwriting"],
        learning: ["Spanish", "Cooking"],
        availability: "In-Person",
        rating: 5.0,
        reviews: 18,
        bio: "Professional musician teaching guitar for 10 years."
    },
    {
        id: 3,
        name: "Emily Rodriguez",
        location: "Austin, TX",
        teaching: ["Yoga", "Meditation", "Wellness"],
        learning: ["Video Editing", "Content Creation"],
        availability: "Both",
        rating: 4.8,
        reviews: 31,
        bio: "Certified yoga instructor. Passionate about wellness."
    },
    {
        id: 4,
        name: "David Kim",
        location: "Seattle, WA",
        teaching: ["Korean Language", "Cooking"],
        learning: ["Graphic Design", "Marketing"],
        availability: "Virtual",
        rating: 4.7,
        reviews: 15,
        bio: "Native Korean speaker. Love sharing my culture!"
    },
    {
        id: 5,
        name: "Aisha Patel",
        location: "Boston, MA",
        teaching: ["Data Science", "Python", "Machine Learning"],
        learning: ["Public Speaking", "Writing"],
        availability: "Virtual",
        rating: 4.9,
        reviews: 27,
        bio: "Data scientist making ML accessible to everyone!"
    },
    {
        id: 6,
        name: "Jake Morrison",
        location: "Denver, CO",
        teaching: ["Photography", "Photo Editing"],
        learning: ["Rock Climbing", "Hiking"],
        availability: "In-Person",
        rating: 4.8,
        reviews: 22,
        bio: "Landscape photographer sharing my passion!"
    }
];

const blogPosts = [
    {
        id: 1,
        title: "From Zero to Hero: Learning Web Development",
        excerpt: "My journey from complete beginner to landing my first developer job.",
        author: "Marcus Johnson",
        date: "Oct 5, 2025",
        category: "Success Story",
        image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop"
    },
    {
        id: 2,
        title: "5 Tips for Effective Skill Exchanges",
        excerpt: "Learn how to make the most of your skill exchange sessions.",
        author: "Sarah Chen",
        date: "Oct 3, 2025",
        category: "Learning Tips",
        image: "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=400&h=300&fit=crop"
    },
    {
        id: 3,
        title: "Teaching Yoga, Learning Video Editing",
        excerpt: "How I combined wellness with content creation.",
        author: "Emily Rodriguez",
        date: "Sep 28, 2025",
        category: "Featured Member",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop"
    },
    {
        id: 4,
        title: "The Science of Skill Exchange",
        excerpt: "Why teaching others helps you learn better.",
        author: "Dr. Aisha Patel",
        date: "Sep 25, 2025",
        category: "Learning Tips",
        image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop"
    },
    {
        id: 5,
        title: "Building Confidence Through Teaching",
        excerpt: "How teaching others can boost your self-esteem.",
        author: "Emily Rodriguez",
        date: "Sep 20, 2025",
        category: "Personal Growth",
        image: "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=400&h=300&fit=crop"
    },
    {
        id: 6,
        title: "Fluent in Spanish While Teaching Korean",
        excerpt: "A multilingual journey through skill exchange.",
        author: "David Kim",
        date: "Sep 15, 2025",
        category: "Success Story",
        image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop"
    }
];

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Check for saved theme or default to system preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    html.classList.toggle('dark', savedTheme === 'dark');
} else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.classList.toggle('dark', prefersDark);
}

themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
});

// Navigation
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

function navigateToPage(pageName) {
    // Update active nav link
    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.page === pageName);
    });
    
    // Show active page
    pages.forEach(page => {
        page.classList.toggle('active', page.id === pageName);
    });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToPage(link.dataset.page);
    });
});

// Button navigation
document.addEventListener('click', (e) => {
    if (e.target.matches('[data-page]') && e.target.tagName === 'BUTTON') {
        navigateToPage(e.target.dataset.page);
    }
});

// Footer link navigation
document.querySelectorAll('.footer-links a[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToPage(link.dataset.page);
    });
});

// Search Functionality
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
                <div class="skill-tags">
                    ${user.teaching.map(skill => `<span class="skill-tag teaching">${skill}</span>`).join('')}
                </div>
            </div>
            <div class="skill-section">
                <strong>Wants to learn:</strong>
                <div class="skill-tags">
                    ${user.learning.map(skill => `<span class="skill-tag learning">${skill}</span>`).join('')}
                </div>
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
        const matchesAvailability = availability === 'all' || 
            user.availability === availability || 
            user.availability === 'Both';
            
        return matchesSearch && matchesLocation && matchesAvailability;
    });
    
    renderUserCards();
}

// Search event listeners
document.getElementById('searchInput')?.addEventListener('input', filterUsers);
document.getElementById('locationFilter')?.addEventListener('change', filterUsers);
document.getElementById('availabilityFilter')?.addEventListener('change', filterUsers);

// Blog Posts
function renderBlogPosts() {
    const container = document.getElementById('blogPosts');
    if (!container) return;
    
    container.innerHTML = blogPosts.map(post => `
        <div class="blog-post">
            <img src="${post.image}" alt="${post.title}" class="blog-image">
            <div class="blog-content">
                <div class="blog-category">${post.category}</div>
                <h3 class="blog-title">${post.title}</h3>
                <p class="blog-excerpt">${post.excerpt}</p>
                <div class="blog-meta">
                    <span>${post.author}</span>
                    <span>•</span>
                    <span>${post.date}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Initialize
renderUserCards();
renderBlogPosts();
