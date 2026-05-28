// ==================== DEVELOPMENT MODE ====================
// Change to false when you want real login
const DEV_MODE = true;   

const API_BASE = 'http://localhost:5000/api';

async function checkAuth() {
    if (DEV_MODE) {
        console.log("🔧 Development Mode: Authentication bypassed");
        return true;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }
    return token;
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

async function loadNavbar() {
    const html = `
        <header class="header glass">
            <div class="container header-content">
                <div class="logo">
                    <span>SkillSwap</span>
                </div>
                <nav class="nav">
                    <a href="home.html" class="nav-link">Home</a>
                    <a href="find-skills.html" class="nav-link">Find Skills</a>
                    <a href="sessions.html" class="nav-link">Sessions</a>
                    <a href="chat.html" class="nav-link">Messages</a>
                    <a href="profile.html" class="nav-link">Profile</a>
                    <a href="about.html" class="nav-link">About</a>
                    <a href="blog.html" class="nav-link">Blog</a>
                </nav>
                <div class="nav-right">
                    <button onclick="toggleTheme()" class="theme-toggle" id="themeToggle">🌙</button>
                    <a href="login.html" class="btn btn-outline" style="margin-left: 12px;">Login</a>
                </div>
            </div>
        </header>
    `;
    const placeholder = document.getElementById('navbar-placeholder');
    if (placeholder) {
        placeholder.innerHTML = html;
    }
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
} f 