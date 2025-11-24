<?php
session_start();
incPath = __DIR__ . '/includes/functions.php';
if (!is_file($incPath)) {
  // Log a helpful message for server admin (not revealing sensitive data to users)
  @file_put_contents(__DIR__ . '/logs/debug.log', sprintf("%s MISSING INCLUDE: %s\n", date('c'), $incPath), FILE_APPEND);
  // Show user-friendly instructions
  http_response_code(500);
  echo "<h2>Server configuration error</h2>";
  echo "<p>The site is missing a required file: <code>includes/functions.php</code>.";
  echo "<br />Please upload that file to the site root's <code>includes/</code> directory or check file permissions (web user must be able to read it).</p>";
  echo "<p>If you have a local copy of the project, ensure <code>includes/functions.php</code> exists on the server at <code>/var/www/html/includes/functions.php</code>.</p>";
  exit();
}
require_once $incPath;

$errors = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['csrf_token'] ?? '';
    if (!verify_csrf_token($token)) {
        $errors[] = 'Invalid CSRF token.';
    }

    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $password2 = $_POST['password2'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Enter a valid email.';
    }
    if (strlen($password) < 6) {
        $errors[] = 'Password must be at least 6 characters.';
    }
    if ($password !== $password2) {
        $errors[] = 'Passwords do not match.';
    }

    // ensure data dir and users file
    $dataDir = __DIR__ . '/data';
    if (!is_dir($dataDir)) {
        @mkdir($dataDir, 0755, true);
    }
    $usersFile = $dataDir . '/users.json';
    if (!file_exists($usersFile)) {
        @file_put_contents($usersFile, json_encode([], JSON_PRETTY_PRINT));
    }

    $users = json_decode(@file_get_contents($usersFile), true) ?: [];
    if (isset($users[$email])) {
        $errors[] = 'An account with that email already exists.';
    }

    if (empty($errors)) {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $users[$email] = $hash;
        @file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        @file_put_contents(__DIR__ . '/logs/debug.log', sprintf("%s REGISTER: sess=%s email=%s\n", date('c'), session_id(), $email), FILE_APPEND);
        // log user in
        $_SESSION['user'] = $email;
        header('Location: products.php');
        exit();
    }
}

?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Sign Up - DHH Merch</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
<header>
  <h1>Create an account</h1>
</header>
<div class="container">
  <?php if ($errors): ?>
    <div style="background:#ffe6e6;padding:10px;border-radius:6px;margin-bottom:12px;">
      <ul>
        <?php foreach ($errors as $e): ?>
          <li><?php echo htmlspecialchars($e); ?></li>
        <?php endforeach; ?>
      </ul>
    </div>
  <?php endif; ?>

  <form method="POST" action="register.php">
    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars(generate_csrf_token()); ?>" />
    <input type="email" name="email" required placeholder="Email" />
    <input type="password" name="password" required placeholder="Password (min 6 chars)" />
    <input type="password" name="password2" required placeholder="Confirm password" />
    <button type="submit">Create account</button>
  </form>

  <p>Already have an account? <a href="index.html">Log in</a></p>
</div>

<footer class="footer">&copy; 2025 DHH Merch</footer>
</body>
</html>

