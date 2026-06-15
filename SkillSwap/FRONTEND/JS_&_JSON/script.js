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

document.querySelectorAll('.btn-filter').forEach((button) => {
    button.addEventListener('click', function () {
        document.querySelectorAll('.btn-filter').forEach((activeButton) => {
            activeButton.classList.remove('active');
        });

        this.classList.add('active');
    });
});
