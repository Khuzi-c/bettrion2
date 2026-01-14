/**
 * Magic Widgets for Manual Page Building
 * Allows usage of <div data-widget="name"></div> in HTML content.
 */
const Widgets = {
    init: (context = document) => {
        Widgets.renderPayments(context);
        Widgets.renderPlayButtons(context);
    },

    // Usage: <div data-widget="payments" data-methods="Visa,PayPal,Bitcoin"></div>
    renderPayments: (context) => {
        const containers = context.querySelectorAll('[data-widget="payments"]');
        containers.forEach(container => {
            const methods = (container.dataset.methods || '').split(',').map(m => m.trim());
            if (methods.length === 0) return;

            let html = '<div class="widget-payments-grid" style="display:flex; flex-wrap:wrap; gap:10px;">';
            methods.forEach(method => {
                // You can add icon mapping here
                html += `<span class="badge" style="background:#222; border:1px solid #333; padding:5px 10px; border-radius:4px; font-size:0.9rem;">${method}</span>`;
            });
            html += '</div>';
            container.innerHTML = html;
        });
    },

    // Usage: <a data-widget="play-btn" data-link="https://...">Play Now</a>
    renderPlayButtons: (context) => {
        const btns = context.querySelectorAll('[data-widget="play-btn"]');
        btns.forEach(btn => {
            btn.classList.add('btn-play-large'); // Apply standard class
            btn.style.display = 'inline-block';
            btn.style.textAlign = 'center';
            // Logic to attach tracking events could go here
            btn.addEventListener('click', () => {
                console.log('Widget Play Button Clicked');
            });
        });
    }
};

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => {
    // Wait for dynamic content injection if necessary
    setTimeout(() => Widgets.init(), 1000);
});

// Expose globally
window.Widgets = Widgets;
