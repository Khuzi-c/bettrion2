const Components = {
    injectHeader: async () => {
        const placeholder = document.getElementById('header-placeholder');
        if (!placeholder) return;

        try {
            const res = await fetch('/components/header.html');
            if (!res.ok) throw new Error('Header file not found');
            const html = await res.text();
            placeholder.innerHTML = html;

            // Re-execute scripts in the injected HTML
            const scripts = placeholder.querySelectorAll("script");
            scripts.forEach(oldScript => {
                const newScript = document.createElement("script");
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });

            // Trigger Translation Init if available
            if (window.initGoogleTranslate) {
                window.initGoogleTranslate();
            } else {
                // Load script if missing
                const s = document.createElement('script');
                s.src = "/assets/js/i18n.js";
                document.body.appendChild(s);
            }

            // Trigger Auth Check (UI update)
            if (window.checkAuth) window.checkAuth();

        } catch (e) {
            console.error("Header injection failed", e);
        }
    }
};

document.addEventListener('DOMContentLoaded', Components.injectHeader);
