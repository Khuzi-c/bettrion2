const http = require('http');

const data = JSON.stringify({
    subject: 'Test Ticket ' + Date.now(),
    category: 'Support',
    priority: 'MEDIUM',
    initial_message: 'This is a test message',
    user_id: '123e4567-e89b-12d3-a456-426614174000', // Mock UUID
    guest_email: 'test@example.com'
});

const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/tickets/create',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on('data', d => {
        process.stdout.write(d);
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
