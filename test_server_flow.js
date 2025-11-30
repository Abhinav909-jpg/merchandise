const fetch = require('node-fetch'); // Need to ensure node-fetch is available or use built-in fetch in Node 18+

// Node 18+ has global fetch. If older, this might fail.
// Assuming Node 18+ based on "Node.js v22.19.0" in previous logs.

async function test() {
    const BASE = 'http://localhost:8000';

    console.log('Testing Login with default user...');
    try {
        // 1. Get CSRF
        const csrfRes = await fetch(`${BASE}/api/csrf`);
        const csrfData = await csrfRes.json();
        const csrf = csrfData.csrf;
        console.log('CSRF:', csrf);

        // 2. Login user@example.com
        const loginRes = await fetch(`${BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
            body: JSON.stringify({ email: 'user@example.com', password: 'password123' })
        });
        const loginJson = await loginRes.json();
        console.log('Login user@example.com:', loginRes.status, loginJson);

        // 3. Register new user
        const newEmail = 'test' + Date.now() + '@test.com';
        console.log(`Registering ${newEmail}...`);
        const regRes = await fetch(`${BASE}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
            body: JSON.stringify({ email: newEmail, password: 'password123' })
        });
        const regJson = await regRes.json();
        console.log('Register:', regRes.status, regJson);

        // 4. Login new user
        const loginNewRes = await fetch(`${BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
            body: JSON.stringify({ email: newEmail, password: 'password123' })
        });
        const loginNewJson = await loginNewRes.json();
        console.log('Login new user:', loginNewRes.status, loginNewJson);

    } catch (e) {
        console.error('Test failed:', e);
    }
}

test();
