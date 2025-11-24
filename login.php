<?php
session_start();

$users = [
  "user@example.com" => "password123",  // simple user:pass storage (for example only)
];

$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

if (isset($users[$email]) && $users[$email] === $password) {
    $_SESSION['user'] = $email;
    header("Location: products.php");
    exit();
} else {
    echo "<p>Invalid login. <a href='index.php'>Try again</a></p>";
}
?>
