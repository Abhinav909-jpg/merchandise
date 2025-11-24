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