// Compatibility loader for pages that reference notifications.js.
// The actual bell implementation lives in notification.js.
(function () {
    const script = document.createElement('script');
    script.src = new URL('notification.js', document.currentScript.src).href;
    document.head.appendChild(script);
})();
