#!/usr/bin/env bash
# server-setup.sh
# Run on your LINUX web server (e.g., /var/www/html) to ensure the app files are present and permissions are correct.
# Usage: sudo ./server-setup.sh /var/www/html

set -euo pipefail
TARGET_DIR=${1:-/var/www/html}
REPO_DIR=$(pwd)

echo "Target dir: $TARGET_DIR"

# Ensure target exists
if [ ! -d "$TARGET_DIR" ]; then
  echo "Target directory $TARGET_DIR does not exist. Aborting." >&2
  exit 1
fi

# Copy includes/ to target
if [ -d "$REPO_DIR/includes" ]; then
  echo "Copying includes/ to $TARGET_DIR/includes"
  mkdir -p "$TARGET_DIR/includes"
  cp -a "$REPO_DIR/includes/." "$TARGET_DIR/includes/"
else
  echo "No includes/ directory found in repo (expected $REPO_DIR/includes)." >&2
fi

# Ensure data/ and files
mkdir -p "$TARGET_DIR/data"
if [ ! -f "$TARGET_DIR/data/users.json" ]; then
  echo "Creating default users.json in target"
  cat > "$TARGET_DIR/data/users.json" <<'JSON'
{ "user@example.com": "$(php -r 'echo password_hash("password123", PASSWORD_DEFAULT);')" }
JSON
fi
if [ ! -f "$TARGET_DIR/data/orders.json" ]; then
  echo "Creating orders.json"
  echo '[]' > "$TARGET_DIR/data/orders.json"
fi

# Ensure logs directory and file
mkdir -p "$TARGET_DIR/logs"
touch "$TARGET_DIR/logs/debug.log"
chmod 660 "$TARGET_DIR/logs/debug.log" || true

# Set ownership and permissions (adjust web user if required)
WEB_USER=www-data
WEB_GROUP=www-data
if id "apache" &>/dev/null; then
  # on some distros it's apache
  WEB_USER=apache
  WEB_GROUP=apache
fi

echo "Setting owner to $WEB_USER:$WEB_GROUP and setting safe permissions"
chown -R "$WEB_USER":"$WEB_GROUP" "$TARGET_DIR" || true
find "$TARGET_DIR" -type d -exec chmod 755 {} + || true
find "$TARGET_DIR" -type f -exec chmod 644 {} + || true
# ensure scripts are executable
chmod +x "$TARGET_DIR/run-local.ps1" || true

echo "Setup finished. Please verify your web server can read files under $TARGET_DIR"

# show helpful next steps
cat <<EOF
Next steps (on the server):
1) Ensure your web server is running (apache/nginx + php-fpm or PHP builtin for dev).
2) Visit your site in a browser and check /register.html and /products.html.
3) If you still see include errors, the site may be served from a different directory than $TARGET_DIR - check your web server DocumentRoot.

EOF
