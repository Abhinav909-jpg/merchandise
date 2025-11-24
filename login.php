<?php
session_start();

// Load users from data/users.json (ensure defaults)
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}
$usersFile = $dataDir . '/users.json';
if (!file_exists($usersFile)) {
    @file_put_contents($usersFile, json_encode(["user@example.com" => password_hash("password123", PASSWORD_DEFAULT)], JSON_PRETTY_PRINT));
}
$users = json_decode(@file_get_contents($usersFile), true) ?: [];

$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

if (isset($users[$email]) && password_verify($password, $users[$email])) {
    $_SESSION['user'] = $email;
    // log successful login for debugging
    @file_put_contents(__DIR__ . '/logs/debug.log', sprintf("%s LOGIN SUCCESS: sess=%s email=%s\n", date('c'), session_id(), $email), FILE_APPEND);
    header("Location: products.php");
    exit();
} else {
    // log failed login attempt
    @file_put_contents(__DIR__ . '/logs/debug.log', sprintf("%s LOGIN FAIL: sess=%s email=%s\n", date('c'), session_id(), $email), FILE_APPEND);
    echo "<p>Invalid login. <a href='index.html'>Try again</a></p>";
}
?>
