// Analytics Tracker - Auto-track page visits
// Include this script on all public pages

(function () {
    // Track page visit
    async function trackVisit() {
        try {
            await fetch('/api/admin/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page_url: window.location.pathname,
                    user_agent: navigator.userAgent,
                    referrer: document.referrer
                })
            });
        } catch (err) {
            // Silently fail - don't break the page
            console.debug('Analytics tracking failed:', err);
        }
    }

    // Track on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trackVisit);
    } else {
        trackVisit();
    }

    // Update active session every 30 seconds
    setInterval(trackVisit, 30000);
})();
