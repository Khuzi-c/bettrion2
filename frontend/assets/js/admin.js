const Admin = {
    checkAuth: () => {
        return true; // Dev mode
    },

    loadSidebar: () => {
        // Prevent double loading
        if (document.querySelector('.admin-sidebar')) return;

        const sidebarHTML = `
            <div class="admin-sidebar-header">
                <div class="admin-brand">
                    <span style="color:var(--primary); font-size:1.5em;">♛</span>
                    <span>BETTRION</span>
                </div>
            </div>
            <nav class="admin-nav">
                <div class="nav-label">OVERVIEW</div>
                <a href="/admin/dashboard.html" class="nav-item">
                    <span class="icon">📊</span> Dashboard
                </a>
                <a href="/admin/notifications.html" class="nav-item">
                    <span class="icon">🔔</span> Notifications
                </a>

                <div class="nav-label">MANAGEMENT</div>
                <a href="/admin/users.html" class="nav-item">
                    <span class="icon">👥</span> Users
                </a>
                <a href="/admin/casinos.html" class="nav-item">
                    <span class="icon">🎰</span> Casinos
                </a>
                <a href="/admin/articles.html" class="nav-item">
                    <span class="icon">📰</span> News & Articles
                </a>
                <a href="/admin/ads.html" class="nav-item">
                    <span class="icon">📢</span> Ads Manager
                </a>
                <a href="/admin/top-lists.html" class="nav-item">
                    <span class="icon">🏆</span> Top Lists
                </a>

                <div class="nav-label">SYSTEM</div>
                <a href="/admin/logs.html" class="nav-item">
                    <span class="icon">📜</span> Server Logs
                </a>
                <a href="/admin/settings.html" class="nav-item">
                    <span class="icon">⚙️</span> Settings
                </a>
                <hr style="border-color:rgba(255,255,255,0.1); margin:15px 20px;">
                <a href="/" class="nav-item" style="color:var(--primary);">
                    <span class="icon">🔙</span> Back to Website
                </a>
            </nav>
        `;

        const sidebar = document.createElement('aside');
        sidebar.className = 'admin-sidebar';
        sidebar.innerHTML = sidebarHTML;
        document.body.prepend(sidebar);

        // Active State
        const currentPath = window.location.pathname;
        const links = sidebar.querySelectorAll('.nav-item');
        links.forEach(link => {
            if (link.getAttribute('href') === currentPath || (currentPath.includes(link.getAttribute('href').replace('.html', '')) && link.getAttribute('href') !== '/')) {
                link.classList.add('active');
            }
        });
    },

    fileUpload: async (fileInput, endpoint) => {
        const file = fileInput.files[0];
        if (!file) return null;
        const formData = new FormData();
        const fieldName = endpoint.includes('logo') ? 'logo' : endpoint.includes('banner') ? 'banner' : 'thumbnail';
        formData.append(fieldName, file);
        try {
            const res = await API.upload(endpoint, formData);
            return res.path;
        } catch (e) {
            alert('Upload failed: ' + e.message);
            throw e;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Inject CSS if missing
    if (!document.querySelector('link[href*="admin.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/assets/css/admin.css';
        document.head.appendChild(link);
    }

    if (window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('login')) {
        Admin.loadSidebar();
    }
});
