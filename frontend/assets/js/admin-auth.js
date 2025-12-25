// Admin Authentication Guard
const AdminAuth = (function () {
    const token = localStorage.getItem('token');

    // Simple Sudo Check (Modal or Prompt)
    // For now, prompt. We can upgrade to a modal later.
    const verifySudo = async (callback) => {
        const password = prompt("⚠️ SUDO ACCESS REQUIRED\nPlease enter your Admin Password to confirm this action:");
        if (!password) return;

        try {
            // Verify with Backend
            const res = await API.post('/admin/verify-sudo', { password });
            if (res.success) {
                callback();
            } else {
                alert('❌ Invalid Password. Access Denied.');
            }
        } catch (e) {
            console.error(e);
            alert('Authentication Error');
        }
    };

    return {
        verifySudo
    };
})();

// Logout Helper
window.adminLogout = function () {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
};
