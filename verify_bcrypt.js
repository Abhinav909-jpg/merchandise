const bcrypt = require('bcrypt');

async function test() {
    try {
        const password = 'password123';
        const hash = await bcrypt.hash(password, 10);
        console.log('Password:', password);
        console.log('Hash:', hash);

        const match = await bcrypt.compare(password, hash);
        console.log('Match:', match);

        if (match) {
            console.log('Bcrypt is working correctly.');
        } else {
            console.error('Bcrypt failed to verify hash.');
        }
    } catch (e) {
        console.error('Bcrypt error:', e);
    }
}

test();
