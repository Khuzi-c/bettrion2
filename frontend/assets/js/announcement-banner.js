// Announcement Banner Component
(function () {
    const banner = document.createElement('div');
    banner.id = 'announcement-banner';
    banner.style.cssText = `
        display: none;
        width: 100%;
        padding: 12px 0;
        text-align: center;
        font-weight: bold;
        font-size: 1rem;
        position: relative;
        overflow: hidden;
        z-index: 999;
    `;

    const messageContainer = document.createElement('div');
    messageContainer.style.cssText = `
        display: inline-block;
        white-space: nowrap;
        animation: scroll-announcement 20s linear infinite;
    `;

    banner.appendChild(messageContainer);

    // Add keyframe animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes scroll-announcement {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }
    `;
    document.head.appendChild(style);

    // Insert banner after header
    window.addEventListener('DOMContentLoaded', () => {
        const header = document.querySelector('header');
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(banner, header.nextSibling);
        } else if (header) {
            header.parentNode.appendChild(banner);
        } else {
            document.body.insertBefore(banner, document.body.firstChild);
        }

        loadAnnouncement();
    });

    async function loadAnnouncement() {
        try {
            const response = await fetch('/api/announcements/active');
            const data = await response.json();

            if (data.success && data.data) {
                const announcement = data.data;
                banner.style.background = announcement.background_color || '#dc2626';
                banner.style.color = announcement.text_color || '#ffffff';
                messageContainer.textContent = announcement.message;
                banner.style.display = 'block';
            } else {
                banner.style.display = 'none';
            }
        } catch (err) {
            console.error('Failed to load announcement:', err);
            banner.style.display = 'none';
        }
    }

    // Refresh announcement every 30 seconds
    setInterval(loadAnnouncement, 30000);
})();
