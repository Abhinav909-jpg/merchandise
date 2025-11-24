# DHH Merch — Local dev instructions

This is a small PHP demo app (no external dependencies). Use the built-in PHP server for local testing.

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

Notes & improvements added in this repo:
- CSRF protection for POST forms (simple session token).
- Defensive checks for product ids when adding to cart or placing orders.
- Helper file: `includes/functions.php` with CSRF helpers and product map.
- Helper file: `includes/functions.php` with CSRF helpers and product map.
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

If you don't have SSH or sudo access, re-upload the missing `includes/functions.php` file into `/var/www/html/includes/` and ensure it is readable by the web server user.
