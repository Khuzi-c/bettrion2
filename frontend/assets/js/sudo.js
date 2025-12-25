const Sudo = {
    check: async () => {
        if (sessionStorage.getItem('sudo_access_granted')) return true;

        // Create Modal
        const modal = document.createElement('div');
        modal.id = 'sudo-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 9999;
            display: flex; justify-content: center; align-items: center;
            backdrop-filter: blur(5px);
        `;

        modal.innerHTML = `
            <div style="background:#141414; padding:30px; border-radius:12px; border:1px solid #333; text-align:center; min-width:300px;">
                <h2 style="color:white; margin-top:0;">🔒 Secured Area</h2>
                <p style="color:#888;">Enter Admin Password to proceed.</p>
                <input type="password" id="sudo-pass" placeholder="Password" style="width:100%; padding:10px; margin:15px 0; background:#000; border:1px solid #333; color:white; border-radius:6px;">
                <button onclick="Sudo.verify()" class="btn btn-primary" style="width:100%;">Unlock</button>
                <div id="sudo-err" style="color:#ff4444; margin-top:10px; font-size:0.9rem;"></div>
            </div>
        `;

        document.body.appendChild(modal);

        // Hide page content to prevent peeking (simple obfuscation)
        const main = document.querySelector('main');
        if (main) main.style.filter = 'blur(10px)';

        return false;
    },

    verify: async () => {
        const pass = document.getElementById('sudo-pass').value;
        try {
            const res = await api.post('/admin/verify-sudo', { password: pass });
            if (res.success) {
                sessionStorage.setItem('sudo_access_granted', 'true');
                document.getElementById('sudo-modal').remove();

                const main = document.querySelector('main');
                if (main) main.style.filter = 'none';

                // If there's a callback or if we just unblock the UI
                if (typeof load === 'function') load();
            } else {
                document.getElementById('sudo-err').innerText = 'Access Denied';
            }
        } catch (e) {
            document.getElementById('sudo-err').innerText = 'Error verifying';
        }
    }
};

// Auto-check on load
document.addEventListener('DOMContentLoaded', () => {
    // Only verify if we are mostly sure the DOM is ready, but Sudo.check() handles the UI blocking.
    // If we want to blocking load:
    Sudo.check();
});
