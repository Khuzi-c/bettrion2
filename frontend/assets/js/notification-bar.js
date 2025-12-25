if (!window.NotificationBar) {
    window.NotificationBar = class {
        constructor() {
            this.notifications = [];
            this.container = null;
        }

        async init() {
            try {
                // FIXED: Use correct endpoint /api/notifications as defined in api.js
                const res = await fetch('/api/notifications');
                const result = await res.json();

                // Fallback if empty to show the requested text
                if (result.success && result.data.length > 0) {
                    this.notifications = result.data;
                } else {
                    // Default Fallback matching user request
                    this.notifications = [{
                        message: "[BETTRION] New Affiliate System is Out Now! Go Enjoy the Money Perks!",
                        color: "#9b59b6"
                    }];
                }

                this.render();
            } catch (e) {
                console.error('NotificationBar Error:', e);
            }
        }

        render() {
            if (this.notifications.length === 0) return;

            // Use the first active notification for the marquee
            const notif = this.notifications[0];
            const text = notif.title ? `[${notif.title}] ${notif.message}` : notif.message;
            const color = notif.color || '#9b59b6';

            // Create Container if not exists
            if (!document.getElementById('announcement-banner')) {
                const bar = document.createElement('div');
                bar.id = 'announcement-banner';

                // Inject Animations
                const style = document.createElement('style');
                style.innerHTML = `
                    @keyframes scroll-announcement {
                        0% { transform: translateX(100%); }
                        100% { transform: translateX(-100%); }
                    }
                `;
                document.head.appendChild(style);

                // Apply Styles given by user
                bar.style.cssText = `
                    display: block; 
                    width: 100%; 
                    padding: 12px 0px; 
                    text-align: center; 
                    font-weight: bold; 
                    font-size: 1rem; 
                    position: relative; 
                    overflow: hidden; 
                    z-index: 999; 
                    background: ${color}; 
                    color: rgb(255, 255, 255);
                    margin-top: 0px; /* Adjust as needed */
                `;

                // Content
                bar.innerHTML = `
                    <div style="display: inline-block; white-space: nowrap; animation: 20s linear 0s infinite normal none running scroll-announcement;">
                        ${text}
                    </div>
                `;

                // Insert at the very top of body
                document.body.insertBefore(bar, document.body.firstChild);
                this.container = bar;
            }
        }
    };
}
