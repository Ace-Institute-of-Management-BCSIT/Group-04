document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();     // Will be bypassed in DEV_MODE
    await loadNavbar();
    
    // Optional: Add any extra interactivity here later
    console.log("About page loaded successfully");
});