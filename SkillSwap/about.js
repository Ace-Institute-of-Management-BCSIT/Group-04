const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    html.classList.toggle('dark', savedTheme === 'dark');
} else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.classList.toggle('dark', prefersDark);
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        html.classList.toggle('dark');
        localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
    });
}

const profileBtn = document.getElementById('profileBtn');
const dropdownMenu = document.getElementById('dropdownMenu');

if (profileBtn && dropdownMenu) {
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!dropdownMenu.contains(e.target) && !profileBtn.contains(e.target)) {
            dropdownMenu.classList.remove('open');
        }
    });
}