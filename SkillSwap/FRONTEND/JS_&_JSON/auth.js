const AUTH_STORAGE_KEYS = {
    loggedIn: 'skillSwapLoggedIn',
    userEmail: 'skillSwapUserEmail'
};

const PUBLIC_PAGES = new Set([
    'home.html',
    'login.html',
    'signup.html',
    'blog.html',
    'about.html',
    'index.html',
    ''
]);

let navbarHandlersBound = false;

function getCurrentPageName() {
    return window.location.pathname.split('/').pop().toLowerCase();
}

function isLoggedIn() {
    return localStorage.getItem(AUTH_STORAGE_KEYS.loggedIn) === 'true';
}

function getUserLabel() {
    const email = localStorage.getItem(AUTH_STORAGE_KEYS.userEmail) || '';

    if (!email) {
        return 'Profile';
    }

    return email.split('@')[0] || 'Profile';
}

function protectRoute() {
    const currentPage = getCurrentPageName();

    if (!PUBLIC_PAGES.has(currentPage) && !isLoggedIn()) {
        window.location.replace('login.html');
        return false;
    }

    return true;
}

function updateNavbarVisibility() {
    const joinButtons = document.querySelectorAll('[data-auth="join"], .nav-actions .btn-primary');
    const profileDropdowns = document.querySelectorAll('[data-auth="profile"], .profile-dropdown');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const profileName = document.querySelector('.profile-name');
    const loggedIn = isLoggedIn();

    joinButtons.forEach((joinButton) => {
        joinButton.hidden = loggedIn;
        joinButton.style.display = loggedIn ? 'none' : '';
    });

    profileDropdowns.forEach((profileDropdown) => {
        profileDropdown.hidden = !loggedIn;
        profileDropdown.style.display = loggedIn ? '' : 'none';
    });

    if (profileName) {
        profileName.textContent = getUserLabel();
    }

    if (!loggedIn && dropdownMenu) {
        dropdownMenu.classList.remove('open');
    }
}

function bindNavbarHandlers() {
    if (navbarHandlersBound) {
        return;
    }

    navbarHandlersBound = true;

    document.addEventListener('click', (event) => {
        const profileBtn = event.target.closest('#profileBtn');
        const dropdownMenu = document.getElementById('dropdownMenu');
        const profileDropdown = document.querySelector('[data-auth="profile"], .profile-dropdown');
        const logoutAction = event.target.closest('.logout');

        if (logoutAction) {
            event.preventDefault();
            localStorage.removeItem(AUTH_STORAGE_KEYS.loggedIn);
            localStorage.removeItem(AUTH_STORAGE_KEYS.userEmail);
            window.location.href = 'login.html';
            return;
        }

        if (!dropdownMenu || !profileDropdown) {
            return;
        }

        const profileHidden = profileDropdown.hidden || profileDropdown.style.display === 'none';
        if (profileHidden) {
            dropdownMenu.classList.remove('open');
            return;
        }

        if (profileBtn) {
            event.preventDefault();
            event.stopPropagation();
            dropdownMenu.classList.toggle('open');
            return;
        }

        const clickedInsideMenu = dropdownMenu.contains(event.target);
        if (!clickedInsideMenu) {
            dropdownMenu.classList.remove('open');
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') {
            return;
        }

        const dropdownMenu = document.getElementById('dropdownMenu');
        dropdownMenu?.classList.remove('open');
    });
}

function wireSharedFilters() {
    document.querySelectorAll('.btn-filter').forEach((button) => {
        button.addEventListener('click', function () {
            document.querySelectorAll('.btn-filter').forEach((activeButton) => {
                activeButton.classList.remove('active');
            });

            this.classList.add('active');
        });
    });
}

function initAuthNavbar() {
    if (!protectRoute()) {
        return;
    }

    bindNavbarHandlers();
    updateNavbarVisibility();
    wireSharedFilters();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthNavbar, { once: true });
} else {
    initAuthNavbar();
}

window.addEventListener('pageshow', initAuthNavbar);
window.addEventListener('storage', initAuthNavbar);
