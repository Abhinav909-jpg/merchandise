<?php
session_start();
if (!isset($_SESSION['user'])) {
    header("Location: index.php");
    exit();
}

$message_sent = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // In real usage, send email or store in DB here
    $name = htmlspecialchars($_POST['name']);
    $email = htmlspecialchars($_POST['email']);
    $message = htmlspecialchars($_POST['message']);
    $message_sent = true;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Customer Care</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
<header>
  <nav>
    <a href="products.php">Home</a>
    <a href="cart.php">Cart</a>
    <a href="orders.php">My Orders</a>
    <a href="track.php">Track Delivery</a>
    <a href="contact.php" class="active">Customer Care</a>
    <a href="logout.php">Logout</a>
  </nav>
</header>

<div class="container">
  <h2>Customer Care</h2>
  
  <?php if ($message_sent): ?>
    <p>Thank you for contacting us! We will respond shortly.</p>
  <?php else: ?>
  <form method="POST" action="">
    <input type="text" name="name" required placeholder="Your name" />
    <input type="email" name="email" required placeholder="Your email" />
    <textarea name="message" required placeholder="Your message" rows="5" style="width: 100%; border-radius: 4px; border: none; padding: 10px;"></textarea>
    <button type="submit">Send Message</button>
  </form>
  <?php endif; ?>
</div>

<footer class="footer">
  &copy; 2025 DHH Merch
</footer>
</body>
</html>
