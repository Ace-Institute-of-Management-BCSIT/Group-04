const blogPosts = [
    {
        id: 1,
        title: "From Zero to Hero: Learning Web Development",
        excerpt: "My journey from complete beginner to landing my first developer job through SkillSwap.",
        author: "Marcus Johnson",
        date: "Oct 5, 2025",
        category: "Success Story",
        image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop"
    },
    {
        id: 2,
        title: "5 Tips for Effective Skill Exchanges",
        excerpt: "Learn how to make the most of your skill exchange sessions and build meaningful connections.",
        author: "Sarah Chen",
        date: "Oct 3, 2025",
        category: "Learning Tips",
        image: "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=400&h=300&fit=crop"
    },
    {
        id: 3,
        title: "Teaching Yoga, Learning Video Editing",
        excerpt: "How I combined wellness with content creation through mutual skill exchange.",
        author: "Emily Rodriguez",
        date: "Sep 28, 2025",
        category: "Featured Member",
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop"
    }
];

function renderBlogPosts() {
    const container = document.getElementById('blogPosts');
    
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
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadNavbar();
    renderBlogPosts();
});