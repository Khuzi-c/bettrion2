const Router = {
    init: () => {
        Router.loadHeader();
        Router.fetchNotifications();
        window.logout = () => {
            localStorage.removeItem('user_token');
            window.location.href = '/login';
        };
    },

    getQueryParam: (param) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },

    loadHeader: async () => {
        // 1. Prepare Header Target
        // We look for #header, header, or #header-placeholder
        const headerPlaceholder = document.getElementById('header') || document.querySelector('header') || document.getElementById('header-placeholder');
        let headerEl = headerPlaceholder;

        // Standardize to <header id="header">
        if (headerPlaceholder && headerPlaceholder.id === 'header-placeholder') {
            headerEl = document.createElement('header');
            headerEl.id = 'header';
            headerPlaceholder.replaceWith(headerEl);
        }

        if (!headerEl) return;

        // 2. Fetch Components in Parallel
        try {
            const [headerRes, sidebarRes, cookiesRes, footerRes] = await Promise.all([
                fetch('/components/header.html').catch(e => null),
                fetch('/components/sidebar_v2.html').catch(e => null),
                fetch('/components/cookies.html').catch(e => null),
                fetch('/components/footer.html').catch(e => null)
            ]);

            const headerHTML = headerRes && headerRes.ok ? await headerRes.text() : '';
            const sidebarHTML = sidebarRes && sidebarRes.ok ? await sidebarRes.text() : '';
            const cookiesHTML = cookiesRes && cookiesRes.ok ? await cookiesRes.text() : '';
            const footerHTML = footerRes && footerRes.ok ? await footerRes.text() : '';

            // 3. Inject Content
            if (headerHTML) headerEl.innerHTML = headerHTML;

            // Inject Sidebar into BODY (to avoid stacking context issues inside Header)
            if (sidebarHTML && !document.getElementById('sidebar-v2')) {
                document.body.insertAdjacentHTML('beforeend', sidebarHTML);
            }

            // Inject Cookie Consent
            if (cookiesHTML && !document.getElementById('cookie-consent')) {
                document.body.insertAdjacentHTML('beforeend', cookiesHTML);
            }

            // Inject Footer (Only if not already present and not in admin)
            if (footerHTML && !document.querySelector('footer.site-footer') && !window.location.pathname.startsWith('/admin')) {
                // Try to find a footer placeholder first
                const footerPlaceholder = document.getElementById('footer-placeholder');
                if (footerPlaceholder) {
                    footerPlaceholder.innerHTML = footerHTML;
                } else {
                    document.body.insertAdjacentHTML('beforeend', footerHTML);
                }
            }

            // 4. Hydrate Dynamic Content (Auth State)
            Router.updateAuthUI();

            // 5. Initialize Interactive Elements (Event Listeners)
            Router.initEvents();

            // 6. Init GTranslate
            Router.initGTranslate();

            // 7. Check Cookies
            Router.checkCookieConsent();

            // 8. Inject Christmas Theme (Banner Fix + Snow)
            const xmasScript = document.createElement('script');
            xmasScript.src = '/assets/js/christmas.js';
            document.body.appendChild(xmasScript);

            // 9. Start UTC Clock (Sidebar)
            setInterval(() => {
                const el = document.getElementById('utc-clock');
                if (el) {
                    const now = new Date();
                    const h = String(now.getUTCHours()).padStart(2, '0');
                    const m = String(now.getUTCMinutes()).padStart(2, '0');
                    const s = String(now.getUTCSeconds()).padStart(2, '0');
                    el.innerText = `${h}:${m}:${s} UTC`;
                }
            }, 1000);

            // 10. Global Chatbot (Public Only)
            if (!window.location.pathname.startsWith('/admin')) {
                // Check if already exists to avoid dupes
                if (!document.querySelector('.elfsight-app-9d38424e-e3ae-4b5f-adaa-db397cca9d5f')) {
                    const chatDiv = document.createElement('div');
                    chatDiv.className = 'elfsight-app-9d38424e-e3ae-4b5f-adaa-db397cca9d5f';
                    chatDiv.setAttribute('data-elfsight-app-lazy', '');
                    document.body.appendChild(chatDiv);

                    const chatScript = document.createElement('script');
                    chatScript.src = 'https://elfsightcdn.com/platform.js';
                    chatScript.async = true;
                    document.body.appendChild(chatScript);
                }
            }

        } catch (error) {
            console.error('Error loading components:', error);
        }
    },

    updateAuthUI: async () => {
        const token = localStorage.getItem('user_token');

        let userData = null;
        if (token && (window.api || window.API)) {
            try {
                const res = await (window.api || window.API).get('/user/profile');
                if (res.success) userData = res.data;
            } catch (e) { console.error('Profile Fetch Error', e); }
        }

        // Sidebar Balance Fetch
        if (userData) {
            const balEl = document.getElementById('user-balance-sidebar');
            if (balEl) {
                balEl.innerHTML = `<a href="/affiliate/payout.html" style="color:#4caf50; text-decoration:none; cursor:pointer;" title="Click to Cashout">$${parseFloat(userData.balance || 0).toFixed(2)}</a>`;
            }
        }

        // Header Auth
        const authContainer = document.getElementById('auth-container');
        if (authContainer) {
            if (token) {
                const avatarContent = userData && userData.avatar_url
                    ? `<img src="${userData.avatar_url}" alt="Profile" style="width:32px; height:32px; border-radius:50%; object-fit:cover; border: 2px solid #333;">`
                    : `<span class="header-icon-btn" title="Profile">👤</span>`;

                authContainer.innerHTML = `
                    <a href="/profile.html" style="text-decoration:none; display:flex; align-items:center;">${avatarContent}</a>
                `;
            } else {
                authContainer.innerHTML = `
                    <a href="/login.html" class="btn-login-plain">Sign In</a>
                    <a href="/signup.html" class="btn-signup">Sign Up</a>
                `;
            }
        }

        // Sidebar Auth (V2)
        const userLinksPlaceholder = document.getElementById('sidebar-auth-placeholder');

        if (userLinksPlaceholder) {
            if (token) {
                userLinksPlaceholder.innerHTML = `
                    <a href="/profile.html" class="nav-link">👤 My Profile</a>
                    <a href="/affiliate" class="nav-link">🤝 Affiliate Program</a>
                    <a href="/settings.html" class="nav-link">⚙️ Settings</a>
                    <a href="#" onclick="logout()" class="nav-link" style="color:var(--primary);">🚪 Logout</a>
                `;
            } else {
                userLinksPlaceholder.innerHTML = `
                    <a href="/login.html" class="nav-link">🔑 Sign In</a>
                    <a href="/signup.html" class="nav-link">📝 Sign Up</a>
                `;
            }
        }
    },

    initEvents: () => {
        // Remove existing listener to avoid duplicates
        document.body.removeEventListener('click', Router.handleGlobalClick);
        document.body.addEventListener('click', Router.handleGlobalClick);
        console.log('Router: Global click listener attached');
    },

    handleGlobalClick: (e) => {
        // Toggle Button (Hamburger) - Check for both ID and class to be safe
        const toggleBtn = e.target.closest('#menu-toggle') || e.target.closest('.menu-btn');
        if (toggleBtn) {
            console.log('Router: Menu Toggle Clicked');
            e.stopPropagation(); // Prevent bubbling
            const sidebar = document.getElementById('sidebar-v2');
            const overlay = document.getElementById('sidebar-v2-overlay');
            if (sidebar) {
                sidebar.classList.add('active');
            }
            if (overlay) overlay.classList.add('active');
        }

        // Close Button or Overlay
        if (e.target.closest('#sidebar-v2-close') || e.target.id === 'sidebar-v2-overlay') {
            console.log('Router: Menu Close Clicked');
            const sidebar = document.getElementById('sidebar-v2');
            const overlay = document.getElementById('sidebar-v2-overlay');
            if (sidebar) sidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        }

        // Cookie Consent
        if (e.target.closest('#accept-cookies')) {
            localStorage.setItem('cookie_consent', 'accepted');
            const banner = document.getElementById('cookie-consent');
            if (banner) banner.style.bottom = '-200px';
        }
        if (e.target.closest('#reject-cookies')) {
            localStorage.setItem('cookie_consent', 'necessary');
            const banner = document.getElementById('cookie-consent');
            if (banner) banner.style.bottom = '-200px';
        }
    },

    initGTranslate: () => {
        // Always set settings first
        window.gtranslateSettings = { "default_language": "en", "native_language_names": true, "detect_browser_language": true, "wrapper_selector": ".gtranslate_wrapper", "flag_size": 24, "flag_style": "3d", "alt_flags": { "en": "usa" } };

        // If script exists, remove it and re-add it to force re-initialization (critical for dynamic loading)
        const existingScript = document.getElementById('gtranslate-script');
        if (existingScript) existingScript.remove();

        const script = document.createElement('script');
        script.src = 'https://cdn.gtranslate.net/widgets/latest/popup.js';
        script.defer = true;
        script.id = 'gtranslate-script';
        document.body.appendChild(script);
        console.log('Router: GTranslate script injected');
    },

    checkCookieConsent: () => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            setTimeout(() => {
                const banner = document.getElementById('cookie-consent');
                if (banner) banner.style.bottom = '0';
            }, 1000);
        }
    },

    fetchNotifications: async () => {
        // Load the Rotating Notification Bar script
        try {
            const script = document.createElement('script');
            script.src = '/assets/js/notification-bar.js';
            document.body.appendChild(script);
        } catch (e) {
            console.error('Failed to load notification bar', e);
        }
    }
};

document.addEventListener('DOMContentLoaded', Router.init);
