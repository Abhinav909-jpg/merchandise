# DHH Merch — Local dev instructions

This project has been migrated from a small PHP demo app to a Node.js + Express demo app.

Quick start (Windows PowerShell):

1. Make sure PHP is installed and available on your PATH. Verify with:

```powershell
php -v
```

2. From the project root run the built-in server:

```powershell
# from C:\Users\Guru\OneDrive\Desktop\website
php -S localhost:8000
```

3. Open http://localhost:8000/index.html in your browser.

- Notes & improvements added in this repo:
- CSRF protection for POST forms (server-side sessions + endpoints).
- Defensive checks for product ids when adding to cart or placing orders.
- Orders are now persisted to `data/orders.json` so placed orders survive server restarts.
- Map on `track.php` uses Leaflet/OpenStreetMap (no API key required).
- Orders are now persisted to `data/orders.json` so placed orders survive server restarts.
- Map on `track.php` uses Leaflet/OpenStreetMap (no API key required).

Security: Users are stored in `data/users.json` with hashed passwords (password_hash / password_verify). This is fine for local testing but NOT production — use a proper database and additional protections (email verification, rate limiting, HTTPS).

If `php` is not found, install PHP from https://windows.php.net/ or use WAMP/XAMPP.

Server deployment helper (Linux)
--------------------------------
If you deployed the project to a Linux web server and receive a missing-file error (for example "Failed to open stream: No such file or directory" for includes/functions.php), run the bundled script from the repository root to copy missing files and set sensible permissions:

```bash
# on your server, from the repo root (where this README lives)
sudo ./server-setup.sh /var/www/html
```

The script will:
- copy `includes/` to your target DocumentRoot
- create `data/users.json` and `data/orders.json` if missing
- create `logs/debug.log` and set permissive, secure permissions
- set ownership to the standard web user (www-data or apache) if available

If you don't have SSH or sudo access, re-upload the missing files or use a deployment method that places the project files in your web server's document root.

Node.js version
---------------
This project now includes a Node.js/Express backend. To run the Node server locally:

1. Install Node.js (https://nodejs.org/) and ensure `node` and `npm` are available.
2. From the project root:

```powershell
# install dependencies (first time)
npm install

# start the Node server
npm start
# or use the helper from PowerShell
.\run-node.ps1
```

The Node server runs on http://localhost:8000 by default and exposes the same UI but backed by JavaScript. Use the web UI as usual.

Static / client-only mode
------------------------
If you don't want to run the Node server or install dependencies you can run the site fully client-side — all major flows (register, login, cart, place order, orders, contact) will work inside your browser using localStorage. No backend required.

Just open `index.html` in your browser (or use a local static server like `npx http-server` or `python -m http.server`) and use the site. The client-only fallback is implemented in `client-api.js`.