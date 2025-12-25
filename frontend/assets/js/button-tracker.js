// Button Click Tracking Script
// Add data-track-button attribute to any button you want to track

(function () {
    function trackButton(buttonId, buttonLabel, pageUrl) {
        fetch('/api/track-button', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                button_id: buttonId,
                button_label: buttonLabel,
                page_url: pageUrl
            })
        }).catch(err => console.debug('Button tracking failed:', err));
    }

    // Auto-track all buttons with data-track-button attribute
    document.addEventListener('click', (e) => {
        const button = e.target.closest('[data-track-button]');
        if (button) {
            const buttonId = button.getAttribute('data-track-button');
            const buttonLabel = button.innerText || button.getAttribute('aria-label') || 'Unknown';
            const pageUrl = window.location.pathname;
            trackButton(buttonId, buttonLabel, pageUrl);
        }
    });

    // Also track buttons with specific classes
    document.addEventListener('click', (e) => {
        const button = e.target.closest('.btn-primary, .btn');
        if (button && !button.hasAttribute('data-track-button')) {
            const buttonId = button.id || `btn-${button.innerText.toLowerCase().replace(/\s+/g, '-')}`;
            const buttonLabel = button.innerText || 'Button';
            const pageUrl = window.location.pathname;
            trackButton(buttonId, buttonLabel, pageUrl);
        }
    });
})();
