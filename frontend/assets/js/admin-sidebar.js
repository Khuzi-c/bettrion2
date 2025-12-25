// Standard Admin Sidebar - Include this in all admin pages
const ADMIN_SIDEBAR_HTML = `
<aside class="sidebar admin-sidebar" id="adminSidebar">
    <div class="admin-sidebar-header">
        <a href="/" class="admin-brand">Bettrion Admin</a>
        <button id="sidebarToggle" style="background:none; border:none; color:white; cursor:pointer; margin-left:auto;">
            ☰
        </button>
    </div>
    <nav class="admin-nav">
        <a href="/admin/dashboard.html" class="nav-item">Dashboard</a>
        <a href="/admin/platform-edit.html" class="nav-item">Add Platform</a>
        <a href="/admin/add-slot.html" class="nav-item">Add Slot</a>
        <a href="/admin/platforms.html" class="nav-item">Manage Platforms</a>
        <a href="/admin/articles.html" class="nav-item">Manage Articles</a>
        <a href="/admin/article-edit.html" class="nav-item">Write Article</a>
        <a href="/admin/tickets.html" class="nav-item">Support Tickets</a>
        <a href="/admin/bot-panel.html" class="nav-item">🤖 Bot Panel</a>
        <a href="/admin/staff-time.html" class="nav-item">Staff Hours</a>
        <a href="/admin/backups.html" class="nav-item">Backups</a>
        <a href="/admin/users.html" class="nav-item">Users</a>
        <a href="/admin/settings.html" class="nav-item">Settings</a>
    </nav>
</aside>
`;

// Auto-highlight current page & Toggle Logic
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject if not present (handled by admin-v2.js usually, but here we define the HTML const)
    // admin-v2.js likely consumes ADMIN_SIDEBAR_HTML. 
    // We will assume admin-v2.js handles injection, or we need to check admin-v2.js.
    // BUT this file's original code implies it just defines the string.

    // 2. Highlight
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.admin-nav a'); // Updated selector
    links.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // 3. Toggle Logic
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('adminSidebar');
    const main = document.querySelector('.admin-main') || document.querySelector('.main-content');

    if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            if (main) main.classList.toggle('expanded');
        });
    }
});
