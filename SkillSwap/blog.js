// Mock Data
const blogPosts = [
    {
        id: 1, title: "From Zero to Hero: Learning Web Development",
        excerpt: "My journey from complete beginner to landing my first developer job.",
        author: "Marcus Johnson", date: "Oct 5, 2025",
        category: "Success Story",
        image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop"
    },
    {
        id: 2, title: "5 Tips for Effective Skill Exchanges",
        excerpt: "Learn how to make the most of your skill exchange sessions.",
        author: "Sarah Chen", date: "Oct 3, 2025",
        category: "Learning Tips",
        image: "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=400&h=300&fit=crop"
    },
    {
        id: 3, title: "Teaching Yoga, Learning Video Editing",
        excerpt: "How I combined wellness with content creation.",
        author: "Emily Rodriguez", date: "Sep 28, 2025",
        category: "Featured Member",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop"
    },
    {
        id: 4, title: "The Science of Skill Exchange",
        excerpt: "Why teaching others helps you learn better.",
        author: "Dr. Aisha Patel", date: "Sep 25, 2025",
        category: "Learning Tips",
        image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop"
    },
    {
        id: 5, title: "Building Confidence Through Teaching",
        excerpt: "How teaching others can boost your self-esteem.",
        author: "Emily Rodriguez", date: "Sep 20, 2025",
        category: "Personal Growth",
        image: "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=400&h=300&fit=crop"
    },
    {
        id: 6, title: "Fluent in Spanish While Teaching Korean",
        excerpt: "A multilingual journey through skill exchange.",
        author: "David Kim", date: "Sep 15, 2025",
        category: "Success Story",
        image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop"
    }
];

function renderBlogPosts() {
    const container = document.getElementById('blogPosts');
    if (!container) return;
    
    container.innerHTML = blogPosts.map(post => `
        <div class="blog-post">
            <img src="${post.image}" alt="${post.title}" class="blog-image">
            <div class="blog-content">
                <div class="blog-category">${post.category}</div>
                <h3>${post.title}</h3>
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

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

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

// Initialize
renderBlogPosts();