const fetch = require('node-fetch');

async function testTicketCreate() {
    try {
        const payload = {
            subject: 'Test Ticket ' + Date.now(),
            category: 'Support',
            priority: 'MEDIUM',
            initial_message: 'This is a test message',
            user_id: '123e4567-e89b-12d3-a456-426614174000', // Mock UUID
            guest_email: 'test@example.com'
        };

        const response = await fetch('http://localhost:3002/api/tickets/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        console.log('Status:', response.status);
        console.log('Body:', text);
    } catch (e) {
        console.error(e);
    }
}

testTicketCreate();
