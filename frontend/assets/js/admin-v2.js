const AdminV2 = {
    init: () => {
        AdminV2.injectSidebar();
        AdminV2.checkAuth();
    },

    checkAuth: () => {
        // 1. Basic Token Check
        if (!localStorage.getItem('user_token')) {
            if (!window.location.href.includes('login')) {
                // window.location.href = '/admin/login.html'; // Uncomment to enforce login
            }
            // For now, allow viewing but lock sensitive actions? 
            // Actually, Requirement is "Lock Admin Panel"
        }

        // 2. Lock Screen Check
        // If we are ALREADY on lock page, do nothing
        if (window.location.href.includes('lock.html')) return;

        // If NOT unlocked, Redirect to Lock
        if (sessionStorage.getItem('admin_unlocked') !== 'true') {
            console.log('Admin Locked. Redirecting...');
            window.location.href = '/admin/lock.html?return=' + encodeURIComponent(window.location.pathname);
        }
    },

    injectSidebar: () => {
        const sidebarHTML = `
            <div class="admin-header">
                <img src="/assets/img/logo.webp" class="admin-logo">
                <span class="admin-title">BETTRION</span>
                <button class="close-sidebar-btn" onclick="AdminV2.toggleSidebar(false)">&times;</button>
            </div>
            <nav class="nav-links">
                <a href="/admin/dashboard.html" class="nav-item">
                    <img src="/assets/img/icon-menu.png" class="nav-icon" onerror="this.src='/assets/img/1881-ping.png'"> Dashboard
                </a>
                
                <div class="nav-label">PLATFORMS</div>
                <a href="/admin/casinos.html" class="nav-item">
                    <img src="/assets/img/2666-casino-chip.png" class="nav-icon"> Manage Casinos
                </a>
                <a href="/admin/platform-edit.html" class="nav-item">
                    <img src="/assets/img/494995-new.png" class="nav-icon"> Add Casino
                </a>
                <a href="/admin/slots.html" class="nav-item">
                    <img src="/assets/img/43091-slots.gif" class="nav-icon"> Manage Slots
                </a>
                <a href="/admin/add-slot.html" class="nav-item">
                    <img src="/assets/img/494995-new.png" class="nav-icon"> Add Slot
                </a>
                <a href="/admin/top-lists.html" class="nav-item">
                    <img src="/assets/img/81912-news-paper.png" class="nav-icon"> Top Lists
                </a>

                <div class="nav-label">CONTENT</div>
                <a href="/admin/articles.html" class="nav-item">
                    <img src="/assets/img/81912-news-paper.png" class="nav-icon"> Manage Articles
                </a>
                <a href="/admin/article-edit.html" class="nav-item">
                    <img src="/assets/img/494995-new.png" class="nav-icon"> Write Article
                </a>
                <a href="/admin/images.html" class="nav-item">
                    <img src="/assets/img/80012-verified.png" class="nav-icon"> Image Manager
                </a>
                <a href="/admin/ads.html" class="nav-item">
                    <img src="/assets/img/3869-cardsndice.png" class="nav-icon"> Ads Manager
                </a>
                <a href="/admin/promotions.html" class="nav-item">
                    <img src="/assets/img/22134-luckyclover.gif" class="nav-icon"> Promotions
                </a>
                <a href="/admin/notifications.html" class="nav-item">
                    <img src="/assets/img/icon-menu.png" class="nav-icon"> Notifications Bar
                </a>
                
                <div class="nav-label">OPERATIONS</div>
                <a href="/admin/affiliates" class="nav-item">
                    <img src="/assets/img/3753-save-money-bag.png" class="nav-icon"> Affiliates
                </a>
                <a href="/admin/users.html" class="nav-item">
                    <img src="/assets/img/44014-msp-elite-vip.png" class="nav-icon"> Users
                </a>
                <a href="/admin/tickets.html" class="nav-item">
                    <img src="/assets/img/18502-beta-pogo-os.png" class="nav-icon"> Support Tickets
                </a>
                <a href="/admin/emails.html" class="nav-item">
                    <img src="/assets/img/1881-ping.png" class="nav-icon"> Emails
                </a>
                <a href="/admin/staff-time.html" class="nav-item">
                    <img src="/assets/img/8885-buyhere-ids.png" class="nav-icon"> Staff Hours
                </a>

                <div class="nav-label">ANALYTICS</div>
                <a href="/admin/web-stats.html" class="nav-item">
                    <img src="/assets/img/22134-luckyclover.gif" class="nav-icon" style="filter: hue-rotate(180deg);" onerror="this.src='/assets/img/1881-ping.png'"> Web Stats
                </a>

                <div class="nav-label">SYSTEM</div>
                <a href="/admin/database.html" class="nav-item">
                    <img src="/assets/img/21503-payhere-ids.png" class="nav-icon"> Database (Raw)
                </a>
                 <a href="/admin/settings.html" class="nav-item">
                    <img src="/assets/img/2879-securitywarning.png" class="nav-icon"> Settings
                </a>
                <a href="/admin/backups.html" class="nav-item">
                    <img src="/assets/img/3753-save-money-bag.png" class="nav-icon"> Backups
                </a>
                <a href="/admin/logs.html" class="nav-item">
                    <img src="/assets/img/81912-news-paper.png" class="nav-icon"> Server Logs
                </a>

                <div style="flex:1"></div>
                <a href="#" onclick="AdminV2.logout()" class="nav-item" style="color:#ff4444;">
                    <img src="/assets/img/2879-securitywarning.png" class="nav-icon"> Logout
                </a>
            </nav>
        `;

        const sidebar = document.createElement('aside');
        sidebar.className = 'admin-sidebar';
        sidebar.innerHTML = sidebarHTML;
        document.body.prepend(sidebar);

        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.onclick = () => AdminV2.toggleSidebar(false);
        document.body.appendChild(overlay);

        // Mobile Toggle Button
        const mobileBtn = document.createElement('button');
        mobileBtn.className = 'mobile-menu-btn';
        mobileBtn.innerHTML = '☰';
        mobileBtn.onclick = () => AdminV2.toggleSidebar(true);
        document.body.appendChild(mobileBtn);

        // Active State
        const path = window.location.pathname;
        const links = document.querySelectorAll('.nav-item');
        links.forEach(link => {
            if (path.includes(link.getAttribute('href'))) {
                link.classList.add('active');
            }
        });
    },

    toggleSidebar: (show) => {
        const sidebar = document.querySelector('.admin-sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        if (show) {
            sidebar.classList.add('active');
            overlay.classList.add('active');
        } else {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    },

    logout: () => {
        if (confirm('Logout?')) {
            localStorage.removeItem('user_token');
            sessionStorage.removeItem('admin_unlocked');
            sessionStorage.removeItem('admin_role');
            window.location.href = '/';
        }
    }
};

document.addEventListener('DOMContentLoaded', AdminV2.init);
