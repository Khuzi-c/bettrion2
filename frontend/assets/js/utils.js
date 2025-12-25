const Utils = {
    getQueryParam: (param) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },

    slugify: (text) => {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    },

    formatDate: (dateString) => {
        return new Date(dateString).toLocaleDateString();
    },

    deviceDetector: () => {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return "tablet";
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return "mobile";
        }
        return "desktop";
    },

    throttledFetch: (fn, delay) => {
        let lastCall = 0;
        return function (...args) {
            const now = (new Date).getTime();
            if (now - lastCall < delay) {
                return;
            }
            lastCall = now;
            return fn(...args);
        }
    },

    applyTheme: () => {
        const theme = localStorage.getItem('user_theme') || 'dark';
        if (theme === 'light') {
            document.body.style.background = '#f5f5f5';
            document.body.style.color = '#333';
            document.documentElement.style.setProperty('--bg-body', '#f5f5f5');
            document.documentElement.style.setProperty('--text-main', '#333');
        } else if (theme === 'gradient') {
            document.body.style.background = 'linear-gradient(135deg, #111 0%, #20202a 100%)';
            document.body.style.color = 'white';
        } else if (theme === 'custom') {
            const c1 = localStorage.getItem('theme_color1') || '#111111';
            const c2 = localStorage.getItem('theme_color2') || '#20202a';
            document.body.style.background = `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
            document.body.style.color = 'white';
        } else {
            // Dark (Default)
            document.body.style.background = '#0d0d0d';
            document.body.style.color = 'white';
            document.documentElement.style.setProperty('--bg-body', '#0d0d0d');
            document.documentElement.style.setProperty('--text-main', '#fff');
        }
    }
};

// Auto-apply theme
document.addEventListener('DOMContentLoaded', Utils.applyTheme);

// --- GLOBAL SIDEBAR LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject Sidebar if missing (AND NOT ON ADMIN PAGES)
    if (!document.getElementById('sidebar') && !window.location.pathname.startsWith('/admin')) {
        const sidebarHTML = `
        <aside id="sidebar" class="sidebar">
            <div class="sidebar-header">
                <div class="brand-link">
                    <img src="/assets/img/3869-cardsndice.png" alt="Casino" style="height:40px;">
                    <span class="brand-name">Bettrion</span>
                </div>
                <button id="menu-close" class="close-btn">×</button>
            </div>
            <div class="sidebar-content">
                <div class="sidebar-section">
                    <h4 class="sidebar-title">Menu</h4>
                    <a href="/" class="sidebar-link"><img src="/assets/img/2666-casino-chip.png" class="icon"> Home</a>
                    <a href="/top-3-casinos" class="sidebar-link"><img src="/assets/img/3753-save-money-bag.png" class="icon"> Top 3 Casinos</a>
                    <a href="/top-10-casinos" class="sidebar-link"><img src="/assets/img/777.png" class="icon"> Top 10 Casinos</a>
                    <a href="/casinos" class="sidebar-link"><img src="/assets/img/3869-cardsndice.png" class="icon"> All Casinos</a>
                    <a href="/slots" class="sidebar-link"><img src="/assets/img/777.png" class="icon"> Slots</a>
                    <a href="/promotions" class="sidebar-link"><img src="/assets/img/3753-save-money-bag.png" class="icon"> Promotions</a>
                    <a href="/articles" class="sidebar-link"><img src="/assets/img/81912-news-paper.png" class="icon"> News</a>
                </div>
                <div class="sidebar-section">
                    <h4 class="sidebar-title">Account</h4>
                    <a href="/login" class="sidebar-link">🔑 Login</a>
                    <a href="/signup" class="sidebar-link">📝 Sign Up</a>
                    <a href="/affiliate" class="sidebar-link">🤝 Affiliate Program</a>
                </div>
                <div class="sidebar-section">
                    <h4 class="sidebar-title">Support</h4>
                    <a href="/support" class="sidebar-link">🎫 Live Support</a>
                </div>
            </div>
        </aside>`;
        document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    }

    // 2. Inject Toggle Button if missing
    const headerContainer = document.querySelector('header .container');
    if (headerContainer && !document.querySelector('.menu-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'menu-toggle';
        toggleBtn.innerHTML = '☰';
        toggleBtn.style.fontSize = '1.5rem';
        toggleBtn.style.background = 'none';
        toggleBtn.style.border = 'none';
        toggleBtn.style.color = 'white';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.marginRight = '15px';
        toggleBtn.onclick = () => window.toggleSidebar();

        // Insert before logo
        if (headerContainer.firstChild) {
            headerContainer.insertBefore(toggleBtn, headerContainer.firstChild);
        } else {
            headerContainer.appendChild(toggleBtn);
        }
    }

    // 3. Bind Events
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('menu-close');

    window.toggleSidebar = () => {
        if (sidebar) sidebar.classList.toggle('active');
    };

    if (closeBtn) {
        closeBtn.onclick = () => {
            if (sidebar) sidebar.classList.remove('active');
        };
    }

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (sidebar && sidebar.classList.contains('active') &&
            !sidebar.contains(e.target) &&
            !e.target.closest('.menu-toggle')) {
            sidebar.classList.remove('active');
        }
    });

    // Fix sidebar links active state
    const path = window.location.pathname;
    document.querySelectorAll('.sidebar-link').forEach(link => {
        if (link.getAttribute('href') === path) {
            link.classList.add('active');
        }
    });
});

