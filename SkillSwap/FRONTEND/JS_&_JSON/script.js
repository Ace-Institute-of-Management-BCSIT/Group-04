(function () {
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

const headerContent = document.querySelector('.header-content');
const nav = document.querySelector('.header .nav');

if (headerContent && nav && !document.querySelector('.nav-toggle')) {
    const navToggle = document.createElement('button');
    navToggle.type = 'button';
    navToggle.className = 'nav-toggle';
    navToggle.setAttribute('aria-label', 'Toggle navigation menu');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';

    const navActions = document.querySelector('.header .nav-actions');
    if (navActions) {
        headerContent.insertBefore(navToggle, navActions);
    } else {
        headerContent.appendChild(navToggle);
    }

    const closeMobileNav = () => {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    };

    navToggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
        navToggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });

    nav.addEventListener('click', (event) => {
        if (event.target.closest('a')) {
            closeMobileNav();
        }
    });

    document.addEventListener('click', (event) => {
        if (nav.classList.contains('open') && !headerContent.contains(event.target)) {
            closeMobileNav();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 900) {
            closeMobileNav();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMobileNav();
        }
    });
}

document.querySelectorAll('.btn-filter').forEach((button) => {
    button.addEventListener('click', function () {
        document.querySelectorAll('.btn-filter').forEach((activeButton) => {
            activeButton.classList.remove('active');
        });

        this.classList.add('active');
    });
});
})();
