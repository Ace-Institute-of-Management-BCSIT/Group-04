// home.js - Load and render 3 random skills from the database

function getCategoryTagClass(category) {
    if (!category) return 'tag-generic';
    const cat = category.toLowerCase();
    if (cat.includes('dev') || cat.includes('program') || cat.includes('web') || cat.includes('code')) return 'dev';
    if (cat.includes('design') || cat.includes('graphic') || cat.includes('ui') || cat.includes('ux')) return 'design';
    if (cat.includes('market') || cat.includes('seo') || cat.includes('social')) return 'marketing';
    return 'tag-generic';
}

function getInitials(fullName) {
    if (!fullName) return '?';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
}

async function loadRandomSkills(category) {
    const container = document.getElementById('homeSkillCards');
    if (!container) return;

    try {
        const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
        const data = await window.api.request(`/skills/random${query}`);

        if (!data.success || !data.skills || data.skills.length === 0) {
            const message = category && category !== 'all'
                ? `No ${category} skills available right now.`
                : `No skills listed yet — be the first to add one!`;
            container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #7f8c8d;">
                ${message}
            </div>`;
            return;
        }

        container.innerHTML = data.skills.map(skill => {
            const catClass = getCategoryTagClass(skill.category);
            const initials = getInitials(skill.provider_name);
            const rating = skill.rating || 4.8;
            const price = skill.price_per_session || 0;

            return `
            <div class="skill-card">
                <div>
                    <div class="card-head">
                        <span class="cat-tag ${catClass}">${skill.category || 'General'}</span>
                        <div class="rating"><i class="fa-solid fa-star"></i> ${rating}</div>
                    </div>
                    <div class="card-body">
                        <h3>${skill.skill_name}</h3>
                        <p>${skill.description || 'Skilled service available.'}</p>
                    </div>
                </div>
                <div class="card-foot">
                    <div class="foot-user">
                        <div class="avatar-sm">${initials}</div>
                        <span>${skill.provider_name}</span>
                    </div>
                    <p class="wants-tag">Price: <span>Rs. ${price} / hr</span></p>
                </div>
            </div>`;
        }).join('');

    } catch (err) {
        console.error('Failed to load random skills:', err);
        container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #e74c3c;">
            Could not load skills. Please try again later.
        </div>`;
    }
}

function bindHomeCategoryFilters() {
    document.querySelectorAll('.btn-filter').forEach((button) => {
        button.addEventListener('click', () => {
            const category = button.textContent.trim() === 'All'
                ? null
                : button.textContent.trim();
            loadRandomSkills(category);
        });
    });
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadRandomSkills();
        bindHomeCategoryFilters();
    });
} else {
    loadRandomSkills();
    bindHomeCategoryFilters();
}
