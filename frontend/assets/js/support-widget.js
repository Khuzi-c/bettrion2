// Floating Support Widget
// Include this script at the end of the body

(function () {
    // Inject CSS
    const style = document.createElement('style');
    style.innerHTML = `
        #support-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            font-family: 'Inter', sans-serif;
        }
        #support-btn {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #ffd700;
            color: black;
            border: none;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            cursor: pointer;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
        }
        #support-btn:hover { transform: scale(1.1); }
        #support-window {
            display: none;
            width: 350px;
            height: 500px;
            background: #141414;
            border: 1px solid #333;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            flex-direction: column;
            overflow: hidden;
            position: absolute;
            bottom: 80px;
            right: 0;
        }
        .sw-header {
            background: #111;
            padding: 15px;
            border-bottom: 1px solid #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .sw-close { cursor: pointer; color: #666; }
        .sw-body {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        }
        .sw-input-area {
            padding: 15px;
            border-top: 1px solid #333;
            background: #111;
        }
        .sw-input {
            width: 100%;
            padding: 10px;
            background: #0a0a0a;
            border: 1px solid #333;
            color: white;
            border-radius: 4px;
            margin-bottom: 10px;
            box-sizing: border-box; 
        }
        .msg {
            margin-bottom: 10px;
            padding: 8px 12px;
            border-radius: 6px;
            max-width: 80%;
            font-size: 0.9rem;
        }
        .msg.user { background: #1e88e5; color: white; align-self: flex-end; }
        .msg.system { background: #333; color: #ddd; align-self: flex-start; }
    `;
    document.head.appendChild(style);

    // Create Elements
    const container = document.createElement('div');
    container.id = 'support-widget';
    container.innerHTML = `
        <div id="support-window">
            <div class="sw-header">
                <span style="font-weight: bold; color: white;">Support</span>
                <span class="sw-close">✕</span>
            </div>
            <div class="sw-body" id="sw-messages">
                <div style="text-align: center; color: #666; margin-top: 50px;">
                    <p>How can we help you?</p>
                </div>
            </div>
            <div id="sw-ticket-info" style="display:none; padding: 10px; background: #0a0a0a; border-top: 1px solid #333; font-size: 0.85rem; color: #999;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Ticket ID: <span id="sw-ticket-id" style="color: #ffd700; font-family: monospace;"></span></span>
                    <button id="sw-close-ticket" style="padding: 5px 10px; background: #ef4444; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 0.8rem;">Close Ticket</button>
                </div>
            </div>
            <div class="sw-input-area" id="sw-form-start">
                <input type="email" id="sw-email" class="sw-input" placeholder="Your Email">
                <input type="text" id="sw-subject" class="sw-input" placeholder="Topic">
                <textarea id="sw-initial-msg" class="sw-input" rows="2" placeholder="Message..."></textarea>
                <button id="sw-start-btn" style="width:100%; padding:10px; background:#ffd700; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">Start Chat</button>
            </div>
            <div class="sw-input-area" id="sw-form-chat" style="display:none;">
                 <div style="display:flex; gap:5px;">
                    <input type="text" id="sw-chat-input" class="sw-input" placeholder="Type a message..." style="margin-bottom:0;">
                    <button id="sw-send-btn" style="padding:0 15px; background:#1e88e5; border:none; border-radius:4px; color:white; cursor:pointer;">➤</button>
                 </div>
            </div>
        </div>
        <button id="support-btn">💬</button>
    `;
    document.body.appendChild(container);

    // Logic
    const btn = document.getElementById('support-btn');
    const win = document.getElementById('support-window');
    const close = document.querySelector('.sw-close');
    const startBtn = document.getElementById('sw-start-btn');
    const sendBtn = document.getElementById('sw-send-btn');
    const closeTicketBtn = document.getElementById('sw-close-ticket');

    let ticketId = localStorage.getItem('bettrion_ticket_id');

    btn.onclick = () => {
        win.style.display = win.style.display === 'flex' ? 'none' : 'flex';
        if (ticketId && win.style.display === 'flex') {
            loadChatMode();
        }
    };
    close.onclick = () => win.style.display = 'none';

    closeTicketBtn.onclick = async () => {
        if (!confirm('Are you sure you want to close this ticket?')) return;

        // Close ticket
        await api.post('/tickets/close', { ticket_id: ticketId });

        // Clear local storage
        localStorage.removeItem('bettrion_ticket_id');
        ticketId = null;

        // Reset UI
        document.getElementById('sw-form-start').style.display = 'block';
        document.getElementById('sw-form-chat').style.display = 'none';
        document.getElementById('sw-ticket-info').style.display = 'none';
        document.getElementById('sw-messages').innerHTML = '<div style="text-align: center; color: #666; margin-top: 50px;"><p>How can we help you?</p></div>';

        alert('Ticket closed successfully. You can create a new ticket now.');
    };

    startBtn.onclick = async () => {
        const email = document.getElementById('sw-email').value;
        const subject = document.getElementById('sw-subject').value;
        const msg = document.getElementById('sw-initial-msg').value;

        if (!email || !msg) return alert('Email and Message required');

        const res = await api.post('/tickets/create', {
            guest_email: email,
            subject: subject || 'General Inquiry',
            initial_message: msg,
            category: 'Support'
        });

        if (res.success) {
            ticketId = res.data.id;
            localStorage.setItem('bettrion_ticket_id', ticketId);

            // Show ticket ID
            document.getElementById('sw-ticket-id').textContent = ticketId.substring(0, 13) + '...';
            document.getElementById('sw-ticket-info').style.display = 'block';

            loadChatMode();
        } else {
            alert('Error: ' + res.error);
        }
    };

    sendBtn.onclick = sendMessage;
    document.getElementById('sw-chat-input').onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };

    async function sendMessage() {
        const input = document.getElementById('sw-chat-input');
        const content = input.value.trim();
        if (!content) return;

        // Optimistic UI
        addMessage(content, 'user');
        input.value = '';

        await api.post('/messages', {
            ticket_id: ticketId,
            sender_role: 'USER', // or GUEST
            content: content
        });
        // Realtime reload (or polling in a real app)
        // For now, basic polling
        setTimeout(loadMessages, 1000);
    }

    async function loadChatMode() {
        document.getElementById('sw-form-start').style.display = 'none';
        document.getElementById('sw-form-chat').style.display = 'block';
        document.getElementById('sw-messages').innerHTML = '';
        await loadMessages();

        // Simple polling
        setInterval(loadMessages, 5000);
    }

    async function loadMessages() {
        if (!ticketId) return;
        const res = await api.get(`/tickets/${ticketId}/messages`);
        if (res.success) {
            const container = document.getElementById('sw-messages');
            container.innerHTML = '';
            res.data.forEach(m => {
                addMessage(m.content, m.sender_role === 'USER' ? 'user' : 'system');
            });
            container.scrollTop = container.scrollHeight;
        }
    }

    function addMessage(text, type) {
        const div = document.createElement('div');
        div.className = `msg ${type}`;
        div.innerText = text;
        document.getElementById('sw-messages').appendChild(div);
    }

})();
