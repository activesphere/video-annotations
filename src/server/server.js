const express = require('express');

const DROPBOX_APP_KEY = process.env.DROPBOX_APP_KEY;
const DROPBOX_APP_SECRET = process.env.DROPBOX_APP_SECRET;

const LOCALHOST_PORT = 4000;

console.log('DROPBOX_APP_KEY =', DROPBOX_APP_KEY);
console.log('DROPBOX_APP_SECRET =', DROPBOX_APP_SECRET);

const app = express();

const urlAfterAuth = encodeURIComponent(
    `http://localhost:${LOCALHOST_PORT}/dropbox/after_oauth_get`
);

console.log('urlAfterAuth =', urlAfterAuth);

app.get('/login', (req, res) => {
    res.redirect(
        `https://dropbox.com/oauth2/authorize?client_id=${DROPBOX_APP_KEY}&response_type=code&redirect_uri=${urlAfterAuth}&force_reapprove=true`
    );
});

app.get('/', (req, res) => {
    res.json({ x: 1, y: 2 });
});

app.get('/dropbox/after_oauth_get', (req, res) => {
    console.log('Request after oauth =', req.query);
    res.json({ msg: 'Done OAuth' });
});

app.listen(LOCALHOST_PORT, () => console.log(`Example app listening on port ${LOCALHOST_PORT}!`));
