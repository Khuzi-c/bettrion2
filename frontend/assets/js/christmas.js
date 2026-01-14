const Christmas = {
    init: () => {
        const now = new Date();
        const endDate = new Date('2026-01-05');

        if (now < endDate) {
            console.log('🎄 Christmas Mode Active');
            Christmas.enableTheme();
            // Christmas.fixBanner(); // Disabled: User defined layout in HTML
            // Christmas.startSnow(); // Disabled: User requested removal
        }
    },

    enableTheme: () => {
        document.body.classList.add('christmas-theme');
        // Add Christmas CSS dynamically
        const style = document.createElement('style');
        style.innerHTML = `
            .christmas-theme {
                --primary: #d42426; /* Christmas Red */
                --primary-hover: #b01b1d;
                --accent: #165b33; /* Christmas Green */
            }
            .christmas-theme .site-header {
                border-bottom: 2px solid #d42426;
            }
            .snowflake {
                position: fixed;
                top: -10px;
                z-index: 9999;
                user-select: none;
                pointer-events: none;
                color: #fff;
                font-size: 1em;
                animation-name: fall;
                animation-timing-function: linear;
                opacity: 0.8;
            }
            @keyframes fall {
                to { transform: translateY(100vh); }
            }
        `;
        document.head.appendChild(style);
    },

    fixBanner: () => {
        // Only on Home
        if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') return;

        const hero = document.querySelector('.hero');
        if (hero) {
            // Force Layout
            hero.style.display = 'flex';
            // 3. Force "Smaller" Banner Layout
            hero.style.display = 'flex';
            hero.style.flexDirection = 'column';
            hero.style.justifyContent = 'center';
            hero.style.paddingTop = '10px';
            hero.style.paddingBottom = '50px';
            hero.style.minHeight = 'auto'; // reduced
            hero.style.height = '180px'; // Ultra-Compact

            // Move Buttons OUT of Hero
            const buttons = hero.querySelector('.hero-buttons');
            const container = document.querySelector('.container'); // Main container below hero

            if (buttons) {
                // formatting
                buttons.style.marginTop = '50px'; // "Buttons a little Go down" - Increased Gap
                buttons.style.marginBottom = '20px';
                buttons.style.position = 'relative';
                buttons.style.zIndex = '10';
                buttons.style.display = 'flex';
                buttons.style.gap = '15px';
                buttons.style.justifyContent = 'center';
                buttons.style.flexWrap = 'wrap';

                // Insert AFTER hero
                hero.parentNode.insertBefore(buttons, hero.nextSibling);

                // Add a wrapper for spacing if needed
                const spacer = document.createElement('div');
                spacer.style.height = '40px';
                spacer.style.width = '100%';
                buttons.parentNode.insertBefore(spacer, buttons.nextSibling);
            }
        }
    },

    startSnow: () => {
        const createSnowflake = () => {
            const flake = document.createElement('div');
            flake.classList.add('snowflake');
            flake.innerText = '❄';
            flake.style.left = Math.random() * 100 + 'vw';
            flake.style.animationDuration = Math.random() * 3 + 2 + 's';
            flake.style.opacity = Math.random();
            flake.style.fontSize = Math.random() * 10 + 10 + 'px';

            document.body.appendChild(flake);

            setTimeout(() => {
                flake.remove();
            }, 5000);
        };
        setInterval(createSnowflake, 200);
    }
};

// Auto-init
document.addEventListener('DOMContentLoaded', Christmas.init);
