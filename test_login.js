

const http = require('http');

function testLogin() {
    const data = JSON.stringify({ cyberId: 'test', cyberPass: 'test' });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/attendance/daywise',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        console.log('Status:', res.statusMessage, res.statusCode);
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log('Body:', body);
        });
    });

    req.on('error', (error) => {
        console.error('Error:', error.message);
    });

    req.write(data);
    req.end();
}

testLogin();

