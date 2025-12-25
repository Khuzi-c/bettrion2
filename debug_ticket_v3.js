const http = require('http');

// Test Case 1: Invalid User ID (Should fallback to Guest)
const data = JSON.stringify({
    subject: 'Test Ticket Invalid User ' + Date.now(),
    category: 'Support',
    priority: 'MEDIUM',
    initial_message: 'This message has an invalid user_id',
    user_id: '00000000-0000-0000-0000-000000000000', // Non-existent UUID
    guest_email: 'tester@debug.com'
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

console.log("Sending request to /api/tickets/create...");

const req = http.request(options, res => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', chunk => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', error => {
    console.error("REQUEST ERROR:", error);
});

req.write(data);
req.end();
