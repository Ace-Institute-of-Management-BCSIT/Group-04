// // Profile Dropdown
// const profileBtn = document.getElementById('profileBtn');
// const dropdownMenu = document.getElementById('dropdownMenu');

// profileBtn.addEventListener('click', (e) => {
//     e.stopPropagation();
//     dropdownMenu.classList.toggle('open');
// });

// document.addEventListener('click', () => dropdownMenu.classList.remove('open'));

// Theme Toggle (Dark = Default)
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

function setTheme(theme) {
    const isLight = theme === 'light';

    html.classList.toggle('light', isLight);
    html.classList.toggle('dark', !isLight);

    if (themeToggle) {
        themeToggle.innerHTML = isLight
            ? `<i class="fa-solid fa-moon"></i>`
            : `<i class="fa-solid fa-sun"></i>`;
    }

    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

const savedTheme = localStorage.getItem('theme');
setTheme(savedTheme === 'light' ? 'light' : 'dark');

themeToggle?.addEventListener('click', () => {
    setTheme(html.classList.contains('light') ? 'dark' : 'light');
});

// // Search
// document.getElementById('searchBtn').addEventListener('click', () => {
//     const query = document.getElementById('searchInput').value.trim();
//     if (query) alert(`Searching: "${query}"`);
// });